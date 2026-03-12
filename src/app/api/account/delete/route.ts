import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

export const dynamic = "force-dynamic";

const DeleteSchema = z.object({
  confirmEmail: z.string().email("Invalid email"),
});

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Strict rate limit: 1 request per 5 minutes
  const rl = await rateLimit(`account-delete:${user.id}`, 1, 300_000);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before trying again." },
      { status: 429 },
    );
  }

  // Parse and validate request body
  let parsed;
  try {
    parsed = DeleteSchema.parse(await req.json());
  } catch (err) {
    const msg =
      err instanceof z.ZodError
        ? (err.issues[0]?.message ?? "Invalid request")
        : "Invalid request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // Confirm email matches the authenticated user
  if (parsed.confirmEmail.toLowerCase() !== user.email?.toLowerCase()) {
    return NextResponse.json(
      { error: "Email does not match your account" },
      { status: 400 },
    );
  }

  // Block owner self-deletion
  const ownerEmail =
    process.env.OWNER_EMAIL || process.env.NEXT_PUBLIC_OWNER_EMAIL;
  const isOwnerByEmail =
    ownerEmail && user.email?.toLowerCase() === ownerEmail.toLowerCase();

  if (isOwnerByEmail) {
    return NextResponse.json(
      { error: "Owner accounts cannot be self-deleted" },
      { status: 403 },
    );
  }

  // Check DB-level owner flag as fallback
  const { data: sub } = await supabase
    .from("user_subscriptions")
    .select("is_owner")
    .eq("user_id", user.id)
    .maybeSingle();

  if (sub?.is_owner) {
    return NextResponse.json(
      { error: "Owner accounts cannot be self-deleted" },
      { status: 403 },
    );
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    console.error("[account/delete] Admin client failed:", err);
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 },
    );
  }

  // Delete from all user tables (order matters for FK constraints — children first)
  const tables: { table: string; column: string }[] = [
    // Gamification
    { table: "coin_transactions", column: "user_id" },
    { table: "user_coins", column: "user_id" },
    { table: "user_equipped_cosmetics", column: "user_id" },
    { table: "user_cosmetics", column: "user_id" },
    { table: "user_badges", column: "user_id" },
    { table: "achievement_progress", column: "user_id" },
    { table: "user_achievements", column: "user_id" },
    { table: "user_xp_events", column: "user_id" },
    { table: "user_levels", column: "user_id" },
    { table: "user_daily_challenge_summary", column: "user_id" },
    { table: "user_daily_challenges", column: "user_id" },
    // Referrals
    { table: "referral_rewards", column: "user_id" },
    { table: "referral_links", column: "user_id" },
    { table: "referrals", column: "referrer_id" },
    { table: "referrals", column: "referred_user_id" },
    // Codes
    { table: "discount_code_redemptions", column: "user_id" },
    { table: "invite_code_redemptions", column: "user_id" },
    // Broker connections (encrypted API keys)
    { table: "sync_logs", column: "user_id" },
    { table: "broker_connections", column: "user_id" },
    // Trading data
    { table: "commodity_trades", column: "user_id" },
    { table: "forex_trades", column: "user_id" },
    { table: "stock_trades", column: "user_id" },
    { table: "trades", column: "user_id" },
    // Journal & behavioral
    { table: "journal_notes", column: "user_id" },
    { table: "behavioral_logs", column: "user_id" },
    { table: "daily_checkins", column: "user_id" },
    { table: "daily_plans", column: "user_id" },
    { table: "account_snapshots", column: "user_id" },
    // Settings & misc
    { table: "user_templates", column: "user_id" },
    { table: "user_addons", column: "user_id" },
    { table: "user_streaks", column: "user_id" },
    // Feedback
    { table: "feedback_comments", column: "user_id" },
    { table: "feedback", column: "user_id" },
    // Subscription (last, since others may FK to it)
    { table: "user_subscriptions", column: "user_id" },
  ];

  for (const { table, column } of tables) {
    const { error: delErr } = await admin
      .from(table)
      .delete()
      .eq(column, user.id);
    if (delErr) {
      console.error(
        `[account/delete] delete from ${table} failed:`,
        delErr.message,
      );
    }
  }

  // Nullify created_by on codes (don't delete the codes themselves)
  await admin
    .from("invite_codes")
    .update({ created_by: null })
    .eq("created_by", user.id);
  await admin
    .from("discount_codes")
    .update({ created_by: null })
    .eq("created_by", user.id);

  // Clean up Supabase Storage files (journal images)
  try {
    const { data: files } = await admin.storage
      .from("journal-images")
      .list(user.id);
    if (files?.length) {
      await admin.storage
        .from("journal-images")
        .remove(files.map((f) => `${user.id}/${f.name}`));
    }
  } catch (err) {
    console.error("[account/delete] Storage cleanup failed:", err);
  }

  // Delete the auth user
  const { error } = await admin.auth.admin.deleteUser(user.id);

  if (error) {
    console.error("[account/delete] auth delete failed:", error.message);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}

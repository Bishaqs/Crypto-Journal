import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function verifyOwner(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const ownerEmail = process.env.OWNER_EMAIL || process.env.NEXT_PUBLIC_OWNER_EMAIL;
  let isOwner = !!(ownerEmail && user.email?.toLowerCase() === ownerEmail.toLowerCase());

  if (!isOwner) {
    const { data: sub } = await supabase
      .from("user_subscriptions")
      .select("is_owner")
      .eq("user_id", user.id)
      .maybeSingle();
    if (sub?.is_owner) isOwner = true;
  }

  return isOwner ? user : null;
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const owner = await verifyOwner(supabase);
  if (!owner) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { userId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!body.userId) {
    return NextResponse.json({ error: "User ID required" }, { status: 400 });
  }

  // Prevent deleting yourself (the owner)
  if (body.userId === owner.id) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    console.error("[admin/users] Admin client failed:", err);
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  // Delete all user data from FK-constrained tables (order matters)
  const tables: { table: string; column: string }[] = [
    { table: "referral_rewards", column: "user_id" },
    { table: "referral_links", column: "user_id" },
    { table: "referrals", column: "referrer_id" },
    { table: "referrals", column: "referred_user_id" },
    { table: "invite_code_redemptions", column: "user_id" },
    { table: "user_templates", column: "user_id" },
    { table: "user_addons", column: "user_id" },
    { table: "user_streaks", column: "user_id" },
    { table: "daily_plans", column: "user_id" },
    { table: "daily_checkins", column: "user_id" },
    { table: "behavioral_logs", column: "user_id" },
    { table: "stock_trades", column: "user_id" },
    { table: "account_snapshots", column: "user_id" },
    { table: "journal_notes", column: "user_id" },
    { table: "trades", column: "user_id" },
    { table: "user_subscriptions", column: "user_id" },
  ];

  for (const { table, column } of tables) {
    const { error: delErr } = await admin.from(table).delete().eq(column, body.userId);
    if (delErr) {
      console.error(`[admin/users] delete from ${table} failed:`, delErr.message);
    }
  }

  // Nullify created_by on invite codes (don't delete the codes themselves)
  await admin.from("invite_codes").update({ created_by: null }).eq("created_by", body.userId);

  // Delete the auth user
  const { error } = await admin.auth.admin.deleteUser(body.userId);

  if (error) {
    console.error("[admin/users] delete failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

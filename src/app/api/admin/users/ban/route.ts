import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { sendBanNotification } from "@/lib/email";
import { z } from "zod";

export const dynamic = "force-dynamic";

const BanUserSchema = z.object({
  userId: z.string().uuid("Invalid user ID format"),
  reason: z.string().max(500).optional(),
});

const UnbanUserSchema = z.object({
  userId: z.string().uuid("Invalid user ID format"),
});

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

// POST: Ban a user
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const owner = await verifyOwner(supabase);
  if (!owner) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`admin:${owner.id}`, 30, 60_000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let parsed;
  try {
    parsed = BanUserSchema.parse(await req.json());
  } catch (err) {
    const msg = err instanceof z.ZodError ? err.issues[0]?.message ?? "Invalid request" : "Invalid request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { userId, reason } = parsed;

  if (userId === owner.id) {
    return NextResponse.json({ error: "Cannot ban your own account" }, { status: 400 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    console.error("[admin/ban] Admin client failed:", err);
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  // Check if user is the owner (via DB flag)
  const { data: targetSub } = await admin
    .from("user_subscriptions")
    .select("is_owner, is_banned")
    .eq("user_id", userId)
    .maybeSingle();

  if (targetSub?.is_owner) {
    return NextResponse.json({ error: "Cannot ban the owner account" }, { status: 400 });
  }

  if (targetSub?.is_banned) {
    return NextResponse.json({ error: "User is already banned" }, { status: 400 });
  }

  // UPSERT ban status (handles users without a subscription row)
  const { error: banErr } = await admin
    .from("user_subscriptions")
    .upsert(
      {
        user_id: userId,
        is_banned: true,
        banned_at: new Date().toISOString(),
        banned_reason: reason || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (banErr) {
    console.error("[admin/ban] ban failed:", banErr.message);
    return NextResponse.json({ error: "Failed to ban user" }, { status: 500 });
  }

  // Sign out the user to invalidate their session
  try {
    await admin.auth.admin.signOut(userId);
  } catch (err) {
    console.error("[admin/ban] signOut failed (non-fatal):", err);
  }

  // Send ban notification email (non-blocking, don't fail the ban if email fails)
  try {
    const { data: authData } = await admin.auth.admin.getUserById(userId);
    if (authData?.user?.email) {
      await sendBanNotification(authData.user.email, reason);
    }
  } catch (err) {
    console.error("[admin/ban] email notification failed (non-fatal):", err);
  }

  return NextResponse.json({ success: true });
}

// PATCH: Unban a user
export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const owner = await verifyOwner(supabase);
  if (!owner) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`admin:${owner.id}`, 30, 60_000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let parsed;
  try {
    parsed = UnbanUserSchema.parse(await req.json());
  } catch (err) {
    const msg = err instanceof z.ZodError ? err.issues[0]?.message ?? "Invalid request" : "Invalid request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    console.error("[admin/ban] Admin client failed:", err);
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const { error: unbanErr } = await admin
    .from("user_subscriptions")
    .update({
      is_banned: false,
      banned_at: null,
      banned_reason: null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", parsed.userId);

  if (unbanErr) {
    console.error("[admin/ban] unban failed:", unbanErr.message);
    return NextResponse.json({ error: "Failed to unban user" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: 5 redemption attempts per minute per user
  const rl = rateLimit(`invite-redeem:${user.id}`, 5, 60_000);
  if (!rl.success) {
    return NextResponse.json(
      { success: false, error: "Too many attempts. Please wait." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetMs / 1000)) } }
    );
  }

  // Parse body
  let body: { code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }

  const code = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";
  if (!code) {
    return NextResponse.json({ success: false, error: "Code is required" }, { status: 400 });
  }

  // Use admin client to bypass RLS entirely
  const admin = createAdminClient();

  // Look up invite code
  const { data: invite, error: lookupErr } = await admin
    .from("invite_codes")
    .select("*")
    .eq("code", code)
    .single();

  if (lookupErr) {
    console.error("[invite/redeem] lookup failed:", lookupErr.message, lookupErr.code);
    if (lookupErr.code === "PGRST116") {
      return NextResponse.json({ success: false, error: "Invalid code" });
    }
    return NextResponse.json({ success: false, error: "Failed to verify code. Please try again." }, { status: 500 });
  }
  if (!invite) {
    return NextResponse.json({ success: false, error: "Invalid code" });
  }

  // Validate code state
  if (!invite.is_active) {
    return NextResponse.json({ success: false, error: "Code is no longer active" });
  }
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ success: false, error: "Code has expired" });
  }
  if (invite.max_uses !== null && invite.current_uses >= invite.max_uses) {
    return NextResponse.json({ success: false, error: "Code has reached maximum uses" });
  }

  // Check if already redeemed by this user
  const { data: existing } = await admin
    .from("invite_code_redemptions")
    .select("id")
    .eq("invite_code_id", invite.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ success: false, error: "You already redeemed this code" });
  }

  // Upgrade subscription (upsert handles missing row from signup trigger)
  const { error: upsertErr } = await admin
    .from("user_subscriptions")
    .upsert(
      {
        user_id: user.id,
        tier: invite.grants_tier,
        granted_by_invite_code: code,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (upsertErr) {
    console.error("[invite/redeem] subscription upsert failed:", upsertErr.message);
    return NextResponse.json({ success: false, error: "Failed to upgrade subscription" }, { status: 500 });
  }

  // Log redemption
  const { error: redeemErr } = await admin
    .from("invite_code_redemptions")
    .insert({ invite_code_id: invite.id, user_id: user.id });

  if (redeemErr) {
    console.error("[invite/redeem] redemption log failed:", redeemErr.message);
  }

  // Increment usage counter
  await admin
    .from("invite_codes")
    .update({ current_uses: invite.current_uses + 1 })
    .eq("id", invite.id);

  return NextResponse.json({ success: true, tier: invite.grants_tier });
}

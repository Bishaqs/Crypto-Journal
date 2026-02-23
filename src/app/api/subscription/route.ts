import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: sub, error } = await supabase
    .from("user_subscriptions")
    .select("tier, is_owner, is_trial, trial_end, granted_by_invite_code")
    .eq("user_id", user.id)
    .single();

  if (error) {
    console.error("[subscription] fetch error:", error.message, error.code);
  }

  if (sub) {
    return NextResponse.json(sub);
  }

  // Fallback: owner always gets max even if DB row missing
  const ownerEmail = process.env.NEXT_PUBLIC_OWNER_EMAIL;
  if (ownerEmail && user.email?.toLowerCase() === ownerEmail.toLowerCase()) {
    return NextResponse.json({
      tier: "max",
      is_owner: true,
      is_trial: false,
      trial_end: null,
      granted_by_invite_code: null,
    });
  }

  // No subscription row — free tier
  return NextResponse.json({
    tier: "free",
    is_owner: false,
    is_trial: false,
    trial_end: null,
    granted_by_invite_code: null,
  });
}

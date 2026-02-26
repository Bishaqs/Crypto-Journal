import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const FREE_RESPONSE = {
  tier: "free" as const,
  is_owner: false,
  is_trial: false,
  trial_end: null,
  granted_by_invite_code: null,
};

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Owner check via env var
  const ownerEmail = process.env.OWNER_EMAIL || process.env.NEXT_PUBLIC_OWNER_EMAIL;
  const isOwnerByEnv = !!(ownerEmail && user.email?.toLowerCase() === ownerEmail.toLowerCase());

  // Query with regular client — RLS allows SELECT on own rows
  const { data: sub, error } = await supabase
    .from("user_subscriptions")
    .select("tier, is_owner, is_trial, trial_end, granted_by_invite_code")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[subscription] fetch error:", error.message, error.code);
    // If env var says owner, still grant max even if DB fails
    if (isOwnerByEnv) {
      return NextResponse.json({ ...FREE_RESPONSE, tier: "max", is_owner: true });
    }
    return NextResponse.json(
      { error: "Failed to load subscription" },
      { status: 500 }
    );
  }

  if (sub) {
    // Override tier to max if owner (by env var or DB flag)
    if (isOwnerByEnv || sub.is_owner) {
      return NextResponse.json({ ...sub, tier: "max", is_owner: true });
    }
    return NextResponse.json(sub);
  }

  // No subscription row — owner still gets max
  if (isOwnerByEnv) {
    return NextResponse.json({ ...FREE_RESPONSE, tier: "max", is_owner: true });
  }

  return NextResponse.json(FREE_RESPONSE);
}

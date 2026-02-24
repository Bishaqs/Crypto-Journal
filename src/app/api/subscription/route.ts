import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

const OWNER_RESPONSE = {
  tier: "max" as const,
  is_owner: true,
  is_trial: false,
  trial_end: null,
  granted_by_invite_code: null,
};

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

  // Owner always gets max — check FIRST before any DB query
  const ownerEmail = process.env.NEXT_PUBLIC_OWNER_EMAIL;
  if (ownerEmail && user.email?.toLowerCase() === ownerEmail.toLowerCase()) {
    return NextResponse.json(OWNER_RESPONSE);
  }

  // Query with admin client (bypasses RLS)
  try {
    const admin = createAdminClient();
    const { data: sub, error } = await admin
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
  } catch (err) {
    console.error("[subscription] admin client failed:", err);
  }

  return NextResponse.json(FREE_RESPONSE);
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isUnreleasedFeature } from "@/lib/feature-flags";

/**
 * API route guard for unreleased features.
 * Returns 404 (not 403) to avoid revealing the feature exists.
 *
 * Usage:
 *   const gate = await checkUnreleasedAccess("education-platform");
 *   if (!gate.allowed) return gate.response!;
 */
export async function checkUnreleasedAccess(feature: string): Promise<{
  allowed: boolean;
  response?: NextResponse;
}> {
  if (!isUnreleasedFeature(feature)) return { allowed: true };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { allowed: false, response: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  }

  const ownerEmail = process.env.OWNER_EMAIL || process.env.NEXT_PUBLIC_OWNER_EMAIL;
  const isOwnerByEmail = !!(ownerEmail && user.email?.toLowerCase() === ownerEmail.toLowerCase());

  const { data: sub } = await supabase
    .from("user_subscriptions")
    .select("is_owner, is_beta_tester")
    .eq("user_id", user.id)
    .maybeSingle();

  const isOwner = isOwnerByEmail || sub?.is_owner;
  if (isOwner || sub?.is_beta_tester) {
    return { allowed: true };
  }

  return { allowed: false, response: NextResponse.json({ error: "Not found" }, { status: 404 }) };
}

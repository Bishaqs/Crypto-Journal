import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isUnreleasedFeature } from "@/lib/feature-flags";

/**
 * Server-side gate for unreleased features.
 * Use in layout.tsx files to protect entire route groups.
 *
 * If the feature is released (not in UNRELEASED_FEATURES), this is a no-op.
 * If unreleased, only owner and beta testers can access; everyone else is redirected.
 *
 * Usage:
 *   await requireUnreleasedAccess("education-platform");
 */
export async function requireUnreleasedAccess(feature: string) {
  if (!isUnreleasedFeature(feature)) return;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/dashboard");
  }

  const ownerEmail = process.env.OWNER_EMAIL || process.env.NEXT_PUBLIC_OWNER_EMAIL;
  let isOwner = !!(ownerEmail && user.email?.toLowerCase() === ownerEmail.toLowerCase());

  if (!isOwner) {
    const { data: sub } = await supabase
      .from("user_subscriptions")
      .select("is_owner, is_beta_tester")
      .eq("user_id", user.id)
      .maybeSingle();

    if (sub?.is_owner) isOwner = true;
    if (!isOwner && !sub?.is_beta_tester) {
      redirect("/dashboard");
    }
  }
}

import { Sidebar } from "@/components/sidebar";
import { DailyCheckin } from "@/components/daily-checkin";
import { InviteRedeemer } from "@/components/invite-redeemer";
import { Starfield } from "@/components/starfield";
import { QuickEmotionFab } from "@/components/quick-emotion-fab";
import { OnboardingTour } from "@/components/onboarding-tour";
import { OnboardingGate } from "@/components/onboarding-gate";
import { ErrorBoundary } from "@/components/error-boundary";
import { SubscriptionProvider } from "@/lib/subscription-context";
import { createClient } from "@/lib/supabase/server";
import type { SubscriptionTier } from "@/lib/use-subscription";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side subscription check — zero race conditions
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const ownerEmail = process.env.OWNER_EMAIL || process.env.NEXT_PUBLIC_OWNER_EMAIL;
  let isOwner = !!(user && ownerEmail && user.email?.toLowerCase() === ownerEmail.toLowerCase());

  let tier: SubscriptionTier = "free";
  let isTrial = false;

  if (user) {
    try {
      // Use regular client — RLS allows SELECT on own rows, no admin client needed
      const { data: sub } = await supabase
        .from("user_subscriptions")
        .select("tier, is_trial, is_owner")
        .eq("user_id", user.id)
        .maybeSingle();
      if (sub) {
        tier = (sub.tier as SubscriptionTier) ?? "free";
        isTrial = sub.is_trial ?? false;
        if (sub.is_owner) {
          isOwner = true;
        }
      }
    } catch {
      // Subscription query failed — fall back to env-var-based owner check
    }
  }

  if (isOwner) {
    tier = "max";
  }

  return (
    <SubscriptionProvider tier={tier} isOwner={isOwner} isTrial={isTrial}>
      <OnboardingGate userId={user?.id} />
      <OnboardingTour>
        <div className="flex h-screen overflow-y-hidden overflow-x-clip relative">
          <Starfield />
          <Sidebar />
          <main id="dashboard-viewport" className="flex-1 overflow-y-auto px-4 md:px-8 py-6 pt-16 md:pt-6 transition-all duration-300 relative z-10">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>
          <DailyCheckin />
          <InviteRedeemer />
          <QuickEmotionFab />
        </div>
      </OnboardingTour>
    </SubscriptionProvider>
  );
}

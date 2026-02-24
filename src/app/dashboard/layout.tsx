import { Sidebar } from "@/components/sidebar";
import { DailyCheckin } from "@/components/daily-checkin";
import { InviteRedeemer } from "@/components/invite-redeemer";
import { Starfield } from "@/components/starfield";
import { QuickEmotionFab } from "@/components/quick-emotion-fab";
import { OnboardingTour } from "@/components/onboarding-tour";
import { ErrorBoundary } from "@/components/error-boundary";
import { SubscriptionProvider } from "@/lib/subscription-context";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SubscriptionTier } from "@/lib/use-subscription";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side subscription check — zero race conditions
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const ownerEmail = process.env.NEXT_PUBLIC_OWNER_EMAIL;
  const isOwner = !!(user && ownerEmail && user.email?.toLowerCase() === ownerEmail.toLowerCase());

  let tier: SubscriptionTier = "free";
  let isTrial = false;

  if (isOwner) {
    tier = "max";
  } else if (user) {
    try {
      const admin = createAdminClient();
      const { data: sub } = await admin
        .from("user_subscriptions")
        .select("tier, is_trial")
        .eq("user_id", user.id)
        .single();
      if (sub) {
        tier = (sub.tier as SubscriptionTier) ?? "free";
        isTrial = sub.is_trial ?? false;
      }
    } catch {}
  }

  return (
    <SubscriptionProvider tier={tier} isOwner={isOwner} isTrial={isTrial}>
      <OnboardingTour>
        <div className="flex h-screen overflow-hidden relative">
          <Starfield />
          <Sidebar />
          <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6 pt-16 md:pt-6 transition-all duration-300 relative z-10">
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

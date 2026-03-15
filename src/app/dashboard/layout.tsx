import dynamic from "next/dynamic";
import { Sidebar } from "@/components/sidebar";
const Starfield = dynamic(
  () => import("@/components/starfield").then(m => ({ default: m.Starfield }))
);
import { OnboardingTour } from "@/components/onboarding-tour";
import { OnboardingGate } from "@/components/onboarding-gate";
import { ErrorBoundary } from "@/components/error-boundary";
import { SubscriptionProvider } from "@/lib/subscription-context";
import { AchievementProvider } from "@/lib/achievements";
import { LevelProvider } from "@/lib/xp";
import { CosmeticProvider } from "@/lib/cosmetics";
import { ChallengeProvider } from "@/lib/challenges";
import { CoinsProvider } from "@/lib/coins";
import { GuideProvider } from "@/components/stargate-guide";
import { HelpCenterProvider } from "@/lib/help-center-context";
import { FlashNewsProvider } from "@/lib/news/flash-news-context";
import { PsychologyTierProvider } from "@/lib/psychology-tier-context";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { SubscriptionTier } from "@/lib/use-subscription";

// Lazy-load non-critical floating components (not visible on initial paint)
const DailyCheckin = dynamic(() => import("@/components/daily-checkin").then(m => ({ default: m.DailyCheckin })));
const InviteRedeemer = dynamic(() => import("@/components/invite-redeemer").then(m => ({ default: m.InviteRedeemer })));
const AchievementToast = dynamic(() => import("@/components/dashboard/achievement-toast").then(m => ({ default: m.AchievementToast })));
const LevelUpToast = dynamic(() => import("@/components/dashboard/level-up-toast").then(m => ({ default: m.LevelUpToast })));
const CelebrationOverlay = dynamic(() => import("@/components/dashboard/celebration-overlay").then(m => ({ default: m.CelebrationOverlay })));
const StargateGuideCharacter = dynamic(() => import("@/components/stargate-guide/stargate-guide").then(m => ({ default: m.StargateGuideCharacter })));
const GuideMenu = dynamic(() => import("@/components/stargate-guide/guide-menu").then(m => ({ default: m.GuideMenu })));
const GuideHelp = dynamic(() => import("@/components/stargate-guide/guide-help").then(m => ({ default: m.GuideHelp })));
const GuideSupport = dynamic(() => import("@/components/stargate-guide/guide-support").then(m => ({ default: m.GuideSupport })));
const Heartbeat = dynamic(() => import("@/components/heartbeat").then(m => ({ default: m.Heartbeat })));
const FlashNewsBanner = dynamic(() => import("@/components/news/flash-news-banner").then(m => ({ default: m.FlashNewsBanner })));
const HelpCenterPanel = dynamic(() => import("@/components/help-center/help-center-panel").then(m => ({ default: m.HelpCenterPanel })));
// PhantomQuickAdd removed — What If is now a toggle inside TradeForm

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
  let isReturningUser = false;

  if (user) {
    try {
      // Use regular client — RLS allows SELECT on own rows, no admin client needed
      const { data: sub } = await supabase
        .from("user_subscriptions")
        .select("tier, is_trial, is_owner, is_banned, created_at")
        .eq("user_id", user.id)
        .maybeSingle();
      if (sub) {
        // Safety-net: redirect banned users even if middleware cookie was missing
        if (sub.is_banned) {
          redirect("/banned");
        }
        tier = (sub.tier as SubscriptionTier) ?? "free";
        isTrial = sub.is_trial ?? false;
        if (sub.is_owner) {
          isOwner = true;
        }
        // Account older than 5 minutes = returning user (skip onboarding on new devices)
        if (sub.created_at) {
          const accountAge = Date.now() - new Date(sub.created_at).getTime();
          isReturningUser = accountAge > 5 * 60 * 1000;
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
      <PsychologyTierProvider userId={user?.id}>
      <AchievementProvider userId={user?.id}>
        <LevelProvider userId={user?.id}>
          <CosmeticProvider userId={user?.id}>
            <ChallengeProvider userId={user?.id}>
            <CoinsProvider userId={user?.id}>
            <GuideProvider>
            <HelpCenterProvider>
            <FlashNewsProvider>
              <OnboardingGate userId={user?.id} isReturningUser={isReturningUser} />
              <OnboardingTour>
                <div className="flex h-screen overflow-hidden relative">
                  <Starfield />
                  <Sidebar />
                  <main id="dashboard-viewport" className="flex-1 overflow-y-auto px-4 md:px-8 py-6 pt-16 md:pt-6 transition-all duration-300 relative z-10">
                    <FlashNewsBanner />
                    <ErrorBoundary>
                      {children}
                    </ErrorBoundary>
                  </main>
                  <DailyCheckin />
                  <InviteRedeemer />
                  <AchievementToast />
                  <LevelUpToast />
                  <CelebrationOverlay />
                  <StargateGuideCharacter />
                  <GuideMenu />
                  <GuideHelp />
                  <GuideSupport />
                  <Heartbeat />
                  <HelpCenterPanel />
                </div>
              </OnboardingTour>
            </FlashNewsProvider>
            </HelpCenterProvider>
            </GuideProvider>
            </CoinsProvider>
            </ChallengeProvider>
          </CosmeticProvider>
        </LevelProvider>
      </AchievementProvider>
      </PsychologyTierProvider>
    </SubscriptionProvider>
  );
}

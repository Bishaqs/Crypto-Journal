import { Sidebar } from "@/components/sidebar";
import { DailyCheckin } from "@/components/daily-checkin";
import { InviteRedeemer } from "@/components/invite-redeemer";
import { Starfield } from "@/components/starfield";
import { QuickEmotionFab } from "@/components/quick-emotion-fab";
import { OnboardingTour } from "@/components/onboarding-tour";
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
  let dbDebug: string = "no-user";

  if (user) {
    try {
      // Use regular client — RLS allows SELECT on own rows, no admin client needed
      const { data: sub, error: subErr } = await supabase
        .from("user_subscriptions")
        .select("tier, is_trial, is_owner")
        .eq("user_id", user.id)
        .maybeSingle();
      dbDebug = subErr ? `err:${subErr.message}` : sub ? JSON.stringify(sub) : "null";
      if (sub) {
        tier = (sub.tier as SubscriptionTier) ?? "free";
        isTrial = sub.is_trial ?? false;
        if (sub.is_owner) {
          isOwner = true;
        }
      }
    } catch (err) {
      dbDebug = `catch:${err instanceof Error ? err.message : err}`;
    }
  }

  if (isOwner) {
    tier = "max";
  }

  const debugInfo = JSON.stringify({
    userEmail: user?.email ?? "no-user",
    ownerEmail: ownerEmail ?? "none",
    envOwner: process.env.OWNER_EMAIL ? "set" : "unset",
    envNextPublicOwner: process.env.NEXT_PUBLIC_OWNER_EMAIL ? "set" : "unset",
    isOwner,
    tier,
    db: dbDebug,
  });

  return (
    <SubscriptionProvider tier={tier} isOwner={isOwner} isTrial={isTrial}>
      <OnboardingTour>
        <div className="flex h-screen overflow-hidden relative">
          {/* TEMPORARY DEBUG — remove after diagnosing isOwner issue */}
          <div style={{background:'#ff0',color:'#000',padding:'8px',fontSize:'11px',zIndex:9999,position:'fixed',top:0,left:0,right:0,fontFamily:'monospace',wordBreak:'break-all'}}>{debugInfo}</div>
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

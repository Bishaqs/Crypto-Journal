import { Sidebar } from "@/components/sidebar";
import { DailyCheckin } from "@/components/daily-checkin";
import { OnboardingGate } from "@/components/onboarding-gate";
import { Starfield } from "@/components/starfield";
import { QuickEmotionFab } from "@/components/quick-emotion-fab";
import { OnboardingTour } from "@/components/onboarding-tour";
import { ErrorBoundary } from "@/components/error-boundary";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
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
        <OnboardingGate />
        <QuickEmotionFab />
      </div>
    </OnboardingTour>
  );
}

"use client";

import { useEffect } from "react";
import { TourProvider, useTour } from "@/lib/tour-context";
import { isTourComplete } from "@/lib/onboarding";
import { useGuide } from "./traverse-guide/guide-context";

function TourStateManager() {
  const { state: tourState, startTour } = useTour();
  const { setMode, goHome } = useGuide();

  // Set guide mode based on tour activity
  useEffect(() => {
    if (tourState.isActive) {
      setMode("tour");
    } else {
      setMode("idle");
      goHome();
    }
  }, [tourState.isActive, setMode, goHome]);

  // Auto-start welcome tour on mount (if not completed)
  useEffect(() => {
    const onboarded = localStorage.getItem("stargate-onboarded");
    const version = localStorage.getItem("stargate-onboarding-version");
    if (!isTourComplete("welcome") && onboarded === "true" && version === "3") {
      const timer = setTimeout(() => {
        startTour("welcome");
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for onboarding completion to start welcome tour
  useEffect(() => {
    function handleOnboardingComplete() {
      if (!isTourComplete("welcome")) {
        setTimeout(() => {
          startTour("welcome");
          // Warp takes 2.5s — delay tour-started until after warp + step 1 render
          setTimeout(() => {
            window.dispatchEvent(new Event("stargate-tour-started"));
          }, 3000);
        }, 500);
      }
    }
    window.addEventListener(
      "stargate-onboarding-complete",
      handleOnboardingComplete,
    );
    return () =>
      window.removeEventListener(
        "stargate-onboarding-complete",
        handleOnboardingComplete,
      );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

export function OnboardingTour({ children }: { children: React.ReactNode }) {
  return (
    <TourProvider>
      {children}
      <TourStateManager />
    </TourProvider>
  );
}

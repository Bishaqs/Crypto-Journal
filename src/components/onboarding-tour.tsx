"use client";

import { useEffect } from "react";
import { NextStepProvider, useNextStep, NextStep } from "nextstepjs";
import { useNextAdapter } from "nextstepjs/adapters/next";
import {
  allTours,
  isTourComplete,
  markTourComplete,
} from "@/lib/onboarding";
import { GuideTourCard } from "./stargate-guide/guide-tour-card";
import { useGuide } from "./stargate-guide/guide-context";

const TOUR_STATE_KEY = "stargate-tour-active";

function dispatchGuideFly(detail: Record<string, unknown>) {
  window.dispatchEvent(new CustomEvent("tour-guide-fly", { detail }));
}

function TourStateManager() {
  const {
    startNextStep,
    currentTour,
    currentStep,
    setCurrentStep,
    isNextStepVisible,
  } = useNextStep();
  const { setMode, goHome } = useGuide();

  // Set guide mode based on tour visibility
  useEffect(() => {
    if (isNextStepVisible) {
      setMode("tour");
    } else {
      setMode("idle");
      goHome();
      dispatchGuideFly({ home: true });
    }
  }, [isNextStepVisible, setMode, goHome]);

  // Restore state on mount (HMR recovery)
  useEffect(() => {
    const saved = sessionStorage.getItem(TOUR_STATE_KEY);
    if (saved) {
      try {
        const { tour, step } = JSON.parse(saved);
        if (tour && !isTourComplete(tour)) {
          startNextStep(tour);
          if (step > 0) setTimeout(() => setCurrentStep(step), 50);
          return;
        }
      } catch {
        /* ignore parse errors */
      }
      sessionStorage.removeItem(TOUR_STATE_KEY);
    }
    // No saved state — start welcome tour if needed
    // Guard: only auto-start if onboarding is already complete (prevents starting under overlay)
    const onboarded = localStorage.getItem("stargate-onboarded");
    if (!isTourComplete("welcome") && onboarded === "true") {
      const timer = setTimeout(() => {
        startNextStep("welcome");
        requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for onboarding completion to start welcome tour
  useEffect(() => {
    function handleOnboardingComplete() {
      if (!isTourComplete("welcome")) {
        setTimeout(() => {
          startNextStep("welcome");
          requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
        }, 1500);
      }
    }
    window.addEventListener("stargate-onboarding-complete", handleOnboardingComplete);
    return () => window.removeEventListener("stargate-onboarding-complete", handleOnboardingComplete);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist state on step changes
  useEffect(() => {
    if (isNextStepVisible && currentTour) {
      sessionStorage.setItem(
        TOUR_STATE_KEY,
        JSON.stringify({ tour: currentTour, step: currentStep }),
      );
    }
  }, [currentTour, currentStep, isNextStepVisible]);

  return null;
}

function restoreSidebar() {
  window.dispatchEvent(
    new CustomEvent("tour-sidebar", { detail: { expand: false } }),
  );
  window.dispatchEvent(new CustomEvent("tour-sections-restore"));
}

function expandSidebar() {
  window.dispatchEvent(
    new CustomEvent("tour-sidebar", { detail: { expand: true } }),
  );
  window.dispatchEvent(new CustomEvent("tour-sections-expand"));
}

function handleStepChange(step: number, tourName: string | null) {
  if (!tourName) return;
  const tour = allTours.find((t) => t.tour === tourName);
  const stepDef = tour?.steps[step];
  if (!stepDef?.selector) {
    // No selector = floating card, guide stays home
    restoreSidebar();
    dispatchGuideFly({ rect: null, step, tourName });
    return;
  }

  // Check if the selector targets a sidebar item (tour-* IDs live in the sidebar)
  // Pre-expand sidebar + all sections so collapsed items become visible in the DOM
  const isSidebarSelector = stepDef.selector.startsWith("#tour-");
  if (isSidebarSelector) {
    expandSidebar();
    // Wait for sections to re-render before locating the element
    requestAnimationFrame(() => {
      const targetEl = document.querySelector(stepDef.selector!);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
        // Dispatch guide position after scroll settles
        setTimeout(() => {
          const rect = targetEl.getBoundingClientRect();
          dispatchGuideFly({
            rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
            side: stepDef.side || "right",
            step,
            tourName,
          });
        }, 300);
      }
    });
    return;
  }

  const targetEl = document.querySelector(stepDef.selector);
  if (!targetEl) return;

  // Non-sidebar target — restore sidebar and scroll into view
  restoreSidebar();
  const viewport = document.getElementById("dashboard-viewport");
  if (viewport?.contains(targetEl)) {
    targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  // Dispatch guide position after scroll settles
  setTimeout(() => {
    const rect = targetEl.getBoundingClientRect();
    dispatchGuideFly({
      rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
      side: stepDef.side || "bottom",
      step,
      tourName,
    });
  }, 300);
}

function sendGuideHome() {
  dispatchGuideFly({ home: true });
}

export function OnboardingTour({ children }: { children: React.ReactNode }) {
  return (
    <NextStepProvider>
      <NextStep
        steps={allTours}
        navigationAdapter={useNextAdapter}
        shadowRgb="0,0,0"
        shadowOpacity="0.75"
        cardComponent={GuideTourCard}
        disableConsoleLogs
        onStepChange={handleStepChange}
        onComplete={(tourName: string | null) => {
          if (tourName) markTourComplete(tourName);
          sessionStorage.removeItem(TOUR_STATE_KEY);
          restoreSidebar();
          sendGuideHome();
        }}
        onSkip={(_step: number, tourName: string | null) => {
          if (tourName) markTourComplete(tourName);
          sessionStorage.removeItem(TOUR_STATE_KEY);
          restoreSidebar();
          sendGuideHome();
        }}
      >
        {children}
        <TourStateManager />
      </NextStep>
    </NextStepProvider>
  );
}

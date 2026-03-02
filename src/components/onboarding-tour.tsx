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

const TOUR_STATE_KEY = "stargate-tour-active";

function TourStateManager() {
  const {
    startNextStep,
    currentTour,
    currentStep,
    setCurrentStep,
    isNextStepVisible,
  } = useNextStep();

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
    if (!isTourComplete("welcome")) {
      const timer = setTimeout(() => {
        startNextStep("welcome");
        requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
      }, 1000);
      return () => clearTimeout(timer);
    }
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
    // No selector = floating card, restore sidebar
    restoreSidebar();
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
        }}
        onSkip={(_step: number, tourName: string | null) => {
          if (tourName) markTourComplete(tourName);
          sessionStorage.removeItem(TOUR_STATE_KEY);
          restoreSidebar();
        }}
      >
        {children}
        <TourStateManager />
      </NextStep>
    </NextStepProvider>
  );
}

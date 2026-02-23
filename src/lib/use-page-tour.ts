"use client";

import { useEffect } from "react";
import { useNextStep } from "nextstepjs";
import { isTourComplete } from "./onboarding";

/**
 * Auto-starts a page-specific tour on first visit.
 * Only triggers if the welcome tour is already complete.
 */
export function usePageTour(tourName: string) {
  const { startNextStep } = useNextStep();

  useEffect(() => {
    // Don't trigger page tours until welcome tour is done
    if (!isTourComplete("welcome")) return;
    if (isTourComplete(tourName)) return;

    const timer = setTimeout(() => {
      startNextStep(tourName);
    }, 500);
    return () => clearTimeout(timer);
  }, [tourName, startNextStep]);
}

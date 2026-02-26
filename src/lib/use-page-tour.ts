"use client";

import { useEffect, useRef } from "react";
import { useNextStep } from "nextstepjs";
import { isTourComplete, markTourComplete } from "./onboarding";
import { allTours } from "./onboarding";

/**
 * Maps stock-specific tours to their crypto equivalents.
 * If the user already completed the crypto version, auto-skip the stock version
 * to avoid redundant explanations of the same concept.
 */
const TOUR_EQUIVALENTS: Record<string, string> = {
  "stocks-trades-page": "trades-page",
  "stocks-analytics-page": "analytics-page",
  "stocks-watchlist-page": "plans-page",
  "stocks-market-page": "market-page",
};

/**
 * Auto-starts a page-specific tour on first visit.
 * Only triggers if the welcome tour is already complete.
 *
 * Features:
 * - Selector retry: waits for async-rendered elements before starting
 *   (nextstepjs Issue #67 — elements may not exist in DOM yet)
 * - Resize dispatch: ensures card positions recalculate after navigation
 *   (nextstepjs Issue #28 — cards may not appear after navigation)
 */
export function usePageTour(tourName: string) {
  const { startNextStep } = useNextStep();
  const attemptRef = useRef(0);

  useEffect(() => {
    // Don't trigger page tours until welcome tour is done
    if (!isTourComplete("welcome")) return;
    if (isTourComplete(tourName)) return;

    // Skip stock tours whose crypto equivalent was already completed
    const equivalent = TOUR_EQUIVALENTS[tourName];
    if (equivalent && isTourComplete(equivalent)) {
      markTourComplete(tourName);
      return;
    }

    // Find the first step's selector (if any) to verify element exists
    const tour = allTours.find((t) => t.tour === tourName);
    const firstSelector = tour?.steps[0]?.selector;

    const MAX_RETRIES = 5;
    const RETRY_DELAY = 300;
    attemptRef.current = 0;

    function tryStart() {
      attemptRef.current++;

      // If a selector is defined, verify the element exists in DOM
      if (firstSelector && !document.querySelector(firstSelector)) {
        if (attemptRef.current < MAX_RETRIES) {
          retryTimer = setTimeout(tryStart, RETRY_DELAY);
          return;
        }
        // After max retries, start anyway — nextstepjs will handle missing selector
      }

      startNextStep(tourName);
      // Workaround: dispatch resize to trigger card position recalculation
      requestAnimationFrame(() => {
        window.dispatchEvent(new Event("resize"));
      });
    }

    // Initial delay for page to settle before first attempt
    let retryTimer: ReturnType<typeof setTimeout>;
    const initialTimer = setTimeout(tryStart, 500);

    return () => {
      clearTimeout(initialTimer);
      clearTimeout(retryTimer);
    };
  }, [tourName, startNextStep]);
}

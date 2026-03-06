"use client";

import { useEffect, useRef } from "react";
import { useTour } from "./tour-context";
import { isTourComplete, markTourComplete, allTours } from "./onboarding";

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
 */
export function usePageTour(tourName: string) {
  const { startTour, state } = useTour();
  const attemptRef = useRef(0);

  useEffect(() => {
    if (state.isActive) return; // Don't start if another tour is running
    if (!isTourComplete("welcome")) return;
    if (isTourComplete(tourName)) return;

    const equivalent = TOUR_EQUIVALENTS[tourName];
    if (equivalent && isTourComplete(equivalent)) {
      markTourComplete(tourName);
      return;
    }

    const tour = allTours.find((t) => t.tour === tourName);
    const firstSelector = tour?.steps[0]?.selector;

    const MAX_RETRIES = 5;
    const RETRY_DELAY = 300;
    attemptRef.current = 0;

    function tryStart() {
      attemptRef.current++;

      if (firstSelector && !document.querySelector(firstSelector)) {
        if (attemptRef.current < MAX_RETRIES) {
          retryTimer = setTimeout(tryStart, RETRY_DELAY);
        }
        // Don't start if selector never found — avoids stuck overlay
        return;
      }

      startTour(tourName);
    }

    let retryTimer: ReturnType<typeof setTimeout>;
    const initialTimer = setTimeout(tryStart, 500);

    return () => {
      clearTimeout(initialTimer);
      clearTimeout(retryTimer);
    };
  }, [tourName, startTour, state.isActive]);
}

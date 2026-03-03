"use client";

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { allTours, markTourComplete, isTourComplete } from "./onboarding";

// ─── Types ──────────────────────────────────────────────────

export type TourStep = {
  icon?: string;
  title: string;
  content: string;
  selector?: string;
  side?: string;
  showControls?: boolean;
  showSkip?: boolean;
  pointerPadding?: number;
  pointerRadius?: number;
  viewportID?: string;
  presentation?: "centered" | "attached";
  transitionEffect?: "star-warp";
  logoSize?: number;
};

export type TourDef = {
  tour: string;
  steps: TourStep[];
};

type TourState = {
  isActive: boolean;
  tourName: string | null;
  currentStep: number;
  totalSteps: number;
};

type TourAction =
  | { type: "START"; tourName: string; totalSteps: number }
  | { type: "NEXT" }
  | { type: "PREV" }
  | { type: "GO_TO"; step: number }
  | { type: "END" };

const initialState: TourState = {
  isActive: false,
  tourName: null,
  currentStep: 0,
  totalSteps: 0,
};

function tourReducer(state: TourState, action: TourAction): TourState {
  switch (action.type) {
    case "START":
      return {
        isActive: true,
        tourName: action.tourName,
        currentStep: 0,
        totalSteps: action.totalSteps,
      };
    case "NEXT":
      if (state.currentStep >= state.totalSteps - 1) return state;
      return { ...state, currentStep: state.currentStep + 1 };
    case "PREV":
      if (state.currentStep <= 0) return state;
      return { ...state, currentStep: state.currentStep - 1 };
    case "GO_TO":
      return { ...state, currentStep: action.step };
    case "END":
      return initialState;
    default:
      return state;
  }
}

// ─── Context ────────────────────────────────────────────────

type TourContextValue = {
  state: TourState;
  currentStepDef: TourStep | null;
  startTour: (name: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  advanceStep: () => void;
};

const TourContext = createContext<TourContextValue | null>(null);

// ─── Helpers ────────────────────────────────────────────────

const TOUR_SESSION_KEY = "stargate-tour-active";

function dispatchGuideFly(detail: Record<string, unknown>) {
  window.dispatchEvent(new CustomEvent("tour-guide-fly", { detail }));
}

// Maps sidebar tour IDs to the drawer category that contains them
const TOUR_ID_TO_CATEGORY: Record<string, string> = {
  "tour-trades": "journal",
  "tour-journal": "journal",
  "tour-calendar": "journal",
  "tour-plans": "journal",
  "tour-analytics": "analytics",
  "tour-insights": "analytics",
  "tour-ai": "analytics",
  "tour-view-toggle": "analytics",
};

const SIDEBAR_TOUR_IDS = new Set(Object.keys(TOUR_ID_TO_CATEGORY));

function expandSidebar(category?: string) {
  window.dispatchEvent(
    new CustomEvent("tour-sidebar", { detail: { expand: true, category: category || "journal" } }),
  );
  window.dispatchEvent(new CustomEvent("tour-sections-expand"));
}

function restoreSidebar() {
  window.dispatchEvent(
    new CustomEvent("tour-sidebar", { detail: { expand: false } }),
  );
  window.dispatchEvent(new CustomEvent("tour-sections-restore"));
}

// ─── Step Execution ─────────────────────────────────────────

function executeStep(step: TourStep, stepIndex: number, tourName: string) {
  const isCentered = step.presentation === "centered";

  // ── Centered mode: guide + bubble stay centered, element just gets highlight ──
  if (isCentered) {
    if (step.selector) {
      const selectorId = step.selector.replace("#", "");
      const isSidebarTarget = SIDEBAR_TOUR_IDS.has(selectorId);

      if (isSidebarTarget) {
        const category = TOUR_ID_TO_CATEGORY[selectorId] || "journal";
        expandSidebar(category);

        setTimeout(() => {
          document
            .querySelectorAll(".tour-highlight")
            .forEach((el) => el.classList.remove("tour-highlight"));
          const targetEl = document.querySelector(step.selector!);
          if (targetEl) {
            targetEl.classList.add("tour-highlight");
            targetEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
          }
          dispatchGuideFly({ centered: true, step: stepIndex, tourName });
        }, 380);
      } else {
        // Close sidebar first, then wait for drawer close animation before highlighting
        restoreSidebar();

        setTimeout(() => {
          document
            .querySelectorAll(".tour-highlight")
            .forEach((el) => el.classList.remove("tour-highlight"));
          const targetEl = document.querySelector(step.selector!);
          if (targetEl) {
            targetEl.classList.add("tour-highlight");
            const viewport = document.getElementById(step.viewportID || "dashboard-viewport");
            if (viewport?.contains(targetEl)) {
              targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
            }
          }
          dispatchGuideFly({ centered: true, step: stepIndex, tourName });
        }, 200);
      }
    } else {
      // Floating centered step — no target
      restoreSidebar();
      document
        .querySelectorAll(".tour-highlight")
        .forEach((el) => el.classList.remove("tour-highlight"));
      dispatchGuideFly({ centered: true, step: stepIndex, tourName });
    }
    return;
  }

  // ── Attached mode (default): guide flies to element ──

  if (!step.selector) {
    restoreSidebar();
    dispatchGuideFly({ rect: null, step: stepIndex, tourName });
    return;
  }

  const selectorId = step.selector.replace("#", "");
  const isSidebarSelector = SIDEBAR_TOUR_IDS.has(selectorId);

  if (isSidebarSelector) {
    const category = TOUR_ID_TO_CATEGORY[selectorId] || "journal";
    expandSidebar(category);
    setTimeout(() => {
      const targetEl = document.querySelector(step.selector!);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
        document
          .querySelectorAll(".tour-highlight")
          .forEach((el) => el.classList.remove("tour-highlight"));
        targetEl.classList.add("tour-highlight");
        const rect = targetEl.getBoundingClientRect();
        dispatchGuideFly({
          rect: {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          },
          side: step.side || "right",
          step: stepIndex,
          tourName,
          padding: step.pointerPadding ?? 8,
          radius: step.pointerRadius ?? 12,
        });
      }
    }, 380);
    return;
  }

  // Non-sidebar target
  restoreSidebar();
  const targetEl = document.querySelector(step.selector);
  if (!targetEl) return;

  document
    .querySelectorAll(".tour-highlight")
    .forEach((el) => el.classList.remove("tour-highlight"));
  targetEl.classList.add("tour-highlight");

  const viewport = document.getElementById(
    step.viewportID || "dashboard-viewport",
  );
  if (viewport?.contains(targetEl)) {
    targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  setTimeout(() => {
    const rect = targetEl.getBoundingClientRect();
    dispatchGuideFly({
      rect: {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      },
      side: step.side || "bottom",
      step: stepIndex,
      tourName,
      padding: step.pointerPadding ?? 10,
      radius: step.pointerRadius ?? 12,
    });
  }, 300);
}

function cleanupHighlights() {
  document
    .querySelectorAll(".tour-highlight")
    .forEach((el) => el.classList.remove("tour-highlight"));
}

// ─── Provider ───────────────────────────────────────────────

export function TourProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(tourReducer, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Get current step definition
  const currentStepDef: TourStep | null = (() => {
    if (!state.isActive || !state.tourName) return null;
    const tour = allTours.find((t) => t.tour === state.tourName);
    return tour?.steps[state.currentStep] ?? null;
  })();

  const completeTour = useCallback((tourName: string | null) => {
    if (tourName) markTourComplete(tourName);
    sessionStorage.removeItem(TOUR_SESSION_KEY);
    cleanupHighlights();
    restoreSidebar();
    dispatchGuideFly({ home: true });
    dispatch({ type: "END" });
  }, []);

  const startTour = useCallback(
    (name: string) => {
      if (stateRef.current.isActive) return;
      const tour = allTours.find((t) => t.tour === name);
      if (!tour || tour.steps.length === 0) return;
      dispatch({ type: "START", tourName: name, totalSteps: tour.steps.length });
      // Execute first step after a frame
      requestAnimationFrame(() => {
        executeStep(tour.steps[0], 0, name);
      });
    },
    [],
  );

  // advanceStep: unconditionally advances (used after star-warp completes)
  const advanceStep = useCallback(() => {
    const s = stateRef.current;
    if (!s.isActive || !s.tourName) return;
    if (s.currentStep >= s.totalSteps - 1) {
      completeTour(s.tourName);
      return;
    }
    dispatch({ type: "NEXT" });
    const tour = allTours.find((t) => t.tour === s.tourName);
    const nextIdx = s.currentStep + 1;
    if (tour?.steps[nextIdx]) {
      executeStep(tour.steps[nextIdx], nextIdx, s.tourName);
    }
  }, [completeTour]);

  const nextStep = useCallback(() => {
    const s = stateRef.current;
    if (!s.isActive || !s.tourName) return;

    // Check if current step has a transition effect
    const tour = allTours.find((t) => t.tour === s.tourName);
    const currentDef = tour?.steps[s.currentStep];
    if (currentDef?.transitionEffect === "star-warp") {
      // Dispatch event — guide component handles warp, then calls advanceStep
      window.dispatchEvent(new CustomEvent("tour-star-warp"));
      return;
    }

    if (s.currentStep >= s.totalSteps - 1) {
      completeTour(s.tourName);
      return;
    }
    dispatch({ type: "NEXT" });
    const nextIdx = s.currentStep + 1;
    if (tour?.steps[nextIdx]) {
      executeStep(tour.steps[nextIdx], nextIdx, s.tourName);
    }
  }, [completeTour, advanceStep]);

  const prevStep = useCallback(() => {
    const s = stateRef.current;
    if (!s.isActive || !s.tourName || s.currentStep <= 0) return;
    dispatch({ type: "PREV" });
    const tour = allTours.find((t) => t.tour === s.tourName);
    const prevIdx = s.currentStep - 1;
    if (tour?.steps[prevIdx]) {
      executeStep(tour.steps[prevIdx], prevIdx, s.tourName);
    }
  }, []);

  const skipTour = useCallback(() => {
    completeTour(stateRef.current.tourName);
  }, [completeTour]);

  // Persist tour state for HMR recovery
  useEffect(() => {
    if (state.isActive && state.tourName) {
      sessionStorage.setItem(
        TOUR_SESSION_KEY,
        JSON.stringify({ tour: state.tourName, step: state.currentStep }),
      );
    }
  }, [state.isActive, state.tourName, state.currentStep]);

  // Restore tour state on mount
  useEffect(() => {
    const saved = sessionStorage.getItem(TOUR_SESSION_KEY);
    if (saved) {
      try {
        const { tour, step } = JSON.parse(saved);
        if (tour && !isTourComplete(tour)) {
          const tourDef = allTours.find((t) => t.tour === tour);
          if (tourDef) {
            dispatch({
              type: "START",
              tourName: tour,
              totalSteps: tourDef.steps.length,
            });
            if (step > 0) {
              setTimeout(() => {
                dispatch({ type: "GO_TO", step });
                executeStep(tourDef.steps[step], step, tour);
              }, 50);
            } else {
              requestAnimationFrame(() => {
                executeStep(tourDef.steps[0], 0, tour);
              });
            }
            return;
          }
        }
      } catch {
        /* ignore parse errors */
      }
      sessionStorage.removeItem(TOUR_SESSION_KEY);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <TourContext.Provider
      value={{ state, currentStepDef, startTour, nextStep, prevStep, skipTour, advanceStep }}
    >
      {children}
    </TourContext.Provider>
  );
}

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error("useTour must be used within TourProvider");
  return ctx;
}

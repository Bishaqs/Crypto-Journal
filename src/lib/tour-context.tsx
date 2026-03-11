"use client";

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { allTours, markTourComplete, isTourComplete } from "./onboarding";

// ─── Types ──────────────────────────────────────────────────

export type TourStep = {
  // New fields (optional for backward compat with page-specific tours)
  id?: string;
  layout?: "fullscreen" | "spotlight";
  sidebarCategory?: string;
  sidebarClose?: boolean;
  appsDropdown?: boolean;
  // Existing fields kept for page-specific tours
  icon?: string;
  title: string;
  content: string;
  titleKey?: string;
  contentKey?: string;
  selector?: string;
  side?: string;
  showControls?: boolean;
  showSkip?: boolean;
  pointerPadding?: number;
  pointerRadius?: number;
  viewportID?: string;
  presentation?: "centered" | "attached"; // legacy — mapped to layout
  transitionEffect?: "star-warp";
  logoSize?: number;
};

export type TourDef = {
  tour: string;
  steps: TourStep[];
};

export type StepTarget = {
  rect: DOMRect;
  side: string;
  padding: number;
  radius: number;
} | null;

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
  stepTarget: StepTarget;
  startTour: (name: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  advanceStep: () => void;
};

const TourContext = createContext<TourContextValue | null>(null);

// ─── Helpers ────────────────────────────────────────────────

const TOUR_SESSION_KEY = "stargate-tour-active";

/** Resolve effective layout — maps legacy `presentation` to new `layout` */
export function getEffectiveLayout(step: TourStep): "fullscreen" | "spotlight" {
  if (step.layout) return step.layout;
  if (step.presentation === "centered") return "fullscreen";
  return "spotlight";
}

function waitForElement(selector: string, timeout = 2000): Promise<Element | null> {
  return new Promise((resolve) => {
    const el = document.querySelector(selector);
    if (el) { resolve(el); return; }
    let timer: ReturnType<typeof setTimeout>;
    const observer = new MutationObserver(() => {
      const found = document.querySelector(selector);
      if (found) { observer.disconnect(); clearTimeout(timer); resolve(found); }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    timer = setTimeout(() => { observer.disconnect(); resolve(null); }, timeout);
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function scrollIntoViewIfNeeded(el: Element, viewportID?: string) {
  const viewport = document.getElementById(viewportID || "dashboard-viewport");
  if (viewport?.contains(el)) {
    el.scrollIntoView({ behavior: "instant", block: "center" });
  }
}

function cleanupHighlights() {
  document.querySelectorAll(".tour-highlight").forEach((el) => el.classList.remove("tour-highlight"));
}

// ─── Provider ───────────────────────────────────────────────

export function TourProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(tourReducer, initialState);
  const [stepTarget, setStepTarget] = useState<StepTarget>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Track current step's selector for resize recalculation
  const currentSelectorRef = useRef<string | undefined>(undefined);
  const currentSideRef = useRef<string>("right");
  const currentPaddingRef = useRef<number>(8);
  const currentRadiusRef = useRef<number>(12);

  // Get current step definition
  const currentStepDef: TourStep | null = (() => {
    if (!state.isActive || !state.tourName) return null;
    const tour = allTours.find((t) => t.tour === state.tourName);
    return tour?.steps[state.currentStep] ?? null;
  })();

  const completeTour = useCallback((tourName: string | null) => {
    if (tourName) markTourComplete(tourName);
    sessionStorage.removeItem(TOUR_SESSION_KEY);

    // Close apps dropdown
    window.dispatchEvent(new CustomEvent("tour-apps", { detail: { open: false } }));

    // Clean highlights
    cleanupHighlights();

    // Restore sidebar
    window.dispatchEvent(new CustomEvent("tour-sidebar", { detail: { expand: false } }));

    dispatch({ type: "END" });
    setStepTarget(null);
    currentSelectorRef.current = undefined;
  }, []);

  const executeStep = useCallback(async (step: TourStep) => {
    // Clear stale stepTarget so the guide's Effect 2 doesn't fire
    // with the previous step's rect before our async work completes
    setStepTarget(null);
    currentSelectorRef.current = undefined;

    const effectiveLayout = getEffectiveLayout(step);

    // 1. Always close apps dropdown from previous step
    window.dispatchEvent(new CustomEvent("tour-apps", { detail: { open: false } }));

    // 2. Sidebar control — new declarative fields take precedence, then fall back to legacy behavior
    if (step.sidebarClose) {
      window.dispatchEvent(new CustomEvent("tour-sidebar", { detail: { expand: false, force: true } }));
      await sleep(300);
    }
    if (step.sidebarCategory) {
      window.dispatchEvent(new CustomEvent("tour-sidebar", { detail: { expand: true, category: step.sidebarCategory } }));
      await waitForElement("#tour-drawer-panel", 1500);
    }

    // 3. Apps dropdown
    if (step.appsDropdown) {
      // Close sidebar first if it's open
      window.dispatchEvent(new CustomEvent("tour-sidebar", { detail: { expand: false, force: true } }));
      await sleep(100);
      const vp = document.getElementById("dashboard-viewport");
      if (vp) vp.scrollTo({ top: 0, behavior: "instant" });
      window.dispatchEvent(new CustomEvent("tour-apps", { detail: { open: true } }));
      await sleep(200);
    }

    // 4. Highlight target
    cleanupHighlights();

    currentSelectorRef.current = step.selector;
    currentSideRef.current = step.side || "right";
    currentPaddingRef.current = step.pointerPadding ?? 8;
    currentRadiusRef.current = step.pointerRadius ?? 12;

    let targetRect: DOMRect | null = null;
    if (step.selector) {
      const el = await waitForElement(step.selector, 2000);
      if (el) {
        el.classList.add("tour-highlight");
        if (effectiveLayout === "spotlight") {
          scrollIntoViewIfNeeded(el, step.viewportID);
        }
        targetRect = el.getBoundingClientRect();
      } else {
        console.warn(`[Tour] Element ${step.selector} not found`);
      }
    }

    // 5. Update context — guide reads from here (no events needed)
    setStepTarget(
      targetRect
        ? {
            rect: targetRect,
            side: currentSideRef.current,
            padding: currentPaddingRef.current,
            radius: currentRadiusRef.current,
          }
        : null,
    );
  }, []);

  const startTour = useCallback(
    (name: string) => {
      if (stateRef.current.isActive) return;
      const tour = allTours.find((t) => t.tour === name);
      if (!tour || tour.steps.length === 0) return;
      dispatch({ type: "START", tourName: name, totalSteps: tour.steps.length });

      const firstStep = tour.steps[0];
      if (firstStep.transitionEffect === "star-warp") {
        requestAnimationFrame(() => {
          window.dispatchEvent(new CustomEvent("tour-star-warp"));
        });
        return;
      }

      requestAnimationFrame(() => {
        executeStep(tour.steps[0]);
      });
    },
    [executeStep],
  );

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
      executeStep(tour.steps[nextIdx]);
    }
  }, [completeTour, executeStep]);

  const nextStep = useCallback(() => {
    const s = stateRef.current;
    if (!s.isActive || !s.tourName) return;

    const tour = allTours.find((t) => t.tour === s.tourName);
    const currentDef = tour?.steps[s.currentStep];
    if (currentDef?.transitionEffect === "star-warp") {
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
      executeStep(tour.steps[nextIdx]);
    }
  }, [completeTour, executeStep]);

  const prevStep = useCallback(() => {
    const s = stateRef.current;
    if (!s.isActive || !s.tourName || s.currentStep <= 0) return;
    dispatch({ type: "PREV" });
    const tour = allTours.find((t) => t.tour === s.tourName);
    const prevIdx = s.currentStep - 1;
    if (tour?.steps[prevIdx]) {
      executeStep(tour.steps[prevIdx]);
    }
  }, [executeStep]);

  const skipTour = useCallback(() => {
    if (stateRef.current.isActive) {
      completeTour(stateRef.current.tourName);
    }
  }, [completeTour]);

  // Recalculate target rect on resize/scroll
  useEffect(() => {
    if (!state.isActive || !currentSelectorRef.current) return;

    const updateRect = () => {
      const el = document.querySelector(currentSelectorRef.current!);
      if (el) {
        setStepTarget({
          rect: el.getBoundingClientRect(),
          side: currentSideRef.current,
          padding: currentPaddingRef.current,
          radius: currentRadiusRef.current,
        });
      }
    };

    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, { capture: true, passive: true });

    return () => {
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, { capture: true });
    };
  }, [state.isActive, state.currentStep]);

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
                executeStep(tourDef.steps[step]);
              }, 50);
            } else {
              requestAnimationFrame(() => {
                executeStep(tourDef.steps[0]);
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
  }, [executeStep]);

  return (
    <TourContext.Provider
      value={{ state, currentStepDef, stepTarget, startTour, nextStep, prevStep, skipTour, advanceStep }}
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

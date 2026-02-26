"use client";

import { useEffect, useRef } from "react";
import { NextStepProvider, useNextStep, NextStep } from "nextstepjs";
import type { CardComponentProps } from "nextstepjs";
import { useNextAdapter } from "nextstepjs/adapters/next";
import {
  allTours,
  isTourComplete,
  markTourComplete,
} from "@/lib/onboarding";
import { ArrowRight, ArrowLeft, X, CheckCircle2 } from "lucide-react";

function TourCard({
  step,
  currentStep,
  totalSteps,
  nextStep,
  prevStep,
  skipTour,
  arrow,
}: CardComponentProps) {
  const isLast = currentStep === totalSteps - 1;
  const cardRef = useRef<HTMLDivElement>(null);

  // Clamp card into the dashboard viewport (both X and Y axes)
  // Re-runs on step change AND on window resize (handles rotation, sidebar toggle)
  useEffect(() => {
    function clampCard() {
      const el = cardRef.current;
      if (!el) return;
      el.style.transform = "";
      requestAnimationFrame(() => {
        const viewport = document.getElementById("dashboard-viewport");
        const rect = el.getBoundingClientRect();
        const bounds = viewport?.getBoundingClientRect() ?? {
          top: 0,
          bottom: window.innerHeight,
          left: 0,
          right: window.innerWidth,
        };
        let dy = 0;
        let dx = 0;
        // Vertical clamping
        if (rect.top < bounds.top + 8) dy = bounds.top + 8 - rect.top;
        else if (rect.bottom > bounds.bottom - 8)
          dy = bounds.bottom - 8 - rect.bottom;
        // Horizontal clamping
        if (rect.left < bounds.left + 8) dx = bounds.left + 8 - rect.left;
        else if (rect.right > bounds.right - 8)
          dx = bounds.right - 8 - rect.right;
        if (dy !== 0 || dx !== 0)
          el.style.transform = `translate(${dx}px, ${dy}px)`;
      });
    }

    clampCard();
    window.addEventListener("resize", clampCard);
    return () => window.removeEventListener("resize", clampCard);
  }, [currentStep]);

  // Keyboard navigation: Escape to skip, ArrowRight for next, ArrowLeft for back
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape" && skipTour) skipTour();
      else if (e.key === "ArrowRight") nextStep();
      else if (e.key === "ArrowLeft" && currentStep > 0) prevStep();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [currentStep, nextStep, prevStep, skipTour]);

  return (
    <div
      ref={cardRef}
      className="glass rounded-2xl border border-border/50 p-5 w-[340px] max-w-[90vw] relative"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      {arrow}

      {/* Progress bar */}
      <div className="h-1 rounded-full bg-surface mb-4 overflow-hidden">
        <div
          className="h-full bg-accent rounded-full transition-all duration-300"
          style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
        />
      </div>

      {/* Icon + title */}
      <div className="flex items-center gap-2 mb-2">
        {step.icon && <span className="text-xl">{step.icon}</span>}
        <h3 className="text-sm font-bold text-foreground">{step.title}</h3>
      </div>

      {/* Content */}
      <p className="text-xs text-muted leading-relaxed mb-4">{step.content}</p>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted/50 font-mono">
          {currentStep + 1}/{totalSteps}
        </span>
        <div className="flex items-center gap-2">
          {step.showSkip && skipTour && (
            <button
              onClick={skipTour}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] text-muted hover:text-foreground transition-colors"
            >
              <X size={12} />
              Skip
            </button>
          )}
          {currentStep > 0 && (
            <button
              onClick={prevStep}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface border border-border text-xs text-foreground hover:border-accent/30 transition-all"
            >
              <ArrowLeft size={12} />
              Back
            </button>
          )}
          <button
            onClick={nextStep}
            className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-accent text-background text-xs font-semibold hover:bg-accent-hover transition-all"
          >
            {isLast ? (
              <>
                <CheckCircle2 size={12} />
                Done
              </>
            ) : (
              <>
                Next
                <ArrowRight size={12} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

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

export function OnboardingTour({ children }: { children: React.ReactNode }) {
  return (
    <NextStepProvider>
      <NextStep
        steps={allTours}
        navigationAdapter={useNextAdapter}
        shadowRgb="0,0,0"
        shadowOpacity="0.75"
        cardComponent={TourCard}
        disableConsoleLogs
        onComplete={(tourName: string | null) => {
          if (tourName) markTourComplete(tourName);
          sessionStorage.removeItem(TOUR_STATE_KEY);
        }}
        onSkip={(_step: number, tourName: string | null) => {
          if (tourName) markTourComplete(tourName);
          sessionStorage.removeItem(TOUR_STATE_KEY);
        }}
      >
        {children}
        <TourStateManager />
      </NextStep>
    </NextStepProvider>
  );
}

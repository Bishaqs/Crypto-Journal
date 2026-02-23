"use client";

import { useEffect, useRef } from "react";
import { NextStepProvider, useNextStep, NextStep } from "nextstepjs";
import type { CardComponentProps } from "nextstepjs";
import { useNextAdapter } from "nextstepjs/adapters/next";
import {
  allTours,
  LEGACY_ONBOARDING_KEY,
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

  // Clamp card into viewport if clipped at top/bottom
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    el.style.transform = "";
    requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      let dy = 0;
      if (rect.top < 8) dy = -rect.top + 8;
      else if (rect.bottom > window.innerHeight - 8)
        dy = window.innerHeight - 8 - rect.bottom;
      if (dy !== 0) el.style.transform = `translateY(${dy}px)`;
    });
  }, [currentStep]);

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

function TourAutoStart() {
  const { startNextStep } = useNextStep();

  useEffect(() => {
    if (!isTourComplete("welcome")) {
      const timer = setTimeout(() => {
        startNextStep("welcome");
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [startNextStep]);

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
          if (tourName === "welcome") {
            localStorage.setItem(LEGACY_ONBOARDING_KEY, "true");
          }
        }}
        onSkip={(_step: number, tourName: string | null) => {
          if (tourName) markTourComplete(tourName);
          if (tourName === "welcome") {
            localStorage.setItem(LEGACY_ONBOARDING_KEY, "true");
          }
        }}
      >
        {children}
        <TourAutoStart />
      </NextStep>
    </NextStepProvider>
  );
}

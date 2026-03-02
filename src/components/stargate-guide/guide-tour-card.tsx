"use client";

import { useEffect, useRef } from "react";
import type { CardComponentProps } from "nextstepjs";
import { ArrowRight, ArrowLeft, X, CheckCircle2 } from "lucide-react";

export function GuideTourCard({
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
        if (rect.top < bounds.top + 8) dy = bounds.top + 8 - rect.top;
        else if (rect.bottom > bounds.bottom - 8)
          dy = bounds.bottom - 8 - rect.bottom;
        if (rect.left < bounds.left + 8) dx = bounds.left + 8 - rect.left;
        else if (rect.right > bounds.right - 8)
          dx = bounds.right - 8 - rect.right;
        if (dy !== 0 || dx !== 0)
          el.style.transform = `translate(${dx}px, ${dy}px)`;
      });
    }

    clampCard();
    const timer = setTimeout(clampCard, 400);
    window.addEventListener("resize", clampCard);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", clampCard);
    };
  }, [currentStep]);

  // Keyboard navigation
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
      className="glass rounded-2xl border border-border/50 w-[340px] max-w-[90vw] relative"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      {arrow}

      {/* Guide character + speech area */}
      <div className="p-4 pb-3">
        {/* Progress bar — guide character flies to this card externally */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1">
            <div className="h-1 rounded-full bg-surface overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-300"
                style={{
                  width: `${((currentStep + 1) / totalSteps) * 100}%`,
                }}
              />
            </div>
          </div>
          <span className="text-[10px] text-muted/50 font-mono shrink-0">
            {currentStep + 1}/{totalSteps}
          </span>
        </div>

        {/* Speech content */}
        <div className="pl-1">
          {/* Icon + title */}
          <div className="flex items-center gap-2 mb-1.5">
            {step.icon && <span className="text-lg">{step.icon}</span>}
            <h3 className="text-sm font-bold text-foreground">{step.title}</h3>
          </div>

          {/* Content */}
          <p className="text-xs text-muted leading-relaxed mb-3">
            {step.content}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-end gap-2">
          {step.showSkip && skipTour && (
            <button
              onClick={skipTour}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] text-muted hover:text-foreground transition-colors mr-auto"
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

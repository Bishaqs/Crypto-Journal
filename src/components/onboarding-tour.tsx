"use client";

import { useEffect } from "react";
import { NextStepProvider, useNextStep, NextStep } from "nextstepjs";
import { useNextAdapter } from "nextstepjs/adapters/next";
import { onboardingTour, ONBOARDING_KEY } from "@/lib/onboarding";

function TourAutoStart() {
  const { startNextStep } = useNextStep();

  useEffect(() => {
    const done = localStorage.getItem(ONBOARDING_KEY);
    if (!done) {
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
        steps={onboardingTour}
        navigationAdapter={useNextAdapter}
        shadowRgb="0,0,0"
        shadowOpacity="0.75"
        disableConsoleLogs
        onComplete={() => {
          localStorage.setItem(ONBOARDING_KEY, "true");
        }}
        onSkip={() => {
          localStorage.setItem(ONBOARDING_KEY, "true");
        }}
      >
        {children}
        <TourAutoStart />
      </NextStep>
    </NextStepProvider>
  );
}

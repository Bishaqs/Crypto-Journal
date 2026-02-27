"use client";

import { useState, useEffect } from "react";
import { Onboarding } from "./onboarding";
import { FeatureExplainer } from "./feature-explainer";

type GateStep = "loading" | "onboarding" | "features" | "done";

const ONBOARDING_KEYS = [
  "stargate-onboarded",
  "stargate-features-seen",
  "stargate-display-name",
  "stargate-experience-level",
  "stargate-getting-started-dismissed",
  "stargate-started-first-trade",
  "stargate-started-first-journal",
  "stargate-started-try-ai",
  "stargate-started-import-trades",
  "stargate-tour-welcome",
];

export function OnboardingGate({ userId }: { userId?: string }) {
  const [step, setStep] = useState<GateStep>("loading");

  useEffect(() => {
    // Detect user switch — clear onboarding state so new user gets fresh experience
    if (userId) {
      const prevUser = localStorage.getItem("stargate-current-user");
      if (prevUser !== userId) {
        ONBOARDING_KEYS.forEach((k) => localStorage.removeItem(k));
      }
      localStorage.setItem("stargate-current-user", userId);
    }

    const onboarded = localStorage.getItem("stargate-onboarded");
    const featuresSeen = localStorage.getItem("stargate-features-seen");
    // Existing users who completed the nextstepjs welcome tour skip onboarding
    const legacyTour = localStorage.getItem("stargate-tour-welcome");
    const legacyOnboarding = localStorage.getItem("stargate-onboarding-complete");

    if (!onboarded && !legacyTour && !legacyOnboarding) {
      setStep("onboarding");
    } else if (!featuresSeen) {
      setStep("features");
    } else {
      setStep("done");
    }
  }, [userId]);

  if (step === "loading" || step === "done") return null;

  if (step === "onboarding") {
    return (
      <Onboarding
        onComplete={() => {
          const featuresSeen = localStorage.getItem("stargate-features-seen");
          setStep(featuresSeen ? "done" : "features");
        }}
      />
    );
  }

  if (step === "features") {
    return <FeatureExplainer onComplete={() => setStep("done")} />;
  }

  return null;
}

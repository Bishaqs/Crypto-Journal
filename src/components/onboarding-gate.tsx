"use client";

import { useState, useEffect } from "react";
import { Onboarding } from "./onboarding";
import { FeatureExplainer } from "./feature-explainer";

type GateStep = "loading" | "onboarding" | "features" | "done";

export function OnboardingGate() {
  const [step, setStep] = useState<GateStep>("loading");

  useEffect(() => {
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
  }, []);

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

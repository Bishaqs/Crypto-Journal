"use client";

import { useState, useEffect } from "react";
import { GuideOnboarding } from "./stargate-guide/guide-onboarding";

type GateStep = "loading" | "onboarding" | "done";

// Bump this when onboarding steps change to re-trigger for existing users
const ONBOARDING_VERSION = "3";

const ONBOARDING_KEYS = [
  "stargate-onboarded",
  "stargate-onboarding-version",
  "stargate-display-name",
  "stargate-experience-level",
  "stargate-account-type",
  "stargate-broker",
  "stargate-instruments",
  "stargate-goals",
  "stargate-risk-tolerance",
  "stargate-preferred-analytics",
  "stargate-referral",
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
    const version = localStorage.getItem("stargate-onboarding-version");

    if (!onboarded || version !== ONBOARDING_VERSION) {
      // New user OR existing user who hasn't seen the latest onboarding
      setStep("onboarding");
    } else {
      setStep("done");
    }
  }, [userId]);

  if (step === "loading" || step === "done") return null;

  if (step === "onboarding") {
    return <GuideOnboarding onComplete={() => setStep("done")} />;
  }

  return null;
}

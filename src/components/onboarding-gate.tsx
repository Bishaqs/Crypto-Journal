"use client";

import { useState, useEffect } from "react";
import { GuideOnboarding } from "./stargate-guide/guide-onboarding";

type GateStep = "loading" | "onboarding" | "transitioning" | "done";

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

export function OnboardingGate({ userId, isReturningUser }: { userId?: string; isReturningUser?: boolean }) {
  const [step, setStep] = useState<GateStep>("loading");

  useEffect(() => {
    // Detect user switch — clear onboarding state so new user gets fresh experience
    if (userId) {
      const prevUser = localStorage.getItem("stargate-current-user");
      if (prevUser !== userId) {
        if (isReturningUser) {
          // Returning user on new device/browser — silently mark as onboarded
          localStorage.setItem("stargate-onboarded", "true");
          localStorage.setItem("stargate-onboarding-version", ONBOARDING_VERSION);
          localStorage.setItem("stargate-tour-welcome", "true");
        } else {
          // Truly new user — clear everything for fresh experience
          ONBOARDING_KEYS.forEach((k) => localStorage.removeItem(k));
          for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key && key.startsWith("stargate-tour-")) {
              localStorage.removeItem(key);
            }
          }
          sessionStorage.removeItem("stargate-tour-active");
        }
      }
      localStorage.setItem("stargate-current-user", userId);
    }

    const onboarded = localStorage.getItem("stargate-onboarded");
    const version = localStorage.getItem("stargate-onboarding-version");

    if (!onboarded || version !== ONBOARDING_VERSION) {
      if (isReturningUser) {
        // Returning user whose localStorage was cleared — skip onboarding
        localStorage.setItem("stargate-onboarded", "true");
        localStorage.setItem("stargate-onboarding-version", ONBOARDING_VERSION);
        localStorage.setItem("stargate-tour-welcome", "true");
        setStep("done");
      } else {
        // New user OR existing user who hasn't seen the latest onboarding
        setStep("onboarding");
      }
    } else {
      setStep("done");
    }
  }, [userId, isReturningUser]);

  // When transitioning, keep black overlay until welcome tour starts
  useEffect(() => {
    if (step !== "transitioning") return;

    function handleTourStarted() {
      setStep("done");
    }

    window.addEventListener("stargate-tour-started", handleTourStarted);
    const timer = setTimeout(() => setStep("done"), 5000);

    return () => {
      window.removeEventListener("stargate-tour-started", handleTourStarted);
      clearTimeout(timer);
    };
  }, [step]);

  if (step === "loading" || step === "transitioning") {
    return <div className="fixed inset-0 z-[9999] bg-black" />;
  }
  if (step === "done") return null;

  if (step === "onboarding") {
    return <GuideOnboarding onComplete={() => setStep("transitioning")} />;
  }

  return null;
}

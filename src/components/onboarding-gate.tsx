"use client";

import { useState, useEffect } from "react";
import { GuideOnboarding } from "./traverse-guide/guide-onboarding";

type GateStep = "loading" | "onboarding" | "done";

// Bump this when onboarding steps change to re-trigger for existing users
const ONBOARDING_VERSION = "3";

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
          // Truly new user — clear ALL stargate keys for fresh experience
          // Preserve tag colors & presets — these are user-curated and stored in DB
          const PRESERVE_KEYS = new Set(["stargate-current-user", "stargate-tag-colors", "stargate-custom-tags"]);
          for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key && key.startsWith("stargate-") && !PRESERVE_KEYS.has(key)) {
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

  if (step === "loading") {
    return <div className="fixed inset-0 z-[9999] bg-black" />;
  }
  if (step === "done") return null;

  if (step === "onboarding") {
    return (
      <GuideOnboarding
        onComplete={() => setStep("done")}
      />
    );
  }

  return null;
}

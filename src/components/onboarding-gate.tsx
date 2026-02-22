"use client";

import { useState, useEffect } from "react";
import { Onboarding } from "./onboarding";

export function OnboardingGate() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const onboarded = localStorage.getItem("stargate-onboarded");
    if (!onboarded) {
      setShowOnboarding(true);
    }
  }, []);

  if (!showOnboarding) return null;

  return <Onboarding onComplete={() => setShowOnboarding(false)} />;
}

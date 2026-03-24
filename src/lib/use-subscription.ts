"use client";

import { useSubscriptionContext } from "@/lib/subscription-context";
import { UNRELEASED_FEATURES } from "@/lib/feature-flags";

export type SubscriptionTier = "free" | "pro" | "max";

const FEATURE_TIERS: Record<string, SubscriptionTier[]> = {
  "unlimited-trades": ["pro", "max"],
  "advanced-analytics": ["pro", "max"],
  "psychology-engine": ["pro", "max"],
  "weekly-reports": ["pro", "max"],
  "premium-themes": ["pro", "max"],
  "playbook": ["pro", "max"],
  "risk-calculator": ["pro", "max"],
  "ai-coach": ["max"],
  "monte-carlo": ["max"],
  "prop-firm": ["max"],
  "heatmaps": ["max"],
  "risk-analysis": ["max"],
  "rule-tracker": ["max"],
  "tax-reports": ["max"],
  "stock-trading": ["max"],
  "auto-link-notes": ["max"],
  "phantom-trades": ["pro", "max"],
  "psychology-advanced": ["pro", "max"],
  "psychology-expert": ["max"],
};

export function clearSubscriptionCache() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("stargate-subscription-cache");
  }
}

export function checkFeatureAccess(tier: SubscriptionTier, feature: string): boolean {
  // Flip to true via NEXT_PUBLIC_FEATURE_GATING_ENABLED env var when ready to monetize
  if (!process.env.NEXT_PUBLIC_FEATURE_GATING_ENABLED) return true;
  return !!FEATURE_TIERS[feature]?.includes(tier);
}

export function useSubscription() {
  const { tier, isOwner, isTrial, isBetaTester } = useSubscriptionContext();

  function hasAccess(feature: string): boolean {
    if (UNRELEASED_FEATURES.has(feature)) {
      return isOwner || isBetaTester;
    }
    if (isOwner) return true;
    return checkFeatureAccess(tier, feature);
  }

  return {
    tier,
    isOwner,
    isBetaTester,
    loading: false,
    hasAccess,
    refetch: () => {},
    isTrial,
  };
}

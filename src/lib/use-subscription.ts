"use client";

import { useSubscriptionContext } from "@/lib/subscription-context";

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
};

export function clearSubscriptionCache() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("stargate-subscription-cache");
  }
}

export function checkFeatureAccess(tier: SubscriptionTier, feature: string): boolean {
  const allowed = FEATURE_TIERS[feature];
  if (!allowed) return true;
  return allowed.includes(tier);
}

export function useSubscription() {
  const { tier, isOwner, isTrial } = useSubscriptionContext();

  function hasAccess(feature: string): boolean {
    if (isOwner) return true;
    return checkFeatureAccess(tier, feature);
  }

  return {
    tier,
    isOwner,
    loading: false,
    hasAccess,
    refetch: () => {},
    isTrial,
  };
}

"use client";

import { useEffect, useState } from "react";

export type SubscriptionTier = "free" | "pro" | "max";

type SubData = {
  tier: SubscriptionTier;
  is_owner: boolean;
  is_trial: boolean;
  trial_end: string | null;
  granted_by_invite_code: string | null;
};

const CACHE_KEY = "stargate-subscription-cache";
const CACHE_TTL = 5 * 60 * 1000;

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
    localStorage.removeItem(CACHE_KEY);
  }
}

export function checkFeatureAccess(tier: SubscriptionTier, feature: string): boolean {
  const allowed = FEATURE_TIERS[feature];
  if (!allowed) return true; // unknown feature = allow
  return allowed.includes(tier);
}

export function useSubscription() {
  const [data, setData] = useState<SubData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Stale-while-revalidate: show cache instantly, always revalidate from server
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const cache = JSON.parse(raw);
        if (Date.now() - cache.ts < CACHE_TTL) {
          setData(cache.data);
          setLoading(false);
        }
      }
    } catch {}

    // Always fetch fresh from server API
    fetchSub();
  }, []);

  async function fetchSub() {
    try {
      const res = await fetch("/api/subscription");
      if (!res.ok) {
        console.error("[subscription] API error:", res.status);
        setLoading(false);
        return;
      }
      const sub: SubData = await res.json();
      setData(sub);
      localStorage.setItem(CACHE_KEY, JSON.stringify({ data: sub, ts: Date.now() }));
    } catch (err) {
      console.error("[subscription] fetch failed:", err);
    }
    setLoading(false);
  }

  const tier: SubscriptionTier = data?.tier ?? "free";
  const isOwner = data?.is_owner ?? false;

  function hasAccess(feature: string): boolean {
    if (isOwner) return true;
    return checkFeatureAccess(tier, feature);
  }

  function refetch() {
    localStorage.removeItem(CACHE_KEY);
    setLoading(true);
    fetchSub();
  }

  return { tier, isOwner, loading, hasAccess, refetch, isTrial: data?.is_trial ?? false };
}

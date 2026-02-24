"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type SubscriptionTier = "free" | "pro" | "max";

type SubData = {
  tier: SubscriptionTier;
  is_owner: boolean;
  is_trial: boolean;
  trial_end: string | null;
  granted_by_invite_code: string | null;
};

const CACHE_KEY = "stargate-subscription-cache";
const OWNER_FLAG_KEY = "stargate-is-owner";
const CACHE_TTL = 5 * 60 * 1000;
const OWNER_EMAIL = process.env.NEXT_PUBLIC_OWNER_EMAIL?.toLowerCase();

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
  if (!allowed) return true;
  return allowed.includes(tier);
}

export function useSubscription() {
  const [data, setData] = useState<SubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [clientOwner, setClientOwner] = useState(false);

  useEffect(() => {
    // Client-side owner check — instant, no API needed
    if (OWNER_EMAIL) {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user?.email?.toLowerCase() === OWNER_EMAIL) {
          setClientOwner(true);
          localStorage.setItem(OWNER_FLAG_KEY, "1");
          const ownerData: SubData = {
            tier: "max", is_owner: true, is_trial: false,
            trial_end: null, granted_by_invite_code: null,
          };
          setData(ownerData);
          setLoading(false);
          localStorage.setItem(CACHE_KEY, JSON.stringify({ data: ownerData, ts: Date.now() }));
        }
      });
    }

    // Stale-while-revalidate cache
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

    fetchSub();
  }, []);

  // Re-fetch on auth state changes (logout → login cycles)
  useEffect(() => {
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        localStorage.removeItem(CACHE_KEY);
        fetchSub();
      }
      if (event === "SIGNED_OUT") {
        localStorage.removeItem(CACHE_KEY);
        setData(null);
        setClientOwner(false);
        setLoading(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function fetchSub(attempt = 0) {
    try {
      const res = await fetch("/api/subscription");
      if (!res.ok) {
        if (res.status === 401 && attempt < 3) {
          setTimeout(() => fetchSub(attempt + 1), 500 * Math.pow(2, attempt));
          return;
        }
        console.error("[subscription] API error:", res.status);
        setLoading(false);
        return;
      }
      const sub: SubData = await res.json();
      setData(sub);
      localStorage.setItem(CACHE_KEY, JSON.stringify({ data: sub, ts: Date.now() }));
      if (sub.is_owner) {
        localStorage.setItem(OWNER_FLAG_KEY, "1");
      } else {
        localStorage.removeItem(OWNER_FLAG_KEY);
      }
    } catch (err) {
      console.error("[subscription] fetch failed:", err);
    }
    setLoading(false);
  }

  // Synchronous owner checks — no async race
  const cookieOwner = typeof document !== "undefined" && document.cookie.includes("stargate-owner=1");
  const persistentOwner = typeof window !== "undefined" && localStorage.getItem(OWNER_FLAG_KEY) === "1";

  const tier: SubscriptionTier = data?.tier ?? "free";
  const isOwner = cookieOwner || persistentOwner || clientOwner || (data?.is_owner ?? false);

  function hasAccess(feature: string): boolean {
    if (isOwner) return true;
    return checkFeatureAccess(tier, feature);
  }

  function refetch() {
    localStorage.removeItem(CACHE_KEY);
    setLoading(true);
    fetchSub();
  }

  return { tier: isOwner ? "max" as SubscriptionTier : tier, isOwner, loading, hasAccess, refetch, isTrial: data?.is_trial ?? false };
}

"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSubscriptionContext } from "@/lib/subscription-context";
import type { PsychologyProfile, PsychologyTier } from "@/lib/types";
import type { SubscriptionTier } from "@/lib/use-subscription";

const TIER_ORDER: PsychologyTier[] = ["simple", "advanced", "expert"];

/** Map subscription tier to the maximum psychology tier allowed. */
function getMaxAllowedTier(sub: SubscriptionTier, isOwner: boolean): PsychologyTier {
  if (isOwner) return "expert";
  switch (sub) {
    case "max": return "expert";
    case "pro": return "advanced";
    default: return "simple";
  }
}

/** Clamp a psychology tier to the max allowed by subscription. */
function clampTier(requested: PsychologyTier, maxAllowed: PsychologyTier): PsychologyTier {
  const reqIdx = TIER_ORDER.indexOf(requested);
  const maxIdx = TIER_ORDER.indexOf(maxAllowed);
  return reqIdx <= maxIdx ? requested : maxAllowed;
}

type PsychologyTierContextType = {
  tier: PsychologyTier;
  setTier: (tier: PsychologyTier) => Promise<void>;
  isAdvanced: boolean;
  isExpert: boolean;
  maxAllowedTier: PsychologyTier;
  isLocked: (tier: PsychologyTier) => boolean;
  requiredSubForTier: (tier: PsychologyTier) => SubscriptionTier;
  profile: PsychologyProfile | null;
  profileLoading: boolean;
  refreshProfile: () => Promise<void>;
};

const PsychologyTierContext = createContext<PsychologyTierContextType>({
  tier: "simple",
  setTier: async () => {},
  isAdvanced: false,
  isExpert: false,
  maxAllowedTier: "simple",
  isLocked: () => false,
  requiredSubForTier: () => "free",
  profile: null,
  profileLoading: false,
  refreshProfile: async () => {},
});

export function PsychologyTierProvider({
  userId,
  children,
}: {
  userId: string | undefined;
  children: React.ReactNode;
}) {
  const { tier: subTier, isOwner } = useSubscriptionContext();
  const maxAllowedTier = getMaxAllowedTier(subTier, isOwner);

  const [tier, setTierState] = useState<PsychologyTier>("simple");
  const [profile, setProfile] = useState<PsychologyProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Load tier preference on mount, clamped to subscription
  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();

    supabase
      .from("user_preferences")
      .select("psychology_tier")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data }: { data: { psychology_tier: string } | null }) => {
        if (data?.psychology_tier) {
          setTierState(clampTier(data.psychology_tier as PsychologyTier, maxAllowedTier));
        }
      });
  }, [userId, maxAllowedTier]);

  // Auto-downgrade if subscription changes
  useEffect(() => {
    setTierState((current) => clampTier(current, maxAllowedTier));
  }, [maxAllowedTier]);

  // Load psychology profile when tier is expert
  const refreshProfile = useCallback(async () => {
    if (!userId) return;
    setProfileLoading(true);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("psychology_profiles")
        .select("*")
        .eq("user_id", userId)
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle();
      setProfile(data as PsychologyProfile | null);
    } finally {
      setProfileLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (tier === "expert") {
      refreshProfile();
    }
  }, [tier, refreshProfile]);

  // Update tier in DB and state (clamped)
  const setTier = useCallback(async (newTier: PsychologyTier) => {
    if (!userId) return;
    const clamped = clampTier(newTier, maxAllowedTier);
    setTierState(clamped);

    const supabase = createClient();
    await supabase
      .from("user_preferences")
      .upsert(
        { user_id: userId, psychology_tier: clamped, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      );
  }, [userId, maxAllowedTier]);

  function isLocked(t: PsychologyTier): boolean {
    return TIER_ORDER.indexOf(t) > TIER_ORDER.indexOf(maxAllowedTier);
  }

  function requiredSubForTier(t: PsychologyTier): SubscriptionTier {
    switch (t) {
      case "expert": return "max";
      case "advanced": return "pro";
      default: return "free";
    }
  }

  return (
    <PsychologyTierContext.Provider
      value={{
        tier,
        setTier,
        isAdvanced: tier === "advanced" || tier === "expert",
        isExpert: tier === "expert",
        maxAllowedTier,
        isLocked,
        requiredSubForTier,
        profile,
        profileLoading,
        refreshProfile,
      }}
    >
      {children}
    </PsychologyTierContext.Provider>
  );
}

export function usePsychologyTier() {
  return useContext(PsychologyTierContext);
}

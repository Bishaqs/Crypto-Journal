"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { PsychologyProfile, PsychologyTier } from "@/lib/types";

type PsychologyTierContextType = {
  tier: PsychologyTier;
  setTier: (tier: PsychologyTier) => Promise<void>;
  isAdvanced: boolean;
  isExpert: boolean;
  profile: PsychologyProfile | null;
  profileLoading: boolean;
  refreshProfile: () => Promise<void>;
};

const PsychologyTierContext = createContext<PsychologyTierContextType>({
  tier: "simple",
  setTier: async () => {},
  isAdvanced: false,
  isExpert: false,
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
  const [tier, setTierState] = useState<PsychologyTier>("simple");
  const [profile, setProfile] = useState<PsychologyProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Load tier preference on mount
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
          setTierState(data.psychology_tier as PsychologyTier);
        }
      });
  }, [userId]);

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

  // Update tier in DB and state
  const setTier = useCallback(async (newTier: PsychologyTier) => {
    if (!userId) return;
    setTierState(newTier);

    const supabase = createClient();
    await supabase
      .from("user_preferences")
      .upsert(
        { user_id: userId, psychology_tier: newTier, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      );
  }, [userId]);

  return (
    <PsychologyTierContext.Provider
      value={{
        tier,
        setTier,
        isAdvanced: tier === "advanced" || tier === "expert",
        isExpert: tier === "expert",
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

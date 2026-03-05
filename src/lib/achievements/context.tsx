"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { createClient } from "@/lib/supabase/client";
import {
  computeProgress,
  checkUnlocks,
  saveProgress,
  type AchievementProgress,
  type UnlockedAchievement,
  type NewUnlock,
} from "./engine";
import { ACHIEVEMENT_MAP, type AchievementTier } from "./definitions";

type AchievementContextType = {
  /** All progress values */
  progress: AchievementProgress[];
  /** All unlocked achievements */
  unlocked: UnlockedAchievement[];
  /** Achievements newly unlocked in this session (for toasts) */
  recentUnlocks: NewUnlock[];
  /** Dismiss a recent unlock toast */
  dismissUnlock: (id: string, tier: AchievementTier | null) => void;
  /** Active display badge */
  activeBadge: { achievement_id: string; tier: string | null } | null;
  /** Set active display badge */
  setActiveBadge: (achievementId: string, tier: string | null) => void;
  /** Refresh achievements (call after logging a trade) */
  refresh: () => void;
  /** Whether data is loading */
  loading: boolean;
};

const AchievementContext = createContext<AchievementContextType>({
  progress: [],
  unlocked: [],
  recentUnlocks: [],
  dismissUnlock: () => {},
  activeBadge: null,
  setActiveBadge: () => {},
  refresh: () => {},
  loading: true,
});

export function AchievementProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [progress, setProgress] = useState<AchievementProgress[]>([]);
  const [unlocked, setUnlocked] = useState<UnlockedAchievement[]>([]);
  const [recentUnlocks, setRecentUnlocks] = useState<NewUnlock[]>([]);
  const [activeBadge, setActiveBadgeState] = useState<{
    achievement_id: string;
    tier: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const supabase = createClient();

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
      else setLoading(false);
    });
  }, [supabase]);

  const refresh = useCallback(async () => {
    if (!userId) return;

    try {
      // Fetch existing unlocks
      const { data: existingUnlocks } = await supabase
        .from("user_achievements")
        .select("achievement_id, tier, unlocked_at")
        .eq("user_id", userId);

      const currentUnlocks: UnlockedAchievement[] = (existingUnlocks ?? []).map(
        (u) => ({
          achievement_id: u.achievement_id,
          tier: u.tier as AchievementTier | null,
          unlocked_at: u.unlocked_at,
        })
      );

      // Compute fresh progress
      const freshProgress = await computeProgress(supabase, userId);

      // Check for new unlocks
      const newUnlocks = checkUnlocks(freshProgress, currentUnlocks);

      // Save to database
      await saveProgress(supabase, userId, freshProgress, newUnlocks);

      setProgress(freshProgress);
      setUnlocked([
        ...currentUnlocks,
        ...newUnlocks.map((u) => ({
          ...u,
          unlocked_at: new Date().toISOString(),
        })),
      ]);

      if (newUnlocks.length > 0) {
        setRecentUnlocks((prev) => [...prev, ...newUnlocks]);
      }

      // Fetch active badge
      const { data: badge } = await supabase
        .from("user_badges")
        .select("active_badge, active_tier")
        .eq("user_id", userId)
        .maybeSingle();

      if (badge?.active_badge) {
        setActiveBadgeState({
          achievement_id: badge.active_badge,
          tier: badge.active_tier,
        });
      }
    } catch {
      // Tables might not exist yet — silently handle
    } finally {
      setLoading(false);
    }
  }, [userId, supabase]);

  // Initial load
  useEffect(() => {
    if (userId) refresh();
  }, [userId, refresh]);

  const dismissUnlock = useCallback(
    (id: string, tier: AchievementTier | null) => {
      setRecentUnlocks((prev) =>
        prev.filter(
          (u) =>
            !(u.achievement_id === id && u.tier === tier)
        )
      );
    },
    []
  );

  const setActiveBadge = useCallback(
    async (achievementId: string, tier: string | null) => {
      if (!userId) return;
      setActiveBadgeState({ achievement_id: achievementId, tier });
      await supabase.from("user_badges").upsert(
        {
          user_id: userId,
          active_badge: achievementId,
          active_tier: tier,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
    },
    [userId, supabase]
  );

  return (
    <AchievementContext.Provider
      value={{
        progress,
        unlocked,
        recentUnlocks,
        dismissUnlock,
        activeBadge,
        setActiveBadge,
        refresh,
        loading,
      }}
    >
      {children}
    </AchievementContext.Provider>
  );
}

export function useAchievements() {
  return useContext(AchievementContext);
}

/** Helper: get the highest unlocked tier for a given achievement */
export function getHighestTier(
  achievementId: string,
  unlocked: UnlockedAchievement[]
): AchievementTier | null {
  const tiers: AchievementTier[] = ["diamond", "gold", "silver", "bronze"];
  for (const tier of tiers) {
    if (
      unlocked.some(
        (u) => u.achievement_id === achievementId && u.tier === tier
      )
    ) {
      return tier;
    }
  }
  // Check for single-tier unlock
  if (unlocked.some((u) => u.achievement_id === achievementId && u.tier === null)) {
    return null; // "unlocked" but no tier concept
  }
  return undefined as unknown as AchievementTier | null; // not unlocked
}

/** Helper: get progress value for an achievement */
export function getProgressValue(
  achievementId: string,
  progress: AchievementProgress[]
): number {
  return progress.find((p) => p.achievement_id === achievementId)?.current_value ?? 0;
}

/** Helper: is this achievement unlocked at any tier? */
export function isUnlocked(
  achievementId: string,
  unlocked: UnlockedAchievement[]
): boolean {
  return unlocked.some((u) => u.achievement_id === achievementId);
}

// Re-export for convenience
export { ACHIEVEMENT_MAP };

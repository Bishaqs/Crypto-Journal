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
import { ACHIEVEMENTS, ACHIEVEMENT_MAP, type AchievementTier } from "./definitions";
import { awardAchievementXP } from "@/lib/xp/engine";

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
  userId: initialUserId,
}: {
  children: React.ReactNode;
  userId?: string;
}) {
  const [progress, setProgress] = useState<AchievementProgress[]>([]);
  const [unlocked, setUnlocked] = useState<UnlockedAchievement[]>([]);
  const [recentUnlocks, setRecentUnlocks] = useState<NewUnlock[]>([]);
  const [activeBadge, setActiveBadgeState] = useState<{
    achievement_id: string;
    tier: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(initialUserId ?? null);

  const supabase = createClient();

  // Get current user (skip if server already provided userId)
  useEffect(() => {
    if (initialUserId) return;
    supabase.auth.getUser().then(({ data: { user } }: { data: { user: { id: string } | null } }) => {
      if (user) setUserId(user.id);
      else setLoading(false);
    });
  }, [supabase, initialUserId]);

  const refresh = useCallback(async () => {
    if (!userId) return;

    try {
      // Fetch existing unlocks
      const { data: existingUnlocks } = await supabase
        .from("user_achievements")
        .select("achievement_id, tier, unlocked_at")
        .eq("user_id", userId);

      const currentUnlocks: UnlockedAchievement[] = (existingUnlocks ?? []).map(
        (u: { achievement_id: string; tier: string | null; unlocked_at: string }) => ({
          achievement_id: u.achievement_id,
          tier: u.tier as AchievementTier | null,
          unlocked_at: u.unlocked_at,
        })
      );

      // Compute fresh progress
      const freshProgress = await computeProgress(supabase, userId);

      // Check for new unlocks
      const newUnlocks = checkUnlocks(freshProgress, currentUnlocks);

      // Compute completionist progress: check if all other achievements are maxed
      const allUnlocksAfter = [
        ...currentUnlocks,
        ...newUnlocks.map((u) => ({
          ...u,
          unlocked_at: new Date().toISOString(),
        })),
      ];
      const completionistIdx = freshProgress.findIndex(
        (p) => p.achievement_id === "completionist"
      );
      if (completionistIdx >= 0) {
        const nonCompletionistAchievements = ACHIEVEMENTS.filter(
          (a) => a.id !== "completionist"
        );
        const allMaxed = nonCompletionistAchievements.every((a) => {
          if (a.tiers === null) {
            return allUnlocksAfter.some(
              (u) => u.achievement_id === a.id
            );
          }
          const maxTier = a.tiers[a.tiers.length - 1].tier;
          return allUnlocksAfter.some(
            (u) => u.achievement_id === a.id && u.tier === maxTier
          );
        });
        freshProgress[completionistIdx].current_value = allMaxed ? 1 : 0;
        // Re-check completionist unlock
        if (allMaxed) {
          const compKey = "completionist:single";
          const isAlreadyUnlocked = currentUnlocks.some(
            (u) => u.achievement_id === "completionist"
          );
          const isInNewUnlocks = newUnlocks.some(
            (u) => u.achievement_id === "completionist"
          );
          if (!isAlreadyUnlocked && !isInNewUnlocks) {
            newUnlocks.push({ achievement_id: "completionist", tier: null });
          }
        }
      }

      // Save to database
      await saveProgress(supabase, userId, freshProgress, newUnlocks);

      // Award XP for each new unlock
      for (const unlock of newUnlocks) {
        try {
          await awardAchievementXP(supabase, userId, unlock.achievement_id, unlock.tier);
        } catch (err: unknown) {
          const xpMsg = err instanceof Error ? err.message : String(err);
          if (!xpMsg.includes("does not exist") && !xpMsg.includes("PGRST")) {
            console.error("[AchievementProvider] XP award error:", xpMsg);
          }
        }
      }

      setProgress(freshProgress);
      setUnlocked(allUnlocksAfter);

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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      // Only silence "table doesn't exist" errors — log everything else
      if (!msg.includes("does not exist") && !msg.includes("PGRST")) {
        console.error("[AchievementProvider] Error loading achievements:", msg);
      }
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
  const tiers: AchievementTier[] = ["legendary", "diamond", "gold", "silver", "bronze"];
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

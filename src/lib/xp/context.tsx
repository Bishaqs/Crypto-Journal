"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import {
  type UserLevel,
  xpForLevel,
  levelProgress,
  xpToNextLevel,
  DAILY_XP_CAP,
} from "./types";

type LevelContextType = {
  level: number;
  totalXP: number;
  xpToNext: number;
  xpForCurrent: number;
  xpProgress: number; // 0-100 within current level
  xpToday: number;
  dailyCapRemaining: number;
  loading: boolean;
  refresh: () => void;
  /** If user just leveled up, this is the new level. null otherwise. */
  recentLevelUp: number | null;
  dismissLevelUp: () => void;
  /** Category keys that were just unlocked via leveling up */
  recentUnlocks: string[];
  dismissUnlocks: () => void;
};

/** Required levels for sidebar categories — mirrors sidebar-data.ts RAIL_CATEGORIES */
const CATEGORY_UNLOCK_LEVELS: { key: string; label: string; requiredLevel: number }[] = [
  { key: "analytics", label: "Analytics", requiredLevel: 5 },
  { key: "intelligence", label: "Intelligence", requiredLevel: 10 },
  { key: "compete", label: "Compete", requiredLevel: 15 },
  { key: "market", label: "Market", requiredLevel: 25 },
];

const LevelContext = createContext<LevelContextType>({
  level: 1,
  totalXP: 0,
  xpToNext: 100,
  xpForCurrent: 0,
  xpProgress: 0,
  xpToday: 0,
  dailyCapRemaining: DAILY_XP_CAP,
  loading: true,
  refresh: () => {},
  recentLevelUp: null,
  dismissLevelUp: () => {},
  recentUnlocks: [],
  dismissUnlocks: () => {},
});

export function LevelProvider({ children, userId: initialUserId }: { children: ReactNode; userId?: string }) {
  const [userLevel, setUserLevel] = useState<UserLevel | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(initialUserId ?? null);
  const [recentLevelUp, setRecentLevelUp] = useState<number | null>(null);
  const [recentUnlocks, setRecentUnlocks] = useState<string[]>([]);
  const [previousLevel, setPreviousLevel] = useState<number | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (initialUserId) return;
    supabase.auth.getUser().then(({ data }: { data: { user: { id: string } | null } }) => {
      setUserId(data?.user?.id ?? null);
    });
  }, [supabase, initialUserId]);

  const refresh = useCallback(async () => {
    if (!userId) return;
    try {
      const { data } = await supabase
        .from("user_levels")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (data) {
        const today = new Date().toISOString().split("T")[0];
        const level = data as UserLevel;
        // Reset xp_today display if it's a new day
        if (level.today_date !== today) {
          level.xp_today = 0;
        }

        // Detect level-up and feature unlocks
        if (previousLevel !== null && level.current_level > previousLevel) {
          setRecentLevelUp(level.current_level);
          // Check if any sidebar categories were unlocked by this level-up
          const newlyUnlocked = CATEGORY_UNLOCK_LEVELS
            .filter(cat => previousLevel < cat.requiredLevel && level.current_level >= cat.requiredLevel)
            .map(cat => cat.key);
          if (newlyUnlocked.length > 0) {
            setRecentUnlocks(newlyUnlocked);
          }
        }
        setPreviousLevel(level.current_level);
        setUserLevel(level);
      } else {
        // No level row yet — user is level 1
        setUserLevel(null);
        setPreviousLevel(1);
      }
    } catch {
      // Tables may not exist yet
    }
    setLoading(false);
  }, [userId, supabase, previousLevel]);

  useEffect(() => {
    if (userId) refresh();
  }, [userId, refresh]);

  const level = userLevel?.current_level ?? 1;
  const totalXP = userLevel?.total_xp ?? 0;
  const xpToday = userLevel?.xp_today ?? 0;

  return (
    <LevelContext.Provider
      value={{
        level,
        totalXP,
        xpToNext: xpToNextLevel(level, totalXP),
        xpForCurrent: xpForLevel(level),
        xpProgress: levelProgress(level, totalXP),
        xpToday,
        dailyCapRemaining: Math.max(0, DAILY_XP_CAP - xpToday),
        loading,
        refresh,
        recentLevelUp,
        dismissLevelUp: () => setRecentLevelUp(null),
        recentUnlocks,
        dismissUnlocks: () => setRecentUnlocks([]),
      }}
    >
      {children}
    </LevelContext.Provider>
  );
}

export function useLevel() {
  return useContext(LevelContext);
}

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
  getDailyChallenges,
  getWeeklyChallenges,
  computeDailyMetrics,
  computeWeeklyMetrics,
  checkChallengeStatus,
  saveChallengeCompletion,
  loadCompletedChallenges,
  type ChallengeStatus,
} from "./engine";
import { CHALLENGE_MAP, type ChallengeDefinition } from "./definitions";
import { awardXP } from "@/lib/xp";

type ChallengeContextType = {
  /** Today's 3 daily challenges with status */
  dailyChallenges: (ChallengeDefinition & ChallengeStatus)[];
  /** This week's 2 weekly challenges with status */
  weeklyChallenges: (ChallengeDefinition & ChallengeStatus)[];
  /** Number of daily challenges completed today */
  dailyCompleted: number;
  /** Whether all 3 dailies are done */
  allDailiesDone: boolean;
  /** Recently completed challenge ID (for celebration toast) */
  recentCompletion: string | null;
  /** Dismiss the completion toast */
  dismissCompletion: () => void;
  /** Refresh challenge state (call after logging a trade) */
  refresh: () => void;
  /** Loading state */
  loading: boolean;
};

const ChallengeContext = createContext<ChallengeContextType>({
  dailyChallenges: [],
  weeklyChallenges: [],
  dailyCompleted: 0,
  allDailiesDone: false,
  recentCompletion: null,
  dismissCompletion: () => {},
  refresh: () => {},
  loading: true,
});

export function ChallengeProvider({
  children,
  userId: initialUserId,
}: {
  children: ReactNode;
  userId?: string;
}) {
  const [dailyChallenges, setDailyChallenges] = useState<
    (ChallengeDefinition & ChallengeStatus)[]
  >([]);
  const [weeklyChallenges, setWeeklyChallenges] = useState<
    (ChallengeDefinition & ChallengeStatus)[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(initialUserId ?? null);
  const [previouslyCompleted, setPreviouslyCompleted] = useState<Set<string>>(
    new Set()
  );
  const [recentCompletion, setRecentCompletion] = useState<string | null>(null);

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
      const today = new Date().toISOString().split("T")[0];

      // Get today's challenges
      const dailyDefs = getDailyChallenges(today);
      const weeklyDefs = getWeeklyChallenges(today);

      // Compute metrics
      const [dailyMetrics, weeklyMetrics, completedIds] = await Promise.all([
        computeDailyMetrics(supabase, userId, today),
        computeWeeklyMetrics(supabase, userId, today),
        loadCompletedChallenges(supabase, userId, today),
      ]);

      // Check status for each challenge
      const dailyWithStatus = dailyDefs.map((def) => {
        const alreadyCompleted = completedIds.includes(def.id);
        const status = checkChallengeStatus(def, dailyMetrics);
        return {
          ...def,
          ...status,
          completed: alreadyCompleted || status.completed,
        };
      });

      const weeklyWithStatus = weeklyDefs.map((def) => {
        const alreadyCompleted = completedIds.includes(def.id);
        const status = checkChallengeStatus(def, weeklyMetrics);
        return {
          ...def,
          ...status,
          completed: alreadyCompleted || status.completed,
        };
      });

      // Detect newly completed challenges and award XP
      const allChallenges = [...dailyWithStatus, ...weeklyWithStatus];
      for (const c of allChallenges) {
        if (c.completed && !previouslyCompleted.has(c.id) && !completedIds.includes(c.id)) {
          // Newly completed! Award XP and save
          try {
            await awardXP(supabase, userId, "challenge_completed", c.id, c.xpReward);
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            if (!msg.includes("does not exist") && !msg.includes("PGRST")) {
              console.error("[ChallengeProvider] XP award error:", msg);
            }
          }
          await saveChallengeCompletion(supabase, userId, c.id, today);
          setRecentCompletion(c.id);
        }
      }

      // Update previously completed set
      const nowCompleted = new Set(
        allChallenges.filter((c) => c.completed).map((c) => c.id)
      );
      setPreviouslyCompleted(nowCompleted);

      setDailyChallenges(dailyWithStatus);
      setWeeklyChallenges(weeklyWithStatus);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes("does not exist") && !msg.includes("PGRST")) {
        console.error("[ChallengeProvider] unexpected error:", msg);
      }
    } finally {
      setLoading(false);
    }
  }, [userId, supabase, previouslyCompleted]);

  // Initial load
  useEffect(() => {
    if (userId) refresh();
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const dailyCompleted = dailyChallenges.filter((c) => c.completed).length;
  const allDailiesDone = dailyCompleted >= 3;

  return (
    <ChallengeContext.Provider
      value={{
        dailyChallenges,
        weeklyChallenges,
        dailyCompleted,
        allDailiesDone,
        recentCompletion,
        dismissCompletion: () => setRecentCompletion(null),
        refresh,
        loading,
      }}
    >
      {children}
    </ChallengeContext.Provider>
  );
}

export function useChallenges() {
  return useContext(ChallengeContext);
}

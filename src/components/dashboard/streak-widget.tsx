"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Flame, Trophy, Calendar, Shield, Wrench } from "lucide-react";

type StreakData = {
  id?: string;
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
  streak_freezes: number;
  broken_streak: number | null;
  broken_at: string | null;
};

const MILESTONES = [7, 30, 90, 180, 365];

const MILESTONE_FREEZE_REWARDS: Record<number, number> = {
  7: 1,
  30: 2,
  90: 3,
};

function getMilestoneMessage(streak: number): string | null {
  if (streak >= 365) return "1 YEAR. You are the 1%.";
  if (streak >= 180) return "6 months of discipline. Legendary.";
  if (streak >= 90) return "90 days — habit cemented.";
  if (streak >= 30) return "30-day streak! The habit is forming.";
  if (streak >= 7) return "7-day streak! Keep building.";
  return null;
}

function getNextMilestone(streak: number): number {
  return MILESTONES.find((m) => m > streak) ?? streak + 30;
}

export function StreakWidget() {
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFreezeConfirm, setShowFreezeConfirm] = useState(false);
  const [showRepairConfirm, setShowRepairConfirm] = useState(false);
  const supabase = createClient();

  const fetchAndUpdateStreak = useCallback(async () => {
    const today = new Date().toISOString().split("T")[0];

    // Check if user was active today (has trades or journal notes or check-in)
    const [tradesResult, notesResult, checkinResult] = await Promise.all([
      supabase.from("trades").select("id").gte("created_at", `${today}T00:00:00`).limit(1),
      supabase.from("journal_notes").select("id").gte("created_at", `${today}T00:00:00`).limit(1),
      supabase.from("daily_checkins").select("id").eq("date", today).limit(1),
    ]);

    const activeToday =
      (tradesResult.data?.length ?? 0) > 0 ||
      (notesResult.data?.length ?? 0) > 0 ||
      (checkinResult.data?.length ?? 0) > 0;

    // Get current streak record
    const { data: streakData } = await supabase
      .from("user_streaks")
      .select("*")
      .limit(1)
      .single();

    if (!streakData) {
      // Create initial streak record
      if (activeToday) {
        const { data: newStreak } = await supabase
          .from("user_streaks")
          .insert({
            current_streak: 1,
            longest_streak: 1,
            last_active_date: today,
            streak_freezes: 0,
          })
          .select()
          .single();
        if (newStreak) setStreak(newStreak as StreakData);
      } else {
        setStreak({
          current_streak: 0,
          longest_streak: 0,
          last_active_date: null,
          streak_freezes: 0,
          broken_streak: null,
          broken_at: null,
        });
      }
    } else {
      const lastActive = streakData.last_active_date;
      const freezes = streakData.streak_freezes ?? 0;

      if (lastActive === today) {
        // Already updated today
        setStreak({ ...streakData, streak_freezes: freezes } as StreakData);
      } else if (activeToday) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];

        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        const twoDaysAgoStr = twoDaysAgo.toISOString().split("T")[0];

        let newStreak: number;
        let usedFreeze = false;

        if (lastActive === yesterdayStr) {
          // Consecutive day
          newStreak = (streakData.current_streak ?? 0) + 1;
        } else if (lastActive === twoDaysAgoStr && (streakData.grace_days_used ?? 0) < 1) {
          // Grace day — 1 missed day doesn't break streak
          newStreak = (streakData.current_streak ?? 0) + 1;
          await supabase
            .from("user_streaks")
            .update({ grace_days_used: (streakData.grace_days_used ?? 0) + 1 })
            .eq("id", streakData.id);
        } else if (lastActive === twoDaysAgoStr && freezes > 0) {
          // Use a streak freeze automatically
          newStreak = (streakData.current_streak ?? 0) + 1;
          usedFreeze = true;
        } else {
          // Streak broken — save the old streak for potential repair
          newStreak = 1;
          await supabase
            .from("user_streaks")
            .update({
              broken_streak: streakData.current_streak,
              broken_at: new Date().toISOString(),
            })
            .eq("id", streakData.id);
        }

        const longestStreak = Math.max(streakData.longest_streak ?? 0, newStreak);

        // Check if this milestone earns a freeze reward
        const freezeReward = MILESTONE_FREEZE_REWARDS[newStreak] ?? 0;
        const newFreezes = (usedFreeze ? freezes - 1 : freezes) + freezeReward;

        await supabase
          .from("user_streaks")
          .update({
            current_streak: newStreak,
            longest_streak: longestStreak,
            last_active_date: today,
            streak_freezes: Math.max(0, newFreezes),
            // Clear broken streak data if actively journaling
            broken_streak: null,
            broken_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", streakData.id);

        setStreak({
          id: streakData.id,
          current_streak: newStreak,
          longest_streak: longestStreak,
          last_active_date: today,
          streak_freezes: Math.max(0, newFreezes),
          broken_streak: null,
          broken_at: null,
        });
      } else {
        // Not active today — check if streak is about to break
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];

        // If last active was yesterday, streak still alive (they have today to continue)
        // If last active was 2+ days ago and there's a broken_streak, they can repair
        setStreak({ ...streakData, streak_freezes: freezes } as StreakData);
      }
    }

    setLoading(false);
  }, [supabase]);

  const useStreakFreeze = useCallback(async () => {
    if (!streak?.id || streak.streak_freezes <= 0) return;

    // Apply freeze to protect today
    await supabase
      .from("user_streaks")
      .update({
        streak_freezes: streak.streak_freezes - 1,
        last_active_date: new Date().toISOString().split("T")[0],
        updated_at: new Date().toISOString(),
      })
      .eq("id", streak.id);

    setStreak({
      ...streak,
      streak_freezes: streak.streak_freezes - 1,
      last_active_date: new Date().toISOString().split("T")[0],
    });
    setShowFreezeConfirm(false);
  }, [streak, supabase]);

  const repairStreak = useCallback(async () => {
    if (!streak?.id || !streak.broken_streak || !streak.broken_at) return;

    // Check if within 24h repair window
    const brokenTime = new Date(streak.broken_at).getTime();
    const now = Date.now();
    const hoursSinceBroken = (now - brokenTime) / (1000 * 60 * 60);

    if (hoursSinceBroken > 24) return;

    // Repair requires 1 freeze
    if (streak.streak_freezes <= 0) return;

    await supabase
      .from("user_streaks")
      .update({
        current_streak: streak.broken_streak,
        streak_freezes: streak.streak_freezes - 1,
        broken_streak: null,
        broken_at: null,
        last_active_date: new Date().toISOString().split("T")[0],
        updated_at: new Date().toISOString(),
      })
      .eq("id", streak.id);

    setStreak({
      ...streak,
      current_streak: streak.broken_streak,
      streak_freezes: streak.streak_freezes - 1,
      broken_streak: null,
      broken_at: null,
      last_active_date: new Date().toISOString().split("T")[0],
    });
    setShowRepairConfirm(false);
  }, [streak, supabase]);

  useEffect(() => {
    fetchAndUpdateStreak();
  }, [fetchAndUpdateStreak]);

  if (loading || !streak) return null;

  const milestoneMsg = getMilestoneMessage(streak.current_streak);
  const nextMilestone = getNextMilestone(streak.current_streak);
  const progressPct = Math.min((streak.current_streak / nextMilestone) * 100, 100);

  // Check if repair is available
  const canRepair =
    streak.broken_streak &&
    streak.broken_at &&
    streak.streak_freezes > 0 &&
    (Date.now() - new Date(streak.broken_at).getTime()) / (1000 * 60 * 60) <= 24;

  // Check if streak is at risk (user hasn't been active today and has a streak)
  const today = new Date().toISOString().split("T")[0];
  const isAtRisk = streak.current_streak > 0 && streak.last_active_date !== today;

  return (
    <div
      className="glass rounded-2xl border border-border/50 p-5 overflow-hidden"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] text-muted font-medium uppercase tracking-widest">
          Journaling Streak
        </span>
        <div className="flex items-center gap-2">
          {/* Streak Freezes indicator */}
          {streak.streak_freezes > 0 && (
            <div
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 cursor-default"
              title={`${streak.streak_freezes} Streak Freeze${streak.streak_freezes > 1 ? "s" : ""} available`}
            >
              <Shield size={10} className="text-blue-400" />
              <span className="text-[9px] font-bold text-blue-400">{streak.streak_freezes}</span>
            </div>
          )}
          <Flame
            size={16}
            className={
              streak.current_streak >= 30
                ? "text-orange-400 animate-pulse"
                : streak.current_streak > 0
                  ? "text-orange-400"
                  : "text-muted"
            }
          />
        </div>
      </div>

      <div className="flex items-end gap-3 mb-3">
        <span
          className={`text-3xl font-bold tracking-tight ${
            streak.current_streak > 0 ? "text-foreground" : "text-muted"
          }`}
        >
          {streak.current_streak}
        </span>
        <span className="text-sm text-muted pb-1">
          {streak.current_streak === 1 ? "day" : "days"}
        </span>
      </div>

      {/* At-risk warning */}
      {isAtRisk && streak.current_streak > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-500/10 border border-orange-500/20 mb-3">
          <Flame size={12} className="text-orange-400 shrink-0" />
          <span className="text-[11px] text-orange-400 font-medium">
            Log activity today to keep your streak!
          </span>
          {isAtRisk && streak.streak_freezes > 0 && !showFreezeConfirm && (
            <button
              onClick={() => setShowFreezeConfirm(true)}
              className="ml-auto text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-colors shrink-0"
            >
              Use Freeze
            </button>
          )}
        </div>
      )}

      {/* Freeze confirmation */}
      {showFreezeConfirm && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 mb-3">
          <Shield size={12} className="text-blue-400 shrink-0" />
          <span className="text-[11px] text-blue-300">
            Use 1 freeze to protect your streak today?
          </span>
          <div className="ml-auto flex gap-2 shrink-0">
            <button
              onClick={useStreakFreeze}
              className="text-[10px] font-bold text-blue-400 hover:text-blue-300"
            >
              Yes
            </button>
            <button
              onClick={() => setShowFreezeConfirm(false)}
              className="text-[10px] font-bold text-muted hover:text-foreground"
            >
              No
            </button>
          </div>
        </div>
      )}

      {/* Streak repair option */}
      {canRepair && !showRepairConfirm && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-3">
          <Wrench size={12} className="text-amber-400 shrink-0" />
          <div className="flex-1">
            <span className="text-[11px] text-amber-400 font-medium">
              Repair your {streak.broken_streak}-day streak?
            </span>
            <span className="text-[9px] text-amber-400/60 block">
              Costs 1 Streak Freeze
            </span>
          </div>
          <button
            onClick={() => setShowRepairConfirm(true)}
            className="text-[10px] font-bold text-amber-400 hover:text-amber-300 shrink-0"
          >
            Repair
          </button>
        </div>
      )}

      {/* Repair confirmation */}
      {showRepairConfirm && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-3">
          <Wrench size={12} className="text-amber-400 shrink-0" />
          <span className="text-[11px] text-amber-300">
            Restore {streak.broken_streak}-day streak for 1 freeze?
          </span>
          <div className="ml-auto flex gap-2 shrink-0">
            <button
              onClick={repairStreak}
              className="text-[10px] font-bold text-amber-400 hover:text-amber-300"
            >
              Yes
            </button>
            <button
              onClick={() => setShowRepairConfirm(false)}
              className="text-[10px] font-bold text-muted hover:text-foreground"
            >
              No
            </button>
          </div>
        </div>
      )}

      {/* Progress to next milestone */}
      <div className="mb-3">
        <div className="flex justify-between text-[10px] text-muted mb-1">
          <span>Progress</span>
          <span>
            {nextMilestone} day milestone
            {MILESTONE_FREEZE_REWARDS[nextMilestone]
              ? ` (+${MILESTONE_FREEZE_REWARDS[nextMilestone]} freeze${MILESTONE_FREEZE_REWARDS[nextMilestone] > 1 ? "s" : ""})`
              : ""}
          </span>
        </div>
        <div className="h-2 rounded-full bg-background overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent to-accent-hover transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Milestone message */}
      {milestoneMsg && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/5 border border-accent/10 mb-3">
          <Trophy size={12} className="text-accent shrink-0" />
          <span className="text-[11px] text-accent font-medium">{milestoneMsg}</span>
        </div>
      )}

      {/* Stats row */}
      <div className="flex items-center gap-4 text-xs text-muted">
        <div className="flex items-center gap-1">
          <Calendar size={12} />
          <span>Best: {streak.longest_streak} days</span>
        </div>
        {streak.streak_freezes > 0 && (
          <div className="flex items-center gap-1">
            <Shield size={12} />
            <span>{streak.streak_freezes} freeze{streak.streak_freezes > 1 ? "s" : ""}</span>
          </div>
        )}
      </div>
    </div>
  );
}

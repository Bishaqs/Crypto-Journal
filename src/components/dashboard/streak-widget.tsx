"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Flame, Trophy, Calendar } from "lucide-react";

type StreakData = {
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
};

const MILESTONES = [7, 30, 90, 180, 365];

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
          })
          .select()
          .single();
        if (newStreak) setStreak(newStreak as StreakData);
      } else {
        setStreak({ current_streak: 0, longest_streak: 0, last_active_date: null });
      }
    } else {
      const lastActive = streakData.last_active_date;

      if (lastActive === today) {
        // Already updated today
        setStreak(streakData as StreakData);
      } else if (activeToday) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];

        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        const twoDaysAgoStr = twoDaysAgo.toISOString().split("T")[0];

        let newStreak: number;
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
        } else {
          // Streak broken
          newStreak = 1;
        }

        const longestStreak = Math.max(streakData.longest_streak ?? 0, newStreak);

        await supabase
          .from("user_streaks")
          .update({
            current_streak: newStreak,
            longest_streak: longestStreak,
            last_active_date: today,
            updated_at: new Date().toISOString(),
          })
          .eq("id", streakData.id);

        setStreak({
          current_streak: newStreak,
          longest_streak: longestStreak,
          last_active_date: today,
        });
      } else {
        setStreak(streakData as StreakData);
      }
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchAndUpdateStreak();
  }, [fetchAndUpdateStreak]);

  if (loading || !streak) return null;

  const milestoneMsg = getMilestoneMessage(streak.current_streak);
  const nextMilestone = getNextMilestone(streak.current_streak);
  const progressPct = Math.min((streak.current_streak / nextMilestone) * 100, 100);

  return (
    <div
      className="glass rounded-2xl border border-border/50 p-5 overflow-hidden"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] text-muted font-medium uppercase tracking-widest">
          Journaling Streak
        </span>
        <Flame size={16} className={streak.current_streak > 0 ? "text-orange-400" : "text-muted"} />
      </div>

      <div className="flex items-end gap-3 mb-3">
        <span className={`text-3xl font-bold tracking-tight ${
          streak.current_streak > 0 ? "text-foreground" : "text-muted"
        }`}>
          {streak.current_streak}
        </span>
        <span className="text-sm text-muted pb-1">
          {streak.current_streak === 1 ? "day" : "days"}
        </span>
      </div>

      {/* Progress to next milestone */}
      <div className="mb-3">
        <div className="flex justify-between text-[10px] text-muted mb-1">
          <span>Progress</span>
          <span>{nextMilestone} day milestone</span>
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
      </div>
    </div>
  );
}

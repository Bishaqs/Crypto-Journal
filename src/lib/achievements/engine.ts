/**
 * Achievement engine — evaluates trade/log data and computes achievement progress.
 * Runs client-side, queries Supabase directly.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { ACHIEVEMENTS, type AchievementTier } from "./definitions";

export type AchievementProgress = {
  achievement_id: string;
  current_value: number;
};

export type UnlockedAchievement = {
  achievement_id: string;
  tier: AchievementTier | null;
  unlocked_at: string;
};

export type NewUnlock = {
  achievement_id: string;
  tier: AchievementTier | null;
};

/**
 * Compute current progress for all achievements by querying the database.
 */
export async function computeProgress(
  supabase: SupabaseClient,
  userId: string
): Promise<AchievementProgress[]> {
  const progress: AchievementProgress[] = [];

  // Batch queries for efficiency
  const [
    tradesResult,
    behavioralLogsResult,
    streakResult,
    journalNotesResult,
  ] = await Promise.all([
    supabase
      .from("trades")
      .select("id, pnl, emotion, process_score, setup_type, notes, tags, checklist, created_at")
      .eq("user_id", userId),
    supabase
      .from("behavioral_logs")
      .select("id, traffic_light, created_at")
      .eq("user_id", userId),
    supabase
      .from("user_streaks")
      .select("current_streak, longest_streak")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("journal_notes")
      .select("id")
      .eq("user_id", userId),
  ]);

  const trades = tradesResult.data ?? [];
  const logs = behavioralLogsResult.data ?? [];
  const streak = streakResult.data;
  const journalNotes = journalNotesResult.data ?? [];

  // Pre-compute trade metrics
  const totalTrades = trades.length;
  const tradesWithEmotion = trades.filter((t) => t.emotion).length;
  const tradesWithSetup = trades.filter((t) => t.setup_type).length;
  const tradesWithNotes = trades.filter((t) => t.notes && t.notes.trim()).length;
  const losingTradesWithNotes = trades.filter(
    (t) => (Number(t.pnl) || 0) < 0 && t.notes && t.notes.trim()
  ).length;
  const tradesWithStopLoss = trades.filter((t) => {
    const cl = t.checklist as Record<string, boolean> | null;
    return cl && (cl.stop_loss === true || cl.stopLoss === true);
  }).length;
  const tradesOnPlan = trades.filter((t) => {
    const cl = t.checklist as Record<string, boolean> | null;
    return cl && (cl.on_plan === true || cl.onPlan === true);
  }).length;

  // Process score average (only count trades with a score)
  const scoredTrades = trades.filter((t) => t.process_score != null);
  const avgProcessScore =
    scoredTrades.length > 0
      ? scoredTrades.reduce((s, t) => s + Number(t.process_score), 0) / scoredTrades.length
      : 0;

  // Behavioral logs
  const totalBehavioralLogs = logs.length;

  // Red light walkways — days where user logged red AND didn't trade after
  const redLightDays = new Set<string>();
  for (const log of logs) {
    if (log.traffic_light === "red") {
      const day = String(log.created_at).split("T")[0];
      redLightDays.add(day);
    }
  }

  // Streak
  const currentStreak = streak?.longest_streak ?? streak?.current_streak ?? 0;

  // Account age in days
  const firstTrade = trades.length > 0
    ? trades.reduce((oldest, t) =>
        new Date(t.created_at) < new Date(oldest.created_at) ? t : oldest
      )
    : null;
  const accountAgeDays = firstTrade
    ? Math.floor((Date.now() - new Date(firstTrade.created_at).getTime()) / 86400000)
    : 0;

  // Map metrics to values
  const metricValues: Record<string, number> = {
    current_streak: currentStreak,
    total_trades: totalTrades,
    weekly_reviews: 0, // TODO: track weekly reviews when feature exists
    losing_trades_with_notes: losingTradesWithNotes,
    trades_with_stop_loss: tradesWithStopLoss,
    days_within_loss_limit: 0, // TODO: compute from daily P&L limits
    avg_process_score: avgProcessScore,
    trades_with_emotion: tradesWithEmotion,
    cooldowns_honored: 0, // TODO: detect post-loss pauses
    red_light_walkways: redLightDays.size,
    behavioral_logs: totalBehavioralLogs,
    trades_with_setup: tradesWithSetup,
    trades_on_plan: tradesOnPlan,
    trades_with_notes: tradesWithNotes,
    total_trades_100: totalTrades,
    total_trades_1000: totalTrades,
    account_age_365: accountAgeDays,
    journal_entries_500: journalNotes.length,
  };

  for (const achievement of ACHIEVEMENTS) {
    const value = metricValues[achievement.metric] ?? 0;
    progress.push({ achievement_id: achievement.id, current_value: value });
  }

  return progress;
}

/**
 * Check which achievements should be newly unlocked based on current progress.
 */
export function checkUnlocks(
  progress: AchievementProgress[],
  alreadyUnlocked: UnlockedAchievement[]
): NewUnlock[] {
  const newUnlocks: NewUnlock[] = [];

  const unlockedSet = new Set(
    alreadyUnlocked.map((u) => `${u.achievement_id}:${u.tier ?? "single"}`)
  );

  for (const p of progress) {
    const def = ACHIEVEMENTS.find((a) => a.id === p.achievement_id);
    if (!def) continue;

    if (def.tiers === null) {
      // Single-tier achievement: unlock at threshold 1 (or specific metric)
      const threshold = getThresholdForSingleTier(def.metric);
      if (p.current_value >= threshold) {
        const key = `${def.id}:single`;
        if (!unlockedSet.has(key)) {
          newUnlocks.push({ achievement_id: def.id, tier: null });
        }
      }
    } else {
      // Multi-tier: check each tier
      for (const t of def.tiers) {
        if (p.current_value >= t.threshold) {
          const key = `${def.id}:${t.tier}`;
          if (!unlockedSet.has(key)) {
            newUnlocks.push({ achievement_id: def.id, tier: t.tier });
          }
        }
      }
    }
  }

  return newUnlocks;
}

function getThresholdForSingleTier(metric: string): number {
  switch (metric) {
    case "total_trades":
      return 1;
    case "total_trades_100":
      return 100;
    case "total_trades_1000":
      return 1000;
    case "account_age_365":
      return 365;
    case "journal_entries_500":
      return 500;
    default:
      return 1;
  }
}

/**
 * Save new unlocks to the database and update progress.
 */
export async function saveProgress(
  supabase: SupabaseClient,
  userId: string,
  progress: AchievementProgress[],
  newUnlocks: NewUnlock[]
): Promise<void> {
  // Upsert progress
  const progressRows = progress.map((p) => ({
    user_id: userId,
    achievement_id: p.achievement_id,
    current_value: p.current_value,
    updated_at: new Date().toISOString(),
  }));

  if (progressRows.length > 0) {
    await supabase
      .from("achievement_progress")
      .upsert(progressRows, { onConflict: "user_id,achievement_id" });
  }

  // Insert new unlocks
  if (newUnlocks.length > 0) {
    const unlockRows = newUnlocks.map((u) => ({
      user_id: userId,
      achievement_id: u.achievement_id,
      tier: u.tier,
      unlocked_at: new Date().toISOString(),
    }));
    await supabase.from("user_achievements").upsert(unlockRows, {
      onConflict: "user_id,achievement_id,tier",
    });
  }
}

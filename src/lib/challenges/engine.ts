/**
 * Challenge engine — selects daily challenges, checks completion, awards XP.
 *
 * Daily challenges are deterministically selected based on the date,
 * so all users see the same 3 challenges on the same day (keeps it social).
 * Weekly challenges rotate Monday-Sunday.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  DAILY_CHALLENGES,
  WEEKLY_CHALLENGES,
  CHALLENGE_MAP,
  type ChallengeDefinition,
} from "./definitions";

// ── Challenge Selection ──────────────────────────────────────────────

/** Simple deterministic hash from a date string to pick challenges */
function dateHash(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash * 31 + dateStr.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/** Get the 3 daily challenges for a given date */
export function getDailyChallenges(dateStr: string): ChallengeDefinition[] {
  const pool = [...DAILY_CHALLENGES];
  const hash = dateHash(dateStr);
  const selected: ChallengeDefinition[] = [];

  // Pick 3, ensuring different categories when possible
  const categories = new Set<string>();
  const shuffled = pool.sort((a, b) => {
    const ha = dateHash(dateStr + a.id);
    const hb = dateHash(dateStr + b.id);
    return ha - hb;
  });

  // First pass: pick one from each category
  for (const c of shuffled) {
    if (selected.length >= 3) break;
    if (!categories.has(c.category)) {
      categories.add(c.category);
      selected.push(c);
    }
  }

  // Second pass: fill remaining slots
  for (const c of shuffled) {
    if (selected.length >= 3) break;
    if (!selected.includes(c)) {
      selected.push(c);
    }
  }

  return selected;
}

/** Get the weekly challenges for the current week */
export function getWeeklyChallenges(dateStr: string): ChallengeDefinition[] {
  // Get Monday of the current week
  const date = new Date(dateStr);
  const day = date.getDay();
  const monday = new Date(date);
  monday.setDate(date.getDate() - ((day + 6) % 7));
  const mondayStr = monday.toISOString().split("T")[0];

  const hash = dateHash(mondayStr + "weekly");
  const shuffled = [...WEEKLY_CHALLENGES].sort((a, b) => {
    const ha = dateHash(mondayStr + a.id);
    const hb = dateHash(mondayStr + b.id);
    return ha - hb;
  });

  // Pick 2 weekly challenges
  return shuffled.slice(0, 2);
}

// ── Metric Computation ───────────────────────────────────────────────

type ChallengeMetrics = Record<string, number>;

/** Compute all metrics for the current day */
export async function computeDailyMetrics(
  supabase: SupabaseClient,
  userId: string,
  dateStr: string
): Promise<ChallengeMetrics> {
  const metrics: ChallengeMetrics = {};

  // Fetch today's trades
  const { data: trades } = await supabase
    .from("trades")
    .select("id, notes, emotion, setup, stop_loss, position_size, process_score, screenshots, tags, created_at")
    .eq("user_id", userId)
    .gte("created_at", `${dateStr}T00:00:00`)
    .lt("created_at", `${dateStr}T23:59:59.999`);

  const todayTrades = trades ?? [];

  metrics.trades_logged_today = todayTrades.length;
  metrics.trades_with_notes_today = todayTrades.filter(
    (t) => t.notes && t.notes.trim().length > 0
  ).length;
  metrics.trades_with_screenshots_today = todayTrades.filter(
    (t) => t.screenshots && (Array.isArray(t.screenshots) ? t.screenshots.length > 0 : true)
  ).length;
  metrics.trades_with_emotion_today = todayTrades.filter(
    (t) => t.emotion && t.emotion.trim().length > 0
  ).length;
  metrics.trades_with_stop_loss_today = todayTrades.filter(
    (t) => t.stop_loss !== null && t.stop_loss !== undefined
  ).length;
  metrics.trades_with_size_today = todayTrades.filter(
    (t) => t.position_size !== null && t.position_size !== undefined
  ).length;
  metrics.trades_with_setup_today = todayTrades.filter(
    (t) => t.setup && t.setup.trim().length > 0
  ).length;

  // Complete trades: has notes + emotion + setup
  metrics.complete_trades_today = todayTrades.filter(
    (t) =>
      t.notes?.trim() &&
      t.emotion?.trim() &&
      t.setup?.trim()
  ).length;

  // Unique tags
  const allTags = new Set<string>();
  for (const t of todayTrades) {
    if (t.tags && Array.isArray(t.tags)) {
      for (const tag of t.tags) allTags.add(tag);
    }
    if (t.setup) allTags.add(t.setup);
  }
  metrics.unique_tags_today = allTags.size;

  // High process score (7+) on ALL trades
  metrics.all_trades_high_process_today =
    todayTrades.length > 0 &&
    todayTrades.every((t) => (t.process_score ?? 0) >= 7)
      ? 1
      : 0;

  // No tilt trades: check if no trades have revenge/FOMO emotion tags
  const tiltEmotions = ["revenge", "fomo", "tilt", "frustrated", "angry"];
  const hasTilt = todayTrades.some(
    (t) =>
      t.emotion &&
      tiltEmotions.some((e) => t.emotion.toLowerCase().includes(e))
  );
  metrics.no_tilt_trades_today = hasTilt ? 0 : 1;

  // Check-in completed today
  const { data: checkin } = await supabase
    .from("daily_checkins")
    .select("id")
    .eq("user_id", userId)
    .eq("date", dateStr)
    .limit(1);
  metrics.checkin_completed_today = checkin && checkin.length > 0 ? 1 : 0;

  // Behavioral logs today
  const { data: logs } = await supabase
    .from("behavioral_logs")
    .select("id")
    .eq("user_id", userId)
    .gte("created_at", `${dateStr}T00:00:00`)
    .lt("created_at", `${dateStr}T23:59:59.999`);
  metrics.behavioral_logs_today = logs?.length ?? 0;

  // Journal entries today
  const { data: journals } = await supabase
    .from("journal_entries")
    .select("id")
    .eq("user_id", userId)
    .gte("created_at", `${dateStr}T00:00:00`)
    .lt("created_at", `${dateStr}T23:59:59.999`);
  metrics.journal_entries_today = journals?.length ?? 0;

  return metrics;
}

/** Compute weekly metrics */
export async function computeWeeklyMetrics(
  supabase: SupabaseClient,
  userId: string,
  dateStr: string
): Promise<ChallengeMetrics> {
  const metrics: ChallengeMetrics = {};

  // Get Monday and Sunday of current week
  const date = new Date(dateStr);
  const day = date.getDay();
  const monday = new Date(date);
  monday.setDate(date.getDate() - ((day + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const mondayStr = monday.toISOString().split("T")[0];
  const sundayStr = sunday.toISOString().split("T")[0];

  // Trades this week
  const { data: trades } = await supabase
    .from("trades")
    .select("id, notes, emotion, stop_loss, created_at")
    .eq("user_id", userId)
    .gte("created_at", `${mondayStr}T00:00:00`)
    .lte("created_at", `${sundayStr}T23:59:59.999`);

  const weekTrades = trades ?? [];

  // Trading days this week
  const tradingDays = new Set(
    weekTrades.map((t) => t.created_at.split("T")[0])
  );
  metrics.trading_days_this_week = tradingDays.size;

  metrics.trades_with_notes_this_week = weekTrades.filter(
    (t) => t.notes && t.notes.trim().length > 0
  ).length;

  metrics.trades_with_stop_loss_this_week = weekTrades.filter(
    (t) => t.stop_loss !== null && t.stop_loss !== undefined
  ).length;

  metrics.trades_with_emotion_this_week = weekTrades.filter(
    (t) => t.emotion && t.emotion.trim().length > 0
  ).length;

  // Check-ins this week
  const { data: checkins } = await supabase
    .from("daily_checkins")
    .select("date")
    .eq("user_id", userId)
    .gte("date", mondayStr)
    .lte("date", sundayStr);
  metrics.checkins_this_week = checkins?.length ?? 0;

  // Days with all dailies completed (from user_daily_challenges table)
  const { data: completedDays } = await supabase
    .from("user_daily_challenges")
    .select("date")
    .eq("user_id", userId)
    .eq("all_completed", true)
    .gte("date", mondayStr)
    .lte("date", sundayStr);
  metrics.days_all_dailies_completed = completedDays?.length ?? 0;

  return metrics;
}

// ── Challenge Completion Check ───────────────────────────────────────

export type ChallengeStatus = {
  challengeId: string;
  completed: boolean;
  currentValue: number;
  targetValue: number;
  progress: number; // 0-100
};

export function checkChallengeStatus(
  challenge: ChallengeDefinition,
  metrics: ChallengeMetrics
): ChallengeStatus {
  const currentValue = metrics[challenge.metric] ?? 0;
  const completed = currentValue >= challenge.target;
  const progress = Math.min(100, (currentValue / challenge.target) * 100);

  return {
    challengeId: challenge.id,
    completed,
    currentValue,
    targetValue: challenge.target,
    progress,
  };
}

// ── Save/Load Challenge State ────────────────────────────────────────

export type UserChallengeRecord = {
  user_id: string;
  challenge_id: string;
  date: string;
  completed: boolean;
  completed_at: string | null;
  xp_awarded: boolean;
};

/** Save challenge completion to database */
export async function saveChallengeCompletion(
  supabase: SupabaseClient,
  userId: string,
  challengeId: string,
  dateStr: string
): Promise<void> {
  await supabase.from("user_daily_challenges").upsert(
    {
      user_id: userId,
      challenge_id: challengeId,
      date: dateStr,
      completed: true,
      completed_at: new Date().toISOString(),
      xp_awarded: true,
    },
    { onConflict: "user_id,challenge_id,date" }
  );
}

/** Load completed challenges for a date */
export async function loadCompletedChallenges(
  supabase: SupabaseClient,
  userId: string,
  dateStr: string
): Promise<string[]> {
  const { data } = await supabase
    .from("user_daily_challenges")
    .select("challenge_id")
    .eq("user_id", userId)
    .eq("date", dateStr)
    .eq("completed", true);

  return (data ?? []).map((r: { challenge_id: string }) => r.challenge_id);
}

/** Mark all_completed flag when all 3 dailies are done */
export async function markAllDailiesCompleted(
  supabase: SupabaseClient,
  userId: string,
  dateStr: string
): Promise<void> {
  // Use a simple update — set all_completed on any row for this user/date
  // We'll store this on a summary row
  await supabase.from("user_daily_challenge_summary").upsert(
    {
      user_id: userId,
      date: dateStr,
      all_completed: true,
      completed_at: new Date().toISOString(),
    },
    { onConflict: "user_id,date" }
  );
}

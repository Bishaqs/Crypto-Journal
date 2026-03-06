/**
 * Achievement engine — evaluates trade/log data and computes achievement progress.
 * Runs client-side, queries Supabase directly.
 *
 * Supports 57 achievements across 5 categories with 5 tiers (Bronze→Legendary).
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
    checkinsResult,
    plansResult,
    userLevelResult,
  ] = await Promise.all([
    supabase
      .from("trades")
      .select("id, pnl, emotion, confidence, process_score, setup_type, sector, symbol, notes, tags, checklist, review, created_at")
      .eq("user_id", userId),
    supabase
      .from("behavioral_logs")
      .select("id, traffic_light, biases, created_at")
      .eq("user_id", userId),
    supabase
      .from("user_streaks")
      .select("current_streak, longest_streak")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("journal_notes")
      .select("id, content")
      .eq("user_id", userId),
    supabase
      .from("daily_checkins")
      .select("id, date, created_at")
      .eq("user_id", userId),
    supabase
      .from("daily_plans")
      .select("id, date")
      .eq("user_id", userId),
    supabase
      .from("user_levels")
      .select("current_level")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  const trades = tradesResult.data ?? [];
  const logs = behavioralLogsResult.data ?? [];
  const streak = streakResult.data;
  const journalNotes = journalNotesResult.data ?? [];
  const checkins = checkinsResult.data ?? [];
  const plans = plansResult.data ?? [];
  const userLevel = userLevelResult.data;

  // ── Pre-compute trade metrics ────────────────────────────────
  const totalTrades = trades.length;
  const tradesWithEmotion = trades.filter((t) => t.emotion).length;
  const tradesWithSetup = trades.filter((t) => t.setup_type).length;
  const tradesWithNotes = trades.filter((t) => t.notes && t.notes.trim()).length;
  const tradesWithConfidence = trades.filter((t) => t.confidence != null).length;
  const losingTradesWithNotes = trades.filter(
    (t) => (Number(t.pnl) || 0) < 0 && t.notes && t.notes.trim()
  ).length;
  // Post-loss reflections = losing trades with review content
  const losingTradesWithReflection = trades.filter((t) => {
    if ((Number(t.pnl) || 0) >= 0) return false;
    const review = t.review as Record<string, string> | null;
    if (!review) return false;
    return Object.values(review).some((v) => v && String(v).trim().length > 0);
  }).length;
  const tradesWithStopLoss = trades.filter((t) => {
    const cl = t.checklist as Record<string, boolean> | null;
    return cl && (cl.stop_loss === true || cl.stopLoss === true);
  }).length;
  const tradesOnPlan = trades.filter((t) => {
    const cl = t.checklist as Record<string, boolean> | null;
    return cl && (cl.on_plan === true || cl.onPlan === true);
  }).length;
  const tradesWithFullChecklist = trades.filter((t) => {
    const cl = t.checklist as Record<string, boolean> | null;
    if (!cl) return false;
    const values = Object.values(cl);
    return values.length >= 2 && values.every((v) => v === true);
  }).length;
  const tradesWithReview = trades.filter((t) => {
    const review = t.review as Record<string, string> | null;
    if (!review) return false;
    return Object.values(review).some((v) => v && String(v).trim().length > 0);
  }).length;
  // Position size tracking (checklist field)
  const tradesWithPositionSize = trades.filter((t) => {
    const cl = t.checklist as Record<string, boolean> | null;
    return cl && (cl.position_size === true || cl.positionSize === true || cl.position_sized === true);
  }).length;
  // R:R ratio tracking (checklist field)
  const tradesWithRRRatio = trades.filter((t) => {
    const cl = t.checklist as Record<string, boolean> | null;
    return cl && (cl.risk_reward === true || cl.riskReward === true || cl.rr_defined === true);
  }).length;

  // Process score average
  const scoredTrades = trades.filter((t) => t.process_score != null);
  const avgProcessScore =
    scoredTrades.length > 0
      ? scoredTrades.reduce((s, t) => s + Number(t.process_score), 0) / scoredTrades.length
      : 0;

  // ── Unique counts ────────────────────────────────────────────
  const uniqueSymbols = new Set(trades.map((t) => t.symbol).filter(Boolean));
  const uniqueSectors = new Set(trades.map((t) => t.sector).filter(Boolean));
  const uniqueEmotions = new Set(trades.map((t) => t.emotion).filter(Boolean));
  const allTags = new Set<string>();
  for (const t of trades) {
    if (Array.isArray(t.tags)) {
      for (const tag of t.tags) {
        if (tag) allTags.add(tag);
      }
    }
  }
  // Timeframe-tagged trades (tags containing timeframe keywords)
  const timeframeKeywords = ["1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w", "scalp", "swing", "day", "intraday"];
  const tradesWithTimeframeTag = trades.filter((t) => {
    if (!Array.isArray(t.tags)) return false;
    return t.tags.some((tag: string) =>
      timeframeKeywords.some((kw) => tag?.toLowerCase().includes(kw))
    );
  }).length;

  // Setup consistency — find the most-used setup type with 50+ uses
  const setupCounts = new Map<string, number>();
  for (const t of trades) {
    if (t.setup_type) {
      setupCounts.set(t.setup_type, (setupCounts.get(t.setup_type) || 0) + 1);
    }
  }
  let maxSetupUsage = 0;
  for (const count of setupCounts.values()) {
    if (count > maxSetupUsage) maxSetupUsage = count;
  }

  // ── Behavioral logs ──────────────────────────────────────────
  const totalBehavioralLogs = logs.length;
  const logsWithBiases = logs.filter((l) => {
    const biases = l.biases as string[] | null;
    return Array.isArray(biases) && biases.length > 0;
  }).length;

  // Red light walkways
  const redLightDays = new Set<string>();
  for (const log of logs) {
    if (log.traffic_light === "red") {
      const day = String(log.created_at).split("T")[0];
      redLightDays.add(day);
    }
  }

  // ── Streak ───────────────────────────────────────────────────
  const currentStreak = streak?.longest_streak ?? streak?.current_streak ?? 0;

  // ── Account age ──────────────────────────────────────────────
  const firstTrade = trades.length > 0
    ? trades.reduce((oldest, t) =>
        new Date(t.created_at) < new Date(oldest.created_at) ? t : oldest
      )
    : null;
  const accountAgeDays = firstTrade
    ? Math.floor((Date.now() - new Date(firstTrade.created_at).getTime()) / 86400000)
    : 0;

  // ── Check-in metrics ─────────────────────────────────────────
  const totalCheckins = checkins.length;
  // Check-in streak: count consecutive days from most recent
  const checkinDates = checkins.map((c) => c.date).sort().reverse();
  let checkinStreak = 0;
  if (checkinDates.length > 0) {
    const today = new Date().toISOString().split("T")[0];
    let expected = today;
    for (const d of checkinDates) {
      if (d === expected || d === getPreviousDay(expected)) {
        checkinStreak++;
        expected = getPreviousDay(d);
      } else if (d < expected) {
        break;
      }
    }
  }
  // Early check-ins (before 9:30 AM ET / 14:30 UTC)
  const earlyCheckins = checkins.filter((c) => {
    const hour = new Date(c.created_at).getUTCHours();
    return hour < 15; // Before 3 PM UTC ≈ before 10 AM ET
  }).length;

  // ── Plan metrics ─────────────────────────────────────────────
  const planDates = new Set(plans.map((p) => p.date));
  // Trading days = days where at least one trade was logged
  const tradeDates = new Set(
    trades.map((t) => String(t.created_at).split("T")[0])
  );
  // Trading days that also had a plan
  let tradingDaysWithPlan = 0;
  for (const d of tradeDates) {
    if (planDates.has(d)) tradingDaysWithPlan++;
  }

  // ── Green-light only trading days ────────────────────────────
  // Days where the check-in was green AND all trades were on that day
  const greenCheckinDates = new Set(
    checkins.filter((c) => {
      // We don't have traffic_light on checkins directly; it's on behavioral_logs
      // Check if there's a green log on that day
      return true; // Simplified: count trading days with a green checkin
    }).map((c) => c.date)
  );
  // Use behavioral logs to find green days
  const greenDays = new Set<string>();
  for (const log of logs) {
    if (log.traffic_light === "green") {
      greenDays.add(String(log.created_at).split("T")[0]);
    }
  }
  let greenOnlyTradingDays = 0;
  for (const d of tradeDates) {
    if (greenDays.has(d)) greenOnlyTradingDays++;
  }

  // ── Perfect months ───────────────────────────────────────────
  // A perfect month = every weekday in that month has at least one trade
  const tradeMonths = new Map<string, Set<string>>();
  for (const d of tradeDates) {
    const month = d.substring(0, 7); // YYYY-MM
    if (!tradeMonths.has(month)) tradeMonths.set(month, new Set());
    tradeMonths.get(month)!.add(d);
  }
  let perfectMonths = 0;
  for (const [month, days] of tradeMonths) {
    const weekdaysInMonth = countWeekdaysInMonth(month);
    // Allow some tolerance: at least 80% of weekdays = "perfect" (crypto trades 7 days, stocks 5)
    if (days.size >= Math.ceil(weekdaysInMonth * 0.8)) {
      perfectMonths++;
    }
  }

  // ── Consecutive trading days with emotions ───────────────────
  const tradeDatesWithEmotion = new Set<string>();
  for (const t of trades) {
    if (t.emotion) {
      tradeDatesWithEmotion.add(String(t.created_at).split("T")[0]);
    }
  }
  const sortedEmotionDates = [...tradeDatesWithEmotion].sort().reverse();
  let consecutiveEmotionDays = 0;
  if (sortedEmotionDates.length > 0) {
    const today = new Date().toISOString().split("T")[0];
    let expected = today;
    for (const d of sortedEmotionDates) {
      if (d === expected || d === getPreviousDay(expected)) {
        consecutiveEmotionDays++;
        expected = getPreviousDay(d);
      } else {
        break;
      }
    }
  }

  // ── Rest days after losing streaks ───────────────────────────
  // Detect: 3+ consecutive losing trades, then a day with no trades
  const sortedTrades = [...trades].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  let restDaysAfterLossStreaks = 0;
  let consecutiveLosses = 0;
  let lastLossDate = "";
  for (const t of sortedTrades) {
    const pnl = Number(t.pnl) || 0;
    const day = String(t.created_at).split("T")[0];
    if (pnl < 0) {
      consecutiveLosses++;
      lastLossDate = day;
    } else {
      if (consecutiveLosses >= 3 && day !== lastLossDate) {
        // Check if there was a gap day
        const nextDay = getNextDay(lastLossDate);
        if (day > nextDay) {
          restDaysAfterLossStreaks++;
        }
      }
      consecutiveLosses = 0;
    }
  }

  // ── Journal with gratitude/lessons ───────────────────────────
  const lessonKeywords = ["learned", "lesson", "takeaway", "grateful", "gratitude", "insight", "key learning", "next time"];
  const journalWithGratitude = journalNotes.filter((n) => {
    const content = (n.content ?? "").toLowerCase();
    return lessonKeywords.some((kw) => content.includes(kw));
  }).length;

  // ── Weekend reviews ──────────────────────────────────────────
  // Plans or journal entries created on weekends
  const weekendReviews = journalNotes.filter((n) => {
    // We only have id, content — no date. Use plans on weekend dates
    return false;
  }).length;
  // Fallback: count plans created on weekends
  const weekendPlans = plans.filter((p) => {
    const day = new Date(p.date + "T12:00:00Z").getUTCDay();
    return day === 0 || day === 6; // Sunday or Saturday
  }).length;

  // ── User level ───────────────────────────────────────────────
  const playerLevel = userLevel?.current_level ?? 1;

  // ── Completionist check ──────────────────────────────────────
  // This will be computed after all other progress is known
  // Set to 0 for now — the context will handle completionist separately

  // Map metrics to values
  const metricValues: Record<string, number> = {
    // Existing
    current_streak: currentStreak,
    total_trades: totalTrades,
    weekly_reviews: weekendPlans, // Use weekend plans as proxy
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

    // New Consistency
    checkin_streak: checkinStreak,
    trading_days_with_plan: tradingDaysWithPlan,
    weekend_reviews: weekendPlans,
    unique_symbols_traded: uniqueSymbols.size,
    perfect_months: perfectMonths,
    early_checkins: earlyCheckins,
    account_age_730: accountAgeDays,
    account_age_1095: accountAgeDays,

    // New Risk Management
    trades_with_position_size: tradesWithPositionSize,
    trades_with_rr_ratio: tradesWithRRRatio,
    consecutive_days_within_loss_limit: 0, // TODO
    months_under_drawdown_threshold: 0, // TODO
    trades_with_full_checklist: tradesWithFullChecklist,
    trades_on_green_days_only: greenOnlyTradingDays,
    consecutive_within_size_rules: tradesWithPositionSize, // Approximation

    // New Psychology
    unique_emotions_logged: uniqueEmotions.size,
    losing_trades_with_reflection: losingTradesWithReflection,
    trades_with_confidence: tradesWithConfidence,
    logs_with_biases_identified: logsWithBiases,
    consecutive_trading_days_with_emotions: consecutiveEmotionDays,
    rest_days_after_losing_streaks: restDaysAfterLossStreaks,
    journal_with_gratitude: journalWithGratitude,

    // New Analysis
    unique_tags_used: allTags.size,
    trades_with_timeframe_tag: tradesWithTimeframeTag,
    playbook_entries: 0, // TODO: when playbook table exists
    unique_sectors_traded: uniqueSectors.size,
    trades_with_review: tradesWithReview,
    consistent_setup_usage: maxSetupUsage,
    total_trades_500: totalTrades,

    // New Milestones
    total_trades_5000: totalTrades,
    journal_entries_10000: journalNotes.length,
    current_streak_1000: currentStreak,
    total_checkins_500: totalCheckins,
    player_level_50: playerLevel,
    player_level_100: playerLevel,
    player_level_150: playerLevel,
    player_level_200: playerLevel,
    player_level_300: playerLevel,
    player_level_500: playerLevel,
    all_achievements_maxed: 0, // Computed separately in context
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
      const threshold = getThresholdForSingleTier(def.metric);
      if (p.current_value >= threshold) {
        const key = `${def.id}:single`;
        if (!unlockedSet.has(key)) {
          newUnlocks.push({ achievement_id: def.id, tier: null });
        }
      }
    } else {
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
    case "total_trades": return 1;
    case "total_trades_100": return 100;
    case "total_trades_500": return 500;
    case "total_trades_1000": return 1000;
    case "total_trades_5000": return 5000;
    case "account_age_365": return 365;
    case "account_age_730": return 730;
    case "account_age_1095": return 1095;
    case "journal_entries_500": return 500;
    case "journal_entries_10000": return 10000;
    case "current_streak_1000": return 1000;
    case "total_checkins_500": return 500;
    case "early_checkins": return 50;
    case "unique_emotions_logged": return 10;
    case "journal_with_gratitude": return 50;
    case "consistent_setup_usage": return 50;
    case "consecutive_within_size_rules": return 100;
    case "player_level_50": return 50;
    case "player_level_100": return 100;
    case "player_level_150": return 150;
    case "player_level_200": return 200;
    case "player_level_300": return 300;
    case "player_level_500": return 500;
    case "all_achievements_maxed": return 1;
    default: return 1;
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

// ── Helpers ────────────────────────────────────────────────────

function getPreviousDay(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().split("T")[0];
}

function getNextDay(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().split("T")[0];
}

function countWeekdaysInMonth(yearMonth: string): number {
  const [year, month] = yearMonth.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  let weekdays = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const day = new Date(year, month - 1, d).getDay();
    if (day !== 0 && day !== 6) weekdays++;
  }
  return weekdays;
}

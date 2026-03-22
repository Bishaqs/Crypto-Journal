/**
 * Psychology-Outcome Correlation Engine
 *
 * Connects psychology data to trade outcomes with real numbers.
 * Frameworks: Kahneman (prospect theory), Douglas (process), Van Tharp (R-multiples),
 * Jung (shadow eruption), Freud (repetition compulsion), Danziger (somatic state).
 */

import type {
  Trade,
  ExpertSessionLog,
  PsychologyProfile,
  BehavioralLog,
  CorrelationResult,
  ConfidenceCalibration,
  PostLossMetrics,
  StreakImpact,
  DispositionRatio,
  TradingSystemClassification,
  DouglasConsistency,
  SQN,
  ShadowEruption,
  RepetitionCompulsion,
  PsychologyCorrelations,
  DailyCheckin,
  SomaticStressCorrelation,
  MoneyScriptBehavior,
  ReadinessCorrelation,
  CheckinCorrelation,
  SomaticHeatmapEntry,
  SomaticArea,
  SomaticIntensity,
} from "./types";
import { parseEmotions } from "./calculations";

// ─── Helper ─────────────────────────────────────────────────────────────────

function closedTrades(trades: Trade[]): Trade[] {
  return trades
    .filter((t) => t.close_timestamp && t.pnl !== null)
    .sort((a, b) => new Date(a.close_timestamp!).getTime() - new Date(b.close_timestamp!).getTime());
}

function winRate(trades: Trade[]): number {
  if (trades.length === 0) return 0;
  return trades.filter((t) => (t.pnl ?? 0) > 0).length / trades.length;
}

function avgPnl(trades: Trade[]): number {
  if (trades.length === 0) return 0;
  return trades.reduce((s, t) => s + (t.pnl ?? 0), 0) / trades.length;
}

function totalPnl(trades: Trade[]): number {
  return trades.reduce((s, t) => s + (t.pnl ?? 0), 0);
}

// ─── Emotion → P&L ──────────────────────────────────────────────────────────

export function calculateEmotionCorrelations(trades: Trade[]): CorrelationResult[] {
  const closed = closedTrades(trades);
  const byEmotion: Record<string, Trade[]> = {};

  for (const t of closed) {
    const emotions = parseEmotions(t.emotion);
    for (const emotion of emotions) {
      if (!byEmotion[emotion]) byEmotion[emotion] = [];
      byEmotion[emotion].push(t);
    }
  }

  return Object.entries(byEmotion)
    .map(([emotion, group]) => ({
      dimension: "emotion",
      value: emotion,
      tradeCount: group.length,
      winRate: Math.round(winRate(group) * 1000) / 10,
      avgPnl: Math.round(avgPnl(group) * 100) / 100,
      totalPnl: Math.round(totalPnl(group) * 100) / 100,
    }))
    .sort((a, b) => b.tradeCount - a.tradeCount);
}

// ─── Time of Day / Day of Week → P&L ────────────────────────────────────────

export function calculateTimeCorrelations(trades: Trade[]): CorrelationResult[] {
  const closed = closedTrades(trades);
  const byHour: Record<string, Trade[]> = {};
  const byDay: Record<string, Trade[]> = {};
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  for (const t of closed) {
    const d = new Date(t.open_timestamp);
    const hour = `${d.getHours().toString().padStart(2, "0")}:00`;
    const day = dayNames[d.getDay()];

    if (!byHour[hour]) byHour[hour] = [];
    byHour[hour].push(t);

    if (!byDay[day]) byDay[day] = [];
    byDay[day].push(t);
  }

  const hourResults = Object.entries(byHour)
    .filter(([, g]) => g.length >= 3)
    .map(([hour, group]) => ({
      dimension: "hour",
      value: hour,
      tradeCount: group.length,
      winRate: Math.round(winRate(group) * 1000) / 10,
      avgPnl: Math.round(avgPnl(group) * 100) / 100,
      totalPnl: Math.round(totalPnl(group) * 100) / 100,
    }));

  const dayResults = Object.entries(byDay)
    .filter(([, g]) => g.length >= 3)
    .map(([day, group]) => ({
      dimension: "day_of_week",
      value: day,
      tradeCount: group.length,
      winRate: Math.round(winRate(group) * 1000) / 10,
      avgPnl: Math.round(avgPnl(group) * 100) / 100,
      totalPnl: Math.round(totalPnl(group) * 100) / 100,
    }));

  return [...dayResults, ...hourResults];
}

// ─── Confidence Calibration ──────────────────────────────────────────────────

export function calculateConfidenceCalibration(trades: Trade[]): ConfidenceCalibration[] {
  const closed = closedTrades(trades).filter((t) => t.confidence != null);
  const byConfidence: Record<number, Trade[]> = {};

  for (const t of closed) {
    const c = t.confidence!;
    if (!byConfidence[c]) byConfidence[c] = [];
    byConfidence[c].push(t);
  }

  return Object.entries(byConfidence)
    .filter(([, g]) => g.length >= 3)
    .map(([conf, group]) => {
      const actual = winRate(group) * 100;
      const expected = Number(conf) * 10; // confidence 7 → expect 70% win rate
      return {
        confidence: Number(conf),
        actualWinRate: Math.round(actual * 10) / 10,
        tradeCount: group.length,
        gap: Math.round((actual - expected) * 10) / 10,
      };
    })
    .sort((a, b) => a.confidence - b.confidence);
}

// ─── Post-Loss Behavior (Revenge Trading Detection) ──────────────────────────

export function calculatePostLossMetrics(trades: Trade[]): PostLossMetrics | null {
  const closed = closedTrades(trades);
  if (closed.length < 10) return null;

  const revengeTrades: Trade[] = [];
  const normalTrades: Trade[] = [];
  const timeBetween: number[] = [];

  for (let i = 1; i < closed.length; i++) {
    const prev = closed[i - 1];
    const current = closed[i];

    if ((prev.pnl ?? 0) < 0) {
      const prevClose = new Date(prev.close_timestamp!).getTime();
      const currentOpen = new Date(current.open_timestamp).getTime();
      const minutesBetween = (currentOpen - prevClose) / (1000 * 60);

      timeBetween.push(minutesBetween);

      if (minutesBetween < 60) {
        revengeTrades.push(current);
      } else {
        normalTrades.push(current);
      }
    } else {
      normalTrades.push(current);
    }
  }

  if (revengeTrades.length < 2) return null;

  return {
    avgMinutesBetweenLossAndNext: Math.round(
      timeBetween.reduce((a, b) => a + b, 0) / timeBetween.length,
    ),
    revengeTradeCount: revengeTrades.length,
    revengeTradeWinRate: Math.round(winRate(revengeTrades) * 1000) / 10,
    revengeTradeAvgPnl: Math.round(avgPnl(revengeTrades) * 100) / 100,
    normalTradeWinRate: Math.round(winRate(normalTrades) * 1000) / 10,
    normalTradeAvgPnl: Math.round(avgPnl(normalTrades) * 100) / 100,
  };
}

// ─── Streak Impact ───────────────────────────────────────────────────────────

export function calculateStreakImpact(trades: Trade[]): StreakImpact[] {
  const closed = closedTrades(trades);
  if (closed.length < 15) return [];

  const avgSize =
    closed.reduce((s, t) => s + t.quantity * t.entry_price, 0) / closed.length;

  // Build streak context for each trade
  const streakData: { streak: number; nextTrade: Trade }[] = [];
  let streak = 0;

  for (let i = 0; i < closed.length - 1; i++) {
    if ((closed[i].pnl ?? 0) > 0) {
      streak = streak > 0 ? streak + 1 : 1;
    } else {
      streak = streak < 0 ? streak - 1 : -1;
    }
    streakData.push({ streak, nextTrade: closed[i + 1] });
  }

  // Group by streak length
  const byStreak: Record<number, Trade[]> = {};
  for (const { streak: s, nextTrade } of streakData) {
    // Bucket: -3 or less, -2, -1, 1, 2, 3 or more
    const bucket = Math.max(-3, Math.min(3, s));
    if (!byStreak[bucket]) byStreak[bucket] = [];
    byStreak[bucket].push(nextTrade);
  }

  return Object.entries(byStreak)
    .filter(([, g]) => g.length >= 3)
    .map(([s, group]) => {
      const groupAvgSize =
        group.reduce((sum, t) => sum + t.quantity * t.entry_price, 0) / group.length;
      return {
        streakLength: Number(s),
        nextTradeWinRate: Math.round(winRate(group) * 1000) / 10,
        nextTradeCount: group.length,
        avgSizingChange: avgSize > 0 ? Math.round(((groupAvgSize - avgSize) / avgSize) * 100) : 0,
      };
    })
    .sort((a, b) => a.streakLength - b.streakLength);
}

// ─── Idea Source → P&L ───────────────────────────────────────────────────────

export function calculateIdeaSourceCorrelations(trades: Trade[]): CorrelationResult[] {
  const closed = closedTrades(trades);
  const bySource: Record<string, Trade[]> = {};

  for (const t of closed) {
    const source = (t as Trade & { idea_source?: string | null }).idea_source || "untracked";
    if (!bySource[source]) bySource[source] = [];
    bySource[source].push(t);
  }

  return Object.entries(bySource)
    .filter(([, g]) => g.length >= 2)
    .map(([source, group]) => ({
      dimension: "idea_source",
      value: source,
      tradeCount: group.length,
      winRate: Math.round(winRate(group) * 1000) / 10,
      avgPnl: Math.round(avgPnl(group) * 100) / 100,
      totalPnl: Math.round(totalPnl(group) * 100) / 100,
    }))
    .sort((a, b) => b.tradeCount - a.tradeCount);
}

// ─── Disposition Ratio (Kahneman/Prospect Theory) ────────────────────────────

export function calculateDispositionRatio(trades: Trade[]): DispositionRatio | null {
  const closed = closedTrades(trades);
  if (closed.length < 20) return null;

  // For each trade, determine if it was "realized" (closed) while in profit or loss
  // PGR = realized gains / (realized gains + paper gains)
  // PLR = realized losses / (realized losses + paper losses)
  // Simplified: use the ratio of avg winner hold time vs avg loser hold time
  // Traders with disposition effect hold losers longer and sell winners faster

  const winners = closed.filter((t) => (t.pnl ?? 0) > 0);
  const losers = closed.filter((t) => (t.pnl ?? 0) <= 0);

  if (winners.length < 5 || losers.length < 5) return null;

  // Calculate hold times
  function avgHoldMs(group: Trade[]): number {
    const holds = group.map(
      (t) => new Date(t.close_timestamp!).getTime() - new Date(t.open_timestamp).getTime(),
    );
    return holds.reduce((a, b) => a + b, 0) / holds.length;
  }

  const avgWinHold = avgHoldMs(winners);
  const avgLossHold = avgHoldMs(losers);

  // Use as proxy: if losing trades held longer, disposition effect is present
  // PGR proxy: winners realized quickly (low hold time = high realization rate)
  // PLR proxy: losers held long (high hold time = low realization rate)
  const pgr = avgLossHold > 0 ? 1 / avgWinHold : 0;
  const plr = avgWinHold > 0 ? 1 / avgLossHold : 0;
  const ratio = plr > 0 ? pgr / plr : 0;

  // Simplified: ratio = avgLossHold / avgWinHold
  const simpleRatio = avgWinHold > 0 ? avgLossHold / avgWinHold : 1;

  let interpretation: DispositionRatio["interpretation"];
  if (simpleRatio > 2.0) interpretation = "strong_disposition";
  else if (simpleRatio > 1.3) interpretation = "mild_disposition";
  else if (simpleRatio > 0.7) interpretation = "balanced";
  else interpretation = "reverse_disposition";

  return {
    pgr: Math.round(pgr * 1000) / 1000,
    plr: Math.round(plr * 1000) / 1000,
    ratio: Math.round(simpleRatio * 100) / 100,
    interpretation,
  };
}

// ─── System 1 vs System 2 Classification (Kahneman) ──────────────────────────

export function classifyTradingSystem(trades: Trade[]): TradingSystemClassification | null {
  const closed = closedTrades(trades);
  if (closed.length < 15) return null;

  const system1: Trade[] = [];
  const system2: Trade[] = [];

  for (let i = 0; i < closed.length; i++) {
    const t = closed[i];
    let impulsiveSignals = 0;

    // No setup type = impulsive
    if (!t.setup_type) impulsiveSignals++;
    // No playbook = impulsive
    if (!t.playbook_id) impulsiveSignals++;
    // Low or no process score = impulsive
    if (t.process_score == null || t.process_score < 5) impulsiveSignals++;
    // Entered within 15 min of previous trade = impulsive
    if (i > 0) {
      const prevClose = new Date(closed[i - 1].close_timestamp!).getTime();
      const currentOpen = new Date(t.open_timestamp).getTime();
      if (currentOpen - prevClose < 15 * 60 * 1000) impulsiveSignals++;
    }
    // Danger-zone emotions = System 1
    const dangerEmotions = ["FOMO", "Revenge", "Greedy", "Overconfident"];
    if (t.emotion && dangerEmotions.includes(t.emotion)) impulsiveSignals++;

    if (impulsiveSignals >= 3) {
      system1.push(t);
    } else {
      system2.push(t);
    }
  }

  if (system1.length < 3 && system2.length < 3) return null;

  return {
    system1Count: system1.length,
    system2Count: system2.length,
    system1WinRate: Math.round(winRate(system1) * 1000) / 10,
    system2WinRate: Math.round(winRate(system2) * 1000) / 10,
    system1AvgPnl: Math.round(avgPnl(system1) * 100) / 100,
    system2AvgPnl: Math.round(avgPnl(system2) * 100) / 100,
  };
}

// ─── Douglas Consistency Score ───────────────────────────────────────────────

export function calculateDouglasConsistency(trades: Trade[]): DouglasConsistency | null {
  const closed = closedTrades(trades);
  if (closed.length < 20) return null;

  // Dimension 1: Process score consistency (low variance = good)
  const processScores = closed.filter((t) => t.process_score != null).map((t) => t.process_score!);
  let processVariance = 0;
  if (processScores.length >= 10) {
    const mean = processScores.reduce((a, b) => a + b, 0) / processScores.length;
    processVariance = processScores.reduce((s, v) => s + (v - mean) ** 2, 0) / processScores.length;
  }
  // Score: lower variance = higher consistency (max 10 variance for score 0)
  const processScore = Math.max(0, Math.round((1 - processVariance / 10) * 100));

  // Dimension 2: Position sizing consistency
  const sizes = closed.map((t) => t.quantity * t.entry_price).filter((s) => s > 0);
  let sizingConsistency = 0;
  if (sizes.length >= 10) {
    const mean = sizes.reduce((a, b) => a + b, 0) / sizes.length;
    const cv = Math.sqrt(sizes.reduce((s, v) => s + (v - mean) ** 2, 0) / sizes.length) / mean;
    // CV < 0.2 = very consistent, > 1.0 = very inconsistent
    sizingConsistency = Math.max(0, Math.round((1 - Math.min(cv, 1)) * 100));
  }

  // Dimension 3: Setup type adherence (% of trades with a setup_type tagged)
  const withSetup = closed.filter((t) => t.setup_type).length;
  const setupAdherence = Math.round((withSetup / closed.length) * 100);

  // Overall score: weighted average
  const overall = Math.round(processScore * 0.4 + sizingConsistency * 0.3 + setupAdherence * 0.3);

  const dimensions = [
    { name: "Process Discipline", score: processScore },
    { name: "Sizing Consistency", score: sizingConsistency },
    { name: "Setup Adherence", score: setupAdherence },
  ].sort((a, b) => a.score - b.score);

  return {
    score: overall,
    processVariance: Math.round(processVariance * 100) / 100,
    sizingConsistency,
    setupAdherence,
    weakestDimension: dimensions[0].name,
    strongestDimension: dimensions[dimensions.length - 1].name,
  };
}

// ─── Van Tharp SQN (System Quality Number) ───────────────────────────────────

export function calculateSQN(trades: Trade[]): SQN | null {
  const closed = closedTrades(trades).filter((t) => t.stop_loss != null && t.stop_loss > 0);
  if (closed.length < 20) return null;

  // Calculate R-multiples: (exit - entry) / (entry - stop) for longs, inverted for shorts
  const rMultiples: number[] = [];
  for (const t of closed) {
    const exitPrice = t.exit_price ?? t.entry_price;
    const risk =
      t.position === "long"
        ? t.entry_price - t.stop_loss!
        : t.stop_loss! - t.entry_price;

    if (risk <= 0) continue;

    const pnlPerUnit =
      t.position === "long" ? exitPrice - t.entry_price : t.entry_price - exitPrice;

    rMultiples.push(pnlPerUnit / risk);
  }

  if (rMultiples.length < 10) return null;

  const mean = rMultiples.reduce((a, b) => a + b, 0) / rMultiples.length;
  const stddev = Math.sqrt(
    rMultiples.reduce((s, v) => s + (v - mean) ** 2, 0) / rMultiples.length,
  );

  if (stddev === 0) return null;

  const sqn = (mean / stddev) * Math.sqrt(Math.min(rMultiples.length, 100));

  let rating: SQN["rating"];
  if (sqn < 1.6) rating = "Poor";
  else if (sqn < 1.9) rating = "Below Average";
  else if (sqn < 2.4) rating = "Average";
  else if (sqn < 2.9) rating = "Good";
  else if (sqn < 5.0) rating = "Excellent";
  else if (sqn < 7.0) rating = "Superb";
  else rating = "Holy Grail";

  return {
    sqn: Math.round(sqn * 100) / 100,
    rating,
    sampleSize: rMultiples.length,
  };
}

// ─── Shadow Eruption Detection (Jung) ────────────────────────────────────────

export function detectShadowEruptions(trades: Trade[]): ShadowEruption[] {
  const closed = closedTrades(trades);
  if (closed.length < 15) return [];

  const eruptions: ShadowEruption[] = [];

  // Group trades by session (same day)
  const byDay: Record<string, Trade[]> = {};
  for (const t of closed) {
    const day = t.close_timestamp!.split("T")[0];
    if (!byDay[day]) byDay[day] = [];
    byDay[day].push(t);
  }

  for (const [day, dayTrades] of Object.entries(byDay)) {
    if (dayTrades.length < 3) continue;

    // Look for regime change: first N trades disciplined, then sudden breakdown
    const firstHalf = dayTrades.slice(0, Math.floor(dayTrades.length / 2));
    const secondHalf = dayTrades.slice(Math.floor(dayTrades.length / 2));

    const firstAvgProcess =
      firstHalf.filter((t) => t.process_score != null).length > 0
        ? firstHalf.filter((t) => t.process_score != null).reduce((s, t) => s + t.process_score!, 0) /
          firstHalf.filter((t) => t.process_score != null).length
        : null;

    const secondAvgProcess =
      secondHalf.filter((t) => t.process_score != null).length > 0
        ? secondHalf.filter((t) => t.process_score != null).reduce((s, t) => s + t.process_score!, 0) /
          secondHalf.filter((t) => t.process_score != null).length
        : null;

    if (firstAvgProcess == null || secondAvgProcess == null) continue;

    const processDrop = firstAvgProcess - secondAvgProcess;
    const secondHalfPnl = secondHalf.reduce((s, t) => s + (t.pnl ?? 0), 0);

    // Shadow eruption: process drops > 3 points and P&L goes negative
    if (processDrop >= 3 && secondHalfPnl < 0) {
      // Find the trigger trade (first loss before the breakdown)
      const triggerTrade = firstHalf.reverse().find((t) => (t.pnl ?? 0) < 0);

      eruptions.push({
        date: day,
        triggerTrade: triggerTrade
          ? { symbol: triggerTrade.symbol, pnl: triggerTrade.pnl ?? 0 }
          : null,
        severity: processDrop >= 5 ? "severe" : "moderate",
        tradesInEruption: secondHalf.length,
        pnlImpact: Math.round(secondHalfPnl * 100) / 100,
      });
    }
  }

  return eruptions.sort((a, b) => b.date.localeCompare(a.date));
}

// ─── Repetition Compulsion Detection (Freud) ─────────────────────────────────

export function detectRepetitionCompulsions(trades: Trade[]): RepetitionCompulsion[] {
  const closed = closedTrades(trades);
  if (closed.length < 15) return [];

  // Find patterns: same symbol, same direction, losing, repeated within 7 days
  const patterns: Record<string, { trades: Trade[] }> = {};

  for (const t of closed) {
    if ((t.pnl ?? 0) >= 0) continue; // Only losses
    const key = `${t.symbol}:${t.position}`;
    if (!patterns[key]) patterns[key] = { trades: [] };
    patterns[key].trades.push(t);
  }

  const compulsions: RepetitionCompulsion[] = [];

  for (const [key, data] of Object.entries(patterns)) {
    if (data.trades.length < 3) continue;

    // Check if losses are clustered (at least 3 within 14-day windows)
    const sorted = data.trades.sort(
      (a, b) => new Date(a.close_timestamp!).getTime() - new Date(b.close_timestamp!).getTime(),
    );

    let clusterCount = 0;
    for (let i = 2; i < sorted.length; i++) {
      const daysBetween =
        (new Date(sorted[i].close_timestamp!).getTime() -
          new Date(sorted[i - 2].close_timestamp!).getTime()) /
        (1000 * 60 * 60 * 24);
      if (daysBetween <= 14) clusterCount++;
    }

    if (clusterCount >= 1) {
      const [symbol, direction] = key.split(":");
      const avgProcess =
        data.trades.filter((t) => t.process_score != null).length > 0
          ? data.trades
              .filter((t) => t.process_score != null)
              .reduce((s, t) => s + t.process_score!, 0) /
            data.trades.filter((t) => t.process_score != null).length
          : 0;

      compulsions.push({
        symbol,
        direction: direction as "long" | "short",
        occurrences: data.trades.length,
        totalLoss: Math.round(data.trades.reduce((s, t) => s + (t.pnl ?? 0), 0) * 100) / 100,
        avgProcessScore: Math.round(avgProcess * 10) / 10,
      });
    }
  }

  return compulsions.sort((a, b) => a.totalLoss - b.totalLoss); // Most negative first
}

// ─── Somatic Stress → Outcome (Danziger) ─────────────────────────────────────

function toDateStr(ts: string): string {
  return ts.split("T")[0];
}

export function calculateSomaticStressCorrelation(
  trades: Trade[],
  sessionLogs: ExpertSessionLog[],
): SomaticStressCorrelation | null {
  if (sessionLogs.length === 0) return null;
  const closed = closedTrades(trades);
  if (closed.length < 5) return null;

  const logByDate = new Map<string, ExpertSessionLog>();
  for (const log of sessionLogs) {
    logByDate.set(log.session_date, log);
  }

  const matchedByIntensity: Record<string, Trade[]> = {};
  const matchedByArea: Record<string, Trade[]> = {};

  for (const t of closed) {
    const tradeDate = toDateStr(t.open_timestamp);
    const log = logByDate.get(tradeDate);
    if (!log) continue;

    const intensity = log.somatic_intensity || "none";
    if (intensity !== "none") {
      if (!matchedByIntensity[intensity]) matchedByIntensity[intensity] = [];
      matchedByIntensity[intensity].push(t);
    }

    for (const area of log.somatic_areas) {
      if (area === "none") continue;
      if (!matchedByArea[area]) matchedByArea[area] = [];
      matchedByArea[area].push(t);
    }
  }

  const byIntensity = Object.entries(matchedByIntensity)
    .filter(([, g]) => g.length >= 2)
    .map(([intensity, group]) => ({
      intensity: intensity as SomaticIntensity,
      tradeCount: group.length,
      winRate: Math.round(winRate(group) * 1000) / 10,
      avgPnl: Math.round(avgPnl(group) * 100) / 100,
    }));

  const byArea = Object.entries(matchedByArea)
    .filter(([, g]) => g.length >= 2)
    .map(([area, group]) => ({
      area: area as SomaticArea,
      tradeCount: group.length,
      winRate: Math.round(winRate(group) * 1000) / 10,
      avgPnl: Math.round(avgPnl(group) * 100) / 100,
    }));

  if (byIntensity.length === 0 && byArea.length === 0) return null;
  return { byIntensity, byArea };
}

// ─── Money Script → Behavior (Klontz) ───────────────────────────────────────

export function detectMoneyScriptBehaviors(
  trades: Trade[],
  profile: PsychologyProfile | null,
): MoneyScriptBehavior[] {
  if (!profile) return [];
  const closed = closedTrades(trades);
  if (closed.length < 15) return [];

  const behaviors: MoneyScriptBehavior[] = [];
  const avgSize = closed.reduce((s, t) => s + t.quantity * t.entry_price, 0) / closed.length;

  // Money Avoidance: cutting winners early (MFE >> exit gain)
  if ((profile.money_avoidance ?? 0) > 3.5) {
    const winnersWithMfe = closed.filter(
      (t) => (t.pnl ?? 0) > 0 && t.price_mfe != null && t.exit_price != null,
    );
    if (winnersWithMfe.length >= 5) {
      let cutEarly = 0;
      for (const t of winnersWithMfe) {
        const exitGain = t.position === "long"
          ? t.exit_price! - t.entry_price
          : t.entry_price - t.exit_price!;
        const mfeGain = t.position === "long"
          ? t.price_mfe! - t.entry_price
          : t.entry_price - t.price_mfe!;
        if (mfeGain > 0 && exitGain > 0 && mfeGain > exitGain * 1.5) cutEarly++;
      }
      const pct = Math.round((cutEarly / winnersWithMfe.length) * 100);
      if (pct >= 30) {
        behaviors.push({
          scriptType: "avoidance",
          score: profile.money_avoidance!,
          detectedPattern: `You cut ${pct}% of winners before they reached full potential`,
          evidence: { metric: "Early exits (MFE > 1.5x actual gain)", value: pct, benchmark: 20 },
        });
      }
    }
  }

  // Money Worship: oversizing
  if ((profile.money_worship ?? 0) > 3.5) {
    const largerThanAvg = closed.filter((t) => t.quantity * t.entry_price > avgSize * 1.5);
    const pct = Math.round((largerThanAvg.length / closed.length) * 100);
    if (pct >= 20) {
      behaviors.push({
        scriptType: "worship",
        score: profile.money_worship!,
        detectedPattern: `${pct}% of trades are oversized (>1.5x your average position)`,
        evidence: { metric: "Oversized positions", value: pct, benchmark: 10 },
      });
    }
  }

  // Money Status: ego trades (low process + oversized)
  if ((profile.money_status ?? 0) > 3.5) {
    const egoTrades = closed.filter(
      (t) => (t.process_score != null && t.process_score < 5) && t.quantity * t.entry_price > avgSize * 1.2,
    );
    const pct = Math.round((egoTrades.length / closed.length) * 100);
    if (pct >= 10 && egoTrades.length >= 3) {
      const egoWR = Math.round(winRate(egoTrades) * 1000) / 10;
      behaviors.push({
        scriptType: "status",
        score: profile.money_status!,
        detectedPattern: `${egoTrades.length} ego trades (low process, oversized) with ${egoWR}% win rate`,
        evidence: { metric: "Ego trade win rate", value: egoWR, benchmark: Math.round(winRate(closed) * 1000) / 10 },
      });
    }
  }

  // Money Vigilance: undersizing
  if ((profile.money_vigilance ?? 0) > 3.5) {
    const tinyTrades = closed.filter((t) => t.quantity * t.entry_price < avgSize * 0.5);
    const pct = Math.round((tinyTrades.length / closed.length) * 100);
    if (pct >= 25) {
      behaviors.push({
        scriptType: "vigilance",
        score: profile.money_vigilance!,
        detectedPattern: `${pct}% of trades are undersized (<50% of your average). You may be leaving money on the table.`,
        evidence: { metric: "Undersized positions", value: pct, benchmark: 15 },
      });
    }
  }

  return behaviors;
}

// ─── Readiness Score → Trade Outcome ─────────────────────────────────────────

export function calculateReadinessCorrelation(
  trades: Trade[],
  behavioralLogs: BehavioralLog[],
): ReadinessCorrelation[] {
  const closed = closedTrades(trades);
  if (closed.length < 5) return [];

  const readinessLogs = behavioralLogs.filter(
    (l) => l.phase === "pre_trade" && l.readiness_score != null,
  );
  if (readinessLogs.length < 3) return [];

  const TWO_HOURS = 2 * 60 * 60 * 1000;
  const byScore: Record<number, Trade[]> = {};

  for (const log of readinessLogs) {
    const logTime = new Date(log.created_at).getTime();
    const nextTrade = closed.find((t) => {
      const tradeTime = new Date(t.open_timestamp).getTime();
      return tradeTime >= logTime && tradeTime - logTime <= TWO_HOURS;
    });
    if (nextTrade) {
      const score = log.readiness_score!;
      if (!byScore[score]) byScore[score] = [];
      byScore[score].push(nextTrade);
    }
  }

  const labels: Record<number, "red" | "yellow" | "green"> = { 1: "red", 2: "yellow", 3: "green" };

  return Object.entries(byScore)
    .filter(([, g]) => g.length >= 2)
    .map(([score, group]) => ({
      score: Number(score),
      label: labels[Number(score)] || ("green" as const),
      tradeCount: group.length,
      winRate: Math.round(winRate(group) * 1000) / 10,
      avgPnl: Math.round(avgPnl(group) * 100) / 100,
      totalPnl: Math.round(totalPnl(group) * 100) / 100,
    }))
    .sort((a, b) => a.score - b.score);
}

// ─── Daily Check-in → Trade Outcome ──────────────────────────────────────────

export function calculateCheckinCorrelation(
  trades: Trade[],
  checkins: DailyCheckin[],
): CheckinCorrelation[] {
  const closed = closedTrades(trades);
  if (closed.length < 10 || checkins.length < 5) return [];

  const checkinByDate = new Map<string, DailyCheckin>();
  for (const c of checkins) checkinByDate.set(c.date, c);

  type Matched = { trade: Trade; checkin: DailyCheckin };
  const matched: Matched[] = [];
  for (const t of closed) {
    const checkin = checkinByDate.get(toDateStr(t.open_timestamp));
    if (checkin) matched.push({ trade: t, checkin });
  }
  if (matched.length < 5) return [];

  const results: CheckinCorrelation[] = [];

  function bucketNumeric(
    dimension: "mood" | "energy" | "sleep_quality" | "cognitive_load",
    getValue: (c: DailyCheckin) => number | null,
  ) {
    const buckets: Record<string, Trade[]> = {};
    for (const { trade, checkin } of matched) {
      const val = getValue(checkin);
      if (val == null) continue;
      const bucket = val <= 2 ? "1-2 (Low)" : val <= 3 ? "3 (Mid)" : "4-5 (High)";
      if (!buckets[bucket]) buckets[bucket] = [];
      buckets[bucket].push(trade);
    }
    for (const [bucket, group] of Object.entries(buckets)) {
      if (group.length < 3) continue;
      results.push({
        dimension,
        bucket,
        tradeCount: group.length,
        winRate: Math.round(winRate(group) * 1000) / 10,
        avgPnl: Math.round(avgPnl(group) * 100) / 100,
        totalPnl: Math.round(totalPnl(group) * 100) / 100,
      });
    }
  }

  bucketNumeric("mood", (c) => c.mood);
  bucketNumeric("energy", (c) => c.energy);
  bucketNumeric("sleep_quality", (c) => c.sleep_quality);
  bucketNumeric("cognitive_load", (c) => c.cognitive_load);

  const byTraffic: Record<string, Trade[]> = {};
  for (const { trade, checkin } of matched) {
    if (!byTraffic[checkin.traffic_light]) byTraffic[checkin.traffic_light] = [];
    byTraffic[checkin.traffic_light].push(trade);
  }
  for (const [light, group] of Object.entries(byTraffic)) {
    if (group.length < 3) continue;
    results.push({
      dimension: "traffic_light" as const,
      bucket: light,
      tradeCount: group.length,
      winRate: Math.round(winRate(group) * 1000) / 10,
      avgPnl: Math.round(avgPnl(group) * 100) / 100,
      totalPnl: Math.round(totalPnl(group) * 100) / 100,
    });
  }

  return results;
}

// ─── Somatic Heatmap (derived) ───────────────────────────────────────────────

export function buildSomaticHeatmap(
  trades: Trade[],
  sessionLogs: ExpertSessionLog[],
): SomaticHeatmapEntry[] {
  const corr = calculateSomaticStressCorrelation(trades, sessionLogs);
  if (!corr) return [];
  const overallWR = winRate(closedTrades(trades)) * 100;

  return corr.byArea.map((entry) => ({
    area: entry.area,
    tradeCount: entry.tradeCount,
    winRate: entry.winRate,
    avgPnl: entry.avgPnl,
    sentiment: entry.winRate > overallWR + 5 ? "positive" as const
      : entry.winRate < overallWR - 5 ? "negative" as const
      : "neutral" as const,
  }));
}

// ─── Master Correlation Builder ──────────────────────────────────────────────

export function calculateAllCorrelations(
  trades: Trade[],
  sessionLogs: ExpertSessionLog[] = [],
  profile: PsychologyProfile | null = null,
  checkins: DailyCheckin[] = [],
  behavioralLogs: BehavioralLog[] = [],
): PsychologyCorrelations {
  return {
    emotionCorrelations: calculateEmotionCorrelations(trades),
    timeCorrelations: calculateTimeCorrelations(trades),
    confidenceCalibration: calculateConfidenceCalibration(trades),
    postLossMetrics: calculatePostLossMetrics(trades),
    streakImpact: calculateStreakImpact(trades),
    ideaSourceCorrelations: calculateIdeaSourceCorrelations(trades),
    dispositionRatio: calculateDispositionRatio(trades),
    systemClassification: classifyTradingSystem(trades),
    douglasConsistency: calculateDouglasConsistency(trades),
    sqn: calculateSQN(trades),
    shadowEruptions: detectShadowEruptions(trades),
    repetitionCompulsions: detectRepetitionCompulsions(trades),
    somaticStressCorrelation: calculateSomaticStressCorrelation(trades, sessionLogs),
    moneyScriptBehaviors: detectMoneyScriptBehaviors(trades, profile),
    readinessCorrelation: calculateReadinessCorrelation(trades, behavioralLogs),
    checkinCorrelation: calculateCheckinCorrelation(trades, checkins),
    somaticHeatmap: buildSomaticHeatmap(trades, sessionLogs),
  };
}

// ─── Generate Top Insights (for headline cards) ──────────────────────────────

export type PsychologyInsight = {
  title: string;
  description: string;
  severity: "positive" | "warning" | "critical" | "neutral";
  framework: string;
};

export function generateHeadlineInsights(correlations: PsychologyCorrelations): PsychologyInsight[] {
  const insights: PsychologyInsight[] = [];

  // Best and worst emotion
  const emotions = correlations.emotionCorrelations.filter((e) => e.tradeCount >= 5 && e.value !== "Untagged");
  if (emotions.length >= 2) {
    const best = [...emotions].sort((a, b) => b.winRate - a.winRate)[0];
    const worst = [...emotions].sort((a, b) => a.winRate - b.winRate)[0];
    if (best.winRate > worst.winRate + 15) {
      insights.push({
        title: `Best state: ${best.value} (${best.winRate}% win rate)`,
        description: `When trading while ${best.value}, you win ${best.winRate}% with $${best.avgPnl.toFixed(0)} avg P&L across ${best.tradeCount} trades.`,
        severity: "positive",
        framework: "Kahneman",
      });
      insights.push({
        title: `Worst state: ${worst.value} (${worst.winRate}% win rate)`,
        description: `When trading while ${worst.value}, you win only ${worst.winRate}% with $${worst.avgPnl.toFixed(0)} avg P&L. Consider not trading in this state.`,
        severity: worst.winRate < 40 ? "critical" : "warning",
        framework: "Kahneman",
      });
    }
  }

  // Post-loss behavior
  if (correlations.postLossMetrics) {
    const m = correlations.postLossMetrics;
    if (m.revengeTradeWinRate < m.normalTradeWinRate - 10) {
      insights.push({
        title: `Revenge trades cost you money`,
        description: `Trades within 60 min of a loss: ${m.revengeTradeWinRate}% win rate ($${m.revengeTradeAvgPnl.toFixed(0)} avg). Normal trades: ${m.normalTradeWinRate}% ($${m.normalTradeAvgPnl.toFixed(0)} avg). Wait at least an hour after losses.`,
        severity: "critical",
        framework: "Freud/Kahneman",
      });
    }
  }

  // Disposition effect
  if (correlations.dispositionRatio) {
    const d = correlations.dispositionRatio;
    if (d.interpretation === "strong_disposition") {
      insights.push({
        title: `Disposition Effect: holding losers ${d.ratio}x longer than winners`,
        description: `You cut winners too early and hold losers too long. This is Kahneman's prospect theory in action — losses feel 2x as painful, so you avoid realizing them.`,
        severity: "critical",
        framework: "Kahneman",
      });
    }
  }

  // System 1 vs 2
  if (correlations.systemClassification) {
    const s = correlations.systemClassification;
    if (s.system1WinRate < s.system2WinRate - 15 && s.system1Count >= 5) {
      insights.push({
        title: `Impulsive trades underperform by ${(s.system2WinRate - s.system1WinRate).toFixed(0)}%`,
        description: `System 1 (impulsive): ${s.system1WinRate}% win rate, $${s.system1AvgPnl.toFixed(0)} avg. System 2 (deliberate): ${s.system2WinRate}%, $${s.system2AvgPnl.toFixed(0)} avg. Slow down.`,
        severity: "warning",
        framework: "Kahneman",
      });
    }
  }

  // SQN
  if (correlations.sqn) {
    const s = correlations.sqn;
    insights.push({
      title: `System Quality: ${s.rating} (SQN ${s.sqn})`,
      description: `Van Tharp SQN from ${s.sampleSize} trades with defined risk. ${s.sqn >= 2.4 ? "Your system has a positive edge." : "Your system needs improvement — focus on cutting losers faster."}`,
      severity: s.sqn >= 2.4 ? "positive" : s.sqn >= 1.6 ? "neutral" : "warning",
      framework: "Van Tharp",
    });
  }

  // Douglas consistency
  if (correlations.douglasConsistency) {
    const c = correlations.douglasConsistency;
    insights.push({
      title: `Consistency Score: ${c.score}/100`,
      description: `Strongest: ${c.strongestDimension}. Weakest: ${c.weakestDimension}. Douglas says consistency is the foundation — your weakest link limits your edge.`,
      severity: c.score >= 70 ? "positive" : c.score >= 40 ? "neutral" : "warning",
      framework: "Douglas",
    });
  }

  // Shadow eruptions
  if (correlations.shadowEruptions.length > 0) {
    const recent = correlations.shadowEruptions[0];
    insights.push({
      title: `Shadow Eruption detected on ${recent.date}`,
      description: `Your process score dropped sharply mid-session, resulting in $${recent.pnlImpact.toFixed(0)} damage across ${recent.tradesInEruption} trades. Jung calls this a shadow takeover — your disciplined self got overridden.`,
      severity: recent.severity === "severe" ? "critical" : "warning",
      framework: "Jung",
    });
  }

  // Repetition compulsion
  if (correlations.repetitionCompulsions.length > 0) {
    const worst = correlations.repetitionCompulsions[0];
    insights.push({
      title: `Repeating pattern: ${worst.symbol} ${worst.direction} (${worst.occurrences} losses)`,
      description: `You keep taking the same losing trade on ${worst.symbol} ${worst.direction}. Total cost: $${worst.totalLoss.toFixed(0)}. Freud calls this repetition compulsion — repeating painful patterns unconsciously.`,
      severity: "critical",
      framework: "Freud",
    });
  }

  // Best time
  const dayCorrelations = correlations.timeCorrelations.filter(
    (t) => t.dimension === "day_of_week" && t.tradeCount >= 5,
  );
  if (dayCorrelations.length >= 3) {
    const bestDay = [...dayCorrelations].sort((a, b) => b.totalPnl - a.totalPnl)[0];
    const worstDay = [...dayCorrelations].sort((a, b) => a.totalPnl - b.totalPnl)[0];
    if (bestDay.totalPnl > 0 && worstDay.totalPnl < 0) {
      insights.push({
        title: `Best day: ${bestDay.value} (+$${bestDay.totalPnl.toFixed(0)})`,
        description: `${bestDay.value}: ${bestDay.winRate}% win rate, $${bestDay.totalPnl.toFixed(0)} total. ${worstDay.value}: ${worstDay.winRate}% win rate, $${worstDay.totalPnl.toFixed(0)} total. Consider reducing activity on ${worstDay.value}s.`,
        severity: "neutral",
        framework: "Danziger",
      });
    }
  }

  // Confidence calibration
  const calData = correlations.confidenceCalibration;
  if (calData.length >= 3) {
    const overconfident = calData.filter((c) => c.gap < -20 && c.tradeCount >= 5);
    if (overconfident.length > 0) {
      const worst = overconfident.sort((a, b) => a.gap - b.gap)[0];
      insights.push({
        title: `Overconfident at level ${worst.confidence}: expected ${worst.confidence * 10}%, actual ${worst.actualWinRate}%`,
        description: `When you rate confidence ${worst.confidence}/10, you expect ~${worst.confidence * 10}% wins but only achieve ${worst.actualWinRate}%. Your confidence is miscalibrated — use data to recalibrate.`,
        severity: "warning",
        framework: "Kahneman",
      });
    }
  }

  // Somatic stress insight
  if (correlations.somaticStressCorrelation) {
    const s = correlations.somaticStressCorrelation;
    const strong = s.byIntensity.find((i) => i.intensity === "strong");
    const light = s.byIntensity.find((i) => i.intensity === "light");
    if (strong && light && strong.tradeCount >= 3) {
      const diff = light.winRate - strong.winRate;
      if (diff > 10) {
        insights.push({
          title: `High body stress costs you ${diff.toFixed(0)}% win rate`,
          description: `Strong somatic stress: ${strong.winRate}% WR ($${strong.avgPnl.toFixed(0)} avg). Light stress: ${light.winRate}% WR ($${light.avgPnl.toFixed(0)} avg). Your body knows before your mind.`,
          severity: diff > 20 ? "critical" : "warning",
          framework: "Danziger",
        });
      }
    }
  }

  // Money script insight
  if (correlations.moneyScriptBehaviors.length > 0) {
    const worst = correlations.moneyScriptBehaviors[0];
    insights.push({
      title: `Money ${worst.scriptType} pattern detected`,
      description: worst.detectedPattern,
      severity: "warning",
      framework: "Klontz",
    });
  }

  // Readiness insight
  if (correlations.readinessCorrelation.length >= 2) {
    const green = correlations.readinessCorrelation.find((r) => r.label === "green");
    const red = correlations.readinessCorrelation.find((r) => r.label === "red");
    if (green && red && green.tradeCount >= 3 && red.tradeCount >= 2) {
      insights.push({
        title: `Readiness check works: green ${green.winRate}% vs red ${red.winRate}% WR`,
        description: `Trades after green readiness: $${green.avgPnl.toFixed(0)} avg. After red: $${red.avgPnl.toFixed(0)} avg. ${red.winRate < green.winRate - 10 ? "The readiness check is protecting you." : "Keep building data."}`,
        severity: green.winRate > red.winRate + 15 ? "positive" : "neutral",
        framework: "Danziger",
      });
    }
  }

  // Checkin mood insight
  const highMood = correlations.checkinCorrelation.find((c) => c.dimension === "mood" && c.bucket === "4-5 (High)");
  const lowMood = correlations.checkinCorrelation.find((c) => c.dimension === "mood" && c.bucket === "1-2 (Low)");
  if (highMood && lowMood && highMood.tradeCount >= 3 && lowMood.tradeCount >= 3) {
    const diff = highMood.winRate - lowMood.winRate;
    if (Math.abs(diff) > 10) {
      insights.push({
        title: `High mood days: ${highMood.winRate}% WR vs low mood: ${lowMood.winRate}% WR`,
        description: diff > 0
          ? "Higher mood = better trades. Consider reducing activity on low-mood days."
          : "You trade better on low-mood days. Perhaps caution improves your process.",
        severity: diff > 15 ? "positive" : "neutral",
        framework: "Danziger",
      });
    }
  }

  // Sort by severity
  const severityOrder = { critical: 0, warning: 1, positive: 2, neutral: 3 };
  return insights.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}

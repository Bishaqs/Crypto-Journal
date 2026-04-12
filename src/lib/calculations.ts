import { Trade, Chain, DashboardStats, DailyPnl, AdvancedStats, BehavioralInsight, WeeklyReport, MonthlyRecap, DailyCheckin, BehavioralLog, SelfSabotageSignal, WealthThermostat, RiskHomeostasis, EndowmentEffect, PsychDevelopmentStage, AnchoringPattern } from "./types";

// Pure functions — given trades in, stats out. No side effects, easy to test.
// This is where all the trading math lives.

/**
 * Parse a trade's emotion field.
 * Handles both single strings ("Calm") and JSON arrays ('["Calm","Excited"]').
 */
export function parseEmotions(raw: string | null | undefined): string[] {
  if (!raw) return ["Untagged"];
  if (raw.startsWith("[")) {
    try {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.length > 0) return arr;
      return ["Untagged"];
    } catch {
      return [raw];
    }
  }
  return [raw];
}

/**
 * Calculate P&L for a single trade.
 * Long: (exit - entry) * quantity - fees
 * Short: (entry - exit) * quantity - fees
 */
export function calculateTradePnl(trade: Trade): number | null {
  if (trade.exit_price === null) return null; // Still open

  const direction = trade.position === "long" ? 1 : -1;
  const priceDiff = (trade.exit_price - trade.entry_price) * direction;
  return priceDiff * trade.quantity - trade.fees;
}

/**
 * Calculate all dashboard statistics from a list of trades.
 */
export function calculateStats(trades: Trade[]): DashboardStats {
  const isClosed = (t: Trade) => t.close_timestamp !== null || t.exit_price !== null || t.pnl !== null;
  const closedTrades = trades.filter(isClosed);
  const openTrades = trades.filter((t) => !isClosed(t));

  const pnls = closedTrades.map((t) => t.pnl ?? calculateTradePnl(t) ?? 0);
  const wins = pnls.filter((p) => p > 0);
  const losses = pnls.filter((p) => p < 0);
  const breakeven = pnls.filter((p) => p === 0);

  const totalWins = wins.reduce((sum, p) => sum + p, 0);
  const totalLosses = Math.abs(losses.reduce((sum, p) => sum + p, 0));

  // Profit Factor = gross wins / gross losses. Infinity if no losses.
  const profitFactor = totalLosses === 0 ? (totalWins > 0 ? Infinity : 0) : totalWins / totalLosses;

  const closedPnl = pnls.reduce((sum, p) => sum + p, 0);

  // Unrealized P&L for open trades (using entry price as current — you'd replace with live price later)
  const unrealizedPnl = openTrades.reduce((sum, t) => {
    return sum + (calculateTradePnl(t) ?? 0);
  }, 0);

  return {
    totalTrades: closedTrades.length,
    wins: wins.length,
    losses: losses.length,
    breakeven: breakeven.length,
    winRate: closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0,
    avgTradePnl: closedTrades.length > 0 ? closedPnl / closedTrades.length : 0,
    profitFactor: profitFactor === Infinity ? 999.99 : Number(profitFactor.toFixed(2)),
    closedPnl,
    unrealizedPnl,
    totalRealizedPnl: closedPnl,
  };
}

/**
 * Group trades by day and calculate daily P&L.
 * Used for the calendar heatmap and daily P&L bar chart.
 */
export function calculateDailyPnl(trades: Trade[]): DailyPnl[] {
  const closedTrades = trades.filter(
    (t) => t.close_timestamp !== null || t.exit_price !== null || t.pnl !== null,
  );
  const dailyMap = new Map<string, { pnl: number; count: number }>();

  for (const trade of closedTrades) {
    const date = (trade.close_timestamp ?? trade.open_timestamp).split("T")[0];
    const existing = dailyMap.get(date) ?? { pnl: 0, count: 0 };
    const tradePnl = trade.pnl ?? calculateTradePnl(trade) ?? 0;
    dailyMap.set(date, {
      pnl: existing.pnl + tradePnl,
      count: existing.count + 1,
    });
  }

  return Array.from(dailyMap.entries())
    .map(([date, data]) => ({ date, pnl: data.pnl, tradeCount: data.count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Tilt / Revenge Trade Detection
 * Analyzes recent trades for emotional trading patterns.
 */
export type TiltSignal = {
  type: "rapid_fire" | "size_spike" | "revenge_reentry";
  message: string;
  severity: "warning" | "danger";
  trades: string[];
};

export function detectTiltSignals(
  trades: Trade[],
  options?: { excludeImported?: boolean; excludeBrokerSynced?: boolean },
): TiltSignal[] {
  const signals: TiltSignal[] = [];
  let base = options?.excludeImported
    ? trades.filter((t) => !t.tags?.includes("csv-import"))
    : trades;
  if (options?.excludeBrokerSynced) {
    base = base.filter((t) => !t.connection_id);
  }
  const sorted = [...base]
    .filter((t) => t.open_timestamp)
    .sort((a, b) => new Date(a.open_timestamp).getTime() - new Date(b.open_timestamp).getTime());

  if (sorted.length < 2) return signals;

  const avgSize = sorted.reduce((sum, t) => sum + t.quantity * t.entry_price, 0) / sorted.length;

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const prev = sorted[i - 1];
    const prevPnl = prev.pnl ?? calculateTradePnl(prev) ?? 0;
    const prevWasLoss = prevPnl < 0;

    if (!prevWasLoss) continue;

    const closeTime = prev.close_timestamp ?? prev.open_timestamp;
    const timeDiffMs = new Date(current.open_timestamp).getTime() - new Date(closeTime).getTime();
    const timeDiffMin = timeDiffMs / 60000;

    // Rapid fire: 3+ trades within 1 hour after a loss
    if (timeDiffMin < 60 && timeDiffMin >= 0) {
      const tradesInWindow = sorted.filter((t, idx) => {
        if (idx <= i - 1) return false;
        const diff = new Date(t.open_timestamp).getTime() - new Date(closeTime).getTime();
        return diff >= 0 && diff < 3600000;
      });
      if (tradesInWindow.length >= 2) {
        signals.push({
          type: "rapid_fire",
          message: `${tradesInWindow.length + 1} trades within 1 hour after a loss`,
          severity: "danger",
          trades: [prev.id, ...tradesInWindow.map((t) => t.id)],
        });
      }
    }

    // Size spike: position size > 1.5x average after a loss
    const currentSize = current.quantity * current.entry_price;
    if (currentSize > avgSize * 1.5 && timeDiffMin >= 0 && timeDiffMin < 120) {
      signals.push({
        type: "size_spike",
        message: `Position size ${((currentSize / avgSize) * 100).toFixed(0)}% of average after a loss`,
        severity: "warning",
        trades: [prev.id, current.id],
      });
    }

    // Same-symbol re-entry within 15 minutes of a loss
    if (current.symbol === prev.symbol && timeDiffMin >= 0 && timeDiffMin < 15) {
      signals.push({
        type: "revenge_reentry",
        message: `Re-entered ${current.symbol} within ${Math.round(timeDiffMin)}min of a loss`,
        severity: "danger",
        trades: [prev.id, current.id],
      });
    }
  }

  // Deduplicate
  const unique = new Map<string, TiltSignal>();
  for (const signal of signals) {
    const key = `${signal.type}-${signal.trades.join(",")}`;
    if (!unique.has(key)) unique.set(key, signal);
  }

  return Array.from(unique.values());
}

/**
 * Build equity curve data from daily P&L.
 * Starts at 0 and accumulates.
 */
export function buildEquityCurve(dailyPnl: DailyPnl[]): { date: string; equity: number }[] {
  let cumulative = 0;
  return dailyPnl.map((d) => {
    cumulative += d.pnl;
    return { date: d.date, equity: cumulative };
  });
}

/**
 * Calculate advanced statistics for the full statistics page.
 */
export function calculateAdvancedStats(trades: Trade[]): AdvancedStats {
  const closed = trades.filter((t) => t.close_timestamp !== null);
  const pnls = closed.map((t) => t.pnl ?? calculateTradePnl(t) ?? 0);
  const wins = pnls.filter((p) => p > 0);
  const losses = pnls.filter((p) => p < 0);

  const totalWins = wins.reduce((s, p) => s + p, 0);
  const totalLosses = Math.abs(losses.reduce((s, p) => s + p, 0));
  const closedPnl = pnls.reduce((s, p) => s + p, 0);
  const profitFactor = totalLosses === 0 ? (totalWins > 0 ? 999.99 : 0) : totalWins / totalLosses;

  // Size metrics
  const avgWinner = wins.length > 0 ? totalWins / wins.length : 0;
  const avgLoser = losses.length > 0 ? totalLosses / losses.length : 0;
  const largestWin = wins.length > 0 ? Math.max(...wins) : 0;
  const largestLoss = losses.length > 0 ? Math.min(...losses) : 0;

  // Drawdown: walk the equity curve and find max peak-to-trough
  let peak = 0;
  let equity = 0;
  let maxDrawdown = 0;
  let drawdownStart = 0;
  let maxDrawdownDuration = 0;
  let currentDrawdownStart = -1;

  const dailyPnl = calculateDailyPnl(trades);
  for (let i = 0; i < dailyPnl.length; i++) {
    equity += dailyPnl[i].pnl;
    if (equity > peak) {
      peak = equity;
      if (currentDrawdownStart >= 0) {
        maxDrawdownDuration = Math.max(maxDrawdownDuration, i - currentDrawdownStart);
      }
      currentDrawdownStart = -1;
    }
    const dd = peak - equity;
    if (dd > maxDrawdown) {
      maxDrawdown = dd;
      if (currentDrawdownStart < 0) currentDrawdownStart = i;
      drawdownStart = currentDrawdownStart;
    }
  }
  if (currentDrawdownStart >= 0) {
    maxDrawdownDuration = Math.max(maxDrawdownDuration, dailyPnl.length - currentDrawdownStart);
  }

  // Sharpe ratio (simplified: daily returns, annualized)
  const dailyReturns = dailyPnl.map((d) => d.pnl);
  const avgDailyReturn = dailyReturns.length > 0 ? dailyReturns.reduce((s, r) => s + r, 0) / dailyReturns.length : 0;
  const stdDev = dailyReturns.length > 1
    ? Math.sqrt(dailyReturns.reduce((s, r) => s + (r - avgDailyReturn) ** 2, 0) / (dailyReturns.length - 1))
    : 0;
  const sharpeRatio = stdDev > 0 ? (avgDailyReturn / stdDev) * Math.sqrt(252) : 0;

  // Expectancy (avg P&L per trade / avg loss, or just avg P&L)
  const expectancy = closed.length > 0 && avgLoser > 0
    ? ((wins.length / closed.length) * avgWinner - (losses.length / closed.length) * avgLoser) / avgLoser
    : 0;

  // Hold times
  function avgHoldTime(subset: Trade[]): number {
    const times = subset
      .filter((t) => t.open_timestamp && t.close_timestamp)
      .map((t) => (new Date(t.close_timestamp!).getTime() - new Date(t.open_timestamp).getTime()) / 3600000);
    return times.length > 0 ? times.reduce((s, t) => s + t, 0) / times.length : 0;
  }
  const winTrades = closed.filter((t) => (t.pnl ?? calculateTradePnl(t) ?? 0) > 0);
  const loseTrades = closed.filter((t) => (t.pnl ?? calculateTradePnl(t) ?? 0) < 0);

  // Streaks
  let bestWin = 0, worstLose = 0, currentW = 0, currentL = 0;
  for (const p of pnls) {
    if (p > 0) { currentW++; currentL = 0; bestWin = Math.max(bestWin, currentW); }
    else if (p < 0) { currentL++; currentW = 0; worstLose = Math.max(worstLose, currentL); }
    else { currentW = 0; currentL = 0; }
  }
  const lastPnl = pnls.length > 0 ? pnls[pnls.length - 1] : 0;
  let streakCount = 0;
  const streakType = lastPnl > 0 ? "win" : lastPnl < 0 ? "loss" : "none";
  for (let i = pnls.length - 1; i >= 0; i--) {
    if ((streakType === "win" && pnls[i] > 0) || (streakType === "loss" && pnls[i] < 0)) {
      streakCount++;
    } else break;
  }

  // P&L by day of week
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayMap = new Map<number, { pnl: number; wins: number; count: number }>();
  for (const t of closed) {
    const day = new Date(t.close_timestamp!).getDay();
    const existing = dayMap.get(day) ?? { pnl: 0, wins: 0, count: 0 };
    const p = t.pnl ?? calculateTradePnl(t) ?? 0;
    dayMap.set(day, { pnl: existing.pnl + p, wins: existing.wins + (p > 0 ? 1 : 0), count: existing.count + 1 });
  }
  const pnlByDayOfWeek = dayNames.map((name, i) => {
    const d = dayMap.get(i);
    return { day: name, pnl: d?.pnl ?? 0, count: d?.count ?? 0, winRate: d && d.count > 0 ? (d.wins / d.count) * 100 : 0 };
  });

  // P&L by hour
  const hourMap = new Map<number, { pnl: number; wins: number; count: number }>();
  for (const t of closed) {
    const hour = new Date(t.open_timestamp).getHours();
    const existing = hourMap.get(hour) ?? { pnl: 0, wins: 0, count: 0 };
    const p = t.pnl ?? calculateTradePnl(t) ?? 0;
    hourMap.set(hour, { pnl: existing.pnl + p, wins: existing.wins + (p > 0 ? 1 : 0), count: existing.count + 1 });
  }
  const pnlByHour = Array.from(hourMap.entries())
    .map(([hour, d]) => ({ hour, pnl: d.pnl, count: d.count, winRate: d.count > 0 ? (d.wins / d.count) * 100 : 0 }))
    .sort((a, b) => a.hour - b.hour);

  return {
    totalTrades: closed.length,
    winRate: closed.length > 0 ? (wins.length / closed.length) * 100 : 0,
    profitFactor: Number(profitFactor.toFixed(2)),
    closedPnl,
    avgWinner,
    avgLoser,
    largestWin,
    largestLoss,
    maxDrawdown,
    maxDrawdownPct: peak > 0 ? (maxDrawdown / peak) * 100 : 0,
    maxDrawdownDuration,
    sharpeRatio,
    expectancy,
    avgHoldTimeWinners: avgHoldTime(winTrades),
    avgHoldTimeLosers: avgHoldTime(loseTrades),
    bestWinStreak: bestWin,
    worstLoseStreak: worstLose,
    currentStreak: { type: streakType as "win" | "loss" | "none", count: streakCount },
    pnlByDayOfWeek,
    pnlByHour,
  };
}

/**
 * Generate behavioral insights by correlating psychology data with P&L.
 */
export function generateBehavioralInsights(trades: Trade[]): BehavioralInsight[] {
  const insights: BehavioralInsight[] = [];
  const closed = trades.filter((t) => t.close_timestamp !== null);
  if (closed.length < 3) return insights;

  // Emotion → P&L correlation
  const emotionMap = new Map<string, { pnl: number; count: number; wins: number }>();
  for (const t of closed) {
    if (!t.emotion) continue;
    const existing = emotionMap.get(t.emotion) ?? { pnl: 0, count: 0, wins: 0 };
    const p = t.pnl ?? calculateTradePnl(t) ?? 0;
    emotionMap.set(t.emotion, {
      pnl: existing.pnl + p,
      count: existing.count + 1,
      wins: existing.wins + (p > 0 ? 1 : 0),
    });
  }

  // Find worst emotion
  let worstEmotion = { name: "", avgPnl: 0, count: 0 };
  let bestEmotion = { name: "", avgPnl: -Infinity, count: 0 };
  for (const [emotion, data] of emotionMap) {
    if (data.count < 2) continue;
    const avg = data.pnl / data.count;
    if (avg < worstEmotion.avgPnl || worstEmotion.name === "") {
      worstEmotion = { name: emotion, avgPnl: avg, count: data.count };
    }
    if (avg > bestEmotion.avgPnl) {
      bestEmotion = { name: emotion, avgPnl: avg, count: data.count };
    }
  }

  if (worstEmotion.name && worstEmotion.avgPnl < 0) {
    const totalCost = worstEmotion.avgPnl * worstEmotion.count;
    insights.push({
      label: `${worstEmotion.name} Trading`,
      description: `Your ${worstEmotion.name.toLowerCase()} trades average $${Math.abs(worstEmotion.avgPnl).toFixed(0)} loss across ${worstEmotion.count} trades`,
      value: `−$${Math.abs(totalCost).toFixed(0)} total`,
      sentiment: "negative",
    });
  }

  if (bestEmotion.name && bestEmotion.avgPnl > 0) {
    insights.push({
      label: `${bestEmotion.name} Edge`,
      description: `When you feel ${bestEmotion.name.toLowerCase()}, your avg return is +$${bestEmotion.avgPnl.toFixed(0)} per trade`,
      value: `+$${(bestEmotion.avgPnl * bestEmotion.count).toFixed(0)} total`,
      sentiment: "positive",
    });
  }

  // Process score → P&L
  const withProcess = closed.filter((t) => t.process_score !== null);
  if (withProcess.length >= 5) {
    const highProcess = withProcess.filter((t) => t.process_score! >= 7);
    const lowProcess = withProcess.filter((t) => t.process_score! <= 4);

    if (highProcess.length > 0 && lowProcess.length > 0) {
      const highAvg = highProcess.reduce((s, t) => s + (t.pnl ?? 0), 0) / highProcess.length;
      const lowAvg = lowProcess.reduce((s, t) => s + (t.pnl ?? 0), 0) / lowProcess.length;
      const diff = highAvg - lowAvg;

      if (Math.abs(diff) > 1) {
        insights.push({
          label: "Process Pays",
          description: `High-process trades (7+) average $${highAvg.toFixed(0)} vs $${lowAvg.toFixed(0)} for low-process (≤4)`,
          value: `$${Math.abs(diff).toFixed(0)} gap`,
          sentiment: diff > 0 ? "positive" : "negative",
        });
      }
    }
  }

  // Confidence → outcome
  const withConfidence = closed.filter((t) => t.confidence !== null);
  if (withConfidence.length >= 5) {
    const highConf = withConfidence.filter((t) => t.confidence! >= 7);
    const lowConf = withConfidence.filter((t) => t.confidence! <= 4);

    if (highConf.length >= 2 && lowConf.length >= 2) {
      const highWR = highConf.filter((t) => (t.pnl ?? 0) > 0).length / highConf.length * 100;
      const lowWR = lowConf.filter((t) => (t.pnl ?? 0) > 0).length / lowConf.length * 100;

      insights.push({
        label: "Confidence Signal",
        description: `High-confidence trades: ${highWR.toFixed(0)}% win rate vs ${lowWR.toFixed(0)}% when unsure`,
        value: `${Math.abs(highWR - lowWR).toFixed(0)}% spread`,
        sentiment: highWR > lowWR ? "positive" : "negative",
      });
    }
  }

  // Setup type performance
  const setupMap = new Map<string, { pnl: number; count: number; wins: number }>();
  for (const t of closed) {
    if (!t.setup_type) continue;
    const existing = setupMap.get(t.setup_type) ?? { pnl: 0, count: 0, wins: 0 };
    const p = t.pnl ?? calculateTradePnl(t) ?? 0;
    setupMap.set(t.setup_type, {
      pnl: existing.pnl + p,
      count: existing.count + 1,
      wins: existing.wins + (p > 0 ? 1 : 0),
    });
  }

  let bestSetup = { name: "", pnl: -Infinity, count: 0, winRate: 0 };
  for (const [setup, data] of setupMap) {
    if (data.count < 2) continue;
    if (data.pnl > bestSetup.pnl) {
      bestSetup = { name: setup, pnl: data.pnl, count: data.count, winRate: (data.wins / data.count) * 100 };
    }
  }
  if (bestSetup.name && bestSetup.pnl > 0) {
    insights.push({
      label: `Best Setup: ${bestSetup.name}`,
      description: `${bestSetup.winRate.toFixed(0)}% win rate across ${bestSetup.count} trades`,
      value: `+$${bestSetup.pnl.toFixed(0)}`,
      sentiment: "positive",
    });
  }

  // Checklist compliance
  const withChecklist = closed.filter((t) => t.checklist !== null);
  if (withChecklist.length >= 5) {
    const fullCompliance = withChecklist.filter((t) => Object.values(t.checklist!).every(Boolean));
    const partial = withChecklist.filter((t) => !Object.values(t.checklist!).every(Boolean));

    if (fullCompliance.length >= 2 && partial.length >= 2) {
      const fullAvg = fullCompliance.reduce((s, t) => s + (t.pnl ?? 0), 0) / fullCompliance.length;
      const partialAvg = partial.reduce((s, t) => s + (t.pnl ?? 0), 0) / partial.length;

      insights.push({
        label: "Checklist Discipline",
        description: `Full checklist: avg $${fullAvg.toFixed(0)} vs $${partialAvg.toFixed(0)} when skipping items`,
        value: `${fullCompliance.length}/${withChecklist.length} compliant`,
        sentiment: fullAvg > partialAvg ? "positive" : "negative",
      });
    }
  }

  return insights;
}

/**
 * Get emotion-based P&L data for charts.
 */
export function getEmotionPnlData(trades: Trade[]): { emotion: string; pnl: number; count: number; avgPnl: number }[] {
  const closed = trades.filter((t) => t.close_timestamp !== null && t.emotion);
  const map = new Map<string, { pnl: number; count: number }>();

  for (const t of closed) {
    const existing = map.get(t.emotion!) ?? { pnl: 0, count: 0 };
    const p = t.pnl ?? calculateTradePnl(t) ?? 0;
    map.set(t.emotion!, { pnl: existing.pnl + p, count: existing.count + 1 });
  }

  return Array.from(map.entries())
    .map(([emotion, d]) => ({ emotion, pnl: d.pnl, count: d.count, avgPnl: d.pnl / d.count }))
    .sort((a, b) => b.pnl - a.pnl);
}

/**
 * Get confidence vs P&L scatter data.
 */
export function getConfidencePnlData(trades: Trade[]): { confidence: number; pnl: number; symbol: string }[] {
  return trades
    .filter((t) => t.close_timestamp !== null && t.confidence !== null)
    .map((t) => ({
      confidence: t.confidence!,
      pnl: t.pnl ?? calculateTradePnl(t) ?? 0,
      symbol: t.symbol,
    }));
}

/**
 * Get process score vs P&L data.
 */
export function getProcessScorePnlData(trades: Trade[]): { score: number; avgPnl: number; count: number }[] {
  const map = new Map<number, { pnl: number; count: number }>();
  for (const t of trades) {
    if (t.close_timestamp === null || t.process_score === null) continue;
    const existing = map.get(t.process_score) ?? { pnl: 0, count: 0 };
    const p = t.pnl ?? calculateTradePnl(t) ?? 0;
    map.set(t.process_score, { pnl: existing.pnl + p, count: existing.count + 1 });
  }
  return Array.from(map.entries())
    .map(([score, d]) => ({ score, avgPnl: d.pnl / d.count, count: d.count }))
    .sort((a, b) => a.score - b.score);
}

/**
 * Generate a weekly report for a given week (Monday-Sunday).
 * Pass the Monday date as weekStart (ISO string "YYYY-MM-DD").
 */
export function generateWeeklyReport(trades: Trade[], weekStart: string): WeeklyReport {
  const start = new Date(weekStart + "T00:00:00");
  const end = new Date(start);
  end.setDate(end.getDate() + 6); // Sunday
  const endStr = end.toISOString().split("T")[0];

  // Filter trades closed during this week
  const weekTrades = trades.filter((t) => {
    if (!t.close_timestamp) return false;
    const closeDate = t.close_timestamp.split("T")[0];
    return closeDate >= weekStart && closeDate <= endStr;
  });

  const pnls = weekTrades.map((t) => t.pnl ?? calculateTradePnl(t) ?? 0);
  const totalPnl = pnls.reduce((s, p) => s + p, 0);
  const wins = pnls.filter((p) => p > 0).length;
  const losses = pnls.filter((p) => p < 0).length;
  const winRate = weekTrades.length > 0 ? (wins / weekTrades.length) * 100 : 0;

  // Best/worst by P&L
  const sortedByPnl = [...weekTrades].sort(
    (a, b) => (b.pnl ?? calculateTradePnl(b) ?? 0) - (a.pnl ?? calculateTradePnl(a) ?? 0)
  );
  const best = sortedByPnl[0];
  const worst = sortedByPnl[sortedByPnl.length - 1];

  // Best/worst by process score
  const withProcess = weekTrades.filter((t) => t.process_score !== null);
  const sortedByProcess = [...withProcess].sort(
    (a, b) => (b.process_score ?? 0) - (a.process_score ?? 0)
  );
  const bestProcess = sortedByProcess[0];
  const worstProcess = sortedByProcess[sortedByProcess.length - 1];

  // Avg process score
  const processScores = weekTrades
    .filter((t) => t.process_score !== null)
    .map((t) => t.process_score!);
  const avgProcessScore =
    processScores.length > 0
      ? processScores.reduce((a, b) => a + b, 0) / processScores.length
      : null;

  // Emotion breakdown
  const emotionMap = new Map<string, { count: number; pnl: number }>();
  for (const t of weekTrades) {
    const emotions = parseEmotions(t.emotion);
    const tradePnl = t.pnl ?? calculateTradePnl(t) ?? 0;
    for (const emotion of emotions) {
      const existing = emotionMap.get(emotion) ?? { count: 0, pnl: 0 };
      emotionMap.set(emotion, {
        count: existing.count + 1,
        pnl: existing.pnl + tradePnl,
      });
    }
  }

  // Rule compliance (% of trades where all checklist items were true)
  const withChecklist = weekTrades.filter(
    (t) => t.checklist && Object.keys(t.checklist).length > 0
  );
  const compliant = withChecklist.filter((t) =>
    Object.values(t.checklist!).every((v) => v === true)
  );
  const ruleCompliance =
    withChecklist.length > 0
      ? (compliant.length / withChecklist.length) * 100
      : null;

  // Trading days count
  const tradingDaySet = new Set(
    weekTrades.map((t) => t.close_timestamp!.split("T")[0])
  );
  const dailyPnl = calculateDailyPnl(weekTrades);
  const greenDays = dailyPnl.filter((d) => d.pnl > 0).length;
  const redDays = dailyPnl.filter((d) => d.pnl < 0).length;

  function toTradeRef(t: Trade) {
    return {
      symbol: t.symbol,
      pnl: t.pnl ?? calculateTradePnl(t) ?? 0,
      processScore: t.process_score,
      date: (t.close_timestamp ?? t.open_timestamp).split("T")[0],
    };
  }

  return {
    weekStart,
    weekEnd: endStr,
    totalPnl,
    tradeCount: weekTrades.length,
    winRate,
    wins,
    losses,
    bestTrade: best ? toTradeRef(best) : null,
    worstTrade: worst && worst !== best ? toTradeRef(worst) : null,
    bestProcessTrade: bestProcess ? { ...toTradeRef(bestProcess), processScore: bestProcess.process_score! } : null,
    worstProcessTrade:
      worstProcess && worstProcess !== bestProcess
        ? { ...toTradeRef(worstProcess), processScore: worstProcess.process_score! }
        : null,
    avgProcessScore,
    emotionBreakdown: Array.from(emotionMap.entries())
      .map(([emotion, d]) => ({ emotion, ...d }))
      .sort((a, b) => b.count - a.count),
    ruleCompliance,
    greenDays,
    redDays,
    tradingDays: tradingDaySet.size,
  };
}

/**
 * Get Monday dates for available weeks from trade data.
 * Returns array of ISO date strings sorted newest first.
 */
export function getAvailableWeeks(trades: Trade[]): string[] {
  const mondaySet = new Set<string>();
  for (const t of trades) {
    if (!t.close_timestamp) continue;
    const d = new Date(t.close_timestamp);
    const day = d.getDay();
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((day + 6) % 7)); // Shift to Monday
    mondaySet.add(monday.toISOString().split("T")[0]);
  }
  return Array.from(mondaySet).sort((a, b) => b.localeCompare(a));
}

/**
 * Generate a monthly performance recap from trades and check-in data.
 */
export function generateMonthlyRecap(
  trades: Trade[],
  checkins: DailyCheckin[],
  month: string, // "YYYY-MM"
): MonthlyRecap {
  const [year, mon] = month.split("-").map(Number);
  const monthStart = `${month}-01`;
  const nextMonth = mon === 12 ? `${year + 1}-01` : `${year}-${String(mon + 1).padStart(2, "0")}`;
  const monthEnd = new Date(nextMonth + "-01T00:00:00");
  monthEnd.setDate(monthEnd.getDate() - 1);
  const monthEndStr = monthEnd.toISOString().split("T")[0];

  const monthLabel = new Date(year, mon - 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  // Filter trades closed during this month
  const monthTrades = trades.filter((t) => {
    if (!t.close_timestamp) return false;
    const closeDate = t.close_timestamp.split("T")[0];
    return closeDate >= monthStart && closeDate <= monthEndStr;
  });

  const pnls = monthTrades.map((t) => t.pnl ?? calculateTradePnl(t) ?? 0);
  const totalPnl = pnls.reduce((s, p) => s + p, 0);
  const wins = pnls.filter((p) => p > 0).length;
  const losses = pnls.filter((p) => p < 0).length;
  const winRate = monthTrades.length > 0 ? (wins / monthTrades.length) * 100 : 0;

  // Best/worst trades
  const sortedByPnl = [...monthTrades].sort(
    (a, b) => (b.pnl ?? calculateTradePnl(b) ?? 0) - (a.pnl ?? calculateTradePnl(a) ?? 0),
  );
  const best = sortedByPnl[0];
  const worst = sortedByPnl[sortedByPnl.length - 1];

  // Process score
  const processScores = monthTrades.filter((t) => t.process_score !== null).map((t) => t.process_score!);
  const avgProcessScore = processScores.length > 0 ? processScores.reduce((a, b) => a + b, 0) / processScores.length : null;

  // Trading days
  const tradingDaySet = new Set(monthTrades.map((t) => t.close_timestamp!.split("T")[0]));
  const dailyPnl = calculateDailyPnl(monthTrades);
  const greenDays = dailyPnl.filter((d) => d.pnl > 0).length;
  const redDays = dailyPnl.filter((d) => d.pnl < 0).length;

  // Emotion breakdown
  const emotionMap = new Map<string, { count: number; pnl: number }>();
  for (const t of monthTrades) {
    const emotions = parseEmotions(t.emotion);
    const tradePnl = t.pnl ?? calculateTradePnl(t) ?? 0;
    for (const emotion of emotions) {
      const existing = emotionMap.get(emotion) ?? { count: 0, pnl: 0 };
      emotionMap.set(emotion, {
        count: existing.count + 1,
        pnl: existing.pnl + tradePnl,
      });
    }
  }

  // Weekly P&L within this month
  const weekMap = new Map<string, { pnl: number; trades: number }>();
  for (const t of monthTrades) {
    const d = new Date(t.close_timestamp!);
    const day = d.getDay();
    const monday = new Date(d);
    monday.setDate(monday.getDate() - ((day + 6) % 7));
    const weekKey = monday.toISOString().split("T")[0];
    const existing = weekMap.get(weekKey) ?? { pnl: 0, trades: 0 };
    weekMap.set(weekKey, {
      pnl: existing.pnl + (t.pnl ?? calculateTradePnl(t) ?? 0),
      trades: existing.trades + 1,
    });
  }

  // Top symbols
  const symbolMap = new Map<string, { pnl: number; count: number }>();
  for (const t of monthTrades) {
    const existing = symbolMap.get(t.symbol) ?? { pnl: 0, count: 0 };
    symbolMap.set(t.symbol, {
      pnl: existing.pnl + (t.pnl ?? calculateTradePnl(t) ?? 0),
      count: existing.count + 1,
    });
  }

  // Rule compliance
  const withChecklist = monthTrades.filter((t) => t.checklist && Object.keys(t.checklist).length > 0);
  const compliant = withChecklist.filter((t) => Object.values(t.checklist!).every((v) => v === true));
  const ruleCompliance = withChecklist.length > 0 ? (compliant.length / withChecklist.length) * 100 : null;

  // Check-in data for the month
  const monthCheckins = checkins.filter((c) => c.date >= monthStart && c.date <= monthEndStr);
  const moods = monthCheckins.filter((c) => c.mood != null).map((c) => c.mood);
  const energies = monthCheckins.filter((c) => c.energy != null).map((c) => c.energy!);
  const avgMood = moods.length > 0 ? moods.reduce((a, b) => a + b, 0) / moods.length : null;
  const avgEnergy = energies.length > 0 ? energies.reduce((a, b) => a + b, 0) / energies.length : null;
  const moodTrend = monthCheckins.filter((c) => c.mood != null).map((c) => ({ date: c.date, mood: c.mood }));

  // Traffic light distribution
  const greenLightDays = monthCheckins.filter((c) => c.traffic_light === "green").length;
  const yellowLightDays = monthCheckins.filter((c) => c.traffic_light === "yellow").length;
  const redLightDays = monthCheckins.filter((c) => c.traffic_light === "red").length;

  function toTradeRef(t: Trade) {
    return {
      symbol: t.symbol,
      pnl: t.pnl ?? calculateTradePnl(t) ?? 0,
      date: (t.close_timestamp ?? t.open_timestamp).split("T")[0],
    };
  }

  return {
    month,
    monthLabel,
    totalPnl,
    tradeCount: monthTrades.length,
    winRate,
    wins,
    losses,
    bestTrade: best ? toTradeRef(best) : null,
    worstTrade: worst && worst !== best ? toTradeRef(worst) : null,
    avgProcessScore,
    tradingDays: tradingDaySet.size,
    greenDays,
    redDays,
    avgMood,
    avgEnergy,
    moodTrend,
    emotionBreakdown: Array.from(emotionMap.entries())
      .map(([emotion, d]) => ({ emotion, ...d }))
      .sort((a, b) => b.count - a.count),
    weeklyPnl: Array.from(weekMap.entries())
      .map(([week, d]) => ({ week, ...d }))
      .sort((a, b) => a.week.localeCompare(b.week)),
    topSymbols: Array.from(symbolMap.entries())
      .map(([symbol, d]) => ({ symbol, ...d }))
      .sort((a, b) => Math.abs(b.pnl) - Math.abs(a.pnl))
      .slice(0, 10),
    ruleCompliance,
    checkinDays: monthCheckins.length,
    greenLightDays,
    yellowLightDays,
    redLightDays,
  };
}

/**
 * Get available months from trade data.
 * Returns array of "YYYY-MM" strings sorted newest first.
 */
export function getAvailableMonths(trades: Trade[]): string[] {
  const monthSet = new Set<string>();
  for (const t of trades) {
    if (!t.close_timestamp) continue;
    const date = t.close_timestamp.split("T")[0];
    monthSet.add(date.substring(0, 7)); // "YYYY-MM"
  }
  return Array.from(monthSet).sort((a, b) => b.localeCompare(a));
}

/**
 * P&L breakdown by chain for DEX trades.
 */
export type ChainStats = {
  chain: Chain;
  pnl: number;
  trades: number;
  wins: number;
  winRate: number;
  totalGas: number;
};

export function calculateChainStats(trades: Trade[]): ChainStats[] {
  const dexTrades = trades.filter((t) => t.trade_source === "dex" && t.chain && t.close_timestamp);
  const map = new Map<Chain, { pnl: number; trades: number; wins: number; gas: number }>();

  for (const t of dexTrades) {
    const chain = t.chain!;
    const existing = map.get(chain) ?? { pnl: 0, trades: 0, wins: 0, gas: 0 };
    const p = t.pnl ?? calculateTradePnl(t) ?? 0;
    map.set(chain, {
      pnl: existing.pnl + p,
      trades: existing.trades + 1,
      wins: existing.wins + (p > 0 ? 1 : 0),
      gas: existing.gas + (t.gas_fee ?? 0),
    });
  }

  return Array.from(map.entries())
    .map(([chain, d]) => ({
      chain,
      pnl: d.pnl,
      trades: d.trades,
      wins: d.wins,
      winRate: d.trades > 0 ? (d.wins / d.trades) * 100 : 0,
      totalGas: d.gas,
    }))
    .sort((a, b) => b.pnl - a.pnl);
}

/**
 * Gas impact: total gas fees as % of gross P&L.
 */
export type GasImpact = {
  totalGasFees: number;
  grossPnl: number;
  gasAsPercent: number;
  netPnlAfterGas: number;
};

export function calculateGasImpact(trades: Trade[]): GasImpact {
  const dexClosed = trades.filter((t) => t.trade_source === "dex" && t.close_timestamp);
  const totalGasFees = dexClosed.reduce((s, t) => s + (t.gas_fee ?? 0), 0);
  const grossPnl = dexClosed.reduce((s, t) => s + (t.pnl ?? calculateTradePnl(t) ?? 0), 0);
  const gasAsPercent = grossPnl !== 0 ? (totalGasFees / Math.abs(grossPnl)) * 100 : 0;

  return {
    totalGasFees,
    grossPnl,
    gasAsPercent,
    netPnlAfterGas: grossPnl - totalGasFees,
  };
}

/* ── Computed column helpers (for Full-mode trade tables) ──────── */

export function formatDuration(openTs: string, closeTs: string | null): string {
  const open = new Date(openTs).getTime();
  const close = closeTs ? new Date(closeTs).getTime() : Date.now();
  const ms = close - open;
  if (ms < 0) return "\u2014";

  const mins = Math.floor(ms / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    const remHours = hours % 24;
    return remHours > 0 ? `${days}d ${remHours}h` : `${days}d`;
  }
  if (hours > 0) {
    const remMins = mins % 60;
    return remMins > 0 ? `${hours}h ${remMins}m` : `${hours}h`;
  }
  return `${mins}m`;
}

export function getReturnPct(trade: { entry_price: number; exit_price: number | null; position: "long" | "short" }): string | null {
  if (!trade.entry_price || trade.exit_price === null) return null;
  const direction = trade.position === "long" ? 1 : -1;
  const pct = ((trade.exit_price - trade.entry_price) / trade.entry_price) * 100 * direction;
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`;
}

/* ── R-Multiple calculation ──────────────────────────────────── */

const LOT_MULTIPLIERS: Record<string, number> = {
  standard: 100000,
  mini: 10000,
  micro: 1000,
};

export function calculateRMultiple(trade: {
  entry_price: number;
  stop_loss: number | null;
  pnl: number | null;
  exit_price: number | null;
  quantity?: number;
  lot_size?: number;
  lot_type?: string;
  tick_size?: number | null;
  tick_value?: number | null;
}): number | null {
  if (trade.stop_loss === null || trade.pnl === null || trade.exit_price === null) return null;

  const priceDiff = Math.abs(trade.entry_price - trade.stop_loss);
  if (priceDiff === 0) return null;

  let initialRisk: number;

  if (trade.tick_size && trade.tick_value && trade.tick_size > 0) {
    initialRisk = (priceDiff / trade.tick_size) * trade.tick_value * (trade.quantity ?? 1);
  } else if (trade.lot_size !== undefined && trade.lot_type) {
    const multiplier = LOT_MULTIPLIERS[trade.lot_type] ?? 100000;
    initialRisk = priceDiff * trade.lot_size * multiplier;
  } else {
    initialRisk = priceDiff * (trade.quantity ?? 1);
  }

  if (initialRisk === 0) return null;
  return trade.pnl / initialRisk;
}

export function formatRMultiple(r: number | null): string | null {
  if (r === null) return null;
  return `${r >= 0 ? "+" : ""}${r.toFixed(2)}R`;
}

/* ── New computed column helpers (TradeZella parity) ──────── */

/**
 * Total commitment = entry_price * quantity, adjusted per asset type.
 */
export function getTotalCommitment(trade: {
  entry_price: number;
  quantity?: number;
  lot_size?: number;
  lot_type?: string;
  contract_size?: number | null;
}): number {
  if (trade.lot_size !== undefined && trade.lot_type) {
    const multiplier = LOT_MULTIPLIERS[trade.lot_type] ?? 100000;
    return trade.entry_price * trade.lot_size * multiplier;
  }
  if (trade.contract_size) {
    return trade.entry_price * (trade.quantity ?? 1) * trade.contract_size;
  }
  return trade.entry_price * (trade.quantity ?? 1);
}

/**
 * Quarter label from a timestamp, e.g. "Q1 '26".
 */
export function getQuarterLabel(timestamp: string | null): string | null {
  if (!timestamp) return null;
  const d = new Date(timestamp);
  const q = Math.ceil((d.getMonth() + 1) / 3);
  const yr = String(d.getFullYear()).slice(-2);
  return `Q${q} '${yr}`;
}

/**
 * Trade MAE in $ — maximum adverse excursion dollar amount.
 * For longs: (entry - price_mae) * qty. For shorts: (price_mae - entry) * qty.
 */
export function calculateTradeMAE(trade: {
  entry_price: number;
  price_mae: number | null;
  position: "long" | "short";
  quantity?: number;
  lot_size?: number;
  lot_type?: string;
  contract_size?: number | null;
  tick_size?: number | null;
  tick_value?: number | null;
}): number | null {
  if (trade.price_mae === null) return null;
  const diff = trade.position === "long"
    ? trade.entry_price - trade.price_mae
    : trade.price_mae - trade.entry_price;
  return Math.abs(diff) * getPositionSize(trade);
}

/**
 * Trade MFE in $ — maximum favorable excursion dollar amount.
 */
export function calculateTradeMFE(trade: {
  entry_price: number;
  price_mfe: number | null;
  position: "long" | "short";
  quantity?: number;
  lot_size?: number;
  lot_type?: string;
  contract_size?: number | null;
  tick_size?: number | null;
  tick_value?: number | null;
}): number | null {
  if (trade.price_mfe === null) return null;
  const diff = trade.position === "long"
    ? trade.price_mfe - trade.entry_price
    : trade.entry_price - trade.price_mfe;
  return Math.abs(diff) * getPositionSize(trade);
}

/**
 * MFE / MAE ratio.
 */
export function getMfeMaeRatio(trade: {
  entry_price: number;
  price_mae: number | null;
  price_mfe: number | null;
  position: "long" | "short";
  quantity?: number;
  lot_size?: number;
  lot_type?: string;
  contract_size?: number | null;
  tick_size?: number | null;
  tick_value?: number | null;
}): number | null {
  const mae = calculateTradeMAE(trade);
  const mfe = calculateTradeMFE(trade);
  if (mae === null || mfe === null || mae === 0) return null;
  return mfe / mae;
}

/**
 * Price MFE as percentage of entry price (directional).
 */
export function getPriceMfePct(trade: {
  entry_price: number;
  price_mfe: number | null;
  position: "long" | "short";
}): number | null {
  if (trade.price_mfe === null || trade.entry_price === 0) return null;
  const direction = trade.position === "long" ? 1 : -1;
  return ((trade.price_mfe - trade.entry_price) / trade.entry_price) * 100 * direction;
}

/**
 * Best exit P&L — P&L if the trade was closed at MFE price.
 */
export function calculateBestExitPnl(trade: {
  entry_price: number;
  price_mfe: number | null;
  position: "long" | "short";
  fees: number;
  quantity?: number;
  lot_size?: number;
  lot_type?: string;
  contract_size?: number | null;
  tick_size?: number | null;
  tick_value?: number | null;
}): number | null {
  if (trade.price_mfe === null) return null;
  const direction = trade.position === "long" ? 1 : -1;
  const priceDiff = (trade.price_mfe - trade.entry_price) * direction;
  return priceDiff * getPositionSize(trade) - trade.fees;
}

/**
 * Exit efficiency = (actual P&L / best exit P&L) * 100.
 */
export function calculateExitEfficiency(trade: {
  entry_price: number;
  price_mfe: number | null;
  pnl: number | null;
  position: "long" | "short";
  fees: number;
  quantity?: number;
  lot_size?: number;
  lot_type?: string;
  contract_size?: number | null;
  tick_size?: number | null;
  tick_value?: number | null;
}): number | null {
  if (trade.pnl === null) return null;
  const bestPnl = calculateBestExitPnl(trade);
  if (bestPnl === null || bestPnl === 0) return null;
  return (trade.pnl / bestPnl) * 100;
}

/**
 * Best exit R-value — R-multiple at MFE.
 */
export function calculateBestExitR(trade: {
  entry_price: number;
  stop_loss: number | null;
  price_mfe: number | null;
  position: "long" | "short";
  fees: number;
  quantity?: number;
  lot_size?: number;
  lot_type?: string;
  contract_size?: number | null;
  tick_size?: number | null;
  tick_value?: number | null;
}): number | null {
  if (trade.stop_loss === null || trade.price_mfe === null) return null;
  const bestPnl = calculateBestExitPnl(trade);
  if (bestPnl === null) return null;

  const priceDiff = Math.abs(trade.entry_price - trade.stop_loss);
  if (priceDiff === 0) return null;

  const initialRisk = priceDiff * getPositionSize(trade);
  if (initialRisk === 0) return null;

  return bestPnl / initialRisk;
}

/** Internal: get effective position size for $ calculations. */
function getPositionSize(trade: {
  quantity?: number;
  lot_size?: number;
  lot_type?: string;
  contract_size?: number | null;
  tick_size?: number | null;
  tick_value?: number | null;
}): number {
  if (trade.tick_size && trade.tick_value && trade.tick_size > 0) {
    return (1 / trade.tick_size) * trade.tick_value * (trade.quantity ?? 1);
  }
  if (trade.lot_size !== undefined && trade.lot_type) {
    const multiplier = LOT_MULTIPLIERS[trade.lot_type] ?? 100000;
    return trade.lot_size * multiplier;
  }
  if (trade.contract_size) {
    return (trade.quantity ?? 1) * trade.contract_size;
  }
  return trade.quantity ?? 1;
}

// --- Phase 4: Additional MAE/MFE calculations ---

export function getPriceMaePct(trade: {
  entry_price: number;
  price_mae: number | null;
  position: "long" | "short";
}): number | null {
  if (trade.price_mae === null) return null;
  if (trade.entry_price === 0) return null;
  const diff = trade.position === "long"
    ? trade.entry_price - trade.price_mae
    : trade.price_mae - trade.entry_price;
  return (diff / trade.entry_price) * 100;
}

export function getTickMfe(trade: {
  entry_price: number;
  price_mfe: number | null;
  tick_size?: number | null;
  position: "long" | "short";
}): number | null {
  if (trade.price_mfe === null || !trade.tick_size || trade.tick_size === 0) return null;
  const diff = trade.position === "long"
    ? trade.price_mfe - trade.entry_price
    : trade.entry_price - trade.price_mfe;
  return diff / trade.tick_size;
}

export function getTickMae(trade: {
  entry_price: number;
  price_mae: number | null;
  tick_size?: number | null;
  position: "long" | "short";
}): number | null {
  if (trade.price_mae === null || !trade.tick_size || trade.tick_size === 0) return null;
  const diff = trade.position === "long"
    ? trade.entry_price - trade.price_mae
    : trade.price_mae - trade.entry_price;
  return diff / trade.tick_size;
}

export function getTimeTillMfe(trade: { open_timestamp: string; mfe_timestamp: string | null }): number | null {
  if (!trade.mfe_timestamp) return null;
  return new Date(trade.mfe_timestamp).getTime() - new Date(trade.open_timestamp).getTime();
}

export function getTimeTillMae(trade: { open_timestamp: string; mae_timestamp: string | null }): number | null {
  if (!trade.mae_timestamp) return null;
  return new Date(trade.mae_timestamp).getTime() - new Date(trade.open_timestamp).getTime();
}

export function getTimeAfterMfe(trade: { close_timestamp: string | null; mfe_timestamp: string | null }): number | null {
  if (!trade.close_timestamp || !trade.mfe_timestamp) return null;
  return new Date(trade.close_timestamp).getTime() - new Date(trade.mfe_timestamp).getTime();
}

export function getTimeAfterMae(trade: { close_timestamp: string | null; mae_timestamp: string | null }): number | null {
  if (!trade.close_timestamp || !trade.mae_timestamp) return null;
  return new Date(trade.close_timestamp).getTime() - new Date(trade.mae_timestamp).getTime();
}

/** Format ms duration to readable string like "1D 5H 30M" */
export function formatDurationMs(ms: number | null): string {
  if (ms === null || ms < 0) return "\u2014";
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) return `${days}D ${hours}H ${minutes}M`;
  if (hours > 0) return `${hours}H ${minutes}M ${seconds}S`;
  if (minutes > 0) return `${minutes}M ${seconds}S`;
  return `${seconds} Secs`;
}

// ─── Psychology Detection Algorithms ─────────────────────────────────────────

/**
 * Detect self-sabotage patterns:
 * 1. Process breaks: 3+ high-process trades followed by sudden low-process trade
 * 2. Profit giveback: profitable week followed by overtrading that gives back >50%
 */
export function detectSelfSabotage(trades: Trade[]): SelfSabotageSignal[] {
  const closed = trades
    .filter((t) => t.close_timestamp && t.pnl !== null && t.process_score !== null)
    .sort((a, b) => new Date(a.close_timestamp!).getTime() - new Date(b.close_timestamp!).getTime());

  if (closed.length < 5) return [];

  const signals: SelfSabotageSignal[] = [];

  // Pattern 1: Process breaks — high-process streak broken by low-process trade
  const processBreaks: { date: string; pnl: number; processScore: number | null }[] = [];
  let highStreak = 0;

  for (const trade of closed) {
    const ps = trade.process_score!;
    if (ps >= 7) {
      highStreak++;
    } else if (ps <= 4 && highStreak >= 3) {
      processBreaks.push({
        date: trade.close_timestamp!.split("T")[0],
        pnl: trade.pnl!,
        processScore: ps,
      });
      highStreak = 0;
    } else {
      highStreak = 0;
    }
  }

  if (processBreaks.length >= 2) {
    signals.push({ type: "process_break", occurrences: processBreaks.length, examples: processBreaks.slice(0, 5) });
  }

  // Pattern 2: Profit giveback — profitable week followed by next-day overtrading
  const weeklyPnl: Record<string, { pnl: number; trades: number }> = {};
  for (const t of closed) {
    const d = new Date(t.close_timestamp!);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay() + 1); // Monday
    const key = weekStart.toISOString().split("T")[0];
    if (!weeklyPnl[key]) weeklyPnl[key] = { pnl: 0, trades: 0 };
    weeklyPnl[key].pnl += t.pnl!;
    weeklyPnl[key].trades++;
  }

  const dailyPnlMap: Record<string, { pnl: number; trades: number }> = {};
  for (const t of closed) {
    const day = t.close_timestamp!.split("T")[0];
    if (!dailyPnlMap[day]) dailyPnlMap[day] = { pnl: 0, trades: 0 };
    dailyPnlMap[day].pnl += t.pnl!;
    dailyPnlMap[day].trades++;
  }

  const givebacks: { date: string; pnl: number; processScore: number | null }[] = [];
  const weeks = Object.entries(weeklyPnl).sort((a, b) => a[0].localeCompare(b[0]));

  for (let i = 0; i < weeks.length - 1; i++) {
    const [, weekData] = weeks[i];
    if (weekData.pnl <= 0) continue;

    // Check the Monday after this profitable week
    const nextWeekStart = weeks[i + 1][0];
    const nextDay = dailyPnlMap[nextWeekStart];
    if (nextDay && nextDay.pnl < 0 && Math.abs(nextDay.pnl) > weekData.pnl * 0.5 && nextDay.trades >= 3) {
      givebacks.push({ date: nextWeekStart, pnl: nextDay.pnl, processScore: null });
    }
  }

  if (givebacks.length >= 2) {
    signals.push({ type: "profit_giveback", occurrences: givebacks.length, examples: givebacks.slice(0, 5) });
  }

  return signals;
}

/**
 * Detect wealth thermostat: repeated equity peaks at the same level.
 * If cumulative P&L hits a ceiling 3+ times and retraces each time, flag it.
 */
export function detectWealthThermostat(trades: Trade[]): WealthThermostat | null {
  const closed = trades
    .filter((t) => t.close_timestamp && t.pnl !== null)
    .sort((a, b) => new Date(a.close_timestamp!).getTime() - new Date(b.close_timestamp!).getTime());

  if (closed.length < 20) return null;

  // Build cumulative P&L
  let cumPnl = 0;
  const curve: { date: string; pnl: number }[] = [];
  for (const t of closed) {
    cumPnl += t.pnl!;
    curve.push({ date: t.close_timestamp!.split("T")[0], pnl: cumPnl });
  }

  // Find local peaks (higher than 3 trades before and after)
  const peaks: { date: string; pnl: number }[] = [];
  for (let i = 3; i < curve.length - 3; i++) {
    const current = curve[i].pnl;
    if (current <= 0) continue;
    const before = Math.max(curve[i - 1].pnl, curve[i - 2].pnl, curve[i - 3].pnl);
    const after = Math.max(curve[i + 1].pnl, curve[i + 2].pnl, curve[i + 3].pnl);
    if (current > before && current > after) {
      peaks.push(curve[i]);
    }
  }

  if (peaks.length < 3) return null;

  // Cluster peaks within 10% of each other
  peaks.sort((a, b) => b.pnl - a.pnl);

  for (let i = 0; i < peaks.length; i++) {
    const ceiling = peaks[i].pnl;
    const threshold = ceiling * 0.1;
    const cluster = peaks.filter((p) => Math.abs(p.pnl - ceiling) <= threshold);

    if (cluster.length >= 3) {
      // Calculate average retrace after peaks
      let totalRetrace = 0;
      let retraceCount = 0;
      for (const peak of cluster) {
        const peakIdx = curve.findIndex((c) => c.date === peak.date && c.pnl === peak.pnl);
        if (peakIdx >= 0 && peakIdx < curve.length - 5) {
          const trough = Math.min(...curve.slice(peakIdx + 1, peakIdx + 10).map((c) => c.pnl));
          totalRetrace += (peak.pnl - trough) / peak.pnl;
          retraceCount++;
        }
      }

      return {
        ceilingLevel: Math.round(ceiling),
        peakCount: cluster.length,
        peaks: cluster.slice(0, 5),
        avgRetracePercent: retraceCount > 0 ? Math.round((totalRetrace / retraceCount) * 100) : 0,
      };
    }
  }

  return null;
}

/**
 * Detect risk homeostasis: position sizing that changes based on recent outcomes.
 * If trader sizes up after losses or sizes down after wins, flags the pattern.
 */
export function detectRiskHomeostasis(trades: Trade[]): RiskHomeostasis | null {
  const closed = trades
    .filter((t) => t.close_timestamp && t.pnl !== null && t.quantity > 0)
    .sort((a, b) => new Date(a.close_timestamp!).getTime() - new Date(b.close_timestamp!).getTime());

  if (closed.length < 10) return null;

  const sizesAfterWin: number[] = [];
  const sizesAfterLoss: number[] = [];

  for (let i = 1; i < closed.length; i++) {
    const prev = closed[i - 1];
    const current = closed[i];
    const size = current.quantity * current.entry_price;

    if (prev.pnl! > 0) {
      sizesAfterWin.push(size);
    } else if (prev.pnl! < 0) {
      sizesAfterLoss.push(size);
    }
  }

  if (sizesAfterWin.length < 3 || sizesAfterLoss.length < 3) return null;

  const avgAfterWin = sizesAfterWin.reduce((a, b) => a + b, 0) / sizesAfterWin.length;
  const avgAfterLoss = sizesAfterLoss.reduce((a, b) => a + b, 0) / sizesAfterLoss.length;

  if (avgAfterWin === 0) return null;

  const changePercent = Math.round(((avgAfterLoss - avgAfterWin) / avgAfterWin) * 100);

  if (Math.abs(changePercent) < 20) return null; // Not significant

  return {
    sizeAfterWin: Math.round(avgAfterWin),
    sizeAfterLoss: Math.round(avgAfterLoss),
    changePercent,
    direction: changePercent > 0 ? "doubling_down" : "compensating",
  };
}

/**
 * Detect endowment/disposition effect: holding losers longer than winners per symbol.
 * Requires 5+ closed trades per symbol to be statistically meaningful.
 */
export function detectEndowmentEffect(trades: Trade[]): EndowmentEffect[] {
  const closed = trades.filter((t) => t.close_timestamp && t.pnl !== null);

  const bySymbol: Record<string, { winHolds: number[]; lossHolds: number[] }> = {};

  for (const t of closed) {
    const holdMs = new Date(t.close_timestamp!).getTime() - new Date(t.open_timestamp).getTime();
    const holdHours = holdMs / (1000 * 60 * 60);
    if (holdHours <= 0) continue;

    const sym = t.symbol;
    if (!bySymbol[sym]) bySymbol[sym] = { winHolds: [], lossHolds: [] };

    if (t.pnl! > 0) {
      bySymbol[sym].winHolds.push(holdHours);
    } else if (t.pnl! < 0) {
      bySymbol[sym].lossHolds.push(holdHours);
    }
  }

  const effects: EndowmentEffect[] = [];

  for (const [symbol, data] of Object.entries(bySymbol)) {
    if (data.winHolds.length < 3 || data.lossHolds.length < 3) continue;

    const avgWin = data.winHolds.reduce((a, b) => a + b, 0) / data.winHolds.length;
    const avgLoss = data.lossHolds.reduce((a, b) => a + b, 0) / data.lossHolds.length;

    if (avgWin <= 0) continue;

    const ratio = avgLoss / avgWin;
    if (ratio > 1.5) {
      effects.push({
        symbol,
        avgHoldWin: Math.round(avgWin * 10) / 10,
        avgHoldLoss: Math.round(avgLoss * 10) / 10,
        ratio: Math.round(ratio * 100) / 100,
      });
    }
  }

  return effects.sort((a, b) => b.ratio - a.ratio);
}

/**
 * Calculate psychological development stage (Dreyfus model for trading):
 * 1. Unconscious Incompetence — no tracking
 * 2. Conscious Incompetence — tracks but negative patterns
 * 3. Conscious Competence — improving process, identifying distortions
 * 4. Unconscious Competence — consistently high process, mostly green
 * 5. Mastery — self-coaching, minimal negative emotion-P&L correlation
 */
export function calculatePsychDevelopmentStage(
  trades: Trade[],
  checkins: DailyCheckin[],
  logs: BehavioralLog[],
): PsychDevelopmentStage {
  const closed = trades.filter((t) => t.close_timestamp && t.pnl !== null);
  const withEmotion = closed.filter((t) => t.emotion);
  const withProcess = closed.filter((t) => t.process_score !== null);

  const met: string[] = [];
  const unmet: string[] = [];

  // Stage 1 → 2: Has any tracking data?
  const hasTracking = withEmotion.length > 5 || checkins.length > 3 || logs.length > 3;
  if (hasTracking) met.push("Tracks emotions and/or daily check-ins");
  else unmet.push("Start tracking emotions on trades or do daily check-ins");

  // Stage 2 → 3: Process scores trending up?
  let processImproving = false;
  if (withProcess.length >= 10) {
    const recent10 = withProcess.slice(-10);
    const older10 = withProcess.slice(0, Math.min(10, withProcess.length));
    const recentAvg = recent10.reduce((a, t) => a + t.process_score!, 0) / recent10.length;
    const olderAvg = older10.reduce((a, t) => a + t.process_score!, 0) / older10.length;
    processImproving = recentAvg > olderAvg + 0.5;
  }
  if (processImproving) met.push("Process scores are trending upward");
  else unmet.push("Improve process score consistency over time");

  // Stage 3 → 4: Consistently high process (avg 7+)?
  let consistentHighProcess = false;
  if (withProcess.length >= 20) {
    const recent20 = withProcess.slice(-20);
    const avg = recent20.reduce((a, t) => a + t.process_score!, 0) / recent20.length;
    consistentHighProcess = avg >= 7;
  }
  if (consistentHighProcess) met.push("Consistent process scores of 7+ (last 20 trades)");
  else unmet.push("Achieve average process score of 7+ over 20 trades");

  // Stage 3 → 4: Traffic light mostly green?
  let mostlyGreen = false;
  if (checkins.length >= 10) {
    const recent = checkins.slice(0, 10);
    const greenCount = recent.filter((c) => c.traffic_light === "green").length;
    mostlyGreen = greenCount >= 7;
  }
  if (mostlyGreen) met.push("70%+ green light days (last 10 check-ins)");
  else unmet.push("Achieve 70%+ green light days in daily check-ins");

  // Stage 4 → 5: Minimal negative emotion-P&L correlation?
  let minimalNegativeCorrelation = false;
  if (withEmotion.length >= 20) {
    const negativeEmotions = ["FOMO", "Revenge", "Greedy", "Overconfident", "Frustrated", "Fearful", "Anxious"];
    const negTrades = withEmotion.filter((t) => negativeEmotions.includes(t.emotion!));
    const posTrades = withEmotion.filter((t) => !negativeEmotions.includes(t.emotion!));

    if (negTrades.length > 0 && posTrades.length > 0) {
      const negAvgPnl = negTrades.reduce((a, t) => a + (t.pnl ?? 0), 0) / negTrades.length;
      const posAvgPnl = posTrades.reduce((a, t) => a + (t.pnl ?? 0), 0) / posTrades.length;
      // If negative-emotion trades are within 20% of positive-emotion trades, correlation is minimal
      if (posAvgPnl > 0 && negAvgPnl > posAvgPnl * -0.2) {
        minimalNegativeCorrelation = true;
      }
    }
  }
  if (minimalNegativeCorrelation) met.push("Negative emotions no longer significantly impact P&L");
  else unmet.push("Reduce the P&L gap between positive and negative emotion trades");

  // Determine stage
  let stage: number;
  if (!hasTracking) {
    stage = 1;
  } else if (!processImproving) {
    stage = 2;
  } else if (!consistentHighProcess || !mostlyGreen) {
    stage = 3;
  } else if (!minimalNegativeCorrelation) {
    stage = 4;
  } else {
    stage = 5;
  }

  const labels = [
    "Unconscious Incompetence",
    "Conscious Incompetence",
    "Conscious Competence",
    "Unconscious Competence",
    "Mastery",
  ];

  const hints = [
    "Start by tracking your emotions on every trade and doing daily check-ins.",
    "You're aware of your patterns — now focus on improving your process score over time.",
    "Your process is improving — aim for consistent 7+ scores and mostly green light days.",
    "You're consistently disciplined — work on eliminating the last negative emotion impacts.",
    "You've achieved mastery — maintain awareness and coach yourself through new challenges.",
  ];

  return {
    stage,
    label: labels[stage - 1],
    criteria: { met, unmet },
    nextStageHint: hints[stage - 1],
  };
}

/**
 * Detect anchoring patterns: entry price clustering around round numbers
 * or previous entry/exit prices for the same symbol.
 */
export function detectAnchoringPatterns(trades: Trade[]): AnchoringPattern[] {
  const closed = trades.filter((t) => t.close_timestamp && t.entry_price > 0);
  const bySymbol: Record<string, { entries: number[]; exits: number[] }> = {};

  for (const t of closed) {
    if (!bySymbol[t.symbol]) bySymbol[t.symbol] = { entries: [], exits: [] };
    bySymbol[t.symbol].entries.push(t.entry_price);
    if (t.exit_price) bySymbol[t.symbol].exits.push(t.exit_price);
  }

  const patterns: AnchoringPattern[] = [];

  for (const [symbol, data] of Object.entries(bySymbol)) {
    if (data.entries.length < 5) continue;

    // Round number detection: find the most common round number anchor
    const roundNumbers = [1, 5, 10, 25, 50, 100, 250, 500, 1000, 5000, 10000, 25000, 50000, 100000];
    for (const round of roundNumbers) {
      if (round > Math.max(...data.entries) * 0.5) continue; // Skip rounds larger than half the max price

      const nearRound = data.entries.filter((p) => {
        const nearest = Math.round(p / round) * round;
        return Math.abs(p - nearest) / nearest < 0.01; // Within 1%
      });

      if (nearRound.length >= 3 && nearRound.length / data.entries.length > 0.4) {
        const mostCommonRound = Math.round(data.entries.reduce((a, b) => a + b, 0) / data.entries.length / round) * round;
        patterns.push({
          symbol,
          pattern: "round_number",
          anchorPrice: mostCommonRound,
          tradeCount: nearRound.length,
        });
        break; // One round-number pattern per symbol
      }
    }

    // Previous price anchoring: entries clustering near prior exits
    const allPrices = [...data.entries, ...data.exits];
    let maxCluster = 0;
    let clusterPrice = 0;

    for (const price of allPrices) {
      const nearby = data.entries.filter((e) => Math.abs(e - price) / price < 0.02); // Within 2%
      if (nearby.length > maxCluster && nearby.length >= 3) {
        maxCluster = nearby.length;
        clusterPrice = price;
      }
    }

    if (maxCluster >= 3 && maxCluster / data.entries.length > 0.3) {
      // Don't double-count if already flagged as round number
      if (!patterns.some((p) => p.symbol === symbol && p.pattern === "round_number")) {
        patterns.push({
          symbol,
          pattern: "previous_price",
          anchorPrice: Math.round(clusterPrice * 100) / 100,
          tradeCount: maxCluster,
        });
      }
    }
  }

  return patterns.sort((a, b) => b.tradeCount - a.tradeCount);
}

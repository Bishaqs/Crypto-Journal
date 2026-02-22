import { Trade, Chain, DashboardStats, DailyPnl, AdvancedStats, BehavioralInsight, WeeklyReport } from "./types";

// Pure functions — given trades in, stats out. No side effects, easy to test.
// This is where all the trading math lives.

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
  const closedTrades = trades.filter((t) => t.close_timestamp !== null);
  const openTrades = trades.filter((t) => t.close_timestamp === null);

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
  const closedTrades = trades.filter((t) => t.close_timestamp !== null);
  const dailyMap = new Map<string, { pnl: number; count: number }>();

  for (const trade of closedTrades) {
    const date = trade.close_timestamp!.split("T")[0];
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

export function detectTiltSignals(trades: Trade[]): TiltSignal[] {
  const signals: TiltSignal[] = [];
  const sorted = [...trades]
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
    const emotion = t.emotion ?? "Untagged";
    const existing = emotionMap.get(emotion) ?? { count: 0, pnl: 0 };
    emotionMap.set(emotion, {
      count: existing.count + 1,
      pnl: existing.pnl + (t.pnl ?? calculateTradePnl(t) ?? 0),
    });
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

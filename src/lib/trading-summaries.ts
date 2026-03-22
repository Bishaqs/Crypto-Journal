/**
 * Hierarchical Trading Summary System
 *
 * Computes daily/weekly/monthly/yearly summaries from trade data.
 * Each level compresses ~4-7x, giving Nova years of history in ~3,000 tokens.
 */

import type { Trade } from "./types";
import { calculateTradePnl, parseEmotions } from "./calculations";

// ─── Types ───────────────────────────────────────────────────────────────────

export type SummaryStats = {
  tradeCount: number;
  winRate: number;
  totalPnl: number;
  avgPnl: number;
  bestTrade: { symbol: string; pnl: number } | null;
  worstTrade: { symbol: string; pnl: number } | null;
  avgProcessScore: number | null;
  dominantEmotion: string | null;
  emotionBreakdown: Record<string, { count: number; winRate: number }>;
  topSymbols: { symbol: string; pnl: number; count: number }[];
  greenDays?: number;
  redDays?: number;
  bestDay?: { date: string; pnl: number };
  worstDay?: { date: string; pnl: number };
  weeklyTrend?: { week: string; pnl: number }[];
};

export type TradingSummary = {
  user_id: string;
  period_type: "daily" | "weekly" | "monthly" | "yearly";
  period_start: string;
  period_end: string;
  stats: SummaryStats;
  narrative: string | null;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pnl(t: Trade): number {
  return t.pnl ?? calculateTradePnl(t) ?? 0;
}

function computeBaseStats(trades: Trade[]): SummaryStats {
  const closed = trades.filter((t) => t.close_timestamp && t.pnl !== null);
  if (closed.length === 0) {
    return {
      tradeCount: 0, winRate: 0, totalPnl: 0, avgPnl: 0,
      bestTrade: null, worstTrade: null, avgProcessScore: null,
      dominantEmotion: null, emotionBreakdown: {}, topSymbols: [],
    };
  }

  const total = closed.reduce((s, t) => s + pnl(t), 0);
  const wins = closed.filter((t) => pnl(t) > 0);

  // Best/worst
  const sorted = [...closed].sort((a, b) => pnl(b) - pnl(a));
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];

  // Process scores
  const processScores = closed.filter((t) => t.process_score != null).map((t) => t.process_score!);
  const avgProcess = processScores.length > 0
    ? Math.round((processScores.reduce((a, b) => a + b, 0) / processScores.length) * 10) / 10
    : null;

  // Emotions
  const emotionMap: Record<string, { count: number; wins: number }> = {};
  for (const t of closed) {
    const emotions = parseEmotions(t.emotion);
    for (const emotion of emotions) {
      if (!emotionMap[emotion]) emotionMap[emotion] = { count: 0, wins: 0 };
      emotionMap[emotion].count++;
      if (pnl(t) > 0) emotionMap[emotion].wins++;
    }
  }

  const emotionBreakdown: Record<string, { count: number; winRate: number }> = {};
  let dominantEmotion: string | null = null;
  let maxCount = 0;
  for (const [emotion, data] of Object.entries(emotionMap)) {
    emotionBreakdown[emotion] = {
      count: data.count,
      winRate: Math.round((data.wins / data.count) * 100),
    };
    if (data.count > maxCount) {
      maxCount = data.count;
      dominantEmotion = emotion;
    }
  }

  // Top symbols
  const symbolMap: Record<string, { pnl: number; count: number }> = {};
  for (const t of closed) {
    const sym = t.symbol;
    if (!symbolMap[sym]) symbolMap[sym] = { pnl: 0, count: 0 };
    symbolMap[sym].pnl += pnl(t);
    symbolMap[sym].count++;
  }
  const topSymbols = Object.entries(symbolMap)
    .map(([symbol, d]) => ({ symbol, pnl: Math.round(d.pnl * 100) / 100, count: d.count }))
    .sort((a, b) => Math.abs(b.pnl) - Math.abs(a.pnl))
    .slice(0, 5);

  return {
    tradeCount: closed.length,
    winRate: Math.round((wins.length / closed.length) * 100),
    totalPnl: Math.round(total * 100) / 100,
    avgPnl: Math.round((total / closed.length) * 100) / 100,
    bestTrade: best ? { symbol: best.symbol, pnl: Math.round(pnl(best) * 100) / 100 } : null,
    worstTrade: worst && worst !== best ? { symbol: worst.symbol, pnl: Math.round(pnl(worst) * 100) / 100 } : null,
    avgProcessScore: avgProcess,
    dominantEmotion: dominantEmotion === "Untagged" ? null : dominantEmotion,
    emotionBreakdown,
    topSymbols,
  };
}

// ─── Daily Summary ───────────────────────────────────────────────────────────

export function computeDailySummary(trades: Trade[], date: string, userId: string): TradingSummary {
  const dayTrades = trades.filter((t) => {
    const d = (t.close_timestamp ?? t.open_timestamp).split("T")[0];
    return d === date;
  });

  const stats = computeBaseStats(dayTrades);

  // Add trading hours
  if (dayTrades.length > 0) {
    const hours = dayTrades.map((t) => new Date(t.open_timestamp).getHours());
    const minH = Math.min(...hours);
    const maxH = Math.max(...hours);
    (stats as Record<string, unknown>).tradingHours = `${String(minH).padStart(2, "0")}:00-${String(maxH + 1).padStart(2, "0")}:00`;
  }

  return {
    user_id: userId,
    period_type: "daily",
    period_start: date,
    period_end: date,
    stats,
    narrative: null,
  };
}

// ─── Weekly Summary ──────────────────────────────────────────────────────────

export function computeWeeklySummary(trades: Trade[], weekStart: string, userId: string): TradingSummary {
  const start = new Date(weekStart + "T00:00:00");
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const endStr = end.toISOString().split("T")[0];

  const weekTrades = trades.filter((t) => {
    if (!t.close_timestamp) return false;
    const d = t.close_timestamp.split("T")[0];
    return d >= weekStart && d <= endStr;
  });

  const stats = computeBaseStats(weekTrades);

  // Daily breakdown for green/red days
  const dailyPnl: Record<string, number> = {};
  for (const t of weekTrades) {
    const d = t.close_timestamp!.split("T")[0];
    dailyPnl[d] = (dailyPnl[d] || 0) + pnl(t);
  }
  const days = Object.entries(dailyPnl);
  stats.greenDays = days.filter(([, p]) => p > 0).length;
  stats.redDays = days.filter(([, p]) => p < 0).length;

  if (days.length > 0) {
    const sorted = days.sort((a, b) => b[1] - a[1]);
    stats.bestDay = { date: sorted[0][0], pnl: Math.round(sorted[0][1] * 100) / 100 };
    stats.worstDay = { date: sorted[sorted.length - 1][0], pnl: Math.round(sorted[sorted.length - 1][1] * 100) / 100 };
  }

  return {
    user_id: userId,
    period_type: "weekly",
    period_start: weekStart,
    period_end: endStr,
    stats,
    narrative: null,
  };
}

// ─── Monthly Summary ─────────────────────────────────────────────────────────

export function computeMonthlySummary(trades: Trade[], month: string, userId: string): TradingSummary {
  // month = "2026-03"
  const monthTrades = trades.filter((t) => {
    if (!t.close_timestamp) return false;
    return t.close_timestamp.startsWith(month);
  });

  const stats = computeBaseStats(monthTrades);

  // Daily breakdown
  const dailyPnl: Record<string, number> = {};
  for (const t of monthTrades) {
    const d = t.close_timestamp!.split("T")[0];
    dailyPnl[d] = (dailyPnl[d] || 0) + pnl(t);
  }
  const days = Object.entries(dailyPnl);
  stats.greenDays = days.filter(([, p]) => p > 0).length;
  stats.redDays = days.filter(([, p]) => p < 0).length;

  if (days.length > 0) {
    const sorted = days.sort((a, b) => b[1] - a[1]);
    stats.bestDay = { date: sorted[0][0], pnl: Math.round(sorted[0][1] * 100) / 100 };
    stats.worstDay = { date: sorted[sorted.length - 1][0], pnl: Math.round(sorted[sorted.length - 1][1] * 100) / 100 };
  }

  // Weekly trend within month
  const weeklyPnl: Record<string, number> = {};
  for (const t of monthTrades) {
    const d = new Date(t.close_timestamp!);
    const weekNum = Math.ceil(d.getDate() / 7);
    const key = `W${weekNum}`;
    weeklyPnl[key] = (weeklyPnl[key] || 0) + pnl(t);
  }
  stats.weeklyTrend = Object.entries(weeklyPnl).map(([week, p]) => ({
    week,
    pnl: Math.round(p * 100) / 100,
  }));

  // Period bounds
  const lastDay = new Date(Number(month.split("-")[0]), Number(month.split("-")[1]), 0);
  const periodEnd = lastDay.toISOString().split("T")[0];

  return {
    user_id: userId,
    period_type: "monthly",
    period_start: `${month}-01`,
    period_end: periodEnd,
    stats,
    narrative: null,
  };
}

// ─── Yearly Summary ──────────────────────────────────────────────────────────

export function computeYearlySummary(trades: Trade[], year: string, userId: string): TradingSummary {
  const yearTrades = trades.filter((t) => {
    if (!t.close_timestamp) return false;
    return t.close_timestamp.startsWith(year);
  });

  const stats = computeBaseStats(yearTrades);

  // Monthly trend
  const monthlyPnl: Record<string, number> = {};
  for (const t of yearTrades) {
    const m = t.close_timestamp!.substring(0, 7);
    monthlyPnl[m] = (monthlyPnl[m] || 0) + pnl(t);
  }
  stats.weeklyTrend = Object.entries(monthlyPnl)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, p]) => ({ week: month, pnl: Math.round(p * 100) / 100 }));

  // Daily breakdown for green/red
  const dailyPnl: Record<string, number> = {};
  for (const t of yearTrades) {
    const d = t.close_timestamp!.split("T")[0];
    dailyPnl[d] = (dailyPnl[d] || 0) + pnl(t);
  }
  const days = Object.entries(dailyPnl);
  stats.greenDays = days.filter(([, p]) => p > 0).length;
  stats.redDays = days.filter(([, p]) => p < 0).length;

  return {
    user_id: userId,
    period_type: "yearly",
    period_start: `${year}-01-01`,
    period_end: `${year}-12-31`,
    stats,
    narrative: null,
  };
}

// ─── Format Summaries for Nova Context ───────────────────────────────────────

export function buildSummaryContext(
  summaries: { period_type: string; period_start: string; stats: SummaryStats; narrative: string | null }[],
): string {
  if (summaries.length === 0) return "";

  const parts: string[] = [];

  // Yearly
  const yearly = summaries.filter((s) => s.period_type === "yearly").sort((a, b) => b.period_start.localeCompare(a.period_start));
  if (yearly.length > 0) {
    parts.push("\n## Yearly Summaries");
    for (const s of yearly) {
      const year = s.period_start.substring(0, 4);
      const e = s.stats.dominantEmotion ? `, dominant: ${s.stats.dominantEmotion}` : "";
      const p = s.stats.avgProcessScore ? `, process: ${s.stats.avgProcessScore}` : "";
      parts.push(`- **${year}**: ${s.stats.tradeCount} trades, ${s.stats.winRate}% WR, $${s.stats.totalPnl.toFixed(0)} P&L${e}${p}`);
      if (s.narrative) parts.push(`  ${s.narrative}`);
    }
  }

  // Monthly (last 12)
  const monthly = summaries.filter((s) => s.period_type === "monthly").sort((a, b) => b.period_start.localeCompare(a.period_start)).slice(0, 12);
  if (monthly.length > 0) {
    parts.push("\n## Monthly Summaries (recent)");
    for (const s of monthly) {
      const month = s.period_start.substring(0, 7);
      const e = s.stats.dominantEmotion ? `, dominant: ${s.stats.dominantEmotion}` : "";
      const p = s.stats.avgProcessScore ? `, process: ${s.stats.avgProcessScore}` : "";
      const gd = s.stats.greenDays != null ? `, ${s.stats.greenDays}G/${s.stats.redDays ?? 0}R days` : "";
      parts.push(`- **${month}**: ${s.stats.tradeCount} trades, ${s.stats.winRate}% WR, $${s.stats.totalPnl.toFixed(0)}${e}${p}${gd}`);
      if (s.narrative) parts.push(`  ${s.narrative}`);
    }
  }

  // Weekly (last 4)
  const weekly = summaries.filter((s) => s.period_type === "weekly").sort((a, b) => b.period_start.localeCompare(a.period_start)).slice(0, 4);
  if (weekly.length > 0) {
    parts.push("\n## Recent Weekly Summaries");
    for (const s of weekly) {
      const e = s.stats.dominantEmotion ? `, dominant: ${s.stats.dominantEmotion}` : "";
      const p = s.stats.avgProcessScore ? `, process: ${s.stats.avgProcessScore}` : "";
      const gd = s.stats.greenDays != null ? `, ${s.stats.greenDays}G/${s.stats.redDays ?? 0}R` : "";
      parts.push(`- **Week of ${s.period_start}**: ${s.stats.tradeCount} trades, ${s.stats.winRate}% WR, $${s.stats.totalPnl.toFixed(0)}${e}${p}${gd}`);
      if (s.narrative) parts.push(`  ${s.narrative}`);
    }
  }

  return parts.length > 0 ? parts.join("\n") : "";
}

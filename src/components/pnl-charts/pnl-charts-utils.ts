import { Trade, DailyPnl } from "@/lib/types";
import { calculateTradePnl } from "@/lib/calculations";

/**
 * Build a drawdown series from daily P&L data.
 * Each point shows how far equity has fallen from its peak.
 */
export function buildDrawdownSeries(
  dailyPnl: DailyPnl[]
): { date: string; drawdown: number; drawdownPct: number }[] {
  let peak = 0;
  let equity = 0;
  return dailyPnl.map((d) => {
    equity += d.pnl;
    if (equity > peak) peak = equity;
    const dd = peak - equity;
    const ddPct = peak > 0 ? (dd / peak) * 100 : 0;
    return { date: d.date, drawdown: -dd, drawdownPct: -ddPct };
  });
}

/**
 * Calculate rolling averages of daily P&L.
 * Returns data points with 7-day and 30-day rolling averages.
 */
export function buildRollingPnl(
  dailyPnl: DailyPnl[]
): { date: string; pnl: number; rolling7: number | null; rolling30: number | null }[] {
  return dailyPnl.map((d, i) => {
    const slice7 = dailyPnl.slice(Math.max(0, i - 6), i + 1);
    const slice30 = dailyPnl.slice(Math.max(0, i - 29), i + 1);
    return {
      date: d.date,
      pnl: d.pnl,
      rolling7: slice7.length >= 7 ? slice7.reduce((s, x) => s + x.pnl, 0) / slice7.length : null,
      rolling30: slice30.length >= 30 ? slice30.reduce((s, x) => s + x.pnl, 0) / slice30.length : null,
    };
  });
}

/**
 * Bin individual trade P&L values into a histogram distribution.
 */
export function buildPnlDistribution(
  trades: Trade[],
  bucketCount = 20
): { range: string; count: number; midpoint: number }[] {
  const pnls = trades
    .filter((t) => t.close_timestamp !== null)
    .map((t) => t.pnl ?? calculateTradePnl(t) ?? 0);

  if (pnls.length === 0) return [];

  const min = Math.min(...pnls);
  const max = Math.max(...pnls);
  if (min === max) return [{ range: `$${min.toFixed(0)}`, count: pnls.length, midpoint: min }];

  const bucketSize = (max - min) / bucketCount;
  const buckets: { range: string; count: number; midpoint: number }[] = [];

  for (let i = 0; i < bucketCount; i++) {
    const lo = min + i * bucketSize;
    const hi = lo + bucketSize;
    const midpoint = (lo + hi) / 2;
    buckets.push({
      range: `$${lo.toFixed(0)}`,
      count: 0,
      midpoint,
    });
  }

  for (const p of pnls) {
    let idx = Math.floor((p - min) / bucketSize);
    if (idx >= bucketCount) idx = bucketCount - 1;
    buckets[idx].count++;
  }

  return buckets.filter((b) => b.count > 0);
}

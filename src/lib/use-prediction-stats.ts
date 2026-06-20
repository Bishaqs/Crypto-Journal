"use client";

import { useMemo } from "react";
import type { PredictionMarket } from "@/lib/schemas/prediction-market";

export type CalibrationBucket = {
  /** Human label for the decile, e.g. "0-10%" or "90-100%" */
  label: string;
  /** Number of resolved bets whose your_prob fell in this bucket */
  n: number;
  /** Average predicted probability (your_prob) across the bucket, 0-100 */
  predictedRate: number;
  /** Actual win rate within the bucket, 0-100 */
  actualRate: number;
};

export type PredictionBetRef = {
  title: string;
  realizedResult: number;
};

export type PredictionStats = {
  /** Bets resolved to won or lost (void + pending excluded from scoring) */
  resolvedCount: number;
  /** Bets still pending */
  openCount: number;
  /** won / resolved * 100 */
  winRate: number;
  /** Mean Brier score over resolved bets (0 = perfect, 0.25 = coin-flip) */
  avgBrier: number;
  /** 1 - avgBrier / 0.25 (> 0 beats chance) */
  skillScore: number;
  /** Calibration deciles, only buckets with n > 0 */
  calibration: CalibrationBucket[];
  /** Sum of realized_result over resolved bets */
  realizedPnl: number;
  /** Resolved bet with the highest realized_result, or null */
  bestBet: PredictionBetRef | null;
  /** Resolved bet with the lowest realized_result, or null */
  worstBet: PredictionBetRef | null;
};

const DECILE_COUNT = 10;

/** Maps a 0-100 probability to its decile index 0..9. 100 lands in the top bucket. */
function decileIndex(prob: number): number {
  const idx = Math.floor(prob / 10);
  return idx > DECILE_COUNT - 1 ? DECILE_COUNT - 1 : idx;
}

function decileLabel(idx: number): string {
  const low = idx * 10;
  const high = idx === DECILE_COUNT - 1 ? 100 : (idx + 1) * 10;
  return `${low}-${high}%`;
}

/**
 * Computes calibration / skill stats over RESOLVED prediction-market bets.
 * Only outcomes 'won' and 'lost' are scored; 'void' and 'pending' are excluded.
 * Pure — no side effects, derived entirely from the passed predictions array.
 */
export function usePredictionStats(
  predictions: PredictionMarket[]
): PredictionStats {
  return useMemo(() => {
    const resolved = predictions.filter(
      (p) => p.outcome === "won" || p.outcome === "lost"
    );
    const openCount = predictions.filter((p) => p.outcome === "pending").length;
    const resolvedCount = resolved.length;

    const wins = resolved.filter((p) => p.outcome === "won").length;
    const winRate = resolvedCount > 0 ? (wins / resolvedCount) * 100 : 0;

    // Brier score: mean of (your_prob/100 - o)^2 where o = 1 if won else 0.
    let brierSum = 0;
    for (const p of resolved) {
      const forecast = p.your_prob / 100;
      const o = p.outcome === "won" ? 1 : 0;
      const diff = forecast - o;
      brierSum += diff * diff;
    }
    const avgBrier = resolvedCount > 0 ? brierSum / resolvedCount : 0;
    const skillScore = resolvedCount > 0 ? 1 - avgBrier / 0.25 : 0;

    // Calibration deciles over your_prob.
    const buckets = Array.from({ length: DECILE_COUNT }, () => ({
      n: 0,
      probSum: 0,
      winSum: 0,
    }));
    for (const p of resolved) {
      const idx = decileIndex(p.your_prob);
      buckets[idx].n += 1;
      buckets[idx].probSum += p.your_prob;
      buckets[idx].winSum += p.outcome === "won" ? 1 : 0;
    }
    const calibration: CalibrationBucket[] = buckets
      .map((b, idx) => ({
        label: decileLabel(idx),
        n: b.n,
        predictedRate: b.n > 0 ? b.probSum / b.n : 0,
        actualRate: b.n > 0 ? (b.winSum / b.n) * 100 : 0,
      }))
      .filter((b) => b.n > 0);

    // Realized P/L + best/worst over resolved bets.
    let realizedPnl = 0;
    let bestBet: PredictionBetRef | null = null;
    let worstBet: PredictionBetRef | null = null;
    for (const p of resolved) {
      const r = p.realized_result ?? 0;
      realizedPnl += r;
      if (bestBet === null || r > bestBet.realizedResult) {
        bestBet = { title: p.title, realizedResult: r };
      }
      if (worstBet === null || r < worstBet.realizedResult) {
        worstBet = { title: p.title, realizedResult: r };
      }
    }

    return {
      resolvedCount,
      openCount,
      winRate,
      avgBrier,
      skillScore,
      calibration,
      realizedPnl,
      bestBet,
      worstBet,
    };
  }, [predictions]);
}

"use client";

import { useMemo } from "react";
import type { PredictionMarket } from "@/lib/schemas/prediction-market";
import { realizedUnits } from "@/lib/betting-odds";

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
  // ── Betting (units / bankroll) ──
  /** True when at least one resolved bet was staked in units */
  hasBettingData: boolean;
  /** Total units staked across resolved bets */
  unitsStaked: number;
  /** Net P/L in units (flat, bankroll-independent) */
  unitsPnl: number;
  /** unitsPnl / unitsStaked * 100 */
  roiPct: number;
  /** Fixed euro value of one unit = bankroll * unitPct / 100 */
  unitValue: number;
  /** Reference bankroll (from settings), in currency */
  startBankroll: number;
  /** Net P/L in currency = unitsPnl * fixed unitValue (no compounding) */
  bankrollPnl: number;
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
  predictions: PredictionMarket[],
  bankroll = 1000,
  unitPct = 1
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

    // Fixed euro value of one unit — constant by design (see below).
    const unitValue = (bankroll * unitPct) / 100;

    // Realized P/L + best/worst over resolved bets, all in currency.
    // For unit-staked bets we derive euros from the FIXED unit value so the
    // figure never drifts; euro-only legacy bets fall back to stored euros.
    function realizedEuro(p: PredictionMarket): number {
      if (p.stake_units != null) {
        const ru =
          p.realized_units != null
            ? p.realized_units
            : realizedUnits(p.outcome, p.stake_units, p.odds) ?? 0;
        return ru * unitValue;
      }
      return p.realized_result ?? 0;
    }

    let realizedPnl = 0;
    let bestBet: PredictionBetRef | null = null;
    let worstBet: PredictionBetRef | null = null;
    for (const p of resolved) {
      const r = realizedEuro(p);
      realizedPnl += r;
      if (bestBet === null || r > bestBet.realizedResult) {
        bestBet = { title: p.title, realizedResult: r };
      }
      if (worstBet === null || r < worstBet.realizedResult) {
        worstBet = { title: p.title, realizedResult: r };
      }
    }

    // ── Betting (units / bankroll) ──
    // Flat units P/L (bankroll-independent): prefer stored realized_units,
    // fall back to a value computed from outcome + stake_units + odds.
    const unitBets = resolved.filter(
      (p) => p.stake_units != null && p.stake_units > 0
    );
    const hasBettingData = unitBets.length > 0;

    let unitsStaked = 0;
    let unitsPnl = 0;
    for (const p of unitBets) {
      unitsStaked += p.stake_units ?? 0;
      const ru =
        p.realized_units != null
          ? p.realized_units
          : realizedUnits(p.outcome, p.stake_units, p.odds) ?? 0;
      unitsPnl += ru;
    }
    const roiPct = unitsStaked > 0 ? (unitsPnl / unitsStaked) * 100 : 0;

    // One unit is always unitPct% of the reference bankroll (unitValue above) —
    // constant by design, so a unit's euro worth, and therefore every bet's euro
    // amount, never drifts as results come in. The euros are the ground truth;
    // only the unit count can change (if you change settings).
    const bankrollPnl = unitsPnl * unitValue;

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
      hasBettingData,
      unitsStaked,
      unitsPnl,
      roiPct,
      unitValue,
      startBankroll: bankroll,
      bankrollPnl,
    };
  }, [predictions, bankroll, unitPct]);
}

/**
 * Pattern Snapshots — deterministic behavioral pattern tracking (zero LLM cost).
 *
 * Computes a snapshot of key trading metrics from a set of trades,
 * then compares two snapshots to detect significant changes over time.
 * Changes are saved as Nova memories so she can say things like
 * "Your FOMO win rate dropped from 45% to 20% this month."
 */

import type { Trade } from "./types";
import {
  calculateEmotionCorrelations,
  calculatePostLossMetrics,
  calculateDispositionRatio,
  calculateConfidenceCalibration,
  calculateDouglasConsistency,
} from "./psychology-correlations";

// ─── Types ──────────────────────────────────────────────────────────────────

export type PatternSnapshot = {
  tradeCount: number;
  winRate: number; // 0-100
  avgProcessScore: number | null;
  emotionWinRates: Record<string, { winRate: number; count: number }>;
  revengeTradeRate: number | null; // percentage
  dispositionRatio: number | null; // losers hold time / winners hold time
  overconfidenceBias: number | null; // avg gap between expected and actual win rate
  processConsistency: number | null; // Douglas consistency score (0-100)
  overtradeRate: number | null; // % of days with >5 trades
  dominantEmotion: string | null;
};

// ─── Compute ────────────────────────────────────────────────────────────────

/**
 * Compute a pattern snapshot from a set of closed trades.
 * Returns null if fewer than 10 trades (insufficient sample).
 */
export function computePatternSnapshot(trades: Trade[]): PatternSnapshot | null {
  const closed = trades.filter((t) => t.close_timestamp && t.pnl !== null);
  if (closed.length < 10) return null;

  const wins = closed.filter((t) => (t.pnl ?? 0) > 0);
  const winRate = Math.round((wins.length / closed.length) * 1000) / 10;

  // Process score average
  const withProcess = closed.filter((t) => t.process_score != null);
  const avgProcessScore =
    withProcess.length >= 5
      ? Math.round((withProcess.reduce((s, t) => s + t.process_score!, 0) / withProcess.length) * 10) / 10
      : null;

  // Emotion win rates (reuse existing function)
  const emotionCorrs = calculateEmotionCorrelations(closed);
  const emotionWinRates: Record<string, { winRate: number; count: number }> = {};
  for (const e of emotionCorrs) {
    if (e.tradeCount >= 3) {
      emotionWinRates[e.value] = { winRate: e.winRate, count: e.tradeCount };
    }
  }

  // Dominant emotion
  const dominantEmotion = emotionCorrs.length > 0 ? emotionCorrs[0].value : null;

  // Revenge trade rate
  const postLoss = calculatePostLossMetrics(closed);
  const revengeTradeRate = postLoss
    ? Math.round((postLoss.revengeTradeCount / closed.length) * 1000) / 10
    : null;

  // Disposition ratio
  const disposition = calculateDispositionRatio(closed);
  const dispositionRatio = disposition?.ratio ?? null;

  // Overconfidence bias (average gap across confidence levels)
  const calibration = calculateConfidenceCalibration(closed);
  const overconfidenceBias =
    calibration.length >= 2
      ? Math.round((calibration.reduce((s, c) => s + Math.abs(c.gap), 0) / calibration.length) * 10) / 10
      : null;

  // Douglas process consistency
  const douglas = calculateDouglasConsistency(closed);
  const processConsistency = douglas?.score ?? null;

  // Overtrade rate: % of trading days with more than 5 trades
  const tradeDays: Record<string, number> = {};
  for (const t of closed) {
    const day = (t.close_timestamp ?? t.open_timestamp).split("T")[0];
    tradeDays[day] = (tradeDays[day] ?? 0) + 1;
  }
  const totalDays = Object.keys(tradeDays).length;
  const overDays = Object.values(tradeDays).filter((c) => c > 5).length;
  const overtradeRate = totalDays >= 3 ? Math.round((overDays / totalDays) * 1000) / 10 : null;

  return {
    tradeCount: closed.length,
    winRate,
    avgProcessScore,
    emotionWinRates,
    revengeTradeRate,
    dispositionRatio,
    overconfidenceBias,
    processConsistency,
    overtradeRate,
    dominantEmotion,
  };
}

// ─── Change Detection ───────────────────────────────────────────────────────

/**
 * Compare two snapshots and return human-readable descriptions of significant changes.
 * Each string becomes a Nova memory with category "snapshot".
 */
export function detectSignificantChanges(
  current: PatternSnapshot,
  previous: PatternSnapshot,
): string[] {
  if (current.tradeCount < 10 || previous.tradeCount < 10) return [];

  const changes: string[] = [];

  // Win rate shift >10%
  const wrDelta = current.winRate - previous.winRate;
  if (Math.abs(wrDelta) > 10) {
    const dir = wrDelta > 0 ? "improved" : "declined";
    changes.push(
      `Overall win rate ${dir} from ${previous.winRate}% to ${current.winRate}% (${current.tradeCount} trades in latest window)`,
    );
  }

  // Process score change >1.0
  if (current.avgProcessScore != null && previous.avgProcessScore != null) {
    const psDelta = current.avgProcessScore - previous.avgProcessScore;
    if (Math.abs(psDelta) > 1.0) {
      const dir = psDelta > 0 ? "improved" : "dropped";
      changes.push(
        `Average process score ${dir} from ${previous.avgProcessScore} to ${current.avgProcessScore}`,
      );
    }
  }

  // Revenge trade rate change >5%
  if (current.revengeTradeRate != null && previous.revengeTradeRate != null) {
    const rtDelta = current.revengeTradeRate - previous.revengeTradeRate;
    if (Math.abs(rtDelta) > 5) {
      const dir = rtDelta > 0 ? "increased" : "decreased";
      changes.push(
        `Revenge trading rate ${dir} from ${previous.revengeTradeRate}% to ${current.revengeTradeRate}%`,
      );
    }
  }

  // Disposition ratio change >0.3
  if (current.dispositionRatio != null && previous.dispositionRatio != null) {
    const drDelta = current.dispositionRatio - previous.dispositionRatio;
    if (Math.abs(drDelta) > 0.3) {
      if (current.dispositionRatio > 1.5) {
        changes.push(
          `Holding losers ${current.dispositionRatio}x longer than winners (was ${previous.dispositionRatio}x) — disposition effect ${drDelta > 0 ? "worsening" : "improving"}`,
        );
      } else {
        changes.push(
          `Disposition ratio improved to ${current.dispositionRatio}x (was ${previous.dispositionRatio}x) — cutting losers faster`,
        );
      }
    }
  }

  // Overconfidence bias change >10%
  if (current.overconfidenceBias != null && previous.overconfidenceBias != null) {
    const ocDelta = current.overconfidenceBias - previous.overconfidenceBias;
    if (Math.abs(ocDelta) > 10) {
      const dir = ocDelta > 0 ? "widened" : "narrowed";
      changes.push(
        `Confidence calibration gap ${dir} from ${previous.overconfidenceBias}% to ${current.overconfidenceBias}%`,
      );
    }
  }

  // Emotion win rate shifts >10% (for emotions with 5+ trades in both)
  for (const [emotion, curr] of Object.entries(current.emotionWinRates)) {
    const prev = previous.emotionWinRates[emotion];
    if (!prev || curr.count < 5 || prev.count < 5) continue;

    const delta = curr.winRate - prev.winRate;
    if (Math.abs(delta) > 10) {
      const dir = delta > 0 ? "improved" : "dropped";
      changes.push(
        `${emotion} win rate ${dir} from ${prev.winRate}% to ${curr.winRate}% across ${curr.count} trades`,
      );
    }
  }

  // Overtrade rate change >10%
  if (current.overtradeRate != null && previous.overtradeRate != null) {
    const otDelta = current.overtradeRate - previous.overtradeRate;
    if (Math.abs(otDelta) > 10) {
      const dir = otDelta > 0 ? "increased" : "decreased";
      changes.push(
        `Overtrading rate ${dir} from ${previous.overtradeRate}% to ${current.overtradeRate}% of trading days`,
      );
    }
  }

  return changes;
}

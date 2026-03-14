/**
 * Pure function: takes OHLC data + phantom trade params
 * Returns whether stop/target would have been hit, which hit first, hypothetical PnL %
 */

type OhlcBar = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  timestamp: number;
};

type PhantomAnalysis = {
  highSince: number;
  highDate: string;
  lowSince: number;
  lowDate: string;
  currentPrice: number;
  targetHit: boolean;
  targetHitDate: string | null;
  stopHit: boolean;
  stopHitDate: string | null;
  firstHit: "target" | "stop" | "neither";
  hypotheticalPnlPct: number;
  daysElapsed: number;
};

export function analyzePhantomTrade(
  ohlc: OhlcBar[],
  entryPrice: number,
  position: "long" | "short",
  stopLoss: number | null,
  profitTarget: number | null,
  observedAt: string,
): PhantomAnalysis {
  // Filter to only bars after the observation date
  const observedDate = observedAt.split("T")[0];
  const relevantBars = ohlc.filter((bar) => bar.date >= observedDate);

  let highSince = -Infinity;
  let highDate = "";
  let lowSince = Infinity;
  let lowDate = "";
  let targetHitDate: string | null = null;
  let stopHitDate: string | null = null;

  for (const bar of relevantBars) {
    if (bar.high > highSince) {
      highSince = bar.high;
      highDate = bar.date;
    }
    if (bar.low < lowSince) {
      lowSince = bar.low;
      lowDate = bar.date;
    }

    // Check target hit
    if (!targetHitDate && profitTarget !== null) {
      if (position === "long" && bar.high >= profitTarget) {
        targetHitDate = bar.date;
      } else if (position === "short" && bar.low <= profitTarget) {
        targetHitDate = bar.date;
      }
    }

    // Check stop hit
    if (!stopHitDate && stopLoss !== null) {
      if (position === "long" && bar.low <= stopLoss) {
        stopHitDate = bar.date;
      } else if (position === "short" && bar.high >= stopLoss) {
        stopHitDate = bar.date;
      }
    }
  }

  const currentPrice = relevantBars.length > 0 ? relevantBars[relevantBars.length - 1].close : entryPrice;

  // Determine which hit first
  let firstHit: "target" | "stop" | "neither" = "neither";
  if (targetHitDate && stopHitDate) {
    firstHit = targetHitDate <= stopHitDate ? "target" : "stop";
  } else if (targetHitDate) {
    firstHit = "target";
  } else if (stopHitDate) {
    firstHit = "stop";
  }

  // Hypothetical PnL % based on what happened
  let hypotheticalPnlPct: number;
  if (firstHit === "target" && profitTarget !== null) {
    hypotheticalPnlPct = position === "long"
      ? ((profitTarget - entryPrice) / entryPrice) * 100
      : ((entryPrice - profitTarget) / entryPrice) * 100;
  } else if (firstHit === "stop" && stopLoss !== null) {
    hypotheticalPnlPct = position === "long"
      ? ((stopLoss - entryPrice) / entryPrice) * 100
      : ((entryPrice - stopLoss) / entryPrice) * 100;
  } else {
    hypotheticalPnlPct = position === "long"
      ? ((currentPrice - entryPrice) / entryPrice) * 100
      : ((entryPrice - currentPrice) / entryPrice) * 100;
  }

  const daysElapsed = relevantBars.length > 0
    ? Math.ceil((Date.now() - new Date(observedAt).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return {
    highSince: highSince === -Infinity ? entryPrice : highSince,
    highDate: highDate || observedDate,
    lowSince: lowSince === Infinity ? entryPrice : lowSince,
    lowDate: lowDate || observedDate,
    currentPrice,
    targetHit: !!targetHitDate,
    targetHitDate,
    stopHit: !!stopHitDate,
    stopHitDate,
    firstHit,
    hypotheticalPnlPct,
    daysElapsed,
  };
}

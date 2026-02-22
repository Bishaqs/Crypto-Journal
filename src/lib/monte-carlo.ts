export type MonteCarloConfig = {
  numSimulations: number;
  numTrades: number;
  startingEquity: number;
  // Advanced options
  ruinThreshold?: number; // 0-1, default 0.5 (50% of starting equity)
  confidenceLevel?: 90 | 95 | 99;
  winRateOverride?: number; // 0-100, if set generates synthetic trades
  avgWinOverride?: number;
  avgLossOverride?: number;
  riskPerTrade?: number; // 0-100 percentage, enables compounding mode
  rewardRiskRatio?: number; // R:R shortcut for what-if mode
};

export type MonteCarloResult = {
  percentiles: {
    p5: number[];
    p10: number[];
    p25: number[];
    p50: number[];
    p75: number[];
    p90: number[];
    p95: number[];
    p99?: number[];
    p1?: number[];
  };
  stats: {
    medianFinalEquity: number;
    worstCase: number;
    bestCase: number;
    probabilityOfProfit: number;
    probabilityOfRuin: number;
    medianMaxDrawdown: number;
    expectedValue: number;
    maxConsecutiveLosses: number;
    confidenceLevel: number;
    ruinThreshold: number;
    kellyPercent: number;
    halfKellyPercent: number;
  };
};

function percentile(sorted: number[], p: number): number {
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

export function runSimulation(
  tradePnls: number[],
  config: MonteCarloConfig
): MonteCarloResult {
  const {
    numSimulations,
    numTrades,
    startingEquity,
    ruinThreshold = 0.5,
    confidenceLevel = 95,
    winRateOverride,
    avgWinOverride,
    avgLossOverride,
    riskPerTrade,
    rewardRiskRatio,
  } = config;

  // Derive avgWin from R:R ratio if provided
  const effectiveAvgWin =
    rewardRiskRatio !== undefined && avgLossOverride !== undefined
      ? avgLossOverride * rewardRiskRatio
      : avgWinOverride;

  // If win rate override is set, generate synthetic P&L pool
  let pnlPool = tradePnls;
  if (
    winRateOverride !== undefined &&
    effectiveAvgWin !== undefined &&
    avgLossOverride !== undefined
  ) {
    pnlPool = generateSyntheticPool(
      winRateOverride / 100,
      effectiveAvgWin,
      avgLossOverride,
      1000
    );
  }

  // Precompute average loss for risk-per-trade mode
  const avgLossForRisk =
    riskPerTrade && riskPerTrade > 0
      ? avgLossOverride ??
        Math.abs(
          pnlPool.filter((p) => p < 0).reduce((s, v) => s + v, 0) /
            Math.max(
              pnlPool.filter((p) => p < 0).length,
              1
            )
        )
      : 0;

  const paths: number[][] = [];
  const finalEquities: number[] = [];
  const maxDrawdowns: number[] = [];
  const maxConsecLosses: number[] = [];
  let ruinCount = 0;

  for (let sim = 0; sim < numSimulations; sim++) {
    const path: number[] = [startingEquity];
    let peak = startingEquity;
    let maxDD = 0;
    let ruined = false;
    let consecLosses = 0;
    let maxConsec = 0;

    for (let t = 0; t < numTrades; t++) {
      const rawPnl = pnlPool[Math.floor(Math.random() * pnlPool.length)];
      const currentEquity = path[path.length - 1];

      let equity: number;
      if (riskPerTrade && riskPerTrade > 0 && avgLossForRisk > 0) {
        // Compounding mode: convert P&L to R-multiples, then apply as % of equity
        const rMultiple = rawPnl / avgLossForRisk;
        const pnlPct = rMultiple * (riskPerTrade / 100);
        equity = Math.max(currentEquity * (1 + pnlPct), 0);
      } else {
        equity = currentEquity + rawPnl;
      }

      path.push(equity);

      if (rawPnl < 0) {
        consecLosses++;
        if (consecLosses > maxConsec) maxConsec = consecLosses;
      } else {
        consecLosses = 0;
      }

      if (equity > peak) peak = equity;
      const dd = peak > 0 ? ((peak - equity) / peak) * 100 : 0;
      if (dd > maxDD) maxDD = dd;
      if (equity <= startingEquity * ruinThreshold) ruined = true;
    }

    paths.push(path);
    finalEquities.push(path[path.length - 1]);
    maxDrawdowns.push(maxDD);
    maxConsecLosses.push(maxConsec);
    if (ruined) ruinCount++;
  }

  const percentiles = calculatePercentileBands(
    paths,
    numTrades + 1,
    confidenceLevel
  );

  const sortedFinals = [...finalEquities].sort((a, b) => a - b);
  const sortedDD = [...maxDrawdowns].sort((a, b) => a - b);
  const sortedConsec = [...maxConsecLosses].sort((a, b) => a - b);

  const profitCount = finalEquities.filter((e) => e > startingEquity).length;
  const ev =
    pnlPool.length > 0
      ? pnlPool.reduce((s, v) => s + v, 0) / pnlPool.length
      : 0;

  // Kelly Criterion: K% = (W * R - L) / R
  const wins = pnlPool.filter((p) => p > 0);
  const losses = pnlPool.filter((p) => p < 0);
  const winRate = pnlPool.length > 0 ? wins.length / pnlPool.length : 0;
  const avgWin =
    wins.length > 0 ? wins.reduce((s, v) => s + v, 0) / wins.length : 0;
  const avgLoss =
    losses.length > 0
      ? Math.abs(losses.reduce((s, v) => s + v, 0) / losses.length)
      : 1;
  const R = avgLoss > 0 ? avgWin / avgLoss : 0;
  const kellyPercent = R > 0 ? ((winRate * R - (1 - winRate)) / R) * 100 : 0;

  return {
    percentiles,
    stats: {
      medianFinalEquity: percentile(sortedFinals, 50),
      worstCase: percentile(sortedFinals, (100 - confidenceLevel) / 2),
      bestCase: percentile(sortedFinals, 100 - (100 - confidenceLevel) / 2),
      probabilityOfProfit: (profitCount / numSimulations) * 100,
      probabilityOfRuin: (ruinCount / numSimulations) * 100,
      medianMaxDrawdown: percentile(sortedDD, 50),
      expectedValue: ev,
      maxConsecutiveLosses: percentile(sortedConsec, 50),
      confidenceLevel,
      ruinThreshold,
      kellyPercent: Math.max(kellyPercent, 0),
      halfKellyPercent: Math.max(kellyPercent / 2, 0),
    },
  };
}

function generateSyntheticPool(
  winRate: number,
  avgWin: number,
  avgLoss: number,
  size: number
): number[] {
  const pool: number[] = [];
  for (let i = 0; i < size; i++) {
    const isWin = Math.random() < winRate;
    const variance = 0.7 + Math.random() * 0.6;
    pool.push(isWin ? avgWin * variance : -(avgLoss * variance));
  }
  return pool;
}

function calculatePercentileBands(
  paths: number[][],
  length: number,
  confidenceLevel: number
): MonteCarloResult["percentiles"] {
  const p1: number[] = [];
  const p5: number[] = [];
  const p10: number[] = [];
  const p25: number[] = [];
  const p50: number[] = [];
  const p75: number[] = [];
  const p90: number[] = [];
  const p95: number[] = [];
  const p99: number[] = [];

  for (let step = 0; step < length; step++) {
    const values = paths.map((path) => path[step]).sort((a, b) => a - b);
    p1.push(percentile(values, 1));
    p5.push(percentile(values, 5));
    p10.push(percentile(values, 10));
    p25.push(percentile(values, 25));
    p50.push(percentile(values, 50));
    p75.push(percentile(values, 75));
    p90.push(percentile(values, 90));
    p95.push(percentile(values, 95));
    p99.push(percentile(values, 99));
  }

  return confidenceLevel === 99
    ? { p1, p5, p10, p25, p50, p75, p90, p95, p99 }
    : { p5, p10, p25, p50, p75, p90, p95 };
}

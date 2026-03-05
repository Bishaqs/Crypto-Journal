import type {
  OHLCBar,
  Formula,
  CrossedFormula,
  ValueFormula,
  BacktestResult,
  BacktestTrade,
  BacktestParams,
  IndicatorName,
} from "./backtester-types";

// ==========================================
// INDICATOR CALCULATIONS
// ==========================================

export function calculateSMA(prices: number[], period: number): (number | null)[] {
  return prices.map((_, i) => {
    if (i < period - 1) return null;
    const slice = prices.slice(i - period + 1, i + 1);
    return slice.reduce((s, v) => s + v, 0) / period;
  });
}

export function calculateEMA(prices: number[], period: number): (number | null)[] {
  const multiplier = 2 / (period + 1);
  const result: (number | null)[] = new Array(prices.length).fill(null);
  if (prices.length < period) return result;
  let sum = 0;
  for (let i = 0; i < period; i++) sum += prices[i];
  result[period - 1] = sum / period;
  for (let i = period; i < prices.length; i++) {
    result[i] = (prices[i] - (result[i - 1] as number)) * multiplier + (result[i - 1] as number);
  }
  return result;
}

export function calculateRSI(prices: number[], period: number = 14): (number | null)[] {
  const result: (number | null)[] = new Array(prices.length).fill(null);
  if (prices.length < period + 1) return result;

  const changes = prices.map((p, i) => (i === 0 ? 0 : p - prices[i - 1]));
  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 1; i <= period; i++) {
    if (changes[i] > 0) avgGain += changes[i];
    else avgLoss += Math.abs(changes[i]);
  }
  avgGain /= period;
  avgLoss /= period;

  result[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

  for (let i = period + 1; i < prices.length; i++) {
    const change = changes[i];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    result[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }

  return result;
}

export function calculateMACD(
  prices: number[],
  fastPeriod: number,
  slowPeriod: number,
  signalPeriod: number,
): { macd: (number | null)[]; signal: (number | null)[]; histogram: (number | null)[] } {
  const fastEMA = calculateEMA(prices, fastPeriod);
  const slowEMA = calculateEMA(prices, slowPeriod);

  const macdLine: (number | null)[] = prices.map((_, i) => {
    if (fastEMA[i] === null || slowEMA[i] === null) return null;
    return (fastEMA[i] as number) - (slowEMA[i] as number);
  });

  // Signal line = EMA of MACD line (skip nulls)
  const macdValues: number[] = [];
  const macdIndices: number[] = [];
  for (let i = 0; i < macdLine.length; i++) {
    if (macdLine[i] !== null) {
      macdValues.push(macdLine[i] as number);
      macdIndices.push(i);
    }
  }

  const signalEMA = calculateEMA(macdValues, signalPeriod);
  const signal: (number | null)[] = new Array(prices.length).fill(null);
  const histogram: (number | null)[] = new Array(prices.length).fill(null);

  for (let j = 0; j < signalEMA.length; j++) {
    const idx = macdIndices[j];
    if (signalEMA[j] !== null) {
      signal[idx] = signalEMA[j];
      histogram[idx] = (macdLine[idx] as number) - (signalEMA[j] as number);
    }
  }

  return { macd: macdLine, signal, histogram };
}

// ==========================================
// INDICATOR SERIES RESOLVER
// ==========================================

type IndicatorCache = Map<string, (number | null)[]>;

function cacheKey(indicator: IndicatorName, params: number[]): string {
  return `${indicator}_${params.join("_")}`;
}

function getIndicatorSeries(
  prices: number[],
  indicator: IndicatorName,
  params: number[],
  cache: IndicatorCache,
): (number | null)[] {
  if (indicator === "PRICE") return prices.map((p) => p);

  const key = cacheKey(indicator, params);
  const cached = cache.get(key);
  if (cached) return cached;

  let series: (number | null)[];
  switch (indicator) {
    case "SMA":
      series = calculateSMA(prices, params[0]);
      break;
    case "EMA":
      series = calculateEMA(prices, params[0]);
      break;
    case "RSI":
      series = calculateRSI(prices, params[0]);
      break;
    case "MACD":
      series = calculateMACD(prices, params[0], params[1], params[2]).macd;
      break;
    case "MACD_SIGNAL":
      series = calculateMACD(prices, params[0], params[1], params[2]).signal;
      break;
    default:
      series = new Array(prices.length).fill(null);
  }

  cache.set(key, series);
  return series;
}

// ==========================================
// FORMULA PARSER
// ==========================================

function parseIndicatorToken(
  token: string,
): { indicator: IndicatorName; params: number[] } | "PRICE" | null {
  const trimmed = token.trim();
  if (trimmed.toUpperCase() === "PRICE") return "PRICE";

  // Match: SMA(10), EMA(25), RSI(14), MACD(12,26,9), MACD_SIGNAL(12,26,9)
  const m = trimmed.match(/^([A-Z_]+)\(([^)]+)\)$/i);
  if (!m) return null;

  const name = m[1].toUpperCase() as IndicatorName;
  const validNames: IndicatorName[] = ["RSI", "SMA", "EMA", "MACD", "MACD_SIGNAL"];
  if (!validNames.includes(name)) return null;

  const params = m[2].split(",").map((s) => Number(s.trim()));
  if (params.some(isNaN)) return null;

  // Validate param counts
  if ((name === "SMA" || name === "EMA" || name === "RSI") && params.length !== 1) return null;
  if ((name === "MACD" || name === "MACD_SIGNAL") && params.length !== 3) return null;

  return { indicator: name, params };
}

function extractKeyValue(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  // Split on commas that are NOT inside parentheses
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const ch of content) {
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    else if (ch === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  if (current.trim()) parts.push(current.trim());

  for (const part of parts) {
    const eqIdx = part.indexOf("=");
    if (eqIdx > 0) {
      const key = part.slice(0, eqIdx).trim().toLowerCase();
      const val = part.slice(eqIdx + 1).trim();
      result[key] = val;
    }
  }
  return result;
}

export function parseFormula(raw: string): Formula | null {
  const trimmed = raw.trim().replace(/^\[/, "").replace(/\]$/, "").trim();
  if (!trimmed) return null;

  // Match CROSSED(...) or VALUE(...)
  const funcMatch = trimmed.match(/^(CROSSED|VALUE)\((.+)\)$/i);
  if (!funcMatch) return null;

  const funcName = funcMatch[1].toUpperCase();
  const kv = extractKeyValue(funcMatch[2]);

  if (funcName === "CROSSED") {
    const input1Raw = kv["input_col"];
    const input2Raw = kv["input_col2"];
    const dir = kv["direction"]?.toLowerCase();
    if (!input1Raw || !input2Raw || (dir !== "above" && dir !== "below")) return null;

    const input1 = parseIndicatorToken(input1Raw);
    const input2 = parseIndicatorToken(input2Raw);
    if (!input1 || !input2) return null;

    return { type: "CROSSED", input1, input2, direction: dir } as CrossedFormula;
  }

  if (funcName === "VALUE") {
    const inputRaw = kv["input_col"];
    const dir = kv["direction"]?.toLowerCase();
    const valStr = kv["value"];
    if (!inputRaw || (dir !== "above" && dir !== "below") || !valStr) return null;

    const input = parseIndicatorToken(inputRaw);
    if (!input || input === "PRICE") return null;

    const value = Number(valStr);
    if (isNaN(value)) return null;

    return { type: "VALUE", input, direction: dir, value } as ValueFormula;
  }

  return null;
}

// ==========================================
// SIGNAL EVALUATION
// ==========================================

function getSeries(
  input: { indicator: IndicatorName; params: number[] } | "PRICE",
  prices: number[],
  cache: IndicatorCache,
): (number | null)[] {
  if (input === "PRICE") return prices.map((p) => p);
  return getIndicatorSeries(prices, input.indicator, input.params, cache);
}

function evaluateFormula(
  formula: Formula,
  prices: number[],
  index: number,
  cache: IndicatorCache,
): boolean {
  if (formula.type === "CROSSED") {
    const s1 = getSeries(formula.input1, prices, cache);
    const s2 = getSeries(formula.input2, prices, cache);
    const curr1 = s1[index];
    const curr2 = s2[index];
    const prev1 = index > 0 ? s1[index - 1] : null;
    const prev2 = index > 0 ? s2[index - 1] : null;
    if (curr1 === null || curr2 === null || prev1 === null || prev2 === null) return false;

    if (formula.direction === "above") {
      return prev1 <= prev2 && curr1 > curr2;
    } else {
      return prev1 >= prev2 && curr1 < curr2;
    }
  }

  if (formula.type === "VALUE") {
    const s = getIndicatorSeries(prices, formula.input.indicator, formula.input.params, cache);
    const curr = s[index];
    if (curr === null) return false;

    if (formula.direction === "above") return curr > formula.value;
    return curr < formula.value;
  }

  return false;
}

// ==========================================
// DEMO DATA GENERATOR
// ==========================================

export function generateDemoOHLC(days: number, startPrice: number = 100): OHLCBar[] {
  const bars: OHLCBar[] = [];
  let price = startPrice;
  const now = Date.now();
  const dayMs = 86400000;

  for (let i = 0; i < days; i++) {
    const change = (Math.random() - 0.48) * price * 0.03; // slight upward bias, 3% daily vol
    const open = price;
    const close = Math.max(price + change, price * 0.5);
    const high = Math.max(open, close) * (1 + Math.random() * 0.015);
    const low = Math.min(open, close) * (1 - Math.random() * 0.015);
    const ts = now - (days - i) * dayMs;
    const date = new Date(ts).toISOString().split("T")[0];

    bars.push({ date, open, high, low, close, timestamp: ts });
    price = close;
  }

  return bars;
}

// ==========================================
// BACKTEST RUNNER
// ==========================================

export function runBacktest(
  ohlcData: OHLCBar[],
  params: BacktestParams,
): BacktestResult | { error: string } {
  const entryFormula = parseFormula(params.entryFormula);
  const exitFormula = parseFormula(params.exitFormula);

  if (!entryFormula) return { error: "Invalid entry formula. Check syntax and try again." };
  if (!exitFormula) return { error: "Invalid exit formula. Check syntax and try again." };

  if (ohlcData.length < 30) return { error: "Insufficient data. Need at least 30 bars." };

  const prices = ohlcData.map((b) => b.close);
  const cache: IndicatorCache = new Map();

  const equityCurve: { date: string; equity: number }[] = [];
  const trades: BacktestTrade[] = [];

  let equity = params.startingEquity;
  let inPosition = false;
  let positionDirection: "long" | "short" = "long";
  let entryPrice = 0;
  let entryDate = "";
  let signalPending = false;
  let pendingDirection: "long" | "short" = "long";

  let peak = params.startingEquity;
  let maxDrawdown = 0;
  const dailyEquities: number[] = [];

  for (let i = 1; i < prices.length; i++) {
    // Check for pending entry from "entry on next bar" mode
    if (signalPending && !inPosition) {
      inPosition = true;
      entryPrice = prices[i]; // enter at this bar's close (approximation of next bar open)
      entryDate = ohlcData[i].date;
      positionDirection = pendingDirection;
      signalPending = false;
    }

    // Check exit signal
    if (inPosition && evaluateFormula(exitFormula, prices, i, cache)) {
      const exitPrice = prices[i];
      const rawPnlPct =
        positionDirection === "long"
          ? (exitPrice - entryPrice) / entryPrice
          : (entryPrice - exitPrice) / entryPrice;
      const commissionCost = equity * params.commission * 2; // entry + exit
      const pnl = equity * rawPnlPct - commissionCost;
      equity += pnl;

      trades.push({
        entryDate,
        exitDate: ohlcData[i].date,
        direction: positionDirection,
        entryPrice,
        exitPrice,
        pnl,
        pnlPct: rawPnlPct * 100,
        commission: commissionCost,
        cumulativeEquity: equity,
      });

      inPosition = false;

      // In "both" mode, immediately open opposite position
      if (params.direction === "both") {
        if (params.entryOnNextBar) {
          signalPending = true;
          pendingDirection = positionDirection === "long" ? "short" : "long";
        } else {
          inPosition = true;
          entryPrice = prices[i];
          entryDate = ohlcData[i].date;
          positionDirection = positionDirection === "long" ? "short" : "long";
        }
      }
    }

    // Check entry signal (only if not already in position)
    if (!inPosition && !signalPending && evaluateFormula(entryFormula, prices, i, cache)) {
      const dir: "long" | "short" =
        params.direction === "short" ? "short" : "long";

      if (params.entryOnNextBar) {
        signalPending = true;
        pendingDirection = dir;
      } else {
        inPosition = true;
        entryPrice = prices[i];
        entryDate = ohlcData[i].date;
        positionDirection = dir;
      }
    }

    // Track equity curve
    let currentEquity = equity;
    if (inPosition) {
      const unrealizedPct =
        positionDirection === "long"
          ? (prices[i] - entryPrice) / entryPrice
          : (entryPrice - prices[i]) / entryPrice;
      currentEquity = equity + equity * unrealizedPct;
    }
    equityCurve.push({ date: ohlcData[i].date, equity: currentEquity });
    dailyEquities.push(currentEquity);

    if (currentEquity > peak) peak = currentEquity;
    const dd = (peak - currentEquity) / peak;
    if (dd > maxDrawdown) maxDrawdown = dd;
  }

  // Close any open position at end
  if (inPosition) {
    const lastPrice = prices[prices.length - 1];
    const rawPnlPct =
      positionDirection === "long"
        ? (lastPrice - entryPrice) / entryPrice
        : (entryPrice - lastPrice) / entryPrice;
    const commissionCost = equity * params.commission * 2;
    const pnl = equity * rawPnlPct - commissionCost;
    equity += pnl;

    trades.push({
      entryDate,
      exitDate: ohlcData[ohlcData.length - 1].date,
      direction: positionDirection,
      entryPrice,
      exitPrice: lastPrice,
      pnl,
      pnlPct: rawPnlPct * 100,
      commission: commissionCost,
      cumulativeEquity: equity,
    });

    // Update last equity point
    if (equityCurve.length > 0) {
      equityCurve[equityCurve.length - 1].equity = equity;
    }
  }

  // Build drawdown curve
  let ddPeak = params.startingEquity;
  const drawdownCurve = equityCurve.map((pt) => {
    if (pt.equity > ddPeak) ddPeak = pt.equity;
    const dd = ddPeak > 0 ? ((ddPeak - pt.equity) / ddPeak) * -100 : 0;
    return { date: pt.date, drawdown: dd };
  });

  // Calculate stats
  const wins = trades.filter((t) => t.pnl > 0).length;
  const losses = trades.filter((t) => t.pnl <= 0).length;
  const numTrades = trades.length;
  const winRate = numTrades > 0 ? (wins / numTrades) * 100 : 0;
  const totalReturn = ((equity - params.startingEquity) / params.startingEquity) * 100;

  const winningPnls = trades.filter((t) => t.pnl > 0).map((t) => t.pnl);
  const losingPnls = trades.filter((t) => t.pnl <= 0).map((t) => t.pnl);
  const avgWin = winningPnls.length > 0 ? winningPnls.reduce((a, b) => a + b, 0) / winningPnls.length : 0;
  const avgLoss = losingPnls.length > 0 ? Math.abs(losingPnls.reduce((a, b) => a + b, 0) / losingPnls.length) : 0;
  const grossProfit = winningPnls.reduce((a, b) => a + b, 0);
  const grossLoss = Math.abs(losingPnls.reduce((a, b) => a + b, 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

  // Sharpe ratio (annualized)
  const dailyReturns: number[] = [];
  for (let i = 1; i < dailyEquities.length; i++) {
    if (dailyEquities[i - 1] > 0) {
      dailyReturns.push((dailyEquities[i] - dailyEquities[i - 1]) / dailyEquities[i - 1]);
    }
  }
  const meanReturn = dailyReturns.length > 0 ? dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length : 0;
  const stdReturn =
    dailyReturns.length > 1
      ? Math.sqrt(dailyReturns.reduce((sum, r) => sum + (r - meanReturn) ** 2, 0) / (dailyReturns.length - 1))
      : 0;
  const sharpeRatio = stdReturn > 0 ? (meanReturn / stdReturn) * Math.sqrt(252) : 0;

  return {
    equityCurve,
    drawdownCurve,
    trades,
    totalReturn,
    winRate,
    maxDrawdown: maxDrawdown * 100,
    numTrades,
    wins,
    losses,
    sharpeRatio,
    profitFactor: profitFactor === Infinity ? 999 : profitFactor,
    avgWin,
    avgLoss,
  };
}

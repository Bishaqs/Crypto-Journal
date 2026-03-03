// === OHLC Data (matches /api/market/historical response) ===
export interface OHLCBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  timestamp: number;
}

// === Indicators ===
export type IndicatorName = "RSI" | "SMA" | "EMA" | "MACD" | "MACD_SIGNAL" | "PRICE";

// === Formula AST ===
export interface CrossedFormula {
  type: "CROSSED";
  input1: { indicator: IndicatorName; params: number[] } | "PRICE";
  input2: { indicator: IndicatorName; params: number[] } | "PRICE";
  direction: "above" | "below";
}

export interface ValueFormula {
  type: "VALUE";
  input: { indicator: IndicatorName; params: number[] };
  direction: "above" | "below";
  value: number;
}

export type Formula = CrossedFormula | ValueFormula;

// === Direction ===
export type TradeDirection = "long" | "short" | "both";

// === Backtest Parameters ===
export interface BacktestParams {
  symbol: string;
  days: number;
  startingEquity: number;
  commission: number; // decimal, e.g. 0.001 = 0.1%
  direction: TradeDirection;
  entryOnNextBar: boolean;
  entryFormula: string;
  exitFormula: string;
}

// === Individual Trade Record ===
export interface BacktestTrade {
  entryDate: string;
  exitDate: string;
  direction: "long" | "short";
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  pnlPct: number;
  commission: number;
  cumulativeEquity: number;
}

// === Backtest Results ===
export interface BacktestResult {
  equityCurve: { date: string; equity: number }[];
  drawdownCurve: { date: string; drawdown: number }[];
  trades: BacktestTrade[];
  totalReturn: number;
  winRate: number;
  maxDrawdown: number;
  numTrades: number;
  wins: number;
  losses: number;
  sharpeRatio: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
}

// === Timeframe (cosmetic for CoinGecko daily data) ===
export type Timeframe = "15m" | "1h" | "4h" | "1d";

export const TIMEFRAME_OPTIONS: { value: Timeframe; label: string }[] = [
  { value: "15m", label: "15 Minute" },
  { value: "1h", label: "1 Hour" },
  { value: "4h", label: "4 Hour" },
  { value: "1d", label: "Daily" },
];

// === Formula Presets ===
export interface FormulaPreset {
  label: string;
  description: string;
  entry: string;
  exit: string;
}

export const FORMULA_PRESETS: FormulaPreset[] = [
  {
    label: "RSI Oversold / Overbought",
    description: "Buy when RSI drops below 30, sell when above 70",
    entry: "VALUE(input_col=RSI(14), direction=below, value=30)",
    exit: "VALUE(input_col=RSI(14), direction=above, value=70)",
  },
  {
    label: "Golden Cross",
    description: "Buy when SMA(50) crosses above SMA(200)",
    entry: "CROSSED(input_col=SMA(50), input_col2=SMA(200), direction=above)",
    exit: "CROSSED(input_col=SMA(50), input_col2=SMA(200), direction=below)",
  },
  {
    label: "EMA Crossover",
    description: "Buy when EMA(10) crosses above EMA(25)",
    entry: "CROSSED(input_col=EMA(10), input_col2=EMA(25), direction=above)",
    exit: "CROSSED(input_col=EMA(10), input_col2=EMA(25), direction=below)",
  },
  {
    label: "Price Breaks SMA",
    description: "Buy when price crosses above SMA(20)",
    entry: "CROSSED(input_col=PRICE, input_col2=SMA(20), direction=above)",
    exit: "CROSSED(input_col=PRICE, input_col2=SMA(20), direction=below)",
  },
  {
    label: "MACD Signal Cross",
    description: "Buy when MACD crosses above signal line",
    entry: "CROSSED(input_col=MACD(12,26,9), input_col2=MACD_SIGNAL(12,26,9), direction=above)",
    exit: "CROSSED(input_col=MACD(12,26,9), input_col2=MACD_SIGNAL(12,26,9), direction=below)",
  },
];

// === Symbol Groups ===
export { CRYPTO_SYMBOL_GROUPS as SYMBOL_GROUPS } from "@/lib/coin-registry";

// === About / Reference Text ===
export const ABOUT_TEXT = `Enter conditions using formula syntax. Click a preset to auto-fill both fields.

CROSSED — Two indicators crossing each other:
  CROSSED(input_col=SMA(10), input_col2=EMA(25), direction=above)
  CROSSED(input_col=PRICE, input_col2=SMA(20), direction=below)

VALUE — Indicator crossing a fixed threshold:
  VALUE(input_col=RSI(14), direction=above, value=70)
  VALUE(input_col=RSI(14), direction=below, value=30)

Supported Indicators:
  SMA(period)  — Simple Moving Average
  EMA(period)  — Exponential Moving Average
  RSI(period)  — Relative Strength Index
  MACD(fast,slow,signal)  — MACD Line
  MACD_SIGNAL(fast,slow,signal)  — MACD Signal Line
  PRICE  — Raw close price`;

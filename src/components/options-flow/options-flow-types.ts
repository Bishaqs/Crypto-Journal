export interface OptionsFlowRow {
  symbol: string;
  expiry: string;
  strike: number;
  type: "C" | "P";
  volume: number;
  openInterest: number;
  premium: number;
  sentiment: "bullish" | "bearish" | "neutral";
  time: string;
  sector: string;
  rawTimestamp: number;
}

export interface SymbolSummary {
  symbol: string;
  sector: string;
  totalFlows: number;
  totalPremium: number;
  avgPremium: number;
  bullishPct: number;
  bearishPct: number;
  callPutRatio: number;
}

export interface FlowSummary {
  totalFlows: number;
  totalPremium: number;
  callVolume: number;
  putVolume: number;
  callPremium: number;
  putPremium: number;
  putCallRatio: number;
  sentiment: { bullish: number; bearish: number; neutral: number };
}

export type OptionsFlowTab = "table" | "market-summary" | "symbol-summary";

export const TAB_OPTIONS: { value: OptionsFlowTab; label: string }[] = [
  { value: "table", label: "Options Flow" },
  { value: "market-summary", label: "Market Summary" },
  { value: "symbol-summary", label: "Symbol Summary" },
];

export type SentimentFilter = "all" | "bullish" | "bearish" | "neutral";
export type TypeFilter = "all" | "call" | "put";
export type PremiumFilter = "all" | "large" | "medium" | "small";
export type SortKey = "time" | "symbol" | "expiry" | "strike" | "type" | "volume" | "openInterest" | "premium" | "sentiment";
export type SortDir = "asc" | "desc";

export const SYMBOL_GROUPS: Record<string, string[]> = {
  "Index ETFs": ["SPY", "QQQ", "IWM", "DIA", "XLF"],
  "Mega Cap": ["AAPL", "MSFT", "AMZN", "GOOGL", "META"],
  Momentum: ["TSLA", "NVDA", "AMD", "COIN", "PLTR"],
  Semis: ["SMCI", "ARM", "AVGO", "MU", "INTC"],
};

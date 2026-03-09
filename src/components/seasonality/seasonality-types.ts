export interface MonthlyReturn {
  month: string;
  avgReturn: number;
  medianReturn: number;
  winRate: number;
  sampleSize: number;
  maxReturn: number;
  minReturn: number;
}

export interface DayOfWeekReturn {
  day: string;
  avgReturn: number;
  medianReturn: number;
  winRate: number;
  sampleSize: number;
}

export interface MonthlyByYear {
  year: number;
  months: { month: string; returnPct: number; sampleSize: number }[];
}

export interface YearlyPriceNormalized {
  year: number;
  data: { dayOfYear: number; normalizedPrice: number }[];
  ytdReturn: number;
}

export interface SeasonalityData {
  monthly: MonthlyReturn[];
  weekday: DayOfWeekReturn[];
  monthlyByYear: MonthlyByYear[];
  yearlyPriceNormalized: YearlyPriceNormalized[];
}

export type SeasonalityTab = "monthly" | "weekday" | "heatmap" | "comparison";

export type LookbackPeriod = "1Y" | "2Y" | "3Y" | "5Y" | "MAX";

export const LOOKBACK_DAYS: Record<LookbackPeriod, number> = {
  "1Y": 365,
  "2Y": 730,
  "3Y": 1095,
  "5Y": 1825,
  "MAX": 0, // 0 signals "max" to the API / CoinGecko
};

export { CRYPTO_SYMBOL_GROUPS as SYMBOL_GROUPS } from "@/lib/coin-registry";

export const TAB_OPTIONS: { value: SeasonalityTab; label: string }[] = [
  { value: "monthly", label: "Monthly Returns" },
  { value: "weekday", label: "Day of Week" },
  { value: "heatmap", label: "Heatmap" },
  { value: "comparison", label: "Year Comparison" },
];

import type {
  SeasonalityData,
  MonthlyReturn,
  DayOfWeekReturn,
  MonthlyByYear,
  YearlyPriceNormalized,
} from "./seasonality-types";

export function formatReturn(value: number, decimals = 2): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
}

export function getHeatmapColor(value: number, min: number, max: number): string {
  if (value === 0 && min === 0 && max === 0) return "rgba(128, 128, 128, 0.1)";
  const absMax = Math.max(Math.abs(min), Math.abs(max), 0.01);
  const normalized = value / absMax;
  if (normalized >= 0) {
    const intensity = Math.min(normalized, 1);
    return `rgba(34, 197, 94, ${0.08 + intensity * 0.62})`;
  } else {
    const intensity = Math.min(Math.abs(normalized), 1);
    return `rgba(239, 68, 68, ${0.08 + intensity * 0.62})`;
  }
}

export function mapApiResponse(json: Record<string, unknown>): SeasonalityData {
  const monthlyDetailed = json.monthlyDetailed as MonthlyReturn[] | undefined;
  const weekdayDetailed = json.weekdayDetailed as DayOfWeekReturn[] | undefined;
  const monthlyByYear = json.monthlyByYear as MonthlyByYear[] | undefined;
  const yearlyPriceNormalized = json.yearlyPriceNormalized as YearlyPriceNormalized[] | undefined;

  // Fallback for old API responses without enhanced fields
  const monthly: MonthlyReturn[] = monthlyDetailed ??
    ((json.monthly as { month: string; avgReturn: number; sampleSize: number }[]) ?? []).map((m) => ({
      month: m.month,
      avgReturn: m.avgReturn,
      medianReturn: m.avgReturn,
      winRate: 0,
      sampleSize: m.sampleSize,
      maxReturn: m.avgReturn,
      minReturn: m.avgReturn,
    }));

  const weekday: DayOfWeekReturn[] = weekdayDetailed ??
    ((json.weekday as { day: string; avgReturn: number; sampleSize: number }[]) ?? []).map((d) => ({
      day: d.day,
      avgReturn: d.avgReturn,
      medianReturn: d.avgReturn,
      winRate: 0,
      sampleSize: d.sampleSize,
    }));

  return {
    monthly,
    weekday,
    monthlyByYear: monthlyByYear ?? [],
    yearlyPriceNormalized: yearlyPriceNormalized ?? [],
  };
}

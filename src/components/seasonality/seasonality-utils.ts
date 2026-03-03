import type {
  SeasonalityData,
  MonthlyReturn,
  DayOfWeekReturn,
  MonthlyByYear,
  YearlyPriceNormalized,
} from "./seasonality-types";
import { resolveCoinGeckoId } from "@/lib/coin-registry";

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

// ── Client-side direct CoinGecko fallback ──────────────────────

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function avg(arr: number[]): number {
  return arr.length > 0 ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;
}
function median(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}
function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

export async function fetchSeasonalityDirect(symbol: string, days: number): Promise<SeasonalityData> {
  const coinId = resolveCoinGeckoId(symbol);
  const clampedDays = Math.min(Math.max(days, 30), 365);

  const res = await fetch(
    `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${clampedDays}`
  );
  if (!res.ok) throw new Error(`CoinGecko returned ${res.status}`);

  const data = await res.json();
  const prices: [number, number][] = data.prices ?? [];
  if (prices.length < 2) throw new Error("Not enough price data");

  // Daily returns
  const dailyReturns: { date: Date; returnPct: number }[] = [];
  for (let i = 1; i < prices.length; i++) {
    const prev = prices[i - 1][1];
    const cur = prices[i][1];
    if (prev > 0) {
      dailyReturns.push({ date: new Date(prices[i][0]), returnPct: ((cur - prev) / prev) * 100 });
    }
  }

  // Monthly buckets
  const monthlyBuckets: Record<number, number[]> = {};
  for (let m = 0; m < 12; m++) monthlyBuckets[m] = [];
  for (const { date, returnPct } of dailyReturns) monthlyBuckets[date.getUTCMonth()].push(returnPct);

  // Weekday buckets
  const weekdayBuckets: Record<number, number[]> = {};
  for (let d = 0; d < 7; d++) weekdayBuckets[d] = [];
  for (const { date, returnPct } of dailyReturns) weekdayBuckets[date.getUTCDay()].push(returnPct);

  // Monthly by year (heatmap)
  const yearMonthBuckets: Record<string, number[]> = {};
  for (const { date, returnPct } of dailyReturns) {
    const key = `${date.getUTCFullYear()}-${date.getUTCMonth()}`;
    (yearMonthBuckets[key] ??= []).push(returnPct);
  }
  const years = Array.from(new Set(dailyReturns.map((d) => d.date.getUTCFullYear()))).sort();

  const monthlyByYear: MonthlyByYear[] = years.map((year) => ({
    year,
    months: MONTH_NAMES.map((month, i) => {
      const bucket = yearMonthBuckets[`${year}-${i}`] ?? [];
      return { month, returnPct: round3(bucket.reduce((s, r) => s + r, 0)), sampleSize: bucket.length };
    }),
  }));

  // Detailed monthly
  const monthly: MonthlyReturn[] = MONTH_NAMES.map((month, i) => {
    const bucket = monthlyBuckets[i];
    const yearlyReturns = monthlyByYear.map((y) => y.months[i]).filter((m) => m.sampleSize > 0).map((m) => m.returnPct);
    return {
      month,
      avgReturn: round3(avg(bucket)),
      medianReturn: round3(median(bucket)),
      winRate: bucket.length > 0 ? Math.round((bucket.filter((r) => r > 0).length / bucket.length) * 1000) / 10 : 0,
      sampleSize: bucket.length,
      maxReturn: yearlyReturns.length > 0 ? round3(Math.max(...yearlyReturns)) : 0,
      minReturn: yearlyReturns.length > 0 ? round3(Math.min(...yearlyReturns)) : 0,
    };
  });

  // Detailed weekday
  const weekday: DayOfWeekReturn[] = DAY_NAMES.map((day, i) => {
    const bucket = weekdayBuckets[i];
    return {
      day,
      avgReturn: round3(avg(bucket)),
      medianReturn: round3(median(bucket)),
      winRate: bucket.length > 0 ? Math.round((bucket.filter((r) => r > 0).length / bucket.length) * 1000) / 10 : 0,
      sampleSize: bucket.length,
    };
  });

  // Yearly price normalized
  const pricesByYear: Record<number, [number, number][]> = {};
  for (const [ts, price] of prices) {
    const year = new Date(ts).getUTCFullYear();
    (pricesByYear[year] ??= []).push([ts, price]);
  }

  const yearlyPriceNormalized: YearlyPriceNormalized[] = Object.entries(pricesByYear)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([yearStr, yearPrices]) => {
      const year = Number(yearStr);
      const firstPrice = yearPrices[0][1];
      const startOfYear = Date.UTC(year, 0, 1);
      return {
        year,
        data: yearPrices.map(([ts, price]) => ({
          dayOfYear: Math.floor((ts - startOfYear) / 86400000) + 1,
          normalizedPrice: Math.round((price / firstPrice) * 10000) / 100,
        })),
        ytdReturn: Math.round(((yearPrices[yearPrices.length - 1][1] - firstPrice) / firstPrice) * 10000) / 100,
      };
    });

  return { monthly, weekday, monthlyByYear, yearlyPriceNormalized };
}

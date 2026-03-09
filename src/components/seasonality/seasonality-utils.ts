import type {
  SeasonalityData,
  MonthlyReturn,
  DayOfWeekReturn,
  MonthlyByYear,
  YearlyPriceNormalized,
} from "./seasonality-types";
import { resolveCoinGeckoId } from "@/lib/coin-registry";

// ── Sine curve fitting via Fourier coefficients ───────────────────

export interface SineFitResult {
  amplitude: number;
  phase: number;
  offset: number;
  fittedValues: number[]; // 12 values for Jan-Dec
  r2: number; // R-squared goodness of fit
}

export function fitSineCurve(monthlyReturns: number[]): SineFitResult {
  const n = monthlyReturns.length; // should be 12
  if (n === 0) return { amplitude: 0, phase: 0, offset: 0, fittedValues: [], r2: 0 };

  const mean = monthlyReturns.reduce((s, v) => s + v, 0) / n;

  let a1 = 0;
  let b1 = 0;
  for (let i = 0; i < n; i++) {
    const angle = (2 * Math.PI * i) / n;
    a1 += monthlyReturns[i] * Math.cos(angle);
    b1 += monthlyReturns[i] * Math.sin(angle);
  }
  a1 *= 2 / n;
  b1 *= 2 / n;

  const amplitude = Math.sqrt(a1 * a1 + b1 * b1);
  const phase = Math.atan2(a1, b1);

  const fittedValues = Array.from({ length: n }, (_, i) =>
    amplitude * Math.sin((2 * Math.PI * i) / n + phase) + mean,
  );

  // R-squared
  const ssTot = monthlyReturns.reduce((s, v) => s + (v - mean) ** 2, 0);
  const ssRes = monthlyReturns.reduce(
    (s, v, i) => s + (v - fittedValues[i]) ** 2,
    0,
  );
  const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;

  return { amplitude, phase, offset: mean, fittedValues, r2 };
}

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

// ── Client-side direct fallback (CoinGecko + CryptoCompare) ─────

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const CRYPTOCOMPARE_BASE = "https://min-api.cryptocompare.com/data/v2";

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

async function fetchFromCryptoCompareDirect(
  ticker: string,
  days: number | "max",
): Promise<[number, number][]> {
  const maxDays = days === "max" ? 3650 : days;
  const allPrices: [number, number][] = [];
  let remaining = maxDays;
  let toTs = Math.floor(Date.now() / 1000);

  while (remaining > 0) {
    const limit = Math.min(remaining, 2000);
    const res = await fetch(
      `${CRYPTOCOMPARE_BASE}/histoday?fsym=${ticker}&tsym=USD&limit=${limit}&toTs=${toTs}`,
    );
    if (!res.ok) throw new Error(`CryptoCompare returned ${res.status}`);
    const json = await res.json();
    if (json.Response !== "Success") throw new Error(json.Message || "CryptoCompare error");

    const dataPoints: { time: number; close: number }[] = json.Data?.Data ?? [];
    if (dataPoints.length === 0) break;

    const batch: [number, number][] = dataPoints
      .filter((d) => d.close > 0)
      .map((d) => [d.time * 1000, d.close]);

    allPrices.unshift(...batch);
    remaining -= dataPoints.length;
    if (dataPoints.length < limit) break;
    toTs = dataPoints[0].time - 1;
  }
  return allPrices;
}

async function fetchDerivedMetricDirect(
  metricId: string,
  days: number | "max",
  useExtended: boolean,
): Promise<[number, number][]> {
  if (metricId === "__virtual__btc_dominance") {
    if (useExtended) {
      const [btcPrices, ethPrices] = await Promise.all([
        fetchFromCryptoCompareDirect("BTC", days),
        fetchFromCryptoCompareDirect("ETH", days),
      ]);
      const ethMap = new Map<number, number>();
      for (const [ts, price] of ethPrices) ethMap.set(Math.floor(ts / 86400000), price);
      return btcPrices
        .map(([ts, btcPrice]) => {
          const ethPrice = ethMap.get(Math.floor(ts / 86400000));
          if (ethPrice == null || btcPrice + ethPrice === 0) return null;
          return [ts, (btcPrice / (btcPrice + ethPrice)) * 100] as [number, number];
        })
        .filter((v): v is [number, number] => v !== null);
    }

    // CoinGecko path (≤365 days)
    const cgDays = typeof days === "number" && days > 365 ? 365 : days;
    const base = "https://api.coingecko.com/api/v3";
    const [btcRes, ethRes] = await Promise.all([
      fetch(`${base}/coins/bitcoin/market_chart?vs_currency=usd&days=${cgDays}`),
      fetch(`${base}/coins/ethereum/market_chart?vs_currency=usd&days=${cgDays}`),
    ]);
    if (!btcRes.ok || !ethRes.ok) throw new Error("Failed to fetch BTC/ETH data");
    const btcData = await btcRes.json();
    const ethData = await ethRes.json();
    const btcMcaps: [number, number][] = btcData.market_caps ?? [];
    const ethMcaps: [number, number][] = ethData.market_caps ?? [];

    const ethMap = new Map<number, number>();
    for (const [ts, mcap] of ethMcaps) ethMap.set(Math.floor(ts / 86400000), mcap);

    return btcMcaps
      .map(([ts, btcMcap]) => {
        const ethMcap = ethMap.get(Math.floor(ts / 86400000));
        if (ethMcap == null || btcMcap + ethMcap === 0) return null;
        return [ts, (btcMcap / (btcMcap + ethMcap)) * 100] as [number, number];
      })
      .filter((v): v is [number, number] => v !== null);
  }
  throw new Error(`Unknown derived metric: ${metricId}`);
}

export async function fetchSeasonalityDirect(symbol: string, days: number): Promise<SeasonalityData> {
  const coinId = resolveCoinGeckoId(symbol);
  const clampedDays = days === 0 ? "max" : Math.min(Math.max(days, 30), 1825);
  const isVirtual = coinId.startsWith("__virtual__");
  const numericDays = typeof clampedDays === "number" ? clampedDays : 1825;
  const needsExtended = numericDays > 365;

  let prices: [number, number][];

  if (isVirtual) {
    prices = await fetchDerivedMetricDirect(coinId, clampedDays, needsExtended);
  } else if (needsExtended) {
    prices = await fetchFromCryptoCompareDirect(symbol, clampedDays);
  } else {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${clampedDays}`,
    );
    if (!res.ok) throw new Error(`CoinGecko returned ${res.status}`);
    const data = await res.json();
    prices = data.prices ?? [];
  }

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

import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { resolveCoinGeckoId } from "@/lib/coin-registry";

const COINGECKO_BASE = "https://api.coingecko.com/api/v3";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

export async function GET(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
  const rl = rateLimit(`seasonality:${ip}`, 60, 60_000);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many requests. Please wait." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetMs / 1000)) } }
    );
  }

  const { searchParams } = new URL(request.url);
  const symbol = (searchParams.get("symbol") ?? "BTC").toUpperCase();
  const days = Math.min(Math.max(Number(searchParams.get("days") ?? 365), 30), 365);

  const coinId = resolveCoinGeckoId(symbol);

  try {
    const res = await fetch(
      `${COINGECKO_BASE}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`,
      {
        headers: { "x-cg-demo-api-key": process.env.CG_DEMO_API_KEY ?? "" },
        next: { revalidate: 3600 },
      }
    );

    if (!res.ok) {
      console.error("[market/seasonality] CoinGecko returned", res.status);
      return NextResponse.json({ error: "CoinGecko API error" }, { status: 502 });
    }

    const data = await res.json();
    const prices: [number, number][] = data.prices ?? [];

    if (prices.length < 2) {
      return NextResponse.json(
        { error: "Not enough price data for seasonality analysis" },
        { status: 422 }
      );
    }

    // Calculate daily returns: (price[i] - price[i-1]) / price[i-1] * 100
    const dailyReturns: { date: Date; returnPct: number }[] = [];
    for (let i = 1; i < prices.length; i++) {
      const prevPrice = prices[i - 1][1];
      const curPrice = prices[i][1];
      if (prevPrice > 0) {
        dailyReturns.push({
          date: new Date(prices[i][0]),
          returnPct: ((curPrice - prevPrice) / prevPrice) * 100,
        });
      }
    }

    // Monthly seasonality: average return per calendar month
    const monthlyBuckets: Record<number, number[]> = {};
    for (let m = 0; m < 12; m++) monthlyBuckets[m] = [];

    for (const { date, returnPct } of dailyReturns) {
      monthlyBuckets[date.getUTCMonth()].push(returnPct);
    }

    const monthly = MONTH_NAMES.map((month, i) => {
      const bucket = monthlyBuckets[i];
      return {
        month,
        avgReturn: round3(avg(bucket)),
        sampleSize: bucket.length,
      };
    });

    // Day-of-week seasonality: average return per weekday
    const weekdayBuckets: Record<number, number[]> = {};
    for (let d = 0; d < 7; d++) weekdayBuckets[d] = [];

    for (const { date, returnPct } of dailyReturns) {
      weekdayBuckets[date.getUTCDay()].push(returnPct);
    }

    const weekday = DAY_NAMES.map((day, i) => {
      const bucket = weekdayBuckets[i];
      return {
        day,
        avgReturn: round3(avg(bucket)),
        sampleSize: bucket.length,
      };
    });

    // --- Enhanced: Monthly returns per year (for heatmap) ---
    const yearMonthBuckets: Record<string, number[]> = {};
    for (const { date, returnPct } of dailyReturns) {
      const key = `${date.getUTCFullYear()}-${date.getUTCMonth()}`;
      (yearMonthBuckets[key] ??= []).push(returnPct);
    }

    const yearsSet = new Set(dailyReturns.map((d) => d.date.getUTCFullYear()));
    const years = Array.from(yearsSet).sort();

    const monthlyByYear = years.map((year) => ({
      year,
      months: MONTH_NAMES.map((month, i) => {
        const bucket = yearMonthBuckets[`${year}-${i}`] ?? [];
        const returnPct = bucket.reduce((s, r) => s + r, 0);
        return { month, returnPct: round3(returnPct), sampleSize: bucket.length };
      }),
    }));

    // --- Enhanced: Detailed monthly stats ---
    const monthlyDetailed = MONTH_NAMES.map((month, i) => {
      const bucket = monthlyBuckets[i];
      const yearlyReturns = monthlyByYear
        .map((y) => y.months[i])
        .filter((m) => m.sampleSize > 0)
        .map((m) => m.returnPct);
      return {
        month,
        avgReturn: round3(avg(bucket)),
        medianReturn: round3(median(bucket)),
        winRate: bucket.length > 0
          ? Math.round((bucket.filter((r) => r > 0).length / bucket.length) * 1000) / 10
          : 0,
        sampleSize: bucket.length,
        maxReturn: yearlyReturns.length > 0 ? round3(Math.max(...yearlyReturns)) : 0,
        minReturn: yearlyReturns.length > 0 ? round3(Math.min(...yearlyReturns)) : 0,
      };
    });

    // --- Enhanced: Detailed weekday stats ---
    const weekdayDetailed = DAY_NAMES.map((day, i) => {
      const bucket = weekdayBuckets[i];
      return {
        day,
        avgReturn: round3(avg(bucket)),
        medianReturn: round3(median(bucket)),
        winRate: bucket.length > 0
          ? Math.round((bucket.filter((r) => r > 0).length / bucket.length) * 1000) / 10
          : 0,
        sampleSize: bucket.length,
      };
    });

    // --- Enhanced: Yearly price normalized to 100 ---
    const pricesByYear: Record<number, [number, number][]> = {};
    for (const [ts, price] of prices) {
      const year = new Date(ts).getUTCFullYear();
      (pricesByYear[year] ??= []).push([ts, price]);
    }

    const yearlyPriceNormalized = Object.entries(pricesByYear)
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
          ytdReturn: Math.round(
            ((yearPrices[yearPrices.length - 1][1] - firstPrice) / firstPrice) * 10000
          ) / 100,
        };
      });

    const response = NextResponse.json({
      symbol,
      coinId,
      days,
      monthly,
      weekday,
      monthlyByYear,
      monthlyDetailed,
      weekdayDetailed,
      yearlyPriceNormalized,
      totalDataPoints: dailyReturns.length,
      timestamp: Date.now(),
    });

    response.headers.set(
      "Cache-Control",
      "s-maxage=3600, stale-while-revalidate=7200"
    );
    return response;
  } catch (err) {
    console.error("[market/seasonality]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Failed to fetch seasonality data" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const COINGECKO_BASE = "https://api.coingecko.com/api/v3";

const SYMBOL_TO_ID: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  ADA: "cardano",
  DOT: "polkadot",
  AVAX: "avalanche-2",
  MATIC: "matic-network",
  LINK: "chainlink",
  ATOM: "cosmos",
  UNI: "uniswap",
  DOGE: "dogecoin",
  SHIB: "shiba-inu",
  XRP: "ripple",
  BNB: "binancecoin",
  LTC: "litecoin",
  ARB: "arbitrum",
  OP: "optimism",
  APT: "aptos",
  SUI: "sui",
  NEAR: "near",
};

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const symbol = (searchParams.get("symbol") ?? "BTC").toUpperCase();
  const days = Math.min(Math.max(Number(searchParams.get("days") ?? 365), 30), 1825);

  const coinId = SYMBOL_TO_ID[symbol] ?? symbol.toLowerCase();

  try {
    const res = await fetch(
      `${COINGECKO_BASE}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`,
      { next: { revalidate: 3600 } }
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
      const avgReturn =
        bucket.length > 0
          ? bucket.reduce((sum, r) => sum + r, 0) / bucket.length
          : 0;
      return {
        month,
        avgReturn: Math.round(avgReturn * 1000) / 1000,
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
      const avgReturn =
        bucket.length > 0
          ? bucket.reduce((sum, r) => sum + r, 0) / bucket.length
          : 0;
      return {
        day,
        avgReturn: Math.round(avgReturn * 1000) / 1000,
        sampleSize: bucket.length,
      };
    });

    const response = NextResponse.json({
      symbol,
      coinId,
      days,
      monthly,
      weekday,
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

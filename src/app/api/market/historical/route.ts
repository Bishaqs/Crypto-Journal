import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { resolveCoinGeckoId } from "@/lib/coin-registry";

const COINGECKO_BASE = "https://api.coingecko.com/api/v3";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit(`market:${user.id}`, 60, 60_000);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many requests. Please wait." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetMs / 1000)) } }
    );
  }

  const { searchParams } = new URL(request.url);
  const symbol = (searchParams.get("symbol") ?? "BTC").toUpperCase();
  const days = Math.min(Number(searchParams.get("days") ?? "365"), 1825);

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
      return NextResponse.json(
        { error: `CoinGecko returned ${res.status}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    const prices: [number, number][] = data.prices ?? [];

    // Convert to OHLCV-like daily data
    const dailyMap = new Map<string, { open: number; high: number; low: number; close: number; timestamp: number }>();

    for (const [ts, price] of prices) {
      const date = new Date(ts).toISOString().split("T")[0];
      const existing = dailyMap.get(date);
      if (!existing) {
        dailyMap.set(date, { open: price, high: price, low: price, close: price, timestamp: ts });
      } else {
        existing.high = Math.max(existing.high, price);
        existing.low = Math.min(existing.low, price);
        existing.close = price;
      }
    }

    const ohlc = Array.from(dailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, d]) => ({
        date,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
        timestamp: d.timestamp,
      }));

    const response = NextResponse.json({ symbol, ohlc, count: ohlc.length });
    response.headers.set("Cache-Control", "s-maxage=3600, stale-while-revalidate=7200");
    return response;
  } catch (err) {
    console.error("[market/historical]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Failed to fetch historical data" }, { status: 500 });
  }
}

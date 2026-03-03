import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

const YAHOO_SCREENER_BASE =
  "https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved";

type YahooQuote = {
  symbol?: string;
  shortName?: string;
  longName?: string;
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  regularMarketVolume?: number;
  marketCap?: number;
};

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
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
  const sort = searchParams.get("sort") ?? "market_cap_desc";
  const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? 50), 1), 100);

  // Map sort param to Yahoo screener predefined IDs
  const scrIdMap: Record<string, string> = {
    market_cap_desc: "most_actives",
    volume_desc: "most_actives",
    gainers: "day_gainers",
    losers: "day_losers",
    most_actives: "most_actives",
  };
  const scrId = scrIdMap[sort] ?? "most_actives";

  try {
    const yahooRes = await fetch(
      `${YAHOO_SCREENER_BASE}?scrIds=${scrId}&count=${limit}`,
      {
        headers: { "User-Agent": "Mozilla/5.0" },
        next: { revalidate: 300 },
      }
    );

    if (yahooRes.ok) {
      const yahooData = await yahooRes.json();
      const quotes: YahooQuote[] =
        yahooData?.finance?.result?.[0]?.quotes ?? [];

      const stocks = quotes.map((q) => ({
        symbol: q.symbol ?? "N/A",
        name: q.longName ?? q.shortName ?? "Unknown",
        price: q.regularMarketPrice ?? 0,
        change: Math.round((q.regularMarketChange ?? 0) * 100) / 100,
        changePercent:
          Math.round((q.regularMarketChangePercent ?? 0) * 100) / 100,
        volume: q.regularMarketVolume ?? 0,
        marketCap: q.marketCap ?? 0,
      }));

      const response = NextResponse.json({
        stocks,
        source: "yahoo",
        sort,
        timestamp: Date.now(),
      });
      response.headers.set(
        "Cache-Control",
        "s-maxage=300, stale-while-revalidate=600"
      );
      return response;
    }

    // Fallback: Yahoo failed, try CoinGecko for top crypto assets as stock-like data
    console.error(
      "[market/stock-screener] Yahoo returned",
      yahooRes.status,
      "- falling back to CoinGecko"
    );

    const fallbackRes = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&sparkline=false&price_change_percentage=24h`,
      { next: { revalidate: 300 } }
    );

    if (!fallbackRes.ok) {
      return NextResponse.json({
        stocks: [],
        source: "none",
        error: "Both Yahoo Finance and fallback APIs unavailable",
        timestamp: Date.now(),
      });
    }

    const fallbackData = await fallbackRes.json();
    const stocks = (fallbackData as Array<{
      symbol?: string;
      name?: string;
      current_price?: number;
      price_change_24h?: number;
      price_change_percentage_24h?: number;
      total_volume?: number;
      market_cap?: number;
    }>).map((coin) => ({
      symbol: (coin.symbol ?? "").toUpperCase(),
      name: coin.name ?? "Unknown",
      price: coin.current_price ?? 0,
      change: Math.round((coin.price_change_24h ?? 0) * 100) / 100,
      changePercent:
        Math.round((coin.price_change_percentage_24h ?? 0) * 100) / 100,
      volume: coin.total_volume ?? 0,
      marketCap: coin.market_cap ?? 0,
    }));

    const response = NextResponse.json({
      stocks,
      source: "coingecko_fallback",
      sort,
      timestamp: Date.now(),
    });
    response.headers.set(
      "Cache-Control",
      "s-maxage=300, stale-while-revalidate=600"
    );
    return response;
  } catch (err) {
    console.error(
      "[market/stock-screener]",
      err instanceof Error ? err.message : err
    );
    return NextResponse.json(
      { error: "Failed to fetch stock screener data" },
      { status: 500 }
    );
  }
}

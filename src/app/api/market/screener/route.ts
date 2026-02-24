import { NextResponse } from "next/server";

const COINGECKO_BASE = "https://api.coingecko.com/api/v3";

export async function GET() {
  try {
    const res = await fetch(
      `${COINGECKO_BASE}/coins/markets?vs_currency=usd&order=volume_desc&per_page=100&sparkline=false&price_change_percentage=24h%2C7d`,
      { next: { revalidate: 300 } }
    );

    if (!res.ok) {
      return NextResponse.json({ error: "CoinGecko API error" }, { status: 502 });
    }

    const coins = await res.json();
    const response = NextResponse.json({ coins, timestamp: Date.now() });
    response.headers.set(
      "Cache-Control",
      "s-maxage=300, stale-while-revalidate=600"
    );
    return response;
  } catch {
    return NextResponse.json({ error: "Failed to fetch screener data" }, { status: 500 });
  }
}

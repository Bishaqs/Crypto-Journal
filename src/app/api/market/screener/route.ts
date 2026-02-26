import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const COINGECKO_BASE = "https://api.coingecko.com/api/v3";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const res = await fetch(
      `${COINGECKO_BASE}/coins/markets?vs_currency=usd&order=volume_desc&per_page=100&sparkline=false&price_change_percentage=24h%2C7d`,
      { next: { revalidate: 300 } }
    );

    if (!res.ok) {
      console.error("[market/screener] CoinGecko returned", res.status);
      return NextResponse.json({ error: "CoinGecko API error" }, { status: 502 });
    }

    const coins = await res.json();
    const response = NextResponse.json({ coins, timestamp: Date.now() });
    response.headers.set(
      "Cache-Control",
      "s-maxage=300, stale-while-revalidate=600"
    );
    return response;
  } catch (err) {
    console.error("[market/screener]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Failed to fetch screener data" }, { status: 500 });
  }
}

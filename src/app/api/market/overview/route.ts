import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const COINGECKO_BASE = "https://api.coingecko.com/api/v3";
const FNG_URL = "https://api.alternative.me/fng/?limit=1";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [coinsRes, globalRes, fngRes, trendingRes] = await Promise.allSettled([
      fetch(
        `${COINGECKO_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=25&sparkline=true&price_change_percentage=1h%2C24h%2C7d`,
        { next: { revalidate: 300 } }
      ),
      fetch(`${COINGECKO_BASE}/global`, { next: { revalidate: 300 } }),
      fetch(FNG_URL, { next: { revalidate: 300 } }),
      fetch(`${COINGECKO_BASE}/search/trending`, { next: { revalidate: 300 } }),
    ]);

    const coins =
      coinsRes.status === "fulfilled" && coinsRes.value.ok
        ? await coinsRes.value.json()
        : [];
    const global =
      globalRes.status === "fulfilled" && globalRes.value.ok
        ? await globalRes.value.json()
        : null;
    const fng =
      fngRes.status === "fulfilled" && fngRes.value.ok
        ? await fngRes.value.json()
        : null;
    const trending =
      trendingRes.status === "fulfilled" && trendingRes.value.ok
        ? await trendingRes.value.json()
        : null;

    const response = NextResponse.json({
      coins,
      global: global?.data ?? null,
      fearGreed: fng?.data?.[0] ?? null,
      trending: trending?.coins?.slice(0, 7) ?? [],
      timestamp: Date.now(),
    });

    response.headers.set(
      "Cache-Control",
      "s-maxage=300, stale-while-revalidate=600"
    );
    return response;
  } catch (err) {
    console.error("[market/overview]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Failed to fetch market data" }, { status: 500 });
  }
}

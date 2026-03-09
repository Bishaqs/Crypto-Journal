import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

const YAHOO_SPARK =
  "https://query1.finance.yahoo.com/v8/finance/spark?symbols=GC%3DF,SI%3DF,PL%3DF,HG%3DF,CL%3DF,BZ%3DF,NG%3DF,ZC%3DF,ZW%3DF,ZS%3DF,KC%3DF,SB%3DF&range=5d&interval=1d";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`market-commodities:${user.id}`, 60, 60_000);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many requests. Please wait." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetMs / 1000)) } }
    );
  }

  try {
    const yahooRes = await fetch(YAHOO_SPARK, {
      next: { revalidate: 300 },
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    let commodities: Record<string, { price: number; change: number; changePct: number; spark: number[] }> = {};

    if (yahooRes.ok) {
      const yahoo = await yahooRes.json();
      const symbolMap: Record<string, string> = {
        "GC=F": "GOLD",
        "SI=F": "SILVER",
        "PL=F": "PLATINUM",
        "HG=F": "COPPER",
        "CL=F": "WTI",
        "BZ=F": "BRENT",
        "NG=F": "NATGAS",
        "ZC=F": "CORN",
        "ZW=F": "WHEAT",
        "ZS=F": "SOYBEANS",
        "KC=F": "COFFEE",
        "SB=F": "SUGAR",
      };
      for (const [sym, key] of Object.entries(symbolMap)) {
        const d = yahoo?.[sym];
        if (d) {
          const closes: number[] = d.close ?? [];
          const price = closes[closes.length - 1] ?? 0;
          const prev = closes[closes.length - 2] ?? price;
          commodities[key] = {
            price,
            change: price - prev,
            changePct: prev ? ((price - prev) / prev) * 100 : 0,
            spark: closes,
          };
        }
      }
    }

    const response = NextResponse.json({
      commodities,
      timestamp: Date.now(),
    });

    response.headers.set(
      "Cache-Control",
      "s-maxage=300, stale-while-revalidate=600"
    );
    return response;
  } catch (err) {
    console.error("[market/commodities]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Failed to fetch commodity data" },
      { status: 500 }
    );
  }
}

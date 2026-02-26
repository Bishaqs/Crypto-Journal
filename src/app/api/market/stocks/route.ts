import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const YAHOO_SPARK =
  "https://query1.finance.yahoo.com/v8/finance/spark?symbols=%5EGSPC,%5EIXIC,%5EDJI,%5EVIX,DX-Y.NYB&range=5d&interval=1d";
const FRANKFURTER =
  "https://api.frankfurter.app/latest?base=USD&symbols=EUR,GBP,JPY,CHF,CAD,AUD";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [yahooRes, fxRes] = await Promise.allSettled([
      fetch(YAHOO_SPARK, {
        next: { revalidate: 300 },
        headers: { "User-Agent": "Mozilla/5.0" },
      }),
      fetch(FRANKFURTER, { next: { revalidate: 300 } }),
    ]);

    // Parse Yahoo Finance spark data
    let indices: Record<string, { price: number; change: number; changePct: number; spark: number[] }> = {};
    if (yahooRes.status === "fulfilled" && yahooRes.value.ok) {
      const yahoo = await yahooRes.value.json();
      const symbolMap: Record<string, string> = {
        "^GSPC": "SP500",
        "^IXIC": "NASDAQ",
        "^DJI": "DOW",
        "^VIX": "VIX",
        "DX-Y.NYB": "DXY",
      };
      for (const [sym, key] of Object.entries(symbolMap)) {
        const d = yahoo?.[sym];
        if (d) {
          const closes: number[] = d.close ?? [];
          const price = closes[closes.length - 1] ?? 0;
          const prev = closes[closes.length - 2] ?? price;
          indices[key] = {
            price,
            change: price - prev,
            changePct: prev ? ((price - prev) / prev) * 100 : 0,
            spark: closes,
          };
        }
      }
    }

    // Parse Frankfurter forex
    let forex: Record<string, number> = {};
    if (fxRes.status === "fulfilled" && fxRes.value.ok) {
      const fx = await fxRes.value.json();
      forex = fx?.rates ?? {};
    }

    const response = NextResponse.json({
      indices,
      forex,
      timestamp: Date.now(),
    });

    response.headers.set(
      "Cache-Control",
      "s-maxage=300, stale-while-revalidate=600"
    );
    return response;
  } catch (err) {
    console.error("[market/stocks]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Failed to fetch stock market data" },
      { status: 500 }
    );
  }
}

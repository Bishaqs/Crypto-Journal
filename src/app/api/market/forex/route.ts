import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

const FRANKFURTER_USD =
  "https://api.frankfurter.app/latest?base=USD&symbols=EUR,GBP,JPY,CHF,CAD,AUD,NZD,SEK,NOK,MXN,ZAR,SGD,HKD,TRY,PLN,CZK,HUF,DKK";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`market-forex:${user.id}`, 60, 60_000);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many requests. Please wait." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetMs / 1000)) } }
    );
  }

  try {
    const fxRes = await fetch(FRANKFURTER_USD, { next: { revalidate: 300 } });

    let rates: Record<string, number> = {};
    let base = "USD";

    if (fxRes.ok) {
      const fx = await fxRes.json();
      rates = fx?.rates ?? {};
      base = fx?.base ?? "USD";
    }

    const response = NextResponse.json({
      rates,
      base,
      timestamp: Date.now(),
    });

    response.headers.set(
      "Cache-Control",
      "s-maxage=300, stale-while-revalidate=600"
    );
    return response;
  } catch (err) {
    console.error("[market/forex]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Failed to fetch forex data" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const BINANCE_URL = "https://fapi.binance.com/fapi/v1/premiumIndex";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const res = await fetch(BINANCE_URL, { next: { revalidate: 300 } });

    if (!res.ok) {
      console.error("[market/funding-rates] Binance returned", res.status);
      return NextResponse.json({ error: "Binance API error" }, { status: 502 });
    }

    const data = await res.json();
    const response = NextResponse.json({ rates: data, timestamp: Date.now() });
    response.headers.set(
      "Cache-Control",
      "s-maxage=300, stale-while-revalidate=600"
    );
    return response;
  } catch (err) {
    console.error("[market/funding-rates]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Failed to fetch funding rates" }, { status: 500 });
  }
}

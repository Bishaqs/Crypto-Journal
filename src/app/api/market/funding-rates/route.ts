import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const preferredRegion = "sin1";

const BINANCE_URLS = [
  "https://fapi.binance.com/fapi/v1/premiumIndex",
  "https://fapi1.binance.com/fapi/v1/premiumIndex",
  "https://fapi2.binance.com/fapi/v1/premiumIndex",
];

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let lastError: string | undefined;

  for (const url of BINANCE_URLS) {
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(5000),
        cache: "no-store",
      });

      if (!res.ok) {
        lastError = `Binance returned ${res.status}`;
        continue;
      }

      const data = await res.json();
      const response = NextResponse.json({ rates: data, timestamp: Date.now() });
      response.headers.set(
        "Cache-Control",
        "s-maxage=300, stale-while-revalidate=600"
      );
      return response;
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      continue;
    }
  }

  console.error("[market/funding-rates] All endpoints failed:", lastError);
  return NextResponse.json({ error: "Failed to fetch funding rates" }, { status: 502 });
}

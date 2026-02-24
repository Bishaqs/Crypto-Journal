import { NextResponse } from "next/server";

const BINANCE_URL = "https://fapi.binance.com/fapi/v1/premiumIndex";

export async function GET() {
  try {
    const res = await fetch(BINANCE_URL, { next: { revalidate: 300 } });

    if (!res.ok) {
      return NextResponse.json({ error: "Binance API error" }, { status: 502 });
    }

    const data = await res.json();
    const response = NextResponse.json({ rates: data, timestamp: Date.now() });
    response.headers.set(
      "Cache-Control",
      "s-maxage=300, stale-while-revalidate=600"
    );
    return response;
  } catch {
    return NextResponse.json({ error: "Failed to fetch funding rates" }, { status: 500 });
  }
}

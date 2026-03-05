import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

// TODO: Replace this mock data generator with a real options flow data source
// such as Unusual Whales (https://unusualwhales.com/api), CBOE DataShop,
// or Tradier API when a subscription/API key is available.

const SYMBOLS = [
  "SPY", "QQQ", "IWM", "DIA", "XLF",
  "AAPL", "MSFT", "AMZN", "GOOGL", "META",
  "TSLA", "NVDA", "AMD", "COIN", "PLTR",
  "SMCI", "ARM", "AVGO", "MU", "INTC",
];

const APPROXIMATE_PRICES: Record<string, number> = {
  SPY: 520, QQQ: 445, IWM: 210, DIA: 395, XLF: 42,
  AAPL: 195, MSFT: 415, AMZN: 185, GOOGL: 175, META: 510,
  TSLA: 245, NVDA: 880, AMD: 165, COIN: 220, PLTR: 25,
  SMCI: 750, ARM: 140, AVGO: 1350, MU: 95, INTC: 28,
};

const SECTOR_MAP: Record<string, string> = {
  SPY: "ETF", QQQ: "ETF", IWM: "ETF", DIA: "ETF", XLF: "ETF",
  AAPL: "Technology", MSFT: "Technology", AMZN: "Consumer", GOOGL: "Technology", META: "Technology",
  TSLA: "Auto/EV", NVDA: "Semiconductor", AMD: "Semiconductor", COIN: "Crypto", PLTR: "Technology",
  SMCI: "Technology", ARM: "Semiconductor", AVGO: "Semiconductor", MU: "Semiconductor", INTC: "Semiconductor",
};

type OptionsFlowEntry = {
  symbol: string;
  expiry: string;
  strike: number;
  type: "CALL" | "PUT";
  volume: number;
  oi: number;
  premium: number;
  sentiment: "bullish" | "bearish" | "neutral";
  timestamp: string;
  sector: string;
};

// Seeded pseudo-random number generator for deterministic output per minute
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateMockFlows(count: number): OptionsFlowEntry[] {
  // Seed changes every minute so data appears to refresh
  const minuteSeed = Math.floor(Date.now() / 60000);
  const rand = seededRandom(minuteSeed);

  const flows: OptionsFlowEntry[] = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const symbol = SYMBOLS[Math.floor(rand() * SYMBOLS.length)];
    const basePrice = APPROXIMATE_PRICES[symbol] ?? 100;

    // Strike near current price: +/- 10%
    const strikeOffset = (rand() - 0.5) * 0.2 * basePrice;
    const roundTo = basePrice > 500 ? 10 : basePrice > 100 ? 5 : 1;
    const strike = Math.round((basePrice + strikeOffset) / roundTo) * roundTo;

    // Random expiry 1-60 days out, on a Friday
    const daysOut = Math.floor(rand() * 60) + 1;
    const expiryDate = new Date(now + daysOut * 86400000);
    const dayOfWeek = expiryDate.getDay();
    const daysUntilFriday = (5 - dayOfWeek + 7) % 7;
    expiryDate.setDate(expiryDate.getDate() + daysUntilFriday);
    const expiry = expiryDate.toISOString().split("T")[0];

    const type: "CALL" | "PUT" = rand() > 0.45 ? "CALL" : "PUT";

    const volume = Math.floor(rand() * 15000) + 100;
    const oi = Math.floor(rand() * 50000) + 500;

    // Premium: between $10K and $5M
    const premiumBase = Math.floor(rand() * 5000000) + 10000;
    const premium = Math.round(premiumBase / 100) * 100;

    // Sentiment derived from call/put + volume/OI ratio
    let sentiment: "bullish" | "bearish" | "neutral";
    const volumeOiRatio = volume / oi;
    if (type === "CALL" && volumeOiRatio > 0.5) {
      sentiment = rand() > 0.2 ? "bullish" : "neutral";
    } else if (type === "PUT" && volumeOiRatio > 0.5) {
      sentiment = rand() > 0.2 ? "bearish" : "neutral";
    } else {
      const r = rand();
      sentiment = r > 0.6 ? "bullish" : r > 0.3 ? "bearish" : "neutral";
    }

    // Timestamp: spread over last 30 minutes
    const minutesAgo = Math.floor(rand() * 30);
    const ts = new Date(now - minutesAgo * 60000);

    flows.push({
      symbol,
      expiry,
      strike,
      type,
      volume,
      oi,
      premium,
      sentiment,
      timestamp: ts.toISOString(),
      sector: SECTOR_MAP[symbol] ?? "Other",
    });
  }

  flows.sort((a, b) => b.premium - a.premium);
  return flows;
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`market:${user.id}`, 60, 60_000);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many requests. Please wait." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetMs / 1000)) } }
    );
  }

  try {
    const flows = generateMockFlows(150);

    const sentimentSummary = {
      bullish: flows.filter((f) => f.sentiment === "bullish").length,
      bearish: flows.filter((f) => f.sentiment === "bearish").length,
      neutral: flows.filter((f) => f.sentiment === "neutral").length,
    };

    const totalPremium = flows.reduce((sum, f) => sum + f.premium, 0);
    const callFlows = flows.filter((f) => f.type === "CALL");
    const putFlows = flows.filter((f) => f.type === "PUT");
    const callVolume = callFlows.reduce((sum, f) => sum + f.volume, 0);
    const putVolume = putFlows.reduce((sum, f) => sum + f.volume, 0);
    const callPremium = callFlows.reduce((sum, f) => sum + f.premium, 0);
    const putPremium = putFlows.reduce((sum, f) => sum + f.premium, 0);

    const response = NextResponse.json({
      flows,
      summary: {
        totalFlows: flows.length,
        totalPremium,
        callVolume,
        putVolume,
        callPremium,
        putPremium,
        putCallRatio: callVolume > 0 ? Math.round((putVolume / callVolume) * 100) / 100 : 0,
        sentiment: sentimentSummary,
      },
      // NOTE: This endpoint serves mock/simulated data. Replace with a real
      // options flow data source when an API key or subscription becomes available.
      isMockData: true,
      timestamp: Date.now(),
    });

    response.headers.set("Cache-Control", "s-maxage=60, stale-while-revalidate=120");
    return response;
  } catch (err) {
    console.error("[market/options-flow]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Failed to generate options flow data" }, { status: 500 });
  }
}

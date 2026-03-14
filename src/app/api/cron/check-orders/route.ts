import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { COIN_TO_COINGECKO_ID } from "@/lib/coin-registry";

export const dynamic = "force-dynamic";

const COINGECKO_BASE = "https://api.coingecko.com/api/v3";
const DEADLINE_MS = 8000; // bail 2s before Vercel 10s timeout

/**
 * Cron endpoint: check pending/active limit orders against live prices.
 * Secured with CRON_SECRET bearer token.
 * Called by external cron service every ~5 minutes.
 */
export async function POST(req: Request) {
  // Authenticate
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const deadline = Date.now() + DEADLINE_MS;
  const supabase = createAdminClient();

  // Fetch all limit orders that need checking
  const { data: orders, error } = await supabase
    .from("phantom_trades")
    .select("*")
    .eq("order_type", "limit")
    .in("status", ["pending", "active"])
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!orders || orders.length === 0) {
    return NextResponse.json({ checked: 0, updated: 0 });
  }

  // Collect unique symbols and map to CoinGecko IDs
  const symbolSet = new Set<string>();
  for (const order of orders) {
    symbolSet.add(order.symbol);
  }

  const prices = await fetchPrices(Array.from(symbolSet));
  if (!prices) {
    return NextResponse.json({ error: "Failed to fetch prices" }, { status: 502 });
  }

  let updated = 0;
  const now = new Date().toISOString();

  for (const order of orders) {
    if (Date.now() > deadline) break; // deadline guard

    const ticker = symbolToTicker(order.symbol);
    const cgId = COIN_TO_COINGECKO_ID[ticker];
    if (!cgId || !prices[cgId]) continue;

    const currentPrice = prices[cgId].usd;
    const updates: Record<string, unknown> = {};

    // Update high/low tracking
    if (order.price_high_since === null || currentPrice > order.price_high_since) {
      updates.price_high_since = currentPrice;
      updates.price_high_date = now;
    }
    if (order.price_low_since === null || currentPrice < order.price_low_since) {
      updates.price_low_since = currentPrice;
      updates.price_low_date = now;
    }

    if (order.status === "pending") {
      // Check if limit entry price was hit
      const filled = order.position === "long"
        ? currentPrice <= order.entry_price  // buy limit: price drops to entry
        : currentPrice >= order.entry_price; // sell limit: price rises to entry

      if (filled) {
        updates.status = "active";
        updates.filled_at = now;
      }
    } else if (order.status === "active") {
      // Check TP/SL
      let resolved = false;

      if (order.profit_target) {
        const tpHit = order.position === "long"
          ? currentPrice >= order.profit_target
          : currentPrice <= order.profit_target;
        if (tpHit) {
          updates.status = "resolved";
          updates.outcome = "target_hit";
          updates.outcome_price = currentPrice;
          updates.resolved_at = now;
          resolved = true;
        }
      }

      if (!resolved && order.stop_loss) {
        const slHit = order.position === "long"
          ? currentPrice <= order.stop_loss
          : currentPrice >= order.stop_loss;
        if (slHit) {
          updates.status = "resolved";
          updates.outcome = "stop_hit";
          updates.outcome_price = currentPrice;
          updates.resolved_at = now;
        }
      }
    }

    if (Object.keys(updates).length > 0) {
      updates.updated_at = now;
      const { error: updateError } = await supabase
        .from("phantom_trades")
        .update(updates)
        .eq("id", order.id);

      if (!updateError) updated++;
    }
  }

  return NextResponse.json({
    checked: orders.length,
    updated,
    timestamp: now,
  });
}

/** Strip USDT/USD/BUSD suffix to get base ticker */
function symbolToTicker(symbol: string): string {
  return symbol
    .replace(/USDT$/i, "")
    .replace(/USD$/i, "")
    .replace(/BUSD$/i, "")
    .toUpperCase();
}

/** Fetch current USD prices from CoinGecko for a list of symbols */
async function fetchPrices(
  symbols: string[]
): Promise<Record<string, { usd: number }> | null> {
  const ids = new Set<string>();
  for (const sym of symbols) {
    const ticker = symbolToTicker(sym);
    const cgId = COIN_TO_COINGECKO_ID[ticker];
    if (cgId) ids.add(cgId);
  }

  if (ids.size === 0) return null;

  try {
    const res = await fetch(
      `${COINGECKO_BASE}/simple/price?ids=${Array.from(ids).join(",")}&vs_currencies=usd`,
      {
        headers: { "x-cg-demo-api-key": process.env.CG_DEMO_API_KEY ?? "" },
      }
    );

    if (!res.ok) {
      console.error("[cron/check-orders] CoinGecko returned", res.status);
      return null;
    }

    return await res.json();
  } catch (err) {
    console.error("[cron/check-orders] price fetch error:", err);
    return null;
  }
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { decrypt } from "@/lib/broker-sync/crypto";
import { buildHeaders, type BitgetCredentials } from "@/lib/broker-sync/bitget";

export const dynamic = "force-dynamic";

/**
 * GET /api/debug-fills — Fetches raw fills and shows classification breakdown.
 * Also shows what's in the DB for comparison.
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: conn } = await supabase
    .from("broker_connections")
    .select("*")
    .eq("user_id", user.id)
    .ilike("broker_name", "%bitget%")
    .limit(1)
    .maybeSingle();

  if (!conn) {
    return NextResponse.json({ error: "No Bitget connection found" }, { status: 404 });
  }

  try {
    const apiKey = decrypt(conn.encrypted_api_key, conn.encryption_iv);
    const apiSecret = decrypt(conn.encrypted_api_secret, conn.secret_iv ?? conn.encryption_iv);
    const passphrase = conn.encrypted_passphrase && conn.passphrase_iv
      ? decrypt(conn.encrypted_passphrase, conn.passphrase_iv)
      : "";

    const creds: BitgetCredentials = { apiKey, apiSecret, passphrase };

    // Fetch fills from last 7 days (max 100)
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const queryParams = new URLSearchParams({
      productType: "USDT-FUTURES",
      limit: "100",
      startTime: sevenDaysAgo.toString(),
      endTime: now.toString(),
    });

    const path = "/api/v2/mix/order/fills";
    const query = "?" + queryParams.toString();
    const fullPath = path + query;

    const headers = buildHeaders(creds, "GET", fullPath);
    const res = await fetch("https://api.bitget.com" + fullPath, { headers });
    const json = await res.json();

    type Fill = { tradeId: string; orderId: string; symbol: string; side: string; tradeSide: string; profit: string; baseVolume: string; price: string; cTime: string; posMode: string };
    const fillList: Fill[] = json.data?.fillList ?? [];

    // Categorize fills
    const categories: Record<string, number> = {};
    for (const f of fillList) {
      const key = `${f.side}_${f.tradeSide}`;
      categories[key] = (categories[key] || 0) + 1;
    }

    // Group by orderId to see how many orders
    const orderIds = new Set(fillList.map((f) => f.orderId));

    // Also check what's in the DB — count by position and status
    const { data: dbTrades } = await supabase
      .from("trades")
      .select("position, exit_price, symbol")
      .eq("user_id", user.id)
      .eq("broker_name", "Bitget");

    const dbStats = {
      total: dbTrades?.length ?? 0,
      long_open: dbTrades?.filter((t) => t.position === "long" && t.exit_price === null).length ?? 0,
      long_closed: dbTrades?.filter((t) => t.position === "long" && t.exit_price !== null).length ?? 0,
      short_open: dbTrades?.filter((t) => t.position === "short" && t.exit_price === null).length ?? 0,
      short_closed: dbTrades?.filter((t) => t.position === "short" && t.exit_price !== null).length ?? 0,
    };

    // Show one example of each category
    const examples: Record<string, { symbol: string; profit: string; baseVolume: string; price: string; time: string }> = {};
    for (const f of fillList) {
      const key = `${f.side}_${f.tradeSide}`;
      if (!examples[key]) {
        examples[key] = {
          symbol: f.symbol,
          profit: f.profit,
          baseVolume: f.baseVolume,
          price: f.price,
          time: new Date(parseInt(f.cTime)).toISOString(),
        };
      }
    }

    return NextResponse.json({
      api_fill_count: fillList.length,
      unique_orders: orderIds.size,
      fill_categories: categories,
      category_examples: examples,
      db_stats: dbStats,
      last_sync_at: conn.last_sync_at,
      connection_status: conn.status,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Debug failed" },
      { status: 500 },
    );
  }
}

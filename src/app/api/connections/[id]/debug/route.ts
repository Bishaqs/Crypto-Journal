import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { decrypt } from "@/lib/broker-sync/crypto";
import { buildHeaders, type BitgetCredentials } from "@/lib/broker-sync/bitget";

export const dynamic = "force-dynamic";

const BASE = "https://api.bitget.com";
const PRODUCT_TYPES = ["USDT-FUTURES", "COIN-FUTURES"];

type FillRaw = {
  tradeId: string; orderId: string; symbol: string; side: string;
  tradeSide?: string; price: string; size: string; fee: string;
  profit: string; cTime: string;
};

/** Probe a single Bitget endpoint and return parsed JSON. */
async function probe(
  creds: BitgetCredentials,
  path: string,
  query: string,
): Promise<{ data: unknown; error: string }> {
  const fullPath = path + query;
  try {
    const headers = buildHeaders(creds, "GET", fullPath);
    const res = await fetch(BASE + fullPath, { headers, signal: AbortSignal.timeout(4000) });
    const json = await res.json();
    if (json.code === "00000") return { data: json.data, error: "" };
    return { data: null, error: json.msg || `Code: ${json.code}` };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : "Failed" };
  }
}

/**
 * Diagnostic endpoint: raw Bitget API probe across all product types.
 * No dedup, no cleanup, no insert — just shows what the API returns.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: conn } = await supabase
    .from("broker_connections")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!conn) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const apiKey = decrypt(conn.encrypted_api_key, conn.encryption_iv);
    const apiSecret = decrypt(
      conn.encrypted_api_secret,
      conn.secret_iv ?? conn.encryption_iv,
    );
    const passphrase =
      conn.encrypted_passphrase && conn.passphrase_iv
        ? decrypt(conn.encrypted_passphrase, conn.passphrase_iv)
        : "";

    const creds: BitgetCredentials = { apiKey, apiSecret, passphrase };
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    // Probe fills + history-position + open-positions for EACH product type
    const productResults: Record<string, {
      fills: unknown[];
      fill_symbols: string[];
      history_positions: unknown[];
      hp_symbols: string[];
      hp_error: string;
      open_positions: unknown[];
      op_symbols: string[];
      op_error: string;
    }> = {};

    for (const pt of PRODUCT_TYPES) {
      // Fills
      const fillQuery = `?productType=${pt}&limit=100&startTime=${sevenDaysAgo}&endTime=${now}`;
      const fillProbe = await probe(creds, "/api/v2/mix/order/fills", fillQuery);
      const fillList: FillRaw[] = ((fillProbe.data as { fillList?: FillRaw[] })?.fillList) ?? [];

      // History positions (no marginCoin filter — return all positions)
      const hpProbe = await probe(creds, "/api/v2/mix/position/history-position", `?productType=${pt}&limit=10`);
      const hpList: Array<{ symbol?: string }> = ((hpProbe.data as { list?: Array<{ symbol?: string }> })?.list ?? []).slice(0, 5);

      // Open positions (no marginCoin filter)
      const opProbe = await probe(creds, "/api/v2/mix/position/all-position", `?productType=${pt}`);
      const opList: Array<{ symbol?: string }> = (opProbe.data as Array<{ symbol?: string }>) ?? [];

      productResults[pt] = {
        fills: fillList.map((f) => ({
          tradeId: f.tradeId, orderId: f.orderId, symbol: f.symbol,
          side: f.side, tradeSide: f.tradeSide, price: f.price,
          size: f.size, fee: f.fee, profit: f.profit,
          time: new Date(parseInt(f.cTime)).toISOString(),
        })),
        fill_symbols: [...new Set(fillList.map((f) => f.symbol))],
        history_positions: hpList,
        hp_symbols: [...new Set(hpList.map((p) => p.symbol).filter(Boolean) as string[])],
        hp_error: hpProbe.error || fillProbe.error || "",
        open_positions: opList,
        op_symbols: [...new Set(opList.map((p) => p.symbol).filter(Boolean) as string[])],
        op_error: opProbe.error || "",
      };
    }

    // Symbol coverage analysis
    const allFillSymbols = new Set<string>();
    const allPositionSymbols = new Set<string>();
    for (const pt of PRODUCT_TYPES) {
      const r = productResults[pt];
      if (r) {
        for (const s of r.fill_symbols) allFillSymbols.add(s);
        for (const s of r.hp_symbols) allPositionSymbols.add(s);
        for (const s of r.op_symbols) allPositionSymbols.add(s);
      }
    }
    const missingFromPositions = [...allFillSymbols].filter((s) => !allPositionSymbols.has(s));

    // Query stored trades
    const { data: storedTrades } = await supabase
      .from("trades")
      .select("symbol, position, entry_price, exit_price, quantity, fees, pnl, broker_order_id, tags, open_timestamp, close_timestamp")
      .eq("user_id", user.id)
      .eq("broker_name", "Bitget")
      .order("open_timestamp", { ascending: false })
      .limit(20);

    // Symbol breakdown from DB
    const { data: dbSymbolCounts } = await supabase
      .from("trades")
      .select("symbol")
      .eq("user_id", user.id)
      .eq("broker_name", "Bitget");
    const dbSymbols = new Map<string, number>();
    for (const t of dbSymbolCounts ?? []) {
      const s = (t as { symbol: string }).symbol;
      dbSymbols.set(s, (dbSymbols.get(s) ?? 0) + 1);
    }

    // Targeted BTC diagnostic: find ALL BTCUSDT trades and the specific missing one
    const { data: btcTrades } = await supabase
      .from("trades")
      .select("id, symbol, position, entry_price, exit_price, quantity, pnl, broker_order_id, broker_name, tags, open_timestamp, close_timestamp, trade_source")
      .eq("user_id", user.id)
      .eq("symbol", "BTCUSDT")
      .order("open_timestamp", { ascending: false })
      .limit(20);

    // Direct search for the specific missing positionId
    const targetId = _req.nextUrl.searchParams.get("check_id");
    let targetTradeResult = null;
    if (targetId) {
      const { data, error } = await supabase
        .from("trades")
        .select("*")
        .eq("user_id", user.id)
        .eq("broker_order_id", targetId)
        .limit(5);
      targetTradeResult = { found: (data?.length ?? 0) > 0, count: data?.length ?? 0, data, error: error?.message };
    }

    // Last sync log
    const { data: lastLog } = await supabase
      .from("sync_logs")
      .select("*")
      .eq("connection_id", id)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return NextResponse.json({
      product_types_probed: PRODUCT_TYPES,
      products: productResults,
      symbol_analysis: {
        fill_symbols: [...allFillSymbols],
        position_symbols: [...allPositionSymbols],
        missing_from_positions: missingFromPositions,
        db_symbol_counts: Object.fromEntries(dbSymbols),
      },
      stored_trades: (storedTrades ?? []).map((t: Record<string, unknown>) => ({
        symbol: t.symbol, position: t.position, qty: t.quantity,
        entry: t.entry_price, exit: t.exit_price, pnl: t.pnl,
        fees: t.fees, broker_order_id: t.broker_order_id, tags: t.tags,
        open: t.open_timestamp, close: t.close_timestamp,
      })),
      stored_trades_count: storedTrades?.length ?? 0,
      btc_trades: (btcTrades ?? []).map((t: Record<string, unknown>) => ({
        id: t.id, symbol: t.symbol, position: t.position, qty: t.quantity,
        entry: t.entry_price, exit: t.exit_price, pnl: t.pnl,
        fees: t.fees, broker_order_id: t.broker_order_id, broker_name: t.broker_name,
        tags: t.tags, trade_source: t.trade_source,
        open: t.open_timestamp, close: t.close_timestamp,
      })),
      btc_trades_count: btcTrades?.length ?? 0,
      target_trade_check: targetTradeResult,
      last_sync_log: lastLog,
      last_sync_at: conn.last_sync_at,
      last_error: conn.last_error,
      connection_status: conn.status,
      total_trades_synced: conn.total_trades_synced,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Debug failed" },
      { status: 500 },
    );
  }
}

import { createHmac } from "crypto";

/* ================================================================
   Bitget API Client — Futures Fill Sync
   Docs: https://www.bitget.com/api-doc/contract/trade/Get-Order-Fills
   ================================================================ */

export type BitgetCredentials = {
  apiKey: string;
  apiSecret: string;
  passphrase: string;
};

type BitgetFill = {
  tradeId: string;
  orderId: string;
  symbol: string;
  side: string;
  price: string;
  size: string;
  fee: string;
  cTime: string;
  profit: string;
  tradeSide?: string;
};

export type MappedTrade = {
  symbol: string;
  position: "long" | "short";
  entry_price: number;
  exit_price: number | null;
  quantity: number;
  fees: number;
  open_timestamp: string;
  close_timestamp: string | null;
  pnl: number | null;
  broker_order_id: string;
  broker_name: string;
  trade_source: "cex";
  tags: string[];
  notes: string | null;
  stop_loss: number | null;
  profit_target: number | null;
  emotion: string | null;
  confidence: number | null;
  setup_type: string | null;
  process_score: number | null;
  checklist: null;
  review: null;
  sector: string | null;
  chain: null;
  dex_protocol: string | null;
  tx_hash: string | null;
  wallet_address: string | null;
  gas_fee: number;
  gas_fee_native: number;
  price_mae: number | null;
  price_mfe: number | null;
  mfe_timestamp: string | null;
  mae_timestamp: string | null;
};

export type BitgetSyncResult = {
  fills: MappedTrade[];
  fetched: number;
  errors: string[];
  constituentFillIds: string[];
};

// ── Signature ──────────────────────────────────────────────────

function sign(
  timestamp: string,
  method: string,
  requestPath: string,
  body: string,
  secret: string,
): string {
  const prehash = timestamp + method.toUpperCase() + requestPath + body;
  return createHmac("sha256", secret).update(prehash).digest("base64");
}

function buildHeaders(
  creds: BitgetCredentials,
  method: string,
  requestPath: string,
  body: string = "",
): Record<string, string> {
  const timestamp = Date.now().toString();
  const signature = sign(timestamp, method, requestPath, body, creds.apiSecret);
  return {
    "ACCESS-KEY": creds.apiKey,
    "ACCESS-SIGN": signature,
    "ACCESS-TIMESTAMP": timestamp,
    "ACCESS-PASSPHRASE": creds.passphrase,
    "Content-Type": "application/json",
    locale: "en-US",
  };
}

// ── API Calls ──────────────────────────────────────────────────

const BASE = "https://api.bitget.com";

/**
 * Test connection by calling the account endpoint.
 * Returns { ok: true } or { ok: false, error: string }.
 */
export async function testBitgetConnection(
  creds: BitgetCredentials,
): Promise<{ ok: boolean; error?: string }> {
  const path = "/api/v2/mix/account/accounts";
  const query = "?productType=USDT-FUTURES";
  const fullPath = path + query;

  try {
    const headers = buildHeaders(creds, "GET", fullPath);
    const res = await fetch(BASE + fullPath, { headers });
    const data = await res.json();

    if (data.code === "00000") {
      return { ok: true };
    }
    return { ok: false, error: data.msg || `Bitget error code ${data.code}` };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not reach Bitget API" };
  }
}

/**
 * Fetch futures fills from Bitget with cursor pagination.
 * Returns mapped trades + error list.
 */
export async function fetchBitgetFills(
  creds: BitgetCredentials,
  options?: { startTime?: number; maxPages?: number },
): Promise<BitgetSyncResult> {
  const rawFills: BitgetFill[] = [];
  const errors: string[] = [];
  let totalFetched = 0;
  let cursor: string | undefined;
  const maxPages = options?.maxPages ?? 50; // Safety limit
  const productType = "USDT-FUTURES";

  for (let page = 0; page < maxPages; page++) {
    const params = new URLSearchParams({ productType, limit: "100" });
    if (cursor) params.set("idLessThan", cursor);
    if (options?.startTime) params.set("startTime", options.startTime.toString());

    const path = "/api/v2/mix/order/fills";
    const query = "?" + params.toString();
    const fullPath = path + query;

    try {
      const headers = buildHeaders(creds, "GET", fullPath);
      const res = await fetch(BASE + fullPath, { headers });

      if (res.status === 429) {
        errors.push("Rate limited by Bitget. Partial results returned.");
        break;
      }

      if (res.status === 401 || res.status === 403) {
        errors.push("Authentication failed. Check your API key, secret, and passphrase.");
        break;
      }

      const json = await res.json();

      if (json.code !== "00000") {
        errors.push(`Bitget API error: ${json.msg || json.code}`);
        break;
      }

      const fillList: BitgetFill[] = json.data?.fillList ?? [];
      if (fillList.length === 0) break;

      totalFetched += fillList.length;
      rawFills.push(...fillList);

      // Cursor pagination: use the last fill's tradeId
      cursor = fillList[fillList.length - 1].tradeId;

      // If we got fewer than limit, there are no more pages
      if (fillList.length < 100) break;

      // Small delay between pages to respect rate limits
      await new Promise((r) => setTimeout(r, 100));
    } catch (err) {
      errors.push(err instanceof Error ? err.message : "Network error fetching fills");
      break;
    }
  }

  const fills = aggregateFills(rawFills);
  const constituentFillIds = rawFills.map((f) => f.tradeId);

  return { fills, fetched: totalFetched, errors, constituentFillIds };
}

// ── Aggregation ────────────────────────────────────────────────
// Groups fills by orderId so iceberg/split orders become one trade row.

function aggregateFills(rawFills: BitgetFill[]): MappedTrade[] {
  const groups = new Map<string, BitgetFill[]>();

  for (const fill of rawFills) {
    const key = fill.orderId || fill.tradeId;
    const existing = groups.get(key);
    if (existing) {
      existing.push(fill);
    } else {
      groups.set(key, [fill]);
    }
  }

  const trades: MappedTrade[] = [];

  for (const [groupKey, fills] of groups) {
    let totalNotional = 0;
    let totalSize = 0;
    let totalFees = 0;
    let totalProfit = 0;
    let earliestTime = Infinity;
    const fillIds: string[] = [];

    for (const f of fills) {
      const price = parseFloat(f.price) || 0;
      const size = parseFloat(f.size) || 0;
      totalNotional += price * size;
      totalSize += size;
      totalFees += Math.abs(parseFloat(f.fee) || 0);
      totalProfit += parseFloat(f.profit) || 0;
      const time = parseInt(f.cTime);
      if (time < earliestTime) earliestTime = time;
      fillIds.push(f.tradeId);
    }

    const vwap = totalSize > 0 ? totalNotional / totalSize : 0;
    const side = fills[0].side?.toLowerCase();
    const position: "long" | "short" = side === "buy" ? "long" : "short";

    const tags = ["bitget-api-sync"];
    if (fills.length > 1) {
      tags.push(`fills:${fills.length}`);
      for (const fid of fillIds) {
        tags.push(`fid:${fid}`);
      }
    }

    trades.push({
      symbol: fills[0].symbol,
      position,
      entry_price: vwap,
      exit_price: null,
      quantity: totalSize,
      fees: totalFees,
      open_timestamp: new Date(earliestTime).toISOString(),
      close_timestamp: null,
      pnl: totalProfit || null,
      broker_order_id: fills[0].orderId ? groupKey : fills[0].tradeId,
      broker_name: "Bitget",
      trade_source: "cex",
      tags,
      notes: null,
      stop_loss: null,
      profit_target: null,
      emotion: null,
      confidence: null,
      setup_type: null,
      process_score: null,
      checklist: null,
      review: null,
      sector: null,
      chain: null,
      dex_protocol: null,
      tx_hash: null,
      wallet_address: null,
      gas_fee: 0,
      gas_fee_native: 0,
      price_mae: null,
      price_mfe: null,
      mfe_timestamp: null,
      mae_timestamp: null,
    });
  }

  return trades;
}

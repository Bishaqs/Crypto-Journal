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
  const fills: MappedTrade[] = [];
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

      for (const fill of fillList) {
        fills.push(mapFillToTrade(fill));
      }

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

  return { fills, fetched: totalFetched, errors };
}

// ── Mapping ────────────────────────────────────────────────────

function mapFillToTrade(fill: BitgetFill): MappedTrade {
  const side = fill.side?.toLowerCase();
  // In futures: tradeSide may indicate "open" or "close"
  // For a journal, each fill is a row — the user can aggregate later
  const position: "long" | "short" = side === "buy" ? "long" : "short";

  return {
    symbol: fill.symbol,
    position,
    entry_price: parseFloat(fill.price) || 0,
    exit_price: null,
    quantity: parseFloat(fill.size) || 0,
    fees: Math.abs(parseFloat(fill.fee) || 0),
    open_timestamp: new Date(parseInt(fill.cTime)).toISOString(),
    close_timestamp: null,
    pnl: parseFloat(fill.profit) || null,
    broker_order_id: fill.tradeId,
    broker_name: "Bitget",
    trade_source: "cex",
    tags: ["bitget-api-sync"],
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
  };
}

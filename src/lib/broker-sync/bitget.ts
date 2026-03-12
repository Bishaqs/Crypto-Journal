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

export type BitgetFill = {
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

/** An order aggregated from one or more partial fills. */
export type AggregatedOrder = {
  orderId: string;
  symbol: string;
  side: string;
  tradeSide: "open" | "close";
  vwap: number;
  totalSize: number;
  totalFees: number;
  totalProfit: number;
  earliestTime: number;
  fillIds: string[];
};

export type BitgetSyncResult = {
  pairedTrades: MappedTrade[];
  unmatchedOpens: MappedTrade[];
  unmatchedCloses: AggregatedOrder[];
  fetched: number;
  errors: string[];
  allFillIds: string[];
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
 * Pairs open/close fills into complete trades using FIFO matching.
 */
export async function fetchBitgetFills(
  creds: BitgetCredentials,
  options?: { startTime?: number; maxPages?: number },
): Promise<BitgetSyncResult> {
  const rawFills: BitgetFill[] = [];
  const errors: string[] = [];
  let totalFetched = 0;
  let cursor: string | undefined;
  const maxPages = options?.maxPages ?? 50;
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

      cursor = fillList[fillList.length - 1].tradeId;
      if (fillList.length < 100) break;
      await new Promise((r) => setTimeout(r, 100));
    } catch (err) {
      errors.push(err instanceof Error ? err.message : "Network error fetching fills");
      break;
    }
  }

  const allFillIds = rawFills.map((f) => f.tradeId);
  const paired = pairBitgetFills(rawFills);

  return { ...paired, fetched: totalFetched, errors, allFillIds };
}

// ── Aggregation & Pairing ──────────────────────────────────────

const QTY_EPSILON = 1e-10;

/** Classify a fill as "open" or "close" using tradeSide or profit heuristic. */
function classifyFill(fill: BitgetFill): "open" | "close" {
  const ts = fill.tradeSide?.toLowerCase();
  if (ts === "open" || ts === "close") return ts;
  const profit = parseFloat(fill.profit) || 0;
  return profit !== 0 ? "close" : "open";
}

/** Group raw fills by orderId into aggregated orders. */
function aggregateByOrder(rawFills: BitgetFill[]): AggregatedOrder[] {
  const groups = new Map<string, BitgetFill[]>();

  for (const fill of rawFills) {
    const key = fill.orderId || fill.tradeId;
    const existing = groups.get(key);
    if (existing) existing.push(fill);
    else groups.set(key, [fill]);
  }

  const orders: AggregatedOrder[] = [];

  for (const [, fills] of groups) {
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

    orders.push({
      orderId: fills[0].orderId || fills[0].tradeId,
      symbol: fills[0].symbol,
      side: (fills[0].side ?? "buy").toLowerCase(),
      tradeSide: classifyFill(fills[0]),
      vwap: totalSize > 0 ? totalNotional / totalSize : 0,
      totalSize,
      totalFees,
      totalProfit,
      earliestTime,
      fillIds,
    });
  }

  orders.sort((a, b) => a.earliestTime - b.earliestTime);
  return orders;
}

/** Shared null-field defaults for MappedTrade. */
const NULL_FIELDS = {
  notes: null, stop_loss: null, profit_target: null, emotion: null,
  confidence: null, setup_type: null, process_score: null, checklist: null,
  review: null, sector: null, chain: null, dex_protocol: null, tx_hash: null,
  wallet_address: null, gas_fee: 0, gas_fee_native: 0, price_mae: null,
  price_mfe: null, mfe_timestamp: null, mae_timestamp: null,
} as const;

type PairResult = {
  pairedTrades: MappedTrade[];
  unmatchedOpens: MappedTrade[];
  unmatchedCloses: AggregatedOrder[];
};

/**
 * Pair open/close orders into complete trades using FIFO matching.
 * Adapted from preprocessBitgetFutures() in csv-import.ts.
 */
function pairBitgetFills(rawFills: BitgetFill[]): PairResult {
  const orders = aggregateByOrder(rawFills);

  const opens = orders.filter((o) => o.tradeSide === "open");
  const closes = orders.filter((o) => o.tradeSide === "close");

  // Build open pool keyed by "SYMBOL|polarity" (buy open=long, sell open=short)
  type OpenTracker = { order: AggregatedOrder; remainingQty: number };
  const openPool = new Map<string, OpenTracker[]>();

  for (const open of opens) {
    const polarity = open.side === "buy" ? "long" : "short";
    const key = `${open.symbol}|${polarity}`;
    if (!openPool.has(key)) openPool.set(key, []);
    openPool.get(key)!.push({ order: open, remainingQty: open.totalSize });
  }

  // FIFO match closes to opens
  const pairedTrades: MappedTrade[] = [];
  const unmatchedCloses: AggregatedOrder[] = [];

  for (const close of closes) {
    // Close: sell closes a long, buy closes a short
    const polarity: "long" | "short" = close.side === "sell" ? "long" : "short";
    const key = `${close.symbol}|${polarity}`;
    const pool = openPool.get(key) || [];

    let remainingCloseQty = close.totalSize;
    const matchedOpens: { order: AggregatedOrder; qty: number }[] = [];

    for (const tracker of pool) {
      if (remainingCloseQty <= QTY_EPSILON) break;
      if (tracker.remainingQty <= QTY_EPSILON) continue;

      const matched = Math.min(tracker.remainingQty, remainingCloseQty);
      matchedOpens.push({ order: tracker.order, qty: matched });
      tracker.remainingQty -= matched;
      if (Math.abs(tracker.remainingQty) < QTY_EPSILON) tracker.remainingQty = 0;
      remainingCloseQty -= matched;
      if (Math.abs(remainingCloseQty) < QTY_EPSILON) remainingCloseQty = 0;
    }

    if (matchedOpens.length > 0) {
      const totalOpenQty = matchedOpens.reduce((s, m) => s + m.qty, 0);
      const weightedEntry = matchedOpens.reduce(
        (s, m) => s + m.order.vwap * m.qty, 0,
      ) / totalOpenQty;

      const openFees = matchedOpens.reduce((s, m) => {
        const proportion = m.order.totalSize > 0 ? m.qty / m.order.totalSize : 1;
        return s + m.order.totalFees * proportion;
      }, 0);

      const earliestOpen = matchedOpens[0].order;
      const openFillIds = matchedOpens.flatMap((m) => m.order.fillIds);
      const closeFillIds = close.fillIds;

      const tags = ["bitget-api-sync"];
      for (const id of closeFillIds) tags.push(`close-fill:${id}`);
      for (const id of openFillIds.slice(1)) tags.push(`open-fill:${id}`);

      pairedTrades.push({
        symbol: close.symbol,
        position: polarity,
        entry_price: weightedEntry,
        exit_price: close.vwap,
        quantity: close.totalSize,
        fees: openFees + close.totalFees,
        open_timestamp: new Date(earliestOpen.earliestTime).toISOString(),
        close_timestamp: new Date(close.earliestTime).toISOString(),
        pnl: close.totalProfit || null,
        broker_order_id: earliestOpen.orderId,
        broker_name: "Bitget",
        trade_source: "cex",
        tags,
        ...NULL_FIELDS,
      });
    } else {
      unmatchedCloses.push(close);
    }
  }

  // Remaining unmatched opens
  const unmatchedOpens: MappedTrade[] = [];
  for (const [, trackers] of openPool) {
    for (const tracker of trackers) {
      if (tracker.remainingQty > QTY_EPSILON) {
        const o = tracker.order;
        const polarity: "long" | "short" = o.side === "buy" ? "long" : "short";
        const tags = ["bitget-api-sync"];
        if (o.fillIds.length > 1) {
          tags.push(`fills:${o.fillIds.length}`);
          for (const fid of o.fillIds) tags.push(`fid:${fid}`);
        }

        unmatchedOpens.push({
          symbol: o.symbol,
          position: polarity,
          entry_price: o.vwap,
          exit_price: null,
          quantity: tracker.remainingQty,
          fees: o.totalFees * (tracker.remainingQty / o.totalSize),
          open_timestamp: new Date(o.earliestTime).toISOString(),
          close_timestamp: null,
          pnl: null,
          broker_order_id: o.orderId,
          broker_name: "Bitget",
          trade_source: "cex",
          tags,
          ...NULL_FIELDS,
        });
      }
    }
  }

  return { pairedTrades, unmatchedOpens, unmatchedCloses };
}

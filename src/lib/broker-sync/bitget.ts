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

/** Core fields for a broker-synced trade. Only includes columns guaranteed
 *  to exist in the DB. Additional nullable columns (notes, emotion, etc.)
 *  are omitted and default to NULL via PostgreSQL column defaults. */
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
  /** Timestamp (ms) of the most recent fill fetched, for tracking sync progress. */
  latestFillTime: number | null;
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

export function buildHeaders(
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
 * Fetch futures fills from Bitget with sliding 7-day time windows.
 * Bitget enforces a max 7-day range between startTime/endTime per request.
 * Windows are processed NEWEST→OLDEST so recent trades are fetched first.
 */
export async function fetchBitgetFills(
  creds: BitgetCredentials,
  options?: { startTime?: number; maxPages?: number; daysBack?: number; deadlineMs?: number; oldestFirst?: boolean; maxWindows?: number },
): Promise<BitgetSyncResult> {
  const rawFills: BitgetFill[] = [];
  const errors: string[] = [];
  let totalFetched = 0;
  const productType = "USDT-FUTURES";
  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
  const maxPagesPerWindow = options?.maxPages ?? 5;

  const defaultDays = options?.daysBack ?? 14;
  const earliest = options?.startTime ?? Date.now() - defaultDays * 24 * 60 * 60 * 1000;
  const now = Date.now();

  // Build windows. Default: newest first so recent trades survive rate limits.
  // oldestFirst: used for full sync so incremental progress works across multiple runs.
  const windows: { start: number; end: number }[] = [];
  for (let winStart = earliest; winStart < now; winStart += SEVEN_DAYS) {
    windows.push({ start: winStart, end: Math.min(winStart + SEVEN_DAYS, now) });
  }
  if (!options?.oldestFirst) {
    windows.reverse();
  }

  const maxWindows = options?.maxWindows ?? 2;
  let windowsCompleted = 0;

  for (let winIdx = 0; winIdx < windows.length; winIdx++) {
    const win = windows[winIdx];

    // Cap windows per invocation so each request finishes within deadline
    if (windowsCompleted >= maxWindows) {
      errors.push(`Stopped after ${windowsCompleted} of ${windows.length} windows (chunk limit). Retry to continue.`);
      break;
    }

    // Deadline guard: stop fetching if running out of time (1.5s margin for dedup/insert)
    if (options?.deadlineMs && Date.now() >= options.deadlineMs - 1500) {
      errors.push(`Stopped early — ${windows.length - winIdx} of ${windows.length} windows remaining (approaching deadline).`);
      break;
    }

    let cursor: string | undefined;
    let rateLimited = false;

    for (let page = 0; page < maxPagesPerWindow; page++) {
      // Deadline check per page — don't start another API call if time is up
      if (options?.deadlineMs && Date.now() >= options.deadlineMs - 1500) {
        errors.push(`Stopped mid-window at page ${page} — approaching deadline.`);
        break;
      }

      const params = new URLSearchParams({ productType, limit: "100" });
      params.set("startTime", win.start.toString());
      params.set("endTime", win.end.toString());
      if (cursor) params.set("idLessThan", cursor);

      const path = "/api/v2/mix/order/fills";
      const query = "?" + params.toString();
      const fullPath = path + query;

      let retries = 0;
      let success = false;

      while (retries < 3 && !success) {
        try {
          const headers = buildHeaders(creds, "GET", fullPath);
          const res = await fetch(BASE + fullPath, {
            headers,
            signal: AbortSignal.timeout(4000),
          });

          if (res.status === 429) {
            retries++;
            if (retries >= 3) {
              errors.push("Rate limited by Bitget after retries. Partial results.");
              rateLimited = true;
              break;
            }
            await new Promise((r) => setTimeout(r, 500 * retries));
            continue;
          }

          if (res.status === 401 || res.status === 403) {
            errors.push("Authentication failed. Check your API key, secret, and passphrase.");
            return buildResult(rawFills, totalFetched, errors);
          }

          // Retry on 5xx (Bitget returns HTML error pages for 502/503)
          if (!res.ok) {
            retries++;
            if (retries >= 3) {
              errors.push(`Bitget server error (HTTP ${res.status}) after retries. Partial results.`);
              break; // Move to next window, not fatal abort
            }
            await new Promise((r) => setTimeout(r, 500 * retries));
            continue;
          }

          const json = await res.json();

          if (json.code !== "00000") {
            errors.push(`Bitget API error: ${json.msg || json.code}`);
            return buildResult(rawFills, totalFetched, errors);
          }

          const fillList: BitgetFill[] = json.data?.fillList ?? [];
          success = true;

          if (fillList.length === 0) break;
          totalFetched += fillList.length;
          rawFills.push(...fillList);

          cursor = fillList[fillList.length - 1].tradeId;
          if (fillList.length < 100) break;
        } catch (err) {
          errors.push(err instanceof Error ? err.message : "Network error fetching fills");
          break; // Continue to next window instead of aborting all
        }
      }

      if (rateLimited) break; // Rate limited — stop all windows
    }
    // Count completed windows (once per window, not per page)
    windowsCompleted++;
    if (rateLimited) break; // Propagate rate limit break to outer loop
  }

  return buildResult(rawFills, totalFetched, errors);
}

/** Build the final sync result from collected fills. */
function buildResult(
  rawFills: BitgetFill[],
  totalFetched: number,
  errors: string[],
): BitgetSyncResult {
  const allFillIds = rawFills.map((f) => f.tradeId);
  const paired = pairBitgetFills(rawFills);
  // Track the most recent fill time for sync progress cursor
  let latestFillTime: number | null = null;
  for (const f of rawFills) {
    const t = parseInt(f.cTime);
    if (!isNaN(t) && (latestFillTime === null || t > latestFillTime)) {
      latestFillTime = t;
    }
  }
  return { ...paired, fetched: totalFetched, errors, allFillIds, latestFillTime };
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
        });
      }
    }
  }

  return { pairedTrades, unmatchedOpens, unmatchedCloses };
}

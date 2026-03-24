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
  baseVolume: string;      // V2 field (was "size" in V1)
  size?: string;           // V1 fallback
  fee?: string;            // V1 field
  feeDetail?: Array<{ totalFee: string; feeCoin: string }>; // V2 field
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
  /** End time (ms) of the last processed window. Used to advance cursor past empty periods. */
  lastWindowEnd: number | null;
  /** Classification stats for diagnostics. */
  classificationStats: { opens: number; closes: number; inMemoryMatched: number };
  /** Sample of raw fill data for debugging classification issues. */
  sampleFills: Array<{ orderId: string; side: string; tradeSide?: string; profit: string; symbol: string }>;
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

// ── Position-based sync (primary) ────────────────────────────

/** Raw response shape from GET /api/v2/mix/position/history-position */
export type BitgetHistoryPosition = {
  positionId: string;
  symbol: string;
  holdSide: string;          // "long" | "short"
  openAvgPrice: string;
  closeAvgPrice: string;
  openTotalPos: string;
  closeTotalPos: string;
  pnl: string;
  netProfit: string;
  totalFunding: string;
  openFee: string;
  closeFee: string;
  marginCoin: string;
  marginMode: string;        // "isolated" | "crossed"
  posMode: string;           // "one_way_mode" | "hedge_mode"
  ctime: string;             // open timestamp ms
  utime: string;             // close timestamp ms
};

export type PositionSyncResult = {
  closedTrades: MappedTrade[];
  openTrades: MappedTrade[];
  fetched: number;
  errors: string[];
  latestCloseTime: number | null;
};

/**
 * Fetch closed positions from Bitget's history-position endpoint.
 * Returns COMPLETE trades with entry+exit — no classification or pairing needed.
 * Limitation: only data within 3 months.
 * Queries multiple product types (USDT-FUTURES + COIN-FUTURES) to catch all positions.
 */
export async function fetchBitgetPositions(
  creds: BitgetCredentials,
  options?: { deadlineMs?: number; maxPages?: number; productTypes?: string[] },
): Promise<PositionSyncResult> {
  const productTypes = options?.productTypes ?? ["USDT-FUTURES"];
  const allClosed: MappedTrade[] = [];
  const allErrors: string[] = [];
  let totalFetched = 0;
  let latestCloseTime: number | null = null;

  for (const productType of productTypes) {
    if (options?.deadlineMs && Date.now() >= options.deadlineMs - 2000) {
      allErrors.push(`Skipped ${productType} (deadline).`);
      break;
    }
    const result = await fetchBitgetPositionsForProduct(creds, productType, options);
    allClosed.push(...result.closedTrades);
    allErrors.push(...result.errors);
    totalFetched += result.fetched;
    if (result.latestCloseTime !== null && (latestCloseTime === null || result.latestCloseTime > latestCloseTime)) {
      latestCloseTime = result.latestCloseTime;
    }
  }

  // Deduplicate by positionId across product types
  const seen = new Set<string>();
  const uniqueTrades: MappedTrade[] = [];
  for (const t of allClosed) {
    if (!seen.has(t.broker_order_id)) {
      seen.add(t.broker_order_id);
      uniqueTrades.push(t);
    }
  }

  return { closedTrades: uniqueTrades, openTrades: [], fetched: totalFetched, errors: allErrors, latestCloseTime };
}

/** Fetch closed positions for a single product type. */
async function fetchBitgetPositionsForProduct(
  creds: BitgetCredentials,
  productType: string,
  options?: { deadlineMs?: number; maxPages?: number },
): Promise<PositionSyncResult> {
  const closedTrades: MappedTrade[] = [];
  const errors: string[] = [];
  let fetched = 0;
  let latestCloseTime: number | null = null;
  const maxPages = options?.maxPages ?? 10;

  let cursor: string | undefined;

  for (let page = 0; page < maxPages; page++) {
    if (options?.deadlineMs && Date.now() >= options.deadlineMs - 1500) {
      errors.push(`Stopped ${productType} after ${page} pages (deadline). Retry to continue.`);
      break;
    }

    // Don't filter by marginCoin — let the API return all positions for this product type.
    // Filtering by marginCoin=USDT can exclude positions in certain account configurations.
    const params = new URLSearchParams({ productType, limit: "100" });
    if (cursor) params.set("endId", cursor);

    const path = "/api/v2/mix/position/history-position";
    const query = "?" + params.toString();
    const fullPath = path + query;

    try {
      const headers = buildHeaders(creds, "GET", fullPath);
      const res = await fetch(BASE + fullPath, {
        headers,
        signal: AbortSignal.timeout(4000),
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          errors.push("Auth failed. Check API key/secret/passphrase.");
          break;
        }
        // 404 = endpoint not available for this account type — silent fallback to fills
        if (res.status === 404) {
          console.log(`[sync:positions] history-position returned 404 — endpoint not available, will use fills fallback`);
          break;
        }
        errors.push(`Bitget server error (HTTP ${res.status}).`);
        break;
      }

      const json = await res.json();
      if (json.code !== "00000") {
        errors.push(`Bitget API error: ${json.msg || json.code}`);
        break;
      }

      const list: BitgetHistoryPosition[] = json.data?.list ?? [];
      if (page === 0) {
        console.log(`[sync:positions] history-position page 0: ${list.length} items. First:`, list[0] ? JSON.stringify(list[0]).slice(0, 300) : "none");
      }
      if (list.length === 0) break;

      fetched += list.length;

      for (const pos of list) {
        try {
          let closePrice = parseFloat(pos.closeAvgPrice) || 0;
          const closeTime = parseInt(pos.utime);

          // Skip positions that haven't been closed (closeAvgPrice = 0 or missing)
          if (closePrice <= 0) {
            const closedQty = parseFloat(pos.closeTotalPos) || 0;
            const rawPnl = parseFloat(pos.pnl);
            const entryPrice = parseFloat(pos.openAvgPrice) || 0;

            // If position was closed (has qty + pnl), derive close price from PnL
            if (closedQty > 0 && !isNaN(rawPnl) && entryPrice > 0) {
              const dir = pos.holdSide?.toLowerCase() === "short" ? -1 : 1;
              closePrice = entryPrice + (rawPnl / (dir * closedQty));
              console.log(`[sync:positions] Derived closePrice for ${pos.symbol} ${pos.holdSide}: ${closePrice.toFixed(4)} (pnl=${rawPnl}, entry=${entryPrice}, qty=${closedQty})`);
            } else {
              console.log(`[sync:positions] Skipped ${pos.symbol} ${pos.holdSide} posId=${pos.positionId} (closeAvgPrice=${pos.closeAvgPrice}, closeTotalPos=${pos.closeTotalPos}, pnl=${pos.pnl})`);
              continue;
            }
          }

          if (!isNaN(closeTime) && (latestCloseTime === null || closeTime > latestCloseTime)) {
            latestCloseTime = closeTime;
          }

          const holdSide = pos.holdSide?.toLowerCase() as "long" | "short";
          // Use gross pnl (before fees) — matches Bitget's "Realized PNL" display.
          // Fees are stored separately in the fees column.
          const rawPnl = parseFloat(pos.pnl);
          const tradePnl = !isNaN(rawPnl) ? rawPnl : null;

          closedTrades.push({
            symbol: pos.symbol,
            position: holdSide === "short" ? "short" : "long",
            entry_price: parseFloat(pos.openAvgPrice) || 0,
            exit_price: closePrice,
            quantity: parseFloat(pos.closeTotalPos) || parseFloat(pos.openTotalPos) || 0,
            fees: Math.abs(parseFloat(pos.openFee) || 0) + Math.abs(parseFloat(pos.closeFee) || 0),
            pnl: tradePnl,
            open_timestamp: new Date(parseInt(pos.ctime)).toISOString(),
            close_timestamp: new Date(closeTime).toISOString(),
            broker_order_id: pos.positionId,
            broker_name: "Bitget",
            trade_source: "cex",
            tags: ["bitget-api-sync", "from-position-history"],
          });
        } catch (err) {
          errors.push(`Skipped position ${pos.symbol ?? "?"}: ${err instanceof Error ? err.message : "parse error"}`);
          continue;
        }
      }

      const prevCursor = cursor;
      cursor = json.data?.endId ?? list[list.length - 1].positionId;
      if (cursor === prevCursor) {
        console.log(`[sync:positions] Cursor stuck at ${cursor} — stopping pagination`);
        break;
      }
      if (list.length < 100) break; // Last page
    } catch (err) {
      errors.push(err instanceof Error ? err.message : "Network error fetching positions");
      break;
    }
  }

  // Log skip summary for diagnostics
  const totalSkipped = fetched - closedTrades.length;
  const symbols = [...new Set(closedTrades.map(t => t.symbol))];
  console.log(`[sync:positions:${productType}] ${fetched} fetched, ${closedTrades.length} mapped, ${totalSkipped} skipped. Symbols: ${symbols.join(", ") || "none"}`);

  // Deduplicate by positionId — broken pagination can return same positions on multiple pages
  const seen = new Set<string>();
  const uniqueTrades: MappedTrade[] = [];
  for (const t of closedTrades) {
    if (!seen.has(t.broker_order_id)) {
      seen.add(t.broker_order_id);
      uniqueTrades.push(t);
    }
  }
  if (uniqueTrades.length < closedTrades.length) {
    console.log(`[sync:positions:${productType}] Deduped ${closedTrades.length} → ${uniqueTrades.length} positions`);
  }

  return { closedTrades: uniqueTrades, openTrades: [], fetched, errors, latestCloseTime };
}

/** Raw response shape from GET /api/v2/mix/position/all-position.
 *  Bitget API uses inconsistent casing — some accounts return `ctime`,
 *  others return `cTime`. We accept both. */
type BitgetOpenPosition = {
  positionId: string;
  symbol: string;
  holdSide: string;
  openPriceAvg: string;
  total: string;
  available: string;
  marginMode: string;
  posMode: string;
  unrealizedPL: string;
  achievedProfits: string;
  ctime?: string;
  cTime?: string;
  utime?: string;
  uTime?: string;
};

/**
 * Fetch currently-open positions (Live trades).
 * Queries multiple product types for full coverage.
 */
export async function fetchBitgetOpenPositions(
  creds: BitgetCredentials,
  options?: { productTypes?: string[]; connectionId?: string },
): Promise<{ openTrades: MappedTrade[]; errors: string[] }> {
  const productTypes = options?.productTypes ?? ["USDT-FUTURES"];
  const allOpen: MappedTrade[] = [];
  const allErrors: string[] = [];

  const connId = options?.connectionId;
  for (const productType of productTypes) {
    const result = await fetchBitgetOpenPositionsForProduct(creds, productType, connId);
    allOpen.push(...result.openTrades);
    allErrors.push(...result.errors);
  }

  return { openTrades: allOpen, errors: allErrors };
}

/** Fetch open positions for a single product type. */
async function fetchBitgetOpenPositionsForProduct(
  creds: BitgetCredentials,
  productType: string,
  connectionId?: string,
): Promise<{ openTrades: MappedTrade[]; errors: string[] }> {
  const path = "/api/v2/mix/position/all-position";
  // Don't filter by marginCoin — return all positions for this product type
  const query = `?productType=${productType}`;
  const fullPath = path + query;

  try {
    const headers = buildHeaders(creds, "GET", fullPath);
    const res = await fetch(BASE + fullPath, {
      headers,
      signal: AbortSignal.timeout(4000),
    });

    if (!res.ok) {
      // 404 is expected for some account types — silently return empty
      if (res.status === 404) {
        console.log(`[sync:positions:${productType}] all-position returned 404 — endpoint not available`);
        return { openTrades: [], errors: [] };
      }
      return { openTrades: [], errors: [`${productType} HTTP ${res.status}`] };
    }

    const json = await res.json();
    if (json.code !== "00000") {
      // "Request URL NOT FOUND" is also a 404-equivalent — not a real error
      const msg = json.msg || json.code;
      if (msg.toLowerCase().includes("not found")) {
        console.log(`[sync:positions:${productType}] all-position: ${msg}`);
        return { openTrades: [], errors: [] };
      }
      return { openTrades: [], errors: [`${productType}: ${msg}`] };
    }

    const list: BitgetOpenPosition[] = json.data ?? [];
    console.log(`[sync:positions:${productType}] all-position: ${list.length} items. First:`, list[0] ? JSON.stringify(list[0]).slice(0, 300) : "none");
    const openTrades: MappedTrade[] = [];
    const errors: string[] = [];

    for (const pos of list) {
      try {
        // Use 'available' (current open qty), NOT 'total' (which includes closed qty)
        const qty = parseFloat(pos.available) || 0;
        if (qty < 1e-10) continue; // Skip closed positions

        const holdSide = pos.holdSide?.toLowerCase() as "long" | "short";
        // Handle both ctime and cTime — Bitget API uses inconsistent casing
        const rawCtime = pos.ctime ?? pos.cTime;
        const ctime = parseInt(rawCtime as string);
        openTrades.push({
          symbol: pos.symbol,
          position: holdSide === "short" ? "short" : "long",
          entry_price: parseFloat(pos.openPriceAvg) || 0,
          exit_price: null,
          quantity: qty,
          fees: 0, // Open positions don't have total fees yet
          pnl: null,
          open_timestamp: !isNaN(ctime) && ctime > 0 ? new Date(ctime).toISOString() : new Date().toISOString(),
          close_timestamp: null,
          // Use real positionId when available — matches history-position's broker_order_id
          // so the sync engine can match open→closed without ID mismatch.
          // Fallback includes connectionId to prevent collisions across connections.
          broker_order_id: pos.positionId && pos.positionId.length > 0
            ? pos.positionId
            : `open:${connectionId ? connectionId + ":" : ""}${pos.symbol}:${holdSide}`,
          broker_name: "Bitget",
          trade_source: "cex",
          tags: ["bitget-api-sync", "from-open-position"],
        });
      } catch (err) {
        errors.push(`Skipped open position ${pos.symbol ?? "?"}: ${err instanceof Error ? err.message : "parse error"}`);
      }
    }

    return { openTrades, errors };
  } catch (err) {
    return { openTrades: [], errors: [err instanceof Error ? err.message : "Network error"] };
  }
}

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
 * Queries multiple product types for full coverage.
 */
export async function fetchBitgetFills(
  creds: BitgetCredentials,
  options?: { startTime?: number; maxPages?: number; daysBack?: number; deadlineMs?: number; oldestFirst?: boolean; maxWindows?: number; productTypes?: string[] },
): Promise<BitgetSyncResult> {
  const productTypes = options?.productTypes ?? ["USDT-FUTURES"];
  const allResults: BitgetSyncResult[] = [];

  for (const pt of productTypes) {
    if (options?.deadlineMs && Date.now() >= options.deadlineMs - 2000) {
      break;
    }
    const result = await fetchBitgetFillsForProduct(creds, pt, options);
    allResults.push(result);
  }

  // Merge results from all product types
  if (allResults.length === 0) {
    return buildResult([], 0, ["No product types queried (deadline)."]);
  }
  if (allResults.length === 1) return allResults[0];

  // Combine all results
  const mergedPaired: MappedTrade[] = [];
  const mergedOpens: MappedTrade[] = [];
  const mergedCloses: AggregatedOrder[] = [];
  const mergedErrors: string[] = [];
  const mergedFillIds: string[] = [];
  let mergedFetched = 0;
  let mergedLatestFill: number | null = null;
  let mergedLastWindowEnd: number | null = null;
  let mergedStats = { opens: 0, closes: 0, inMemoryMatched: 0 };
  const mergedSampleFills: Array<{ orderId: string; side: string; tradeSide?: string; profit: string; symbol: string }> = [];

  for (const r of allResults) {
    mergedPaired.push(...r.pairedTrades);
    mergedOpens.push(...r.unmatchedOpens);
    mergedCloses.push(...r.unmatchedCloses);
    mergedErrors.push(...r.errors);
    mergedFillIds.push(...r.allFillIds);
    mergedFetched += r.fetched;
    if (r.latestFillTime !== null && (mergedLatestFill === null || r.latestFillTime > mergedLatestFill)) {
      mergedLatestFill = r.latestFillTime;
    }
    if (r.lastWindowEnd !== null && (mergedLastWindowEnd === null || r.lastWindowEnd > mergedLastWindowEnd)) {
      mergedLastWindowEnd = r.lastWindowEnd;
    }
    mergedStats.opens += r.classificationStats.opens;
    mergedStats.closes += r.classificationStats.closes;
    mergedStats.inMemoryMatched += r.classificationStats.inMemoryMatched;
    mergedSampleFills.push(...r.sampleFills);
  }

  return {
    pairedTrades: mergedPaired,
    unmatchedOpens: mergedOpens,
    unmatchedCloses: mergedCloses,
    fetched: mergedFetched,
    errors: mergedErrors,
    allFillIds: mergedFillIds,
    latestFillTime: mergedLatestFill,
    lastWindowEnd: mergedLastWindowEnd,
    classificationStats: mergedStats,
    sampleFills: mergedSampleFills.slice(0, 10),
  };
}

/** Fetch fills for a single product type. */
async function fetchBitgetFillsForProduct(
  creds: BitgetCredentials,
  productType: string,
  options?: { startTime?: number; maxPages?: number; daysBack?: number; deadlineMs?: number; oldestFirst?: boolean; maxWindows?: number },
): Promise<BitgetSyncResult> {
  const rawFills: BitgetFill[] = [];
  const errors: string[] = [];
  let totalFetched = 0;
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
  let lastWindowEnd: number | null = null;

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
    lastWindowEnd = win.end;
    windowsCompleted++;
    if (rateLimited) break; // Propagate rate limit break to outer loop
  }

  return { ...buildResult(rawFills, totalFetched, errors), lastWindowEnd };
}

/** Build the final sync result from collected fills. */
function buildResult(
  rawFills: BitgetFill[],
  totalFetched: number,
  errors: string[],
): BitgetSyncResult {
  // Deduplicate fills by tradeId — overlapping 7-day windows can return the
  // same fill twice, which would double quantity/fees in aggregateByOrder.
  const seen = new Set<string>();
  const uniqueFills: BitgetFill[] = [];
  for (const f of rawFills) {
    if (!seen.has(f.tradeId)) {
      seen.add(f.tradeId);
      uniqueFills.push(f);
    }
  }
  if (uniqueFills.length < rawFills.length) {
    const dupeCount = rawFills.length - uniqueFills.length;
    errors.push(`Deduplicated ${dupeCount} duplicate fill${dupeCount !== 1 ? "s" : ""} from overlapping windows.`);
  }

  const allFillIds = uniqueFills.map((f) => f.tradeId);
  const paired = pairBitgetFills(uniqueFills);
  // Track the most recent fill time for sync progress cursor
  let latestFillTime: number | null = null;
  for (const f of rawFills) {
    const t = parseInt(f.cTime);
    if (!isNaN(t) && (latestFillTime === null || t > latestFillTime)) {
      latestFillTime = t;
    }
  }
  // Capture sample fills for debugging classification
  const sampleFills = uniqueFills.slice(0, 10).map((f) => ({
    orderId: f.orderId,
    side: f.side,
    tradeSide: f.tradeSide,
    profit: f.profit,
    symbol: f.symbol,
  }));
  return { ...paired, fetched: totalFetched, errors, allFillIds, latestFillTime, lastWindowEnd: null, classificationStats: paired.classificationStats, sampleFills };
}

// ── Aggregation & Pairing ──────────────────────────────────────


/** Classify an order by checking ALL fills — not just the first one.
 *  Handles both hedge mode (tradeSide="open"/"close") and one-way mode
 *  (tradeSide="sell_single"/"buy_single") from Bitget V2 API. */
function classifyOrderFills(fills: BitgetFill[]): "open" | "close" {
  // Priority 1: Any fill with explicit tradeSide="close" → order is a close (hedge mode)
  for (const fill of fills) {
    if (fill.tradeSide?.toLowerCase() === "close") return "close";
  }
  // Priority 2: One-way mode — "sell_single"/"buy_single" don't indicate open/close,
  // so we rely on the profit field. Any nonzero profit → close.
  for (const fill of fills) {
    if ((parseFloat(fill.profit) || 0) !== 0) return "close";
  }
  // Priority 3: Any fill with explicit tradeSide="open" → order is an open (hedge mode)
  for (const fill of fills) {
    if (fill.tradeSide?.toLowerCase() === "open") return "open";
  }
  // Priority 4: One-way mode with profit=0 — use tradeSide as directional hint.
  // In one-way mode, "sell_single" on a predominantly long account likely closes a long.
  // BUT we can't be sure without position context, so fall back to "open".
  // The in-memory cross-sync and Phase C will catch misclassified closes later.
  return "open";
}

/** Group raw fills into aggregated orders.
 *  Primary key: orderId (when fills share one).
 *  Secondary key: symbol|side|minute — merges iceberg/partial fills that have
 *  unique orderIds but are logically one order (common in one-way mode). */
function aggregateByOrder(rawFills: BitgetFill[]): AggregatedOrder[] {
  const groups = new Map<string, BitgetFill[]>();

  // First pass: group by orderId
  const byOrderId = new Map<string, BitgetFill[]>();
  for (const fill of rawFills) {
    const oid = fill.orderId || fill.tradeId;
    if (!byOrderId.has(oid)) byOrderId.set(oid, []);
    byOrderId.get(oid)!.push(fill);
  }

  // Second pass: merge single-fill "orders" that share symbol+side+minute
  // These are iceberg fills with unique orderIds
  for (const [oid, fills] of byOrderId) {
    if (fills.length > 1) {
      // Multiple fills share this orderId — genuine multi-fill order
      groups.set(oid, fills);
    } else {
      // Single fill — might be an iceberg. Group by symbol+side+minute
      const f = fills[0];
      const minute = Math.floor(parseInt(f.cTime) / 60000);
      const mergeKey = `${f.symbol}|${(f.side ?? "buy").toLowerCase()}|${minute}`;
      if (!groups.has(mergeKey)) groups.set(mergeKey, []);
      groups.get(mergeKey)!.push(f);
    }
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
      const size = parseFloat(f.baseVolume) || parseFloat(f.size as string) || 0;
      totalNotional += price * size;
      totalSize += size;
      let fee = 0;
      if (f.feeDetail && f.feeDetail.length > 0) {
        for (const fd of f.feeDetail) {
          fee += Math.abs(parseFloat(fd.totalFee) || 0);
        }
      } else {
        fee = Math.abs(parseFloat(f.fee ?? "0") || 0);
      }
      totalFees += fee;
      totalProfit += parseFloat(f.profit) || 0;
      const time = parseInt(f.cTime);
      if (time < earliestTime) earliestTime = time;
      fillIds.push(f.tradeId);
    }

    orders.push({
      orderId: fills[0].orderId || fills[0].tradeId,
      symbol: fills[0].symbol,
      side: (fills[0].side ?? "buy").toLowerCase(),
      tradeSide: classifyOrderFills(fills),
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
  classificationStats: { opens: number; closes: number; inMemoryMatched: number };
};

/**
 * Position-tracking approach: uses `side` (buy/sell) to determine trade direction
 * instead of relying on `tradeSide`/`profit` classification (which fails in one-way mode).
 *
 * How it works:
 * - Track net position per symbol chronologically
 * - Buy = increase long / decrease short
 * - Sell = increase short / decrease long
 * - When position returns to zero → completed trade (paired)
 * - Handles partial fills via quantity tracking
 *
 * This is how other trading journals (Tradervue, Kinfo, etc.) handle broker sync.
 */
function pairBitgetFills(rawFills: BitgetFill[]): PairResult {
  const orders = aggregateByOrder(rawFills);
  // orders are sorted by earliestTime ASC from aggregateByOrder

  type Entry = { order: AggregatedOrder; remainingQty: number };
  type Position = { direction: "long" | "short"; entries: Entry[]; totalQty: number };
  const positions = new Map<string, Position>();

  const pairedTrades: MappedTrade[] = [];
  const crossInvCloses: AggregatedOrder[] = [];
  let matchedCount = 0;

  for (const order of orders) {
    const isBuy = order.side === "buy";
    const qty = order.totalSize;
    const pos = positions.get(order.symbol);

    if (!pos) {
      // No existing position → this fill opens a new one
      positions.set(order.symbol, {
        direction: isBuy ? "long" : "short",
        entries: [{ order, remainingQty: qty }],
        totalQty: qty,
      });
      continue;
    }

    const sameDir =
      (pos.direction === "long" && isBuy) ||
      (pos.direction === "short" && !isBuy);

    if (sameDir) {
      // Same direction → adding to position
      pos.entries.push({ order, remainingQty: qty });
      pos.totalQty += qty;
    } else {
      // Opposite direction → closing position (FIFO by entry time)
      let closeRemaining = qty;

      while (closeRemaining > 1e-10 && pos.entries.length > 0) {
        const entry = pos.entries[0];
        const matchQty = Math.min(entry.remainingQty, closeRemaining);

        const tags = ["bitget-api-sync"];
        for (const id of order.fillIds) tags.push(`close-fill:${id}`);
        if (entry.order.fillIds.length > 1) {
          tags.push(`fills:${entry.order.fillIds.length}`);
          for (const fid of entry.order.fillIds) tags.push(`fid:${fid}`);
        }

        const entryProportion = entry.order.totalSize > 0 ? matchQty / entry.order.totalSize : 1;
        const closeProportion = qty > 0 ? matchQty / qty : 1;

        pairedTrades.push({
          symbol: order.symbol,
          position: pos.direction,
          entry_price: entry.order.vwap,
          exit_price: order.vwap,
          quantity: matchQty,
          fees: entry.order.totalFees * entryProportion + order.totalFees * closeProportion,
          open_timestamp: new Date(entry.order.earliestTime).toISOString(),
          close_timestamp: new Date(order.earliestTime).toISOString(),
          pnl: order.totalProfit !== 0 ? order.totalProfit * closeProportion : 0,
          broker_order_id: entry.order.orderId,
          broker_name: "Bitget",
          trade_source: "cex",
          tags,
        });

        matchedCount++;
        closeRemaining -= matchQty;
        entry.remainingQty -= matchQty;
        pos.totalQty -= matchQty;
        if (entry.remainingQty < 1e-10) pos.entries.shift();
      }

      if (closeRemaining > 1e-10) {
        if (pos.entries.length === 0) {
          // Position fully consumed → remainder opens opposite direction (position flip)
          positions.set(order.symbol, {
            direction: isBuy ? "long" : "short",
            entries: [{ order: { ...order, totalSize: closeRemaining }, remainingQty: closeRemaining }],
            totalQty: closeRemaining,
          });
        } else {
          // Excess close beyond position — cross-invocation close
          crossInvCloses.push({ ...order, totalSize: closeRemaining });
        }
      }

      if (pos.totalQty < 1e-10 && pos.entries.length === 0) {
        positions.delete(order.symbol);
      }
    }
  }

  // Remaining positions → unmatched opens
  const unmatchedOpens: MappedTrade[] = [];
  for (const [, pos] of positions) {
    for (const entry of pos.entries) {
      if (entry.remainingQty < 1e-10) continue;
      const tags = ["bitget-api-sync"];
      if (entry.order.fillIds.length > 1) {
        tags.push(`fills:${entry.order.fillIds.length}`);
        for (const fid of entry.order.fillIds) tags.push(`fid:${fid}`);
      }
      const proportion = entry.order.totalSize > 0 ? entry.remainingQty / entry.order.totalSize : 1;
      unmatchedOpens.push({
        symbol: entry.order.symbol,
        position: pos.direction,
        entry_price: entry.order.vwap,
        exit_price: null,
        quantity: entry.remainingQty,
        fees: entry.order.totalFees * proportion,
        open_timestamp: new Date(entry.order.earliestTime).toISOString(),
        close_timestamp: null,
        pnl: null,
        broker_order_id: entry.remainingQty < entry.order.totalSize - 1e-10
          ? `${entry.order.orderId}:partial`
          : entry.order.orderId,
        broker_name: "Bitget",
        trade_source: "cex",
        tags,
      });
    }
  }

  // Merge fills of the same order: combine trades with same symbol + open time + close time
  // This handles iceberg/partial fills that have different orderIds but are logically one trade
  const mergedPaired = mergeSameTimestampTrades(pairedTrades);
  const mergedOpens = mergeSameTimestampTrades(unmatchedOpens);

  // Diagnostics: keep old classification stats for debugging
  const classifiedOpens = orders.filter((o) => o.tradeSide === "open").length;
  const classifiedCloses = orders.filter((o) => o.tradeSide === "close").length;

  return {
    pairedTrades: mergedPaired,
    unmatchedOpens: mergedOpens,
    unmatchedCloses: crossInvCloses,
    classificationStats: {
      opens: classifiedOpens,
      closes: classifiedCloses,
      inMemoryMatched: matchedCount,
    },
  };
}

/** Merge trades with the same symbol + open_timestamp + close_timestamp into one combined trade.
 *  Sums quantity, fees, PnL. Computes VWAP for entry/exit prices. */
function mergeSameTimestampTrades(trades: MappedTrade[]): MappedTrade[] {
  if (trades.length <= 1) return trades;

  const groups = new Map<string, MappedTrade[]>();
  for (const t of trades) {
    // Truncate to minute — fills of the same order have timestamps within the same minute
    const openMin = t.open_timestamp.slice(0, 16);
    const closeMin = t.close_timestamp?.slice(0, 16) ?? "";
    const key = `${t.symbol}|${t.position}|${openMin}|${closeMin}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(t);
  }

  const merged: MappedTrade[] = [];
  for (const [, group] of groups) {
    if (group.length === 1) {
      merged.push(group[0]);
      continue;
    }

    // Combine: VWAP prices, sum quantity/fees/pnl, merge tags
    let totalQty = 0;
    let totalEntryNotional = 0;
    let totalExitNotional = 0;
    let totalFees = 0;
    let totalPnl = 0;
    let hasPnl = false;
    const allTags = new Set<string>();

    for (const t of group) {
      totalQty += t.quantity;
      totalEntryNotional += t.entry_price * t.quantity;
      if (t.exit_price !== null) totalExitNotional += t.exit_price * t.quantity;
      totalFees += t.fees;
      if (t.pnl !== null) { totalPnl += t.pnl; hasPnl = true; }
      for (const tag of t.tags) allTags.add(tag);
    }

    merged.push({
      ...group[0],
      entry_price: totalQty > 0 ? totalEntryNotional / totalQty : group[0].entry_price,
      exit_price: group[0].exit_price !== null
        ? (totalQty > 0 ? totalExitNotional / totalQty : group[0].exit_price)
        : null,
      quantity: totalQty,
      fees: totalFees,
      pnl: hasPnl ? totalPnl : null,
      tags: [...allTags],
    });
  }

  return merged;
}

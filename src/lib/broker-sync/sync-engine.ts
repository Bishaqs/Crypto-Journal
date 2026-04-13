import { fetchBitgetPositions, fetchBitgetOpenPositions, fetchBitgetFills, type MappedTrade } from "@/lib/broker-sync/bitget";
import type { SupabaseClient } from "@supabase/supabase-js";

export type SyncDiagnostics = {
  phase_a_fetched: number;
  phase_a_paired: number;
  phase_a_unmatched_opens: number;
  phase_a_unmatched_closes: number;
  phase_a_all_fill_ids: number;
  phase_a_api_errors: string[];
  /** Symbols found via history-position endpoint */
  symbols_from_positions: string[];
  /** Symbols found via supplementary fills check (missing from positions) */
  symbols_from_fills: string[];
  /** Number of trades recovered from supplementary fills */
  supplementary_fills_recovered: number;
  legacy_cleanup_skipped: boolean;
  dedup_existing_ids: number;
  dedup_new_trades: number;
  dedup_skipped: number;
  cross_sync_merged: number;
  cross_sync_close_only: number;
  stale_open_matched: number;
  insert_attempted: number;
  insert_succeeded: number;
  insert_failed: number;
  insert_errors: string[];
  sample_trade_keys?: string[];
  classification?: { opens: number; closes: number; in_memory_matched: number };
  sample_fills?: Array<{ orderId: string; side: string; tradeSide?: string; profit: string; symbol: string }>;
};

export type SyncOutput = {
  fetched: number;
  imported: number;
  merged: number;
  skipped: number;
  failed: number;
  errors: string[];
  diagnostics: SyncDiagnostics;
  /** Ms timestamp of the most recent fill actually fetched. Used for sync cursor. */
  latestFillTime: number | null;
};

export async function syncBitget(
  creds: { apiKey: string; apiSecret: string; passphrase: string },
  userId: string,
  supabase: SupabaseClient,
  _lastSyncAt: string | null,
  opts: { dryRun?: boolean; daysBack?: number; deadline: number; connectionId?: string },
): Promise<SyncOutput> {
  const { dryRun = false, deadline, connectionId } = opts;
  const errors: string[] = [];

  const diag: SyncDiagnostics = {
    phase_a_fetched: 0, phase_a_paired: 0, phase_a_unmatched_opens: 0,
    phase_a_unmatched_closes: 0, phase_a_all_fill_ids: 0, phase_a_api_errors: [],
    symbols_from_positions: [], symbols_from_fills: [], supplementary_fills_recovered: 0,
    legacy_cleanup_skipped: true,
    dedup_existing_ids: 0, dedup_new_trades: 0, dedup_skipped: 0,
    cross_sync_merged: 0, cross_sync_close_only: 0, stale_open_matched: 0,
    insert_attempted: 0, insert_succeeded: 0, insert_failed: 0, insert_errors: [],
  };

  const mkResult = (extra: Partial<SyncOutput> = {}): SyncOutput => ({
    fetched: diag.phase_a_fetched, imported: 0, merged: 0, skipped: 0,
    failed: 0, errors, diagnostics: diag, latestFillTime: null, ...extra,
  });

  // ── Step 1: Try history-position endpoint first (complete trades) ──
  console.log(`[sync:bitget] Trying history-position endpoint...`);
  const posResult = await fetchBitgetPositions(creds, { deadlineMs: deadline });

  let allTrades: MappedTrade[];
  let closedTradesForUpdate: MappedTrade[] = [];
  let trackingLatestTime: number | null = null;
  let usedPositionEndpoint = false;

  if (posResult.closedTrades.length > 0) {
    usedPositionEndpoint = true;
    // history-position worked — use it as primary source
    console.log(`[sync:bitget] history-position returned ${posResult.closedTrades.length} closed trades`);
    errors.push(...posResult.errors);

    // Track which symbols positions covered
    const positionSymbols = new Set(posResult.closedTrades.map((t) => t.symbol));
    diag.symbols_from_positions = [...positionSymbols];

    // ── Supplementary fills check (runs BEFORE open positions — higher priority) ──
    // history-position may not return all symbols (known Bitget API gap for
    // liquidations, ADL closures, portfolio margin positions, etc.).
    // Fetch fills for the recent period and recover trades for any symbols
    // that appear in fills but NOT in positions.
    let supplementaryTrades: MappedTrade[] = [];
    if (Date.now() < deadline - 5000) {
      console.log(`[sync:bitget] Running supplementary fills check (position symbols: ${[...positionSymbols].join(", ")})...`);
      const fillResult = await fetchBitgetFills(creds, {
        daysBack: 90,
        deadlineMs: deadline - 1500,
        maxWindows: 1,
        maxPages: 3,
        productTypes: ["USDT-FUTURES"],
      });

      // Find symbols in fills that are missing from positions
      const fillSymbols = new Set([
        ...fillResult.pairedTrades.map((t) => t.symbol),
        ...fillResult.unmatchedOpens.map((t) => t.symbol),
      ]);
      const missingSymbols = new Set<string>();
      for (const s of fillSymbols) {
        if (!positionSymbols.has(s)) missingSymbols.add(s);
      }

      if (missingSymbols.size > 0) {
        console.log(`[sync:bitget] FOUND ${missingSymbols.size} symbols in fills missing from positions: ${[...missingSymbols].join(", ")}`);
        supplementaryTrades = [
          ...fillResult.pairedTrades.filter((t) => missingSymbols.has(t.symbol)),
          ...fillResult.unmatchedOpens.filter((t) => missingSymbols.has(t.symbol)),
        ];
        diag.symbols_from_fills = [...missingSymbols];
        diag.supplementary_fills_recovered = supplementaryTrades.length;
        supplementaryTrades = mergeIcebergTrades(supplementaryTrades);
        errors.push(...fillResult.errors);
      } else {
        console.log(`[sync:bitget] All fill symbols covered by positions. No supplementary recovery needed.`);
      }
    } else {
      console.log(`[sync:bitget] Skipped supplementary fills check (deadline pressure).`);
    }

    // Fetch open positions (lower priority — skippable if time is tight)
    let openTrades: MappedTrade[] = [];
    if (Date.now() < deadline - 1500) {
      const openResult = await fetchBitgetOpenPositions(creds, { connectionId });
      openTrades = openResult.openTrades;
      errors.push(...openResult.errors);
      for (const t of openTrades) positionSymbols.add(t.symbol);
    }

    const closedIds = new Set(posResult.closedTrades.map((t) => t.broker_order_id));
    const dedupedOpen = openTrades.filter((t) => !closedIds.has(t.broker_order_id));
    allTrades = [...posResult.closedTrades, ...dedupedOpen, ...supplementaryTrades];

    // Dedup open trades by symbol:position — supplementary fills + open positions
    // can return the same open position with different broker_order_ids
    const openByKey = new Map<string, number>();
    const openDupIndices = new Set<number>();
    for (let i = 0; i < allTrades.length; i++) {
      const t = allTrades[i];
      if (t.exit_price !== null) continue;
      const key = `${t.symbol}:${t.position}`;
      const prev = openByKey.get(key);
      if (prev !== undefined) {
        const prevIsLive = allTrades[prev].tags.includes("from-open-position");
        const currIsLive = t.tags.includes("from-open-position");
        if (currIsLive && !prevIsLive) {
          openDupIndices.add(prev);
          openByKey.set(key, i);
        } else {
          openDupIndices.add(i);
        }
      } else {
        openByKey.set(key, i);
      }
    }
    if (openDupIndices.size > 0) {
      console.log(`[sync:bitget] Deduped ${openDupIndices.size} duplicate open trades by symbol:position`);
      allTrades = allTrades.filter((_, i) => !openDupIndices.has(i));
    }

    closedTradesForUpdate = [
      ...posResult.closedTrades,
      ...supplementaryTrades.filter((t) => t.exit_price !== null),
    ];
    trackingLatestTime = posResult.latestCloseTime;
    diag.phase_a_fetched = posResult.fetched;
    diag.phase_a_paired = posResult.closedTrades.length + supplementaryTrades.filter(t => t.exit_price !== null).length;
    diag.phase_a_unmatched_opens = dedupedOpen.length + supplementaryTrades.filter(t => t.exit_price === null).length;
  } else {
    // history-position returned nothing — fall back to fills + position tracking
    console.log(`[sync:bitget] history-position empty. Falling back to fills + position tracking...`);
    const isFullSync = _lastSyncAt === null;
    const fetchStart = _lastSyncAt ? new Date(_lastSyncAt).getTime() + 1 : undefined;
    const fillResult = await fetchBitgetFills(creds, {
      startTime: fetchStart,
      daysBack: isFullSync ? 90 : 14,
      deadlineMs: deadline,
      oldestFirst: isFullSync,
    });
    errors.push(...fillResult.errors);

    // Position tracking pairs trades using side (buy/sell), not tradeSide classification
    allTrades = [...fillResult.pairedTrades, ...fillResult.unmatchedOpens];
    closedTradesForUpdate = fillResult.pairedTrades.filter((t) => t.exit_price !== null);
    trackingLatestTime = fillResult.latestFillTime ?? fillResult.lastWindowEnd;
    diag.phase_a_fetched = fillResult.fetched;
    diag.phase_a_paired = fillResult.pairedTrades.length;
    diag.phase_a_unmatched_opens = fillResult.unmatchedOpens.length;
    diag.phase_a_unmatched_closes = fillResult.unmatchedCloses.length;
    diag.phase_a_all_fill_ids = fillResult.allFillIds.length;
    diag.classification = {
      opens: fillResult.classificationStats.opens,
      closes: fillResult.classificationStats.closes,
      in_memory_matched: fillResult.classificationStats.inMemoryMatched,
    };
    diag.sample_fills = fillResult.sampleFills;
    console.log(`[sync:bitget] Fills fallback: ${fillResult.fetched} fills → ${fillResult.pairedTrades.length} paired + ${fillResult.unmatchedOpens.length} open (${fillResult.classificationStats.inMemoryMatched} matched by position tracking)`);
  }

  // ── Diagnostic: log which path ran and sample data ──
  console.log(`[sync:bitget] Path: ${usedPositionEndpoint ? "POSITION" : "FILLS"}, trades: ${allTrades.length}, sample:`,
    JSON.stringify(allTrades.slice(0, 2).map(t => ({ sym: t.symbol, qty: t.quantity, pnl: t.pnl, entry: t.entry_price, exit: t.exit_price }))));

  // ── Guardrail: ensure pnl is never null for closed trades ──
  // Prevents calculateTradePnl() fallback from using potentially wrong fill quantities
  for (const t of allTrades) {
    if (t.exit_price !== null && t.pnl === null) {
      const dir = t.position === "long" ? 1 : -1;
      t.pnl = (t.exit_price - t.entry_price) * dir * t.quantity - t.fees;
    }
  }

  // ── Merge iceberg fills (FILLS PATH ONLY) ──
  // Position-based trades are already complete — merging would sum duplicate
  // quantities from broken pagination, causing 10x P&L errors.
  if (!usedPositionEndpoint) {
    const beforeMerge = allTrades.length;
    allTrades = mergeIcebergTrades(allTrades);
    if (allTrades.length < beforeMerge) {
      console.log(`[sync:bitget] Merged ${beforeMerge} → ${allTrades.length} trades (${beforeMerge - allTrades.length} iceberg fills combined)`);
    }
  }

  if (allTrades.length === 0) {
    return mkResult({ errors });
  }

  if (Date.now() >= deadline) {
    return mkResult({ errors: [...errors, "Timed out after fetching positions."] });
  }

  // ── Step 3: Dedup against existing DB trades by positionId ──
  // Returns both broker_order_id and exit_price so we know which are still open
  const candidateIds = [...new Set(allTrades.map((t) => t.broker_order_id))];
  const existingIds = new Set<string>();
  const stillOpenIds = new Set<string>(); // DB rows with exit_price IS NULL

  if (candidateIds.length > 0) {
    // Paginate in chunks of 500 to handle large candidate sets
    for (let i = 0; i < candidateIds.length; i += 500) {
      const batch = candidateIds.slice(i, i + 500);
      const query = supabase
        .from("trades")
        .select("broker_order_id, exit_price")
        .eq("user_id", userId)
        .eq("broker_name", "Bitget")
        .in("broker_order_id", batch);
      const { data } = await query;

      if (data) {
        for (const t of data) {
          if (t.broker_order_id) {
            existingIds.add(t.broker_order_id);
            if (t.exit_price === null) {
              stillOpenIds.add(t.broker_order_id);
            }
          }
        }
      }
    }

    // Also exclude dismissed (user-deleted) broker_order_ids
    for (let i = 0; i < candidateIds.length; i += 500) {
      const batch = candidateIds.slice(i, i + 500);
      const { data: dismissed } = await supabase
        .from("sync_dismissed_ids")
        .select("broker_order_id")
        .eq("user_id", userId)
        .eq("broker_name", "Bitget")
        .in("broker_order_id", batch);
      if (dismissed) {
        for (const d of dismissed) existingIds.add(d.broker_order_id);
      }
    }
  }

  diag.dedup_existing_ids = existingIds.size;
  let newTrades = allTrades.filter((t) => !existingIds.has(t.broker_order_id));

  // In-batch dedup: if multiple sources (positions + fills) yielded the same broker_order_id,
  // keep only the first occurrence
  {
    const seenBrokerIds = new Set<string>();
    newTrades = newTrades.filter((t) => {
      if (!t.broker_order_id || seenBrokerIds.has(t.broker_order_id)) return false;
      seenBrokerIds.add(t.broker_order_id);
      return true;
    });
  }

  const skipped = allTrades.length - newTrades.length;
  diag.dedup_new_trades = newTrades.length;
  diag.dedup_skipped = skipped;

  // ── Step 3b: Cross-ID stale-open matching ──
  // Handles the case where open positions were stored with synthetic "open:SYMBOL:SIDE"
  // broker_order_ids but their closed version uses the real Bitget positionId.
  let staleOpenMatched = 0;

  if (!dryRun && Date.now() < deadline - 2000) {
    const closedNewTrades = newTrades.filter((t) => t.exit_price !== null);

    if (closedNewTrades.length > 0) {
      // Derive synthetic keys for each closed trade
      // Include both legacy format (open:SYMBOL:SIDE) and new format (open:CONN_ID:SYMBOL:SIDE)
      const syntheticKeys = [...new Set(closedNewTrades.flatMap((t) => {
        const legacy = `open:${t.symbol}:${t.position}`;
        return connectionId ? [legacy, `open:${connectionId}:${t.symbol}:${t.position}`] : [legacy];
      }))];

      // Batch query: find open rows with these synthetic broker_order_ids
      const staleOpenRows = new Map<string, { id: string; broker_order_id: string; open_timestamp: string }>();
      for (let i = 0; i < syntheticKeys.length; i += 500) {
        const batch = syntheticKeys.slice(i, i + 500);
        let staleQuery = supabase
          .from("trades")
          .select("id, broker_order_id, open_timestamp")
          .eq("user_id", userId)
          .eq("broker_name", "Bitget")
          .is("exit_price", null)
          .in("broker_order_id", batch);
        if (connectionId) staleQuery = staleQuery.or(`connection_id.eq.${connectionId},connection_id.is.null`);
        const { data } = await staleQuery;

        if (data) {
          for (const row of data) {
            if (row.broker_order_id) {
              staleOpenRows.set(row.broker_order_id, {
                id: row.id,
                broker_order_id: row.broker_order_id,
                open_timestamp: (row as { open_timestamp: string }).open_timestamp,
              });
            }
          }
        }
      }

      if (staleOpenRows.size > 0) {
        console.log(`[sync:bitget] Found ${staleOpenRows.size} stale open:SYMBOL:SIDE rows to match with closed trades`);
        const matchedIndices = new Set<number>();

        for (let idx = 0; idx < newTrades.length; idx++) {
          if (Date.now() >= deadline - 1500) break;
          const trade = newTrades[idx];
          if (trade.exit_price === null) continue;

          const syntheticKey = `open:${trade.symbol}:${trade.position}`;
          const staleRow = staleOpenRows.get(syntheticKey);
          if (!staleRow) continue;

          // Validate: don't pair if the stale open is from a wildly different time
          // This prevents ancient open positions from being merged with recent closes
          const staleOpenMs = new Date(staleRow.open_timestamp).getTime();
          const tradeOpenMs = new Date(trade.open_timestamp).getTime();
          const gapDays = Math.abs(tradeOpenMs - staleOpenMs) / (1000 * 60 * 60 * 24);
          if (gapDays > 7) {
            console.log(`[sync:bitget] Skipping stale-open match for ${trade.symbol}: stale open is ${Math.round(gapDays)} days apart from closed trade (${staleRow.open_timestamp} vs ${trade.open_timestamp})`);
            continue;
          }

          // Update the existing row with ALL data from the closed position
          // (entry + exit) — the position history has authoritative data
          const { error } = await supabase
            .from("trades")
            .update({
              entry_price: trade.entry_price,
              exit_price: trade.exit_price,
              quantity: trade.quantity,
              open_timestamp: trade.open_timestamp,
              close_timestamp: trade.close_timestamp,
              pnl: trade.pnl,
              fees: trade.fees,
              tags: trade.tags,
              broker_order_id: trade.broker_order_id,
              ...(connectionId ? { connection_id: connectionId } : {}),
            })
            .eq("id", staleRow.id)
            .is("exit_price", null);

          if (!error) {
            staleOpenMatched++;
            matchedIndices.add(idx);
            staleOpenRows.delete(syntheticKey);
          }
        }

        if (matchedIndices.size > 0) {
          newTrades = newTrades.filter((_, idx) => !matchedIndices.has(idx));
          console.log(`[sync:bitget] Matched ${staleOpenMatched} stale open trades with closed positions (journal links preserved)`);
        }
      }
    }
  }

  diag.stale_open_matched = staleOpenMatched;

  // ── Step 4: Update existing open trades that are now closed ──
  // Only update trades that are actually still open in DB (not already closed)
  let merged = 0;
  const closedWithExistingOpen = closedTradesForUpdate.filter(
    (t) => stillOpenIds.has(t.broker_order_id) && t.exit_price !== null,
  );

  if (!dryRun && closedWithExistingOpen.length > 0) {
    console.log(`[sync:bitget] Updating ${closedWithExistingOpen.length} still-open trades with exit data (${existingIds.size} total existing, ${stillOpenIds.size} still open)...`);
    // Parallel batches of 5 for efficiency
    const UPDATE_BATCH = 5;
    for (let i = 0; i < closedWithExistingOpen.length; i += UPDATE_BATCH) {
      if (Date.now() >= deadline) {
        errors.push("Update incomplete (deadline). Retry to finish.");
        break;
      }
      const batch = closedWithExistingOpen.slice(i, i + UPDATE_BATCH);
      const results = await Promise.all(
        batch.map((trade) => {
          let q = supabase
            .from("trades")
            .update({
              exit_price: trade.exit_price,
              close_timestamp: trade.close_timestamp,
              pnl: trade.pnl,
              fees: trade.fees,
              tags: trade.tags,
              ...(connectionId ? { connection_id: connectionId } : {}),
            })
            .eq("user_id", userId)
            .eq("broker_name", "Bitget")
            .eq("broker_order_id", trade.broker_order_id);
          if (connectionId) q = q.or(`connection_id.eq.${connectionId},connection_id.is.null`);
          return q.is("exit_price", null);
        }),
      );
      merged += results.filter((r) => !r.error).length;
    }
  }

  // ── Step 4b: Refresh metadata for existing open positions ──
  // Corrects wrong timestamps (from ctime parsing bugs), stale entry prices
  // (from averaging into positions), and quantity changes (from partial closes).
  let refreshed = 0;
  const openToRefresh = allTrades.filter(
    (t) => stillOpenIds.has(t.broker_order_id) && t.exit_price === null,
  );

  if (!dryRun && openToRefresh.length > 0 && Date.now() < deadline) {
    console.log(`[sync:bitget] Refreshing ${openToRefresh.length} existing open positions...`);
    const REFRESH_BATCH = 5;
    for (let i = 0; i < openToRefresh.length; i += REFRESH_BATCH) {
      if (Date.now() >= deadline) break;
      const batch = openToRefresh.slice(i, i + REFRESH_BATCH);
      const results = await Promise.all(
        batch.map((t) => {
          let q = supabase
            .from("trades")
            .update({
              open_timestamp: t.open_timestamp,
              entry_price: t.entry_price,
              quantity: t.quantity,
              ...(connectionId ? { connection_id: connectionId } : {}),
            })
            .eq("user_id", userId)
            .eq("broker_name", "Bitget")
            .eq("broker_order_id", t.broker_order_id);
          if (connectionId) q = q.or(`connection_id.eq.${connectionId},connection_id.is.null`);
          return q.is("exit_price", null);
        }),
      );
      refreshed += results.filter((r) => !r.error).length;
    }
    if (refreshed > 0) {
      console.log(`[sync:bitget] Refreshed ${refreshed} open positions.`);
    }
  }

  // ── Step 5: Insert new trades ──
  let imported = 0;
  let failed = 0;
  const CHUNK = 20;

  if (!dryRun && newTrades.length > 0) {
    console.log(`[sync:bitget] Inserting ${newTrades.length} new trades...`);
    diag.insert_attempted = newTrades.length;

    for (let i = 0; i < newTrades.length; i += CHUNK) {
      if (Date.now() >= deadline) {
        errors.push(`Insert incomplete — ${newTrades.length - i} remaining (deadline). Retry.`);
        break;
      }
      const chunk = newTrades.slice(i, i + CHUNK);
      const rows = chunk.map((t: MappedTrade) => ({ user_id: userId, ...t, ...(connectionId ? { connection_id: connectionId } : {}) }));

      const { error: insertError } = await supabase.from("trades").insert(rows);
      if (insertError) {
        console.error("[sync:bitget] Insert failed:", insertError.message);
        diag.insert_errors.push(insertError.message);
        // Fallback: try one-by-one
        for (const row of rows) {
          const { error: singleErr } = await supabase.from("trades").insert(row);
          if (singleErr) failed++;
          else imported++;
        }
      } else {
        imported += chunk.length;
      }
    }
  }

  diag.insert_succeeded = imported;
  diag.insert_failed = failed;
  diag.cross_sync_merged = merged + staleOpenMatched;
  console.log(`[sync:bitget] Done: ${imported} imported, ${merged} updated, ${staleOpenMatched} stale-open matched, ${skipped} skipped, ${failed} failed.`);

  // Track cursor based on actual progress, not optimistic API-fetch max.
  // This prevents the cursor from jumping past positions that weren't actually persisted.
  let actualLatestTime: number | null = null;

  // Include time from successfully updated trades (Step 4)
  if (merged > 0) {
    for (const t of closedWithExistingOpen) {
      if (t.close_timestamp) {
        const ms = new Date(t.close_timestamp).getTime();
        if (!isNaN(ms) && (actualLatestTime === null || ms > actualLatestTime)) {
          actualLatestTime = ms;
        }
      }
    }
  }

  // Include time from successfully inserted trades (Step 5)
  if (imported > 0) {
    for (const t of newTrades) {
      const ts = t.close_timestamp ?? t.open_timestamp;
      const ms = new Date(ts).getTime();
      if (!isNaN(ms) && (actualLatestTime === null || ms > actualLatestTime)) {
        actualLatestTime = ms;
      }
    }
  }

  // If we only skipped (everything already existed), still advance to API-fetched time
  // since all data is accounted for
  if (imported === 0 && merged === 0 && skipped > 0) {
    actualLatestTime = trackingLatestTime;
  }

  return { fetched: diag.phase_a_fetched, imported, merged, skipped, failed, errors, diagnostics: diag, latestFillTime: actualLatestTime };
}

// ── Helpers ───────────────────────────────────────────────────

/** Merge iceberg fills: combine trades with same symbol + position + ~same minute.
 *  In one-way mode, each fill gets a unique orderId even when they're part of
 *  the same logical order. This merges them into one trade with VWAP entry/exit. */
export function mergeIcebergTrades(trades: MappedTrade[]): MappedTrade[] {
  if (trades.length <= 1) return trades;

  const groups = new Map<string, MappedTrade[]>();
  for (const t of trades) {
    // Round open timestamp to nearest minute for grouping
    const openMs = new Date(t.open_timestamp).getTime();
    const openMin = Math.floor(openMs / 60000);
    // Round close timestamp too (or use empty for open trades)
    const closeMin = t.close_timestamp
      ? Math.floor(new Date(t.close_timestamp).getTime() / 60000)
      : "";
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

export async function updateSyncLog(
  supabase: SupabaseClient,
  logId: string | undefined,
  fields: Record<string, unknown>,
) {
  if (!logId) return;
  const { error } = await supabase.from("sync_logs").update(fields).eq("id", logId);
  if (error) {
    console.error("[sync] Failed to update sync log:", error.message);
  }
}

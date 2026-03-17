import { fetchBitgetPositions, fetchBitgetOpenPositions, fetchBitgetFills, type MappedTrade } from "@/lib/broker-sync/bitget";
import type { SupabaseClient } from "@supabase/supabase-js";

export type SyncDiagnostics = {
  phase_a_fetched: number;
  phase_a_paired: number;
  phase_a_unmatched_opens: number;
  phase_a_unmatched_closes: number;
  phase_a_all_fill_ids: number;
  phase_a_api_errors: string[];
  legacy_cleanup_skipped: boolean;
  dedup_existing_ids: number;
  dedup_new_trades: number;
  dedup_skipped: number;
  cross_sync_merged: number;
  cross_sync_close_only: number;
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
  opts: { dryRun?: boolean; daysBack?: number; deadline: number },
): Promise<SyncOutput> {
  const { dryRun = false, deadline } = opts;
  const errors: string[] = [];

  const diag: SyncDiagnostics = {
    phase_a_fetched: 0, phase_a_paired: 0, phase_a_unmatched_opens: 0,
    phase_a_unmatched_closes: 0, phase_a_all_fill_ids: 0, phase_a_api_errors: [],
    legacy_cleanup_skipped: true,
    dedup_existing_ids: 0, dedup_new_trades: 0, dedup_skipped: 0,
    cross_sync_merged: 0, cross_sync_close_only: 0,
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

    // Also fetch open positions
    let openTrades: MappedTrade[] = [];
    if (Date.now() < deadline - 1500) {
      const openResult = await fetchBitgetOpenPositions(creds);
      openTrades = openResult.openTrades;
      errors.push(...openResult.errors);
    }

    const closedIds = new Set(posResult.closedTrades.map((t) => t.broker_order_id));
    const dedupedOpen = openTrades.filter((t) => !closedIds.has(t.broker_order_id));
    allTrades = [...posResult.closedTrades, ...dedupedOpen];
    closedTradesForUpdate = posResult.closedTrades;
    trackingLatestTime = posResult.latestCloseTime;
    diag.phase_a_fetched = posResult.fetched;
    diag.phase_a_paired = posResult.closedTrades.length;
    diag.phase_a_unmatched_opens = dedupedOpen.length;
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
      const { data } = await supabase
        .from("trades")
        .select("broker_order_id, exit_price")
        .eq("user_id", userId)
        .eq("broker_name", "Bitget")
        .contains("tags", ["bitget-api-sync"])
        .in("broker_order_id", batch);

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
  }

  diag.dedup_existing_ids = existingIds.size;
  const newTrades = allTrades.filter((t) => !existingIds.has(t.broker_order_id));
  const skipped = allTrades.length - newTrades.length;
  diag.dedup_new_trades = newTrades.length;
  diag.dedup_skipped = skipped;

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
        batch.map((trade) =>
          supabase
            .from("trades")
            .update({
              exit_price: trade.exit_price,
              close_timestamp: trade.close_timestamp,
              pnl: trade.pnl,
              fees: trade.fees,
              tags: trade.tags,
            })
            .eq("user_id", userId)
            .eq("broker_name", "Bitget")
            .eq("broker_order_id", trade.broker_order_id)
            .is("exit_price", null),
        ),
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
        batch.map((t) =>
          supabase
            .from("trades")
            .update({
              open_timestamp: t.open_timestamp,
              entry_price: t.entry_price,
              quantity: t.quantity,
            })
            .eq("user_id", userId)
            .eq("broker_name", "Bitget")
            .eq("broker_order_id", t.broker_order_id)
            .is("exit_price", null),
        ),
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
      const rows = chunk.map((t: MappedTrade) => ({ user_id: userId, ...t }));

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
  diag.cross_sync_merged = merged;
  console.log(`[sync:bitget] Done: ${imported} imported, ${merged} updated, ${skipped} skipped, ${failed} failed.`);

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

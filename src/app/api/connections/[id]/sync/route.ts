import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { decrypt } from "@/lib/broker-sync/crypto";
import { fetchBitgetPositions, fetchBitgetOpenPositions, fetchBitgetFills, type MappedTrade } from "@/lib/broker-sync/bitget";
import type { SupabaseClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const maxDuration = 10;

type SyncDiagnostics = {
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

type SyncOutput = {
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

// POST: Trigger sync for a connection
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Deadline must start from actual request receipt — not after pre-sync overhead
  const startTime = Date.now();
  const deadline = startTime + 8000; // 2s safety margin from Vercel's 10s limit

  const { id } = await params;
  const url = new URL(_req.url);
  const fullSync = url.searchParams.get("fullSync") === "true";
  const dryRun = url.searchParams.get("dryRun") === "true";
  const defaultDays = fullSync ? "90" : "14";
  const daysBack = Math.min(Math.max(parseInt(url.searchParams.get("daysBack") || defaultDays) || 14, 1), 90);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parallel batch 1: rate limit + connection fetch (both need only user.id)
  const [rl, { data: conn, error: connError }] = await Promise.all([
    rateLimit(`sync:${user.id}`, 15, 60_000),
    supabase
      .from("broker_connections")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (!rl.success) {
    return NextResponse.json({ error: "Too many sync requests. Wait 1 minute." }, { status: 429 });
  }
  if (connError || !conn) {
    return NextResponse.json({ error: "Connection not found" }, { status: 404 });
  }

  // Parallel batch 2: set sync sentinel + insert sync log (skip for dry runs)
  let syncLogId: string | undefined;
  if (!dryRun) {
    const [, syncLogResult] = await Promise.all([
      supabase.from("broker_connections").update({
        last_error: "Syncing...",
        updated_at: new Date().toISOString(),
      }).eq("id", id),
      supabase
        .from("sync_logs")
        .insert({
          connection_id: id,
          user_id: user.id,
          sync_type: fullSync ? "full" : "manual",
          status: "started",
          started_at: new Date().toISOString(),
        })
        .select("id")
        .single(),
    ]);
    syncLogId = syncLogResult.data?.id;
  }

  try {
    // Decrypt credentials
    const apiKey = decrypt(conn.encrypted_api_key, conn.encryption_iv);
    const apiSecret = decrypt(conn.encrypted_api_secret, conn.secret_iv ?? conn.encryption_iv);
    const passphrase = conn.encrypted_passphrase && conn.passphrase_iv
      ? decrypt(conn.encrypted_passphrase, conn.passphrase_iv)
      : "";
    console.log(`[sync] Credentials decrypted in ${Date.now() - startTime}ms`);

    // Route to broker-specific sync
    let result: SyncOutput;
    const brokerLower = conn.broker_name.toLowerCase();

    if (brokerLower.includes("bitget")) {
      result = await syncBitget(
        { apiKey, apiSecret, passphrase },
        user.id,
        supabase,
        fullSync ? null : conn.last_sync_at,
        { dryRun, daysBack: fullSync ? daysBack : undefined, deadline },
      );
    } else {
      if (!dryRun) {
        await updateSyncLog(supabase, syncLogId, {
          status: "success",
          duration_ms: Date.now() - startTime,
        });
      }
      return NextResponse.json({
        message: `Sync not yet supported for ${conn.broker_name}. Coming soon.`,
        trades_imported: 0,
      });
    }

    // Update sync log (skip for dry runs)
    if (!dryRun) {
      const duration = Date.now() - startTime;
      await updateSyncLog(supabase, syncLogId, {
        status: result.errors.length > 0 ? "partial" : "success",
        trades_fetched: result.fetched,
        trades_imported: result.imported,
        trades_skipped: result.skipped,
        trades_failed: result.failed,
        error_message: result.errors.join("; ") || null,
        duration_ms: duration,
        completed_at: new Date().toISOString(),
      });

      // Update connection status — use actual fill progress for last_sync_at
      // so incremental sync resumes from where we left off, not "now"
      // If no fills were fetched, keep the existing cursor to avoid skipping data
      const syncCursor = result.latestFillTime
        ? new Date(result.latestFillTime).toISOString()
        : conn.last_sync_at;
      const { error: updateError } = await supabase
        .from("broker_connections")
        .update({
          last_sync_at: syncCursor,
          status: "active",
          total_trades_synced: (conn.total_trades_synced ?? 0) + result.imported,
          last_error: result.errors.filter(e => !e.includes("404"))[0] ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (updateError) {
        console.error("[sync] Failed to update connection:", updateError.message);
      }
    }

    const totalNew = result.imported + result.merged;
    const hasRetryableErrors = result.errors.some(e =>
      e.includes("deadline") || e.includes("Timed out") || e.includes("Retry to") ||
      e.includes("Stopped early") || e.includes("Stopped after") || e.includes("Partial results"),
    );
    return NextResponse.json({
      trades_imported: result.imported,
      trades_merged: result.merged,
      trades_skipped: result.skipped,
      trades_failed: result.failed,
      fetched: result.fetched,
      api_errors: result.errors,
      dry_run: dryRun,
      retryable: hasRetryableErrors,
      duration_ms: Date.now() - startTime,
      diagnostics: result.diagnostics,
      message: dryRun
        ? `Dry run: ${result.diagnostics.dedup_new_trades} trades would be imported (${result.fetched} positions fetched).`
        : totalNew > 0
          ? `Imported ${result.imported} trade${result.imported !== 1 ? "s" : ""} (${result.diagnostics.phase_a_paired} closed, ${result.diagnostics.phase_a_unmatched_opens} open)${result.merged > 0 ? `, updated ${result.merged}` : ""}${result.skipped > 0 ? `, ${result.skipped} already synced` : ""}.`
          : result.fetched > 0
            ? `No new trades — ${result.skipped} already imported. (${result.fetched} positions fetched: ${result.diagnostics.phase_a_paired} closed, ${result.diagnostics.phase_a_unmatched_opens} open)`
            : "No new trades found.",
    });
  } catch (err) {
    const duration = Date.now() - startTime;
    const errorMsg = err instanceof Error ? err.message : "Unknown sync error";
    console.error("[sync] Error:", errorMsg);

    if (!dryRun) {
      await updateSyncLog(supabase, syncLogId, {
        status: "failed",
        error_message: errorMsg,
        duration_ms: duration,
        completed_at: new Date().toISOString(),
      });

      await supabase
        .from("broker_connections")
        .update({
          status: "error",
          last_error: errorMsg,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
    }

    return NextResponse.json(
      { error: `Sync failed: ${errorMsg}`, trades_imported: 0 },
      { status: 500 },
    );
  }
}

// ── Bitget position-based sync (primary) ─────────────────────

async function syncBitget(
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

  // ── Merge iceberg fills: combine trades with same symbol+position+minute ──
  // Fills of the same order have unique orderIds in one-way mode but share
  // the same symbol, direction, and approximate timestamp.
  const beforeMerge = allTrades.length;
  allTrades = mergeIcebergTrades(allTrades);
  if (allTrades.length < beforeMerge) {
    console.log(`[sync:bitget] Merged ${beforeMerge} → ${allTrades.length} trades (${beforeMerge - allTrades.length} iceberg fills combined)`);
  }

  if (allTrades.length === 0) {
    return mkResult({ errors });
  }

  if (Date.now() >= deadline) {
    return mkResult({ errors: [...errors, "Timed out after fetching positions."] });
  }

  // ── Step 3: Dedup against existing DB trades by positionId ──
  const candidateIds = [...new Set(allTrades.map((t) => t.broker_order_id))];
  const existingIds = new Set<string>();

  if (candidateIds.length > 0) {
    const { data } = await supabase
      .from("trades")
      .select("broker_order_id")
      .eq("user_id", userId)
      .eq("broker_name", "Bitget")
      .contains("tags", ["bitget-api-sync"])
      .in("broker_order_id", candidateIds.slice(0, 500));

    if (data) {
      for (const t of data) {
        if (t.broker_order_id) existingIds.add(t.broker_order_id);
      }
    }
  }

  diag.dedup_existing_ids = existingIds.size;
  const newTrades = allTrades.filter((t) => !existingIds.has(t.broker_order_id));
  const skipped = allTrades.length - newTrades.length;
  diag.dedup_new_trades = newTrades.length;
  diag.dedup_skipped = skipped;

  // ── Step 4: Update existing open trades that are now closed ──
  let merged = 0;
  const closedWithExistingOpen = closedTradesForUpdate.filter(
    (t) => existingIds.has(t.broker_order_id) && t.exit_price !== null,
  );

  if (!dryRun && closedWithExistingOpen.length > 0) {
    console.log(`[sync:bitget] Updating ${closedWithExistingOpen.length} existing opens with exit data...`);
    for (const trade of closedWithExistingOpen) {
      if (Date.now() >= deadline) {
        errors.push("Update incomplete (deadline). Retry to finish.");
        break;
      }
      const { error } = await supabase
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
        .is("exit_price", null);
      if (!error) merged++;
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

  const latestFillTime = (imported + merged + skipped) > 0 ? trackingLatestTime : null;
  return { fetched: diag.phase_a_fetched, imported, merged, skipped, failed, errors, diagnostics: diag, latestFillTime };
}

// ── Helpers ───────────────────────────────────────────────────

/** Merge iceberg fills: combine trades with same symbol + position + ~same minute.
 *  In one-way mode, each fill gets a unique orderId even when they're part of
 *  the same logical order. This merges them into one trade with VWAP entry/exit. */
function mergeIcebergTrades(trades: MappedTrade[]): MappedTrade[] {
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

async function updateSyncLog(
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

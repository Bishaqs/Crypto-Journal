import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { decrypt } from "@/lib/broker-sync/crypto";
import { fetchBitgetFills, type MappedTrade } from "@/lib/broker-sync/bitget";
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
          last_error: result.errors[0] ?? null,
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
        ? `Dry run: ${result.diagnostics.dedup_new_trades} trades would be imported (${result.fetched} fills fetched).`
        : totalNew > 0
          ? `Imported ${result.imported} trade${result.imported !== 1 ? "s" : ""}${result.merged > 0 ? `, merged ${result.merged} close fill${result.merged !== 1 ? "s" : ""}` : ""} from Bitget.`
          : result.fetched > 0
            ? `No new trades — ${result.skipped} already imported. (${result.fetched} fills fetched)`
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

// ── Bitget-specific sync ──────────────────────────────────────

async function syncBitget(
  creds: { apiKey: string; apiSecret: string; passphrase: string },
  userId: string,
  supabase: SupabaseClient,
  lastSyncAt: string | null,
  opts: { dryRun?: boolean; daysBack?: number; deadline: number },
): Promise<SyncOutput> {
  const { dryRun = false, daysBack, deadline } = opts;

  const diag: SyncDiagnostics = {
    phase_a_fetched: 0,
    phase_a_paired: 0,
    phase_a_unmatched_opens: 0,
    phase_a_unmatched_closes: 0,
    phase_a_all_fill_ids: 0,
    phase_a_api_errors: [],
    legacy_cleanup_skipped: true,
    dedup_existing_ids: 0,
    dedup_new_trades: 0,
    dedup_skipped: 0,
    cross_sync_merged: 0,
    cross_sync_close_only: 0,
    insert_attempted: 0,
    insert_succeeded: 0,
    insert_failed: 0,
    insert_errors: [],
  };

  let latestFillTime: number | null = null;

  const mkResult = (extra: Partial<SyncOutput> = {}): SyncOutput => ({
    fetched: diag.phase_a_fetched,
    imported: 0,
    merged: 0,
    skipped: 0,
    failed: 0,
    errors: [],
    diagnostics: diag,
    latestFillTime,
    ...extra,
  });

  // Phase A: Fetch and pair fills (pass deadline so API calls stop in time)
  // Full sync (lastSyncAt=null): process oldest→newest so incremental clicks make forward progress
  const isFullSync = lastSyncAt === null;
  const phaseAStart = Date.now();
  console.log(`[sync:bitget] Phase A: Fetching fills. lastSync=${lastSyncAt ?? "null"}, daysBack=${daysBack ?? "default"}, oldestFirst=${isFullSync}`);
  // Add 1ms to skip the last-synced fill — Bitget's startTime is inclusive,
  // so using the exact latestFillTime re-fetches it every sync.
  const fetchStart = lastSyncAt ? new Date(lastSyncAt).getTime() + 1 : undefined;
  const result = await fetchBitgetFills(creds, { startTime: fetchStart, daysBack, deadlineMs: deadline, oldestFirst: isFullSync });
  latestFillTime = result.latestFillTime;
  console.log(`[sync:bitget] Phase A: ${result.fetched} fills in ${Date.now() - phaseAStart}ms (${result.pairedTrades.length} paired, ${result.unmatchedOpens.length} open, ${result.unmatchedCloses.length} close, latestFill=${latestFillTime ? new Date(latestFillTime).toISOString() : "none"})`);

  diag.phase_a_fetched = result.fetched;
  diag.phase_a_paired = result.pairedTrades.length;
  diag.phase_a_unmatched_opens = result.unmatchedOpens.length;
  diag.phase_a_unmatched_closes = result.unmatchedCloses.length;
  diag.phase_a_all_fill_ids = result.allFillIds.length;
  diag.phase_a_api_errors = [...result.errors];
  diag.classification = {
    opens: result.classificationStats.opens,
    closes: result.classificationStats.closes,
    in_memory_matched: result.classificationStats.inMemoryMatched,
  };

  const allTrades = [...result.pairedTrades, ...result.unmatchedOpens];

  if (allTrades.length === 0 && result.unmatchedCloses.length === 0) {
    return mkResult({ errors: result.errors });
  }

  // Deadline check before Phase B
  if (Date.now() >= deadline) {
    console.log(`[sync:bitget] Deadline reached after Phase A (${Date.now() - phaseAStart}ms). Returning partial results.`);
    return mkResult({ errors: [...result.errors, `Timed out after fetching ${result.fetched} fills. Retry to continue.`] });
  }

  // Phase B: Dedup — check fetched fills against existing DB rows
  const phaseBStart = Date.now();
  const existingIds = new Set<string>();
  const candidateOrderIds = [...new Set(allTrades.map((t) => t.broker_order_id))];

  if (candidateOrderIds.length > 0 && candidateOrderIds.length <= 500) {
    // Optimized path: targeted query for just the order IDs we fetched
    // Only dedup against API-synced trades (not CSV imports) — CSV trades lack the bitget-api-sync tag
    console.log(`[sync:bitget] Phase B: Targeted dedup for ${candidateOrderIds.length} order IDs`);
    const { data } = await supabase
      .from("trades")
      .select("broker_order_id, tags")
      .eq("user_id", userId)
      .eq("broker_name", "Bitget")
      .contains("tags", ["bitget-api-sync"])
      .in("broker_order_id", candidateOrderIds);

    if (data) {
      for (const t of data) {
        if (t.broker_order_id) existingIds.add(t.broker_order_id);
        for (const tag of (t.tags ?? []) as string[]) {
          if (tag.startsWith("close-fill:")) existingIds.add(tag.slice(11));
          else if (tag.startsWith("open-fill:")) existingIds.add(tag.slice(10));
          else if (tag.startsWith("fid:")) existingIds.add(tag.slice(4));
        }
      }
    }

    // For cross-sync skip check: verify each unmatched close's fill IDs against existing tags
    // Only check if we have time
    for (const closeOrder of result.unmatchedCloses) {
      if (Date.now() >= deadline) break;
      const tagToCheck = `close-fill:${closeOrder.fillIds[0]}`;
      const { data: tagMatch } = await supabase
        .from("trades")
        .select("tags")
        .eq("user_id", userId)
        .eq("broker_name", "Bitget")
        .contains("tags", [tagToCheck])
        .limit(1);
      if (tagMatch && tagMatch.length > 0) {
        for (const fid of closeOrder.fillIds) existingIds.add(fid);
      }
    }
  } else if (candidateOrderIds.length > 500) {
    // Fallback: paginated scan for full re-sync with many orders
    console.log(`[sync:bitget] Phase B: Paginated dedup for ${candidateOrderIds.length} order IDs`);
    const PAGE_SIZE = 1000;
    let page = 0;

    while (true) {
      if (Date.now() >= deadline) {
        result.errors.push("Dedup scan incomplete (deadline). Some duplicates may slip through.");
        break;
      }
      const { data } = await supabase
        .from("trades")
        .select("broker_order_id, tags")
        .eq("user_id", userId)
        .eq("broker_name", "Bitget")
        .contains("tags", ["bitget-api-sync"])
        .not("broker_order_id", "is", null)
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
      if (!data || data.length === 0) break;
      for (const t of data) {
        if (t.broker_order_id) existingIds.add(t.broker_order_id);
        for (const tag of (t.tags ?? []) as string[]) {
          if (tag.startsWith("close-fill:")) existingIds.add(tag.slice(11));
          else if (tag.startsWith("open-fill:")) existingIds.add(tag.slice(10));
          else if (tag.startsWith("fid:")) existingIds.add(tag.slice(4));
        }
      }
      if (data.length < PAGE_SIZE) break;
      page++;
    }
  }

  diag.dedup_existing_ids = existingIds.size;
  console.log(`[sync:bitget] Phase B: Dedup complete in ${Date.now() - phaseBStart}ms. ${existingIds.size} existing IDs found.`);

  const newTrades = allTrades.filter((t) => !existingIds.has(t.broker_order_id));
  diag.dedup_new_trades = newTrades.length;
  diag.dedup_skipped = allTrades.length - newTrades.length;

  // Include sample trade keys for debugging column mismatches
  if (newTrades.length > 0) {
    diag.sample_trade_keys = Object.keys(newTrades[0]);
  }

  // Deadline check before Phase D1
  if (Date.now() >= deadline) {
    console.log(`[sync:bitget] Deadline reached after Phase B. ${newTrades.length} new trades identified but not inserted.`);
    return mkResult({ errors: [...result.errors, `Timed out during dedup. ${newTrades.length} new trades found but not inserted. Retry to continue.`] });
  }

  // Split new trades: opens first (so Phase C cross-sync can find them in DB)
  const newOpens = newTrades.filter((t) => t.exit_price === null);
  const newPaired = newTrades.filter((t) => t.exit_price !== null);

  // Phase D1: Insert unmatched opens first — Phase C needs them in DB
  const phaseD1Start = Date.now();
  let imported = 0;
  let failed = 0;
  const CHUNK_SIZE = 20;

  if (!dryRun && newOpens.length > 0) {
    console.log(`[sync:bitget] Phase D1: Inserting ${newOpens.length} open trades before cross-sync`);
    for (let i = 0; i < newOpens.length; i += CHUNK_SIZE) {
      if (Date.now() >= deadline) {
        const remaining = newOpens.length - i;
        result.errors.push(`D1 insert incomplete — ${remaining} opens remaining (deadline). Retry to finish.`);
        break;
      }

      const chunk = newOpens.slice(i, i + CHUNK_SIZE);
      const rows = chunk.map((trade: MappedTrade) => ({ user_id: userId, ...trade }));

      const { error: insertError } = await supabase.from("trades").insert(rows);
      if (insertError) {
        console.error("[sync:bitget] D1 insert failed:", insertError.message, insertError.code);
        diag.insert_errors.push(insertError.message);
        result.errors.push(`D1 insert error: ${insertError.message}`);
        for (const row of rows) {
          const { error: singleErr } = await supabase.from("trades").insert(row);
          if (singleErr) {
            failed++;
          } else {
            imported++;
          }
        }
      } else {
        imported += chunk.length;
      }
    }
    console.log(`[sync:bitget] Phase D1: ${imported} opens inserted in ${Date.now() - phaseD1Start}ms`);
  }

  // Phase C: Cross-sync matching — update existing open trades with close data
  // Now includes opens just inserted in D1, so same-invocation matching works
  const phaseCStart = Date.now();
  let merged = 0;
  let closeOnlyInserted = 0;

  if (!dryRun) {
    for (const closeOrder of result.unmatchedCloses) {
      if (Date.now() >= deadline) {
        result.errors.push("Cross-sync incomplete (deadline). Retry to merge remaining closes.");
        break;
      }

      const alreadyProcessed = closeOrder.fillIds.some((id) => existingIds.has(id));
      if (alreadyProcessed) continue;

      // Close: sell closes a long, buy closes a short
      const polarity = closeOrder.side === "sell" ? "long" : "short";

      const { data: openTrade } = await supabase
        .from("trades")
        .select("id, fees, tags")
        .eq("user_id", userId)
        .eq("broker_name", "Bitget")
        .eq("symbol", closeOrder.symbol)
        .eq("position", polarity)
        .is("exit_price", null)
        .order("open_timestamp", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (openTrade) {
        const closeTags = closeOrder.fillIds.map((id) => `close-fill:${id}`);
        const updatedTags = [...((openTrade.tags ?? []) as string[]), ...closeTags];

        const { error: updateError } = await supabase
          .from("trades")
          .update({
            exit_price: closeOrder.vwap,
            close_timestamp: new Date(closeOrder.earliestTime).toISOString(),
            pnl: closeOrder.totalProfit || null,
            fees: (openTrade.fees || 0) + closeOrder.totalFees,
            tags: updatedTags,
          })
          .eq("id", openTrade.id);

        if (!updateError) {
          merged++;
          for (const id of closeOrder.fillIds) existingIds.add(id);
        } else {
          console.error(`[sync:bitget] Phase C: Merge update failed for ${closeOrder.orderId}:`, updateError.message);
          diag.insert_errors.push(`Merge: ${updateError.message}`);
          result.errors.push(`Merge update failed: ${updateError.message}`);
        }
      } else {
        console.log(`[sync:bitget] Phase C: No open trade found for close ${closeOrder.orderId} (${closeOrder.symbol}, ${polarity}). Skipping — open may be outside sync window.`);
        for (const id of closeOrder.fillIds) existingIds.add(id);
      }
    }
  }
  diag.cross_sync_merged = merged;
  diag.cross_sync_close_only = closeOnlyInserted;
  console.log(`[sync:bitget] Phase C: Cross-sync complete in ${Date.now() - phaseCStart}ms. Merged ${merged}, close-only ${closeOnlyInserted}.`);

  // Phase D2: Insert paired trades (already have exit data)
  if (!dryRun && newPaired.length > 0) {
    const phaseD2Start = Date.now();
    console.log(`[sync:bitget] Phase D2: Inserting ${newPaired.length} paired trades`);
    diag.insert_attempted = newOpens.length + newPaired.length;

    for (let i = 0; i < newPaired.length; i += CHUNK_SIZE) {
      if (Date.now() >= deadline) {
        const remaining = newPaired.length - i;
        result.errors.push(`D2 insert incomplete — ${remaining} paired trades remaining (deadline). Retry to finish.`);
        break;
      }

      const chunk = newPaired.slice(i, i + CHUNK_SIZE);
      const rows = chunk.map((trade: MappedTrade) => ({ user_id: userId, ...trade }));

      const { error: insertError } = await supabase.from("trades").insert(rows);
      if (insertError) {
        console.error("[sync:bitget] D2 insert failed:", insertError.message, insertError.code);
        diag.insert_errors.push(insertError.message);
        result.errors.push(`D2 insert error: ${insertError.message}`);
        for (const row of rows) {
          const { error: singleErr } = await supabase.from("trades").insert(row);
          if (singleErr) {
            failed++;
          } else {
            imported++;
          }
        }
      } else {
        imported += chunk.length;
      }
    }
    console.log(`[sync:bitget] Phase D2: Paired insert complete in ${Date.now() - phaseD2Start}ms`);
  } else if (!dryRun) {
    diag.insert_attempted = newOpens.length;
  }

  diag.insert_succeeded = imported;
  diag.insert_failed = failed;
  console.log(`[sync:bitget] Phases D1+D2: ${imported} total succeeded, ${failed} failed.`);

  // Legacy cleanup removed — was deleting valid trades by matching broker_order_id
  // against fill tradeIds, which can collide and destroy just-inserted or existing trades.
  diag.legacy_cleanup_skipped = true;

  const skipped = allTrades.length - newTrades.length;
  // Cursor advancement logic — three outcomes:
  // 1. Fills processed (imported/merged/deduped) → advance to latest fill time
  // 2. No fills fetched but windows scanned → advance past empty period (prevents cursor stalling)
  // 3. Fills fetched but all failed → DON'T advance (retry same fills next time)
  const anyProgress = (imported + closeOnlyInserted + merged + skipped) > 0;
  const emptyWindowProgress = !anyProgress && result.fetched === 0 && result.lastWindowEnd !== null;
  const cursorTime = anyProgress ? latestFillTime : emptyWindowProgress ? result.lastWindowEnd : null;
  return { fetched: result.fetched, imported: imported + closeOnlyInserted, merged, skipped, failed, errors: result.errors, diagnostics: diag, latestFillTime: cursorTime };
}

// ── Helpers ───────────────────────────────────────────────────

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

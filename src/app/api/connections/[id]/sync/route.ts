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
  insert_attempted: number;
  insert_succeeded: number;
  insert_failed: number;
  insert_errors: string[];
  sample_trade_keys?: string[];
};

type SyncOutput = {
  fetched: number;
  imported: number;
  merged: number;
  skipped: number;
  failed: number;
  errors: string[];
  diagnostics: SyncDiagnostics;
};

// POST: Trigger sync for a connection
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const url = new URL(_req.url);
  const fullSync = url.searchParams.get("fullSync") === "true";
  const dryRun = url.searchParams.get("dryRun") === "true";
  const daysBack = Math.min(Math.max(parseInt(url.searchParams.get("daysBack") || "14") || 14, 1), 90);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`sync:${user.id}`, 5, 60_000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many sync requests. Wait 1 minute." }, { status: 429 });
  }

  // Fetch connection WITH encrypted credentials
  const { data: conn, error: connError } = await supabase
    .from("broker_connections")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (connError || !conn) {
    return NextResponse.json({ error: "Connection not found" }, { status: 404 });
  }

  const startTime = Date.now();

  // Log sync start (skip for dry runs)
  let syncLogId: string | undefined;
  if (!dryRun) {
    const { data: syncLog } = await supabase
      .from("sync_logs")
      .insert({
        connection_id: id,
        user_id: user.id,
        sync_type: fullSync ? "full" : "manual",
        status: "started",
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    syncLogId = syncLog?.id;
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
        { dryRun, daysBack: fullSync ? daysBack : undefined },
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

      // Update connection status
      const { error: updateError } = await supabase
        .from("broker_connections")
        .update({
          last_sync_at: new Date().toISOString(),
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
    return NextResponse.json({
      trades_imported: result.imported,
      trades_merged: result.merged,
      trades_skipped: result.skipped,
      trades_failed: result.failed,
      fetched: result.fetched,
      api_errors: result.errors,
      dry_run: dryRun,
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
  opts: { dryRun?: boolean; daysBack?: number } = {},
): Promise<SyncOutput> {
  const { dryRun = false, daysBack } = opts;

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
    insert_attempted: 0,
    insert_succeeded: 0,
    insert_failed: 0,
    insert_errors: [],
  };

  // Phase A: Fetch and pair fills
  const phaseAStart = Date.now();
  console.log(`[sync:bitget] Phase A: Fetching fills. lastSync=${lastSyncAt ?? "null"}, daysBack=${daysBack ?? "default"}`);
  const fetchStart = lastSyncAt ? new Date(lastSyncAt).getTime() : undefined;
  const result = await fetchBitgetFills(creds, { startTime: fetchStart, daysBack });
  console.log(`[sync:bitget] Phase A: ${result.fetched} fills in ${Date.now() - phaseAStart}ms (${result.pairedTrades.length} paired, ${result.unmatchedOpens.length} open, ${result.unmatchedCloses.length} close)`);

  diag.phase_a_fetched = result.fetched;
  diag.phase_a_paired = result.pairedTrades.length;
  diag.phase_a_unmatched_opens = result.unmatchedOpens.length;
  diag.phase_a_unmatched_closes = result.unmatchedCloses.length;
  diag.phase_a_all_fill_ids = result.allFillIds.length;
  diag.phase_a_api_errors = [...result.errors];

  const allTrades = [...result.pairedTrades, ...result.unmatchedOpens];

  if (allTrades.length === 0 && result.unmatchedCloses.length === 0) {
    return { fetched: result.fetched, imported: 0, merged: 0, skipped: 0, failed: 0, errors: result.errors, diagnostics: diag };
  }

  // Legacy cleanup: remove old fill-level rows that are now aggregated.
  // ONLY run on incremental sync — on full re-sync there's no benefit
  // (we re-fetch everything anyway) and it could accidentally delete valid rows.
  const isFullSync = lastSyncAt === null;
  if (!dryRun && !isFullSync && result.allFillIds.length > 0) {
    diag.legacy_cleanup_skipped = false;
    const CLEANUP_CHUNK = 200;
    for (let i = 0; i < result.allFillIds.length; i += CLEANUP_CHUNK) {
      const chunk = result.allFillIds.slice(i, i + CLEANUP_CHUNK);
      await supabase
        .from("trades")
        .delete()
        .eq("user_id", userId)
        .eq("broker_name", "Bitget")
        .in("broker_order_id", chunk);
    }
  }

  // Phase B: Dedup — check fetched fills against existing DB rows
  const phaseBStart = Date.now();
  const existingIds = new Set<string>();
  const candidateOrderIds = [...new Set(allTrades.map((t) => t.broker_order_id))];

  if (candidateOrderIds.length > 0 && candidateOrderIds.length <= 500) {
    // Optimized path: targeted query for just the order IDs we fetched
    console.log(`[sync:bitget] Phase B: Targeted dedup for ${candidateOrderIds.length} order IDs`);
    const { data } = await supabase
      .from("trades")
      .select("broker_order_id, tags")
      .eq("user_id", userId)
      .eq("broker_name", "Bitget")
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
    for (const closeOrder of result.unmatchedCloses) {
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
      const { data } = await supabase
        .from("trades")
        .select("broker_order_id, tags")
        .eq("user_id", userId)
        .eq("broker_name", "Bitget")
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

  // Phase C: Cross-sync matching — update existing open trades with close data
  const phaseCStart = Date.now();
  let merged = 0;

  if (!dryRun) {
    for (const closeOrder of result.unmatchedCloses) {
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
        }
      }
    }
  }
  diag.cross_sync_merged = merged;
  console.log(`[sync:bitget] Phase C: Cross-sync complete in ${Date.now() - phaseCStart}ms. Merged ${merged}.`);

  // Phase D: Insert new trades in chunks
  const phaseDStart = Date.now();
  let imported = 0;
  let failed = 0;

  if (!dryRun && newTrades.length > 0) {
    const CHUNK_SIZE = 20;
    diag.insert_attempted = newTrades.length;

    for (let i = 0; i < newTrades.length; i += CHUNK_SIZE) {
      const chunk = newTrades.slice(i, i + CHUNK_SIZE);
      const rows = chunk.map((trade: MappedTrade) => ({ user_id: userId, ...trade }));

      const { error: insertError } = await supabase.from("trades").insert(rows);
      if (insertError) {
        console.error("[sync:bitget] Insert failed:", insertError.message, insertError.code);
        diag.insert_errors.push(insertError.message);
        result.errors.push(`Insert error: ${insertError.message}`);

        // Retry individual rows to isolate the bad one
        for (const row of rows) {
          const { error: singleErr } = await supabase.from("trades").insert(row);
          if (singleErr) {
            failed++;
            console.error("[sync:bitget] Single insert failed:", singleErr.message);
          } else {
            imported++;
          }
        }
      } else {
        imported += chunk.length;
      }
    }
  }

  diag.insert_succeeded = imported;
  diag.insert_failed = failed;
  console.log(`[sync:bitget] Phase D: Insert complete in ${Date.now() - phaseDStart}ms. ${imported} succeeded, ${failed} failed.`);

  const skipped = allTrades.length - newTrades.length;
  return { fetched: result.fetched, imported, merged, skipped, failed, errors: result.errors, diagnostics: diag };
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

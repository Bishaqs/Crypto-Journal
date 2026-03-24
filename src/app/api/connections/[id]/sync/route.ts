import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { decrypt } from "@/lib/broker-sync/crypto";
import { syncBitget, updateSyncLog, type SyncOutput } from "@/lib/broker-sync/sync-engine";

export const dynamic = "force-dynamic";
export const maxDuration = 10;

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
  const daysBackRaw = url.searchParams.get("daysBack");
  if (daysBackRaw && !/^\d+$/.test(daysBackRaw)) {
    return NextResponse.json({ error: "Invalid daysBack parameter" }, { status: 400 });
  }
  const defaultDays = fullSync ? "90" : "14";
  const daysBack = Math.min(Math.max(parseInt(daysBackRaw || defaultDays) || 14, 1), 90);
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

  // Sync lock: prevent concurrent syncs for the same connection
  if (conn.last_error === "Syncing..." && conn.updated_at) {
    const lockAge = Date.now() - new Date(conn.updated_at).getTime();
    if (lockAge < 15_000) {
      return NextResponse.json(
        { error: "Sync already in progress. Please wait.", trades_imported: 0 },
        { status: 409 },
      );
    }
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
        { dryRun, daysBack: fullSync ? daysBack : undefined, deadline, connectionId: id },
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
      let syncCursor: string | null;
      try {
        syncCursor = result.latestFillTime
          ? new Date(result.latestFillTime).toISOString()
          : conn.last_sync_at;
      } catch {
        syncCursor = conn.last_sync_at;
      }
      // Validate — don't write garbage to DB
      if (syncCursor && isNaN(new Date(syncCursor).getTime())) {
        syncCursor = null;
      }
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
      api_errors: result.errors.filter(e => !e.includes("404")),
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


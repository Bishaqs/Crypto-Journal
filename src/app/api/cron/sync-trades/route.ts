import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { decrypt } from "@/lib/broker-sync/crypto";
import { syncBitget, updateSyncLog } from "@/lib/broker-sync/sync-engine";

export const dynamic = "force-dynamic";
export const maxDuration = 10;

const FREQUENCY_MIN_DAYS: Record<string, number> = {
  daily: 0,
  hourly: 0,
  weekly: 6,
};

/**
 * Cron endpoint: auto-sync all enabled broker connections.
 * Vercel cron sends GET requests. Also supports POST for external cron services.
 * Secured with CRON_SECRET bearer token.
 * Schedule: daily at midnight UTC (configured in vercel.json).
 */
export async function GET(req: NextRequest) {
  return handleCronSync(req);
}

export async function POST(req: NextRequest) {
  return handleCronSync(req);
}

async function handleCronSync(req: NextRequest) {
  const startTime = Date.now();
  const deadline = startTime + 8000; // 2s safety margin from Vercel's 10s limit

  // Authenticate via CRON_SECRET
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Fetch all connections with auto_sync_enabled = true and status = active
  const { data: connections, error: fetchError } = await supabase
    .from("broker_connections")
    .select("*")
    .eq("auto_sync_enabled", true)
    .in("status", ["active", "error"])
    .order("last_sync_at", { ascending: true, nullsFirst: true });

  if (fetchError) {
    console.error("[cron/sync-trades] Failed to fetch connections:", fetchError.message);
    return NextResponse.json({ error: "DB query failed" }, { status: 500 });
  }

  if (!connections || connections.length === 0) {
    return NextResponse.json({ synced: 0, message: "No auto-sync connections found." });
  }

  const results: Array<{
    connection_id: string;
    broker: string;
    label: string | null;
    imported: number;
    skipped: number;
    error?: string;
  }> = [];

  for (const conn of connections) {
    // Deadline guard — stop if we're running low on time
    if (Date.now() > deadline - 2000) {
      console.log(`[cron/sync-trades] Deadline approaching, ${connections.length - results.length} connections remaining.`);
      break;
    }

    // Respect sync_frequency — skip connections that were synced recently
    const minDays = FREQUENCY_MIN_DAYS[conn.sync_frequency] ?? 0;
    if (minDays > 0 && conn.last_sync_at) {
      const daysSince = (Date.now() - new Date(conn.last_sync_at).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < minDays) {
        console.log(`[cron/sync-trades] Skipping ${conn.id} — synced ${daysSince.toFixed(1)} days ago (frequency: ${conn.sync_frequency})`);
        continue;
      }
    }

    // Cooldown for errored connections — retry after 1 hour
    if (conn.status === "error" && conn.updated_at) {
      const hoursSinceError = (Date.now() - new Date(conn.updated_at).getTime()) / (1000 * 60 * 60);
      if (hoursSinceError < 1) {
        console.log(`[cron/sync-trades] Skipping ${conn.id} — error cooldown (${hoursSinceError.toFixed(1)}h ago)`);
        continue;
      }
      console.log(`[cron/sync-trades] Retrying errored connection ${conn.id} (error was ${hoursSinceError.toFixed(1)}h ago)`);
    }

    // Sync lock check
    if (conn.last_error === "Syncing..." && conn.updated_at) {
      const lockAge = Date.now() - new Date(conn.updated_at).getTime();
      if (lockAge < 15_000) {
        console.log(`[cron/sync-trades] Skipping ${conn.id} — sync already in progress.`);
        continue;
      }
    }

    // Insert sync log
    const { data: syncLog } = await supabase
      .from("sync_logs")
      .insert({
        connection_id: conn.id,
        user_id: conn.user_id,
        sync_type: "scheduled",
        status: "started",
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    const syncLogId = syncLog?.id;

    // Set sync sentinel
    await supabase.from("broker_connections").update({
      last_error: "Syncing...",
      updated_at: new Date().toISOString(),
    }).eq("id", conn.id);

    try {
      // Decrypt credentials
      const apiKey = decrypt(conn.encrypted_api_key, conn.encryption_iv);
      const apiSecret = decrypt(conn.encrypted_api_secret, conn.secret_iv ?? conn.encryption_iv);
      const passphrase = conn.encrypted_passphrase && conn.passphrase_iv
        ? decrypt(conn.encrypted_passphrase, conn.passphrase_iv)
        : "";

      const brokerLower = (conn.broker_name ?? "").toLowerCase();

      if (!brokerLower.includes("bitget")) {
        await updateSyncLog(supabase, syncLogId, {
          status: "success",
          duration_ms: Date.now() - startTime,
          completed_at: new Date().toISOString(),
        });
        results.push({
          connection_id: conn.id,
          broker: conn.broker_name,
          label: conn.account_label,
          imported: 0,
          skipped: 0,
          error: `Sync not supported for ${conn.broker_name}`,
        });
        continue;
      }

      const result = await syncBitget(
        { apiKey, apiSecret, passphrase },
        conn.user_id,
        supabase,
        conn.last_sync_at,
        { deadline: Math.min(deadline, Date.now() + 6000) },
      );

      // Update sync log
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

      // Update connection cursor
      let syncCursor: string | null;
      try {
        syncCursor = result.latestFillTime
          ? new Date(result.latestFillTime).toISOString()
          : conn.last_sync_at;
      } catch {
        syncCursor = conn.last_sync_at;
      }
      if (syncCursor && isNaN(new Date(syncCursor).getTime())) {
        syncCursor = null;
      }

      await supabase
        .from("broker_connections")
        .update({
          last_sync_at: syncCursor,
          status: "active",
          total_trades_synced: (conn.total_trades_synced ?? 0) + result.imported,
          last_error: result.errors.filter((e: string) => !e.includes("404"))[0] ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", conn.id);

      results.push({
        connection_id: conn.id,
        broker: conn.broker_name,
        label: conn.account_label,
        imported: result.imported,
        skipped: result.skipped,
        error: result.errors.length > 0 ? result.errors[0] : undefined,
      });

      console.log(`[cron/sync-trades] ${conn.broker_name} (${conn.account_label ?? conn.id}): ${result.imported} imported, ${result.skipped} skipped`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      console.error(`[cron/sync-trades] Error syncing ${conn.id}:`, errorMsg);

      await updateSyncLog(supabase, syncLogId, {
        status: "failed",
        error_message: errorMsg,
        duration_ms: Date.now() - startTime,
        completed_at: new Date().toISOString(),
      });

      // Only mark as permanent error for auth failures — transient errors keep status
      const isPermanentError = errorMsg.includes("Auth failed") ||
        errorMsg.includes("Check API key") ||
        errorMsg.includes("Invalid API") ||
        errorMsg.includes("passphrase");

      await supabase
        .from("broker_connections")
        .update({
          status: isPermanentError ? "error" : conn.status,
          last_error: errorMsg,
          updated_at: new Date().toISOString(),
        })
        .eq("id", conn.id);

      results.push({
        connection_id: conn.id,
        broker: conn.broker_name,
        label: conn.account_label,
        imported: 0,
        skipped: 0,
        error: errorMsg,
      });
    }
  }

  const totalImported = results.reduce((sum, r) => sum + r.imported, 0);
  return NextResponse.json({
    synced: results.length,
    total_imported: totalImported,
    duration_ms: Date.now() - startTime,
    results,
  });
}

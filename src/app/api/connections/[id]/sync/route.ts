import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { decrypt } from "@/lib/broker-sync/crypto";
import { fetchBitgetFills, type MappedTrade } from "@/lib/broker-sync/bitget";
import type { SupabaseClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

type SyncOutput = {
  fetched: number;
  imported: number;
  skipped: number;
  failed: number;
  errors: string[];
};

// POST: Trigger sync for a connection
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
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

  // Log sync start
  const { data: syncLog } = await supabase
    .from("sync_logs")
    .insert({
      connection_id: id,
      user_id: user.id,
      sync_type: "manual",
      status: "started",
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  try {
    // Decrypt credentials
    const apiKey = decrypt(conn.encrypted_api_key, conn.encryption_iv);
    const apiSecret = decrypt(conn.encrypted_api_secret, conn.secret_iv ?? conn.encryption_iv);
    const passphrase = conn.encrypted_passphrase && conn.passphrase_iv
      ? decrypt(conn.encrypted_passphrase, conn.passphrase_iv)
      : "";

    // Route to broker-specific sync
    let result: SyncOutput;
    const brokerLower = conn.broker_name.toLowerCase();

    if (brokerLower.includes("bitget")) {
      result = await syncBitget(
        { apiKey, apiSecret, passphrase },
        user.id,
        supabase,
        conn.last_sync_at,
      );
    } else {
      // Unsupported broker — return info message
      await updateSyncLog(supabase, syncLog?.id, {
        status: "success",
        duration_ms: Date.now() - startTime,
      });
      return NextResponse.json({
        message: `Sync not yet supported for ${conn.broker_name}. Coming soon.`,
        trades_imported: 0,
      });
    }

    // Update sync log
    const duration = Date.now() - startTime;
    await updateSyncLog(supabase, syncLog?.id, {
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

    return NextResponse.json({
      trades_imported: result.imported,
      trades_skipped: result.skipped,
      trades_failed: result.failed,
      message: result.imported > 0
        ? `Imported ${result.imported} trade${result.imported !== 1 ? "s" : ""} from Bitget.`
        : result.fetched > 0
          ? `No new trades — ${result.skipped} already imported.`
          : "No new trades found.",
    });
  } catch (err) {
    const duration = Date.now() - startTime;
    const errorMsg = err instanceof Error ? err.message : "Unknown sync error";
    console.error("[sync] Error:", errorMsg);

    await updateSyncLog(supabase, syncLog?.id, {
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
): Promise<SyncOutput> {
  // Fetch fills from Bitget API
  const startTime = lastSyncAt ? new Date(lastSyncAt).getTime() : undefined;
  const result = await fetchBitgetFills(creds, { startTime });

  if (result.fills.length === 0) {
    return {
      fetched: result.fetched,
      imported: 0,
      skipped: 0,
      failed: 0,
      errors: result.errors,
    };
  }

  // Dedup: fetch existing broker_order_ids for this user+broker
  const { data: existing } = await supabase
    .from("trades")
    .select("broker_order_id")
    .eq("user_id", userId)
    .eq("broker_name", "Bitget")
    .not("broker_order_id", "is", null);

  const existingIds = new Set((existing ?? []).map((t: { broker_order_id: string }) => t.broker_order_id));
  const newFills = result.fills.filter((f) => !existingIds.has(f.broker_order_id));
  const skipped = result.fills.length - newFills.length;

  if (newFills.length === 0) {
    return {
      fetched: result.fetched,
      imported: 0,
      skipped,
      failed: 0,
      errors: result.errors,
    };
  }

  // Insert in chunks of 20
  let imported = 0;
  let failed = 0;
  const CHUNK_SIZE = 20;

  for (let i = 0; i < newFills.length; i += CHUNK_SIZE) {
    const chunk = newFills.slice(i, i + CHUNK_SIZE);
    const rows = chunk.map((fill: MappedTrade) => ({
      user_id: userId,
      ...fill,
    }));

    const { error: insertError } = await supabase.from("trades").insert(rows);
    if (insertError) {
      console.error("[sync:bitget] Insert failed:", insertError.message, insertError.code);
      failed += chunk.length;
      result.errors.push(`Insert error: ${insertError.message}`);
    } else {
      imported += chunk.length;
    }
  }

  return {
    fetched: result.fetched,
    imported,
    skipped,
    failed,
    errors: result.errors,
  };
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

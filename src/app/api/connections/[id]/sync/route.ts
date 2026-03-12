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
  merged: number;
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
  const fullSync = new URL(_req.url).searchParams.get("fullSync") === "true";
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
      sync_type: fullSync ? "full" : "manual",
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
        fullSync ? null : conn.last_sync_at,
      );
    } else {
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
    const totalNew = result.imported + result.merged;
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
      trades_merged: result.merged,
      trades_skipped: result.skipped,
      trades_failed: result.failed,
      message: totalNew > 0
        ? `Imported ${result.imported} trade${result.imported !== 1 ? "s" : ""}${result.merged > 0 ? `, merged ${result.merged} close fill${result.merged !== 1 ? "s" : ""}` : ""} from Bitget.`
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
  // Phase A: Fetch and pair fills
  const fetchStart = lastSyncAt ? new Date(lastSyncAt).getTime() : undefined;
  const result = await fetchBitgetFills(creds, { startTime: fetchStart });

  const allTrades = [...result.pairedTrades, ...result.unmatchedOpens];

  if (allTrades.length === 0 && result.unmatchedCloses.length === 0) {
    return { fetched: result.fetched, imported: 0, merged: 0, skipped: 0, failed: 0, errors: result.errors };
  }

  // Legacy cleanup: remove old fill-level rows that are now aggregated
  if (result.allFillIds.length > 0) {
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

  // Phase B: Dedup — fetch existing broker_order_ids + tags (paginated)
  const existingIds = new Set<string>();
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

  const newTrades = allTrades.filter((t) => !existingIds.has(t.broker_order_id));
  const skipped = allTrades.length - newTrades.length;

  // Phase C: Cross-sync matching — update existing open trades with close data
  let merged = 0;

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

  // Phase D: Insert new trades in chunks
  let imported = 0;
  let failed = 0;
  const CHUNK_SIZE = 20;

  for (let i = 0; i < newTrades.length; i += CHUNK_SIZE) {
    const chunk = newTrades.slice(i, i + CHUNK_SIZE);
    const rows = chunk.map((trade: MappedTrade) => ({ user_id: userId, ...trade }));

    const { error: insertError } = await supabase.from("trades").insert(rows);
    if (insertError) {
      console.error("[sync:bitget] Insert failed:", insertError.message, insertError.code);
      failed += chunk.length;
      result.errors.push(`Insert error: ${insertError.message}`);
    } else {
      imported += chunk.length;
    }
  }

  return { fetched: result.fetched, imported, merged, skipped, failed, errors: result.errors };
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

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { decrypt } from "@/lib/broker-sync/crypto";
import { fetchBitgetPositions } from "@/lib/broker-sync/bitget";

export const dynamic = "force-dynamic";

/**
 * POST: Repair existing unpaired Bitget fills.
 *
 * Phase 0: Undo bad repairs where close_timestamp < open_timestamp
 * Phase 1: FIFO match remaining unpaired fills with chronological constraint
 */
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

  const rl = await rateLimit(`repair:${user.id}`, 3, 60_000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many repair requests. Wait 1 minute." }, { status: 429 });
  }

  // Verify connection ownership (include creds for dedup-fix mode)
  const { data: conn } = await supabase
    .from("broker_connections")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!conn) {
    return NextResponse.json({ error: "Connection not found" }, { status: 404 });
  }

  const url = new URL(_req.url);

  // ── Mode: dedup-resync — clean duplicates + reset cursor for fresh resync ──
  if (url.searchParams.get("mode") === "dedup-resync") {
    return dedupAndResetCursor(supabase, user.id, id);
  }

  // ── Mode: dedup-fix — remove duplicates + close stale open trades ──
  if (url.searchParams.get("mode") === "dedup-fix") {
    return dedupFix(supabase, user.id, id, conn);
  }

  // ── Phase 0: Undo bad repairs (close_timestamp < open_timestamp) ──────

  type RepairedRow = {
    id: string;
    symbol: string;
    position: string;
    entry_price: number;
    exit_price: number;
    quantity: number;
    fees: number;
    open_timestamp: string;
    close_timestamp: string;
    pnl: number | null;
    tags: string[] | null;
    broker_order_id: string | null;
    broker_name: string;
    trade_source: string | null;
  };

  let undone = 0;
  const PAGE_SIZE = 1000;

  // Fetch all repaired Bitget trades (paginated)
  const repairedRows: RepairedRow[] = [];
  let rPage = 0;
  while (true) {
    const { data } = await supabase
      .from("trades")
      .select("id, symbol, position, entry_price, exit_price, quantity, fees, open_timestamp, close_timestamp, pnl, tags, broker_order_id, broker_name, trade_source")
      .eq("user_id", user.id)
      .eq("broker_name", "Bitget")
      .not("exit_price", "is", null)
      .contains("tags", ["repaired"])
      .range(rPage * PAGE_SIZE, (rPage + 1) * PAGE_SIZE - 1);
    if (!data || data.length === 0) break;
    repairedRows.push(...(data as RepairedRow[]));
    if (data.length < PAGE_SIZE) break;
    rPage++;
  }

  // Find bad repairs: close_timestamp < open_timestamp
  const badRepairs = repairedRows.filter((r) =>
    r.close_timestamp && r.open_timestamp &&
    new Date(r.close_timestamp) < new Date(r.open_timestamp)
  );

  for (const bad of badRepairs) {
    // Re-create the close fill as a separate row
    const { error: insertError } = await supabase
      .from("trades")
      .insert({
        user_id: user.id,
        symbol: bad.symbol,
        position: bad.position,
        entry_price: bad.exit_price, // close fill's price was stored as exit_price
        exit_price: null,
        quantity: bad.quantity,
        fees: 0, // fees were merged; close fill's original fees unknown
        open_timestamp: bad.close_timestamp, // close fill's timestamp
        close_timestamp: null,
        pnl: bad.pnl, // PnL belongs to the close fill
        broker_order_id: null,
        broker_name: "Bitget",
        trade_source: bad.trade_source || "cex",
        tags: ["bitget-api-sync"],
      });

    if (insertError) continue;

    // Revert the open row: null out close fields, remove "repaired" tag
    const cleanTags = ((bad.tags ?? []) as string[]).filter((t) => t !== "repaired");
    await supabase
      .from("trades")
      .update({
        exit_price: null,
        close_timestamp: null,
        pnl: null,
        tags: cleanTags,
      })
      .eq("id", bad.id);

    undone++;
  }

  // ── Phase 1: FIFO match remaining unpaired fills ──────────────────────

  type OpenRow = {
    id: string;
    symbol: string;
    position: string;
    entry_price: number;
    quantity: number;
    fees: number;
    open_timestamp: string;
    pnl: number | null;
    tags: string[] | null;
  };

  const allRows: OpenRow[] = [];
  let page = 0;

  while (true) {
    const { data } = await supabase
      .from("trades")
      .select("id, symbol, position, entry_price, quantity, fees, open_timestamp, pnl, tags")
      .eq("user_id", user.id)
      .eq("broker_name", "Bitget")
      .is("exit_price", null)
      .order("open_timestamp", { ascending: true })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    if (!data || data.length === 0) break;
    allRows.push(...(data as OpenRow[]));
    if (data.length < PAGE_SIZE) break;
    page++;
  }

  if (allRows.length === 0 && undone === 0) {
    return NextResponse.json({
      message: "No unpaired Bitget fills found.",
      undone: 0,
      merged: 0,
      orphaned_opens: 0,
      orphaned_closes: 0,
    });
  }

  // Separate opens from closes: pnl non-null and non-zero → close fill
  const opens: OpenRow[] = [];
  const closes: OpenRow[] = [];

  for (const row of allRows) {
    if (row.pnl !== null && row.pnl !== 0) {
      closes.push(row);
    } else {
      opens.push(row);
    }
  }

  // Build open pool keyed by "SYMBOL|position"
  type OpenTracker = { row: OpenRow; used: boolean };
  const openPool = new Map<string, OpenTracker[]>();

  for (const open of opens) {
    const key = `${open.symbol}|${open.position}`;
    if (!openPool.has(key)) openPool.set(key, []);
    openPool.get(key)!.push({ row: open, used: false });
  }

  // FIFO match each close to the oldest unused open — WITH chronological constraint
  let merged = 0;
  const deleteIds: string[] = [];

  for (const close of closes) {
    const key = `${close.symbol}|${close.position}`;
    const pool = openPool.get(key) || [];

    // Find first unused open that was opened BEFORE this close
    const closeTime = new Date(close.open_timestamp).getTime();
    const tracker = pool.find(
      (t) => !t.used && new Date(t.row.open_timestamp).getTime() < closeTime
    );
    if (!tracker) continue;

    tracker.used = true;

    const updatedTags = [
      ...((tracker.row.tags ?? []) as string[]),
      "repaired",
    ];

    const { error: updateError } = await supabase
      .from("trades")
      .update({
        exit_price: close.entry_price,
        close_timestamp: close.open_timestamp,
        pnl: close.pnl,
        fees: (tracker.row.fees || 0) + (close.fees || 0),
        tags: updatedTags,
      })
      .eq("id", tracker.row.id);

    if (!updateError) {
      merged++;
      deleteIds.push(close.id);
    }
  }

  // Delete the close rows that were merged
  if (deleteIds.length > 0) {
    const CHUNK = 200;
    for (let i = 0; i < deleteIds.length; i += CHUNK) {
      const chunk = deleteIds.slice(i, i + CHUNK);
      await supabase
        .from("trades")
        .delete()
        .eq("user_id", user.id)
        .in("id", chunk);
    }
  }

  const orphanedOpens = opens.filter((o) => {
    const key = `${o.symbol}|${o.position}`;
    const pool = openPool.get(key) || [];
    const tracker = pool.find((t) => t.row.id === o.id);
    return tracker && !tracker.used;
  }).length;

  const orphanedCloses = closes.length - merged;

  return NextResponse.json({
    message: `Undid ${undone} bad repair${undone !== 1 ? "s" : ""}. Repaired ${merged} trade${merged !== 1 ? "s" : ""}. ${orphanedOpens} open${orphanedOpens !== 1 ? "s" : ""} and ${orphanedCloses} close${orphanedCloses !== 1 ? "s" : ""} remain unmatched.`,
    undone,
    merged,
    orphaned_opens: orphanedOpens,
    orphaned_closes: orphanedCloses,
    total_examined: allRows.length,
  });
}

// ── Dedup Fix: Remove duplicates + close stale open trades ──────────
// Non-destructive: keeps the best row per broker_order_id, transfers journal links.

import type { SupabaseClient } from "@supabase/supabase-js";

type TradeRow = {
  id: string;
  broker_order_id: string | null;
  exit_price: number | null;
  close_timestamp: string | null;
  created_at: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function dedupFix(supabase: SupabaseClient, userId: string, connectionId: string, conn: any) {
  const startTime = Date.now();
  const deadline = startTime + 8000; // 8s self-imposed deadline
  let deduped = 0;
  let notesMoved = 0;
  let closeUpdated = 0;

  // ── Phase 1: Find and remove duplicate broker_order_ids ──
  const PAGE = 1000;
  const allTrades: TradeRow[] = [];
  let page = 0;

  while (true) {
    const { data } = await supabase
      .from("trades")
      .select("id, broker_order_id, exit_price, close_timestamp, created_at")
      .eq("user_id", userId)
      .eq("broker_name", "Bitget")
      .contains("tags", ["bitget-api-sync"])
      .order("created_at", { ascending: true })
      .range(page * PAGE, (page + 1) * PAGE - 1);
    if (!data || data.length === 0) break;
    allTrades.push(...(data as TradeRow[]));
    if (data.length < PAGE) break;
    page++;
  }

  // Group by broker_order_id
  const groups = new Map<string, TradeRow[]>();
  for (const t of allTrades) {
    if (!t.broker_order_id) continue;
    if (!groups.has(t.broker_order_id)) groups.set(t.broker_order_id, []);
    groups.get(t.broker_order_id)!.push(t);
  }

  // For each group with duplicates, keep the best row
  const deleteIds: string[] = [];
  for (const [, dupes] of groups) {
    if (dupes.length <= 1) continue;

    // Sort: closed first (exit_price not null), then oldest created_at
    dupes.sort((a, b) => {
      if (a.exit_price !== null && b.exit_price === null) return -1;
      if (a.exit_price === null && b.exit_price !== null) return 1;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    const keeper = dupes[0];
    const toDelete = dupes.slice(1);

    // Transfer journal_notes from duplicates to keeper
    const dupIds = toDelete.map((d) => d.id);
    const { data: notes } = await supabase
      .from("journal_notes")
      .select("id")
      .in("trade_id", dupIds);

    if (notes && notes.length > 0) {
      await supabase
        .from("journal_notes")
        .update({ trade_id: keeper.id })
        .in("trade_id", dupIds);
      notesMoved += notes.length;
    }

    deleteIds.push(...dupIds);
  }

  // Batch delete duplicates
  if (deleteIds.length > 0) {
    const CHUNK = 200;
    for (let i = 0; i < deleteIds.length; i += CHUNK) {
      if (Date.now() >= deadline) break;
      const chunk = deleteIds.slice(i, i + CHUNK);
      const { error } = await supabase
        .from("trades")
        .delete()
        .eq("user_id", userId)
        .in("id", chunk);
      if (!error) deduped += chunk.length;
    }
  }

  // ── Phase 2: Close stale open trades using Bitget API ──
  if (Date.now() < deadline - 2000) {
    try {
      const apiKey = decrypt(conn.encrypted_api_key, conn.encryption_iv);
      const apiSecret = decrypt(conn.encrypted_api_secret, conn.secret_iv ?? conn.encryption_iv);
      const passphrase = conn.encrypted_passphrase && conn.passphrase_iv
        ? decrypt(conn.encrypted_passphrase, conn.passphrase_iv)
        : "";

      const posResult = await fetchBitgetPositions(
        { apiKey, apiSecret, passphrase },
        { deadlineMs: deadline - 1000, maxPages: 10 },
      );

      if (posResult.closedTrades.length > 0) {
        // Build a map of closed positions by positionId
        const closedMap = new Map<string, { exit_price: number; close_timestamp: string; pnl: number | null; fees: number; tags: string[] }>();
        for (const t of posResult.closedTrades) {
          closedMap.set(t.broker_order_id, {
            exit_price: t.exit_price!,
            close_timestamp: t.close_timestamp!,
            pnl: t.pnl,
            fees: t.fees,
            tags: t.tags,
          });
        }

        // Find DB trades that are still open but should be closed
        const openTrades: { id: string; broker_order_id: string }[] = [];
        let oPage = 0;
        while (true) {
          const { data } = await supabase
            .from("trades")
            .select("id, broker_order_id")
            .eq("user_id", userId)
            .eq("broker_name", "Bitget")
            .is("exit_price", null)
            .not("broker_order_id", "is", null)
            .contains("tags", ["bitget-api-sync"])
            .range(oPage * PAGE, (oPage + 1) * PAGE - 1);
          if (!data || data.length === 0) break;
          openTrades.push(...(data as { id: string; broker_order_id: string }[]));
          if (data.length < PAGE) break;
          oPage++;
        }

        // Batch update open trades with close data (parallel batches of 5)
        const toUpdate = openTrades.filter((t) => closedMap.has(t.broker_order_id));
        const BATCH = 5;
        for (let i = 0; i < toUpdate.length; i += BATCH) {
          if (Date.now() >= deadline) break;
          const batch = toUpdate.slice(i, i + BATCH);
          const results = await Promise.all(
            batch.map((t) => {
              const closeData = closedMap.get(t.broker_order_id)!;
              return supabase
                .from("trades")
                .update({
                  exit_price: closeData.exit_price,
                  close_timestamp: closeData.close_timestamp,
                  pnl: closeData.pnl,
                  fees: closeData.fees,
                  tags: closeData.tags,
                })
                .eq("id", t.id)
                .is("exit_price", null);
            }),
          );
          closeUpdated += results.filter((r) => !r.error).length;
        }
      }
    } catch (err) {
      console.error("[repair:dedup-fix] Phase 2 error:", err instanceof Error ? err.message : err);
    }
  }

  // Update connection trade count
  const { count: finalCount } = await supabase
    .from("trades")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("broker_name", "Bitget")
    .contains("tags", ["bitget-api-sync"]);

  await supabase
    .from("broker_connections")
    .update({
      total_trades_synced: finalCount ?? 0,
      last_error: null,
    })
    .eq("id", connectionId);

  return NextResponse.json({
    message: `Removed ${deduped} duplicate${deduped !== 1 ? "s" : ""}, moved ${notesMoved} journal note${notesMoved !== 1 ? "s" : ""}, closed ${closeUpdated} stale trade${closeUpdated !== 1 ? "s" : ""}. ${finalCount ?? 0} trades remaining.`,
    deduped,
    notes_moved: notesMoved,
    close_updated: closeUpdated,
    total_remaining: finalCount ?? 0,
    duration_ms: Date.now() - startTime,
  });
}

// ── Nuclear Re-sync: Delete All API-Synced Trades + Reset Cursor ──
// Deletes ALL Bitget API-synced trades (preserves CSV imports & manual entries),
// then resets the sync cursor so a fresh re-sync creates correct FIFO pairings.

async function dedupAndResetCursor(
  supabase: SupabaseClient,
  userId: string,
  connectionId: string,
) {
  // Step 1: Count all API-synced trades
  const { count } = await supabase
    .from("trades")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("broker_name", "Bitget")
    .contains("tags", ["bitget-api-sync"]);

  const totalBefore = count ?? 0;

  // Step 2: Delete all API-synced trades (paginated to avoid timeouts)
  let deleted = 0;
  const PAGE = 200;
  while (true) {
    const { data } = await supabase
      .from("trades")
      .select("id")
      .eq("user_id", userId)
      .eq("broker_name", "Bitget")
      .contains("tags", ["bitget-api-sync"])
      .limit(PAGE);
    if (!data || data.length === 0) break;

    const ids = data.map((t: { id: string }) => t.id);
    const { error } = await supabase
      .from("trades")
      .delete()
      .eq("user_id", userId)
      .in("id", ids);
    if (!error) deleted += ids.length;
    else break;
  }

  // Step 3: Reset sync cursor + trade count
  const { error: cursorError } = await supabase
    .from("broker_connections")
    .update({
      last_sync_at: null,
      last_error: null,
      total_trades_synced: 0,
    })
    .eq("id", connectionId);

  return NextResponse.json({
    message: `Deleted ${deleted} API-synced trades. Cursor reset — click Full Re-sync to re-import.`,
    total_before: totalBefore,
    deleted,
    cursor_reset: !cursorError,
  });
}

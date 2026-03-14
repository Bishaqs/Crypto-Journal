import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

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

  // Verify connection ownership
  const { data: conn } = await supabase
    .from("broker_connections")
    .select("id, broker_name")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!conn) {
    return NextResponse.json({ error: "Connection not found" }, { status: 404 });
  }

  // ── Mode: dedup-resync — clean duplicates + reset cursor for fresh resync ──
  const url = new URL(_req.url);
  if (url.searchParams.get("mode") === "dedup-resync") {
    return dedupAndResetCursor(supabase, user.id, id);
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

// ── Dedup + Reset Cursor ─────────────────────────────────────────
// Deletes duplicate Bitget trades (keeps one per broker_order_id group),
// then resets the sync cursor so a fresh sync re-fetches and properly pairs.

import type { SupabaseClient } from "@supabase/supabase-js";

async function dedupAndResetCursor(
  supabase: SupabaseClient,
  userId: string,
  connectionId: string,
) {
  const PAGE_SIZE = 1000;

  // Step 1: Fetch all Bitget API-synced trades
  type TradeRow = { id: string; broker_order_id: string | null; open_timestamp: string; exit_price: number | null };
  const allTrades: TradeRow[] = [];
  let page = 0;
  while (true) {
    const { data, error } = await supabase
      .from("trades")
      .select("id, broker_order_id, open_timestamp, exit_price")
      .eq("user_id", userId)
      .eq("broker_name", "Bitget")
      .contains("tags", ["bitget-api-sync"])
      .order("open_timestamp", { ascending: true })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    if (error || !data || data.length === 0) break;
    allTrades.push(...(data as TradeRow[]));
    if (data.length < PAGE_SIZE) break;
    page++;
  }

  // Step 2: Group by broker_order_id, find duplicates
  const groups = new Map<string, TradeRow[]>();
  let nullIdCount = 0;
  for (const t of allTrades) {
    if (!t.broker_order_id) { nullIdCount++; continue; }
    // Strip :partial suffix for grouping
    const baseId = t.broker_order_id.replace(/:partial$/, "");
    const existing = groups.get(baseId);
    if (existing) existing.push(t);
    else groups.set(baseId, [t]);
  }

  // Step 3: For each group with >1 trade, keep the one with exit data (or oldest), delete rest
  const deleteIds: string[] = [];
  let dupGroups = 0;
  for (const [, trades] of groups) {
    if (trades.length <= 1) continue;
    dupGroups++;
    // Prefer the trade with exit data; if none or multiple, keep the oldest
    const sorted = [...trades].sort((a, b) => {
      if (a.exit_price !== null && b.exit_price === null) return -1;
      if (a.exit_price === null && b.exit_price !== null) return 1;
      return new Date(a.open_timestamp).getTime() - new Date(b.open_timestamp).getTime();
    });
    // Keep first (has exit or oldest), delete rest
    for (let i = 1; i < sorted.length; i++) {
      deleteIds.push(sorted[i].id);
    }
  }

  // Step 4: Delete duplicates
  let deleted = 0;
  if (deleteIds.length > 0) {
    const CHUNK = 200;
    for (let i = 0; i < deleteIds.length; i += CHUNK) {
      const chunk = deleteIds.slice(i, i + CHUNK);
      const { error } = await supabase
        .from("trades")
        .delete()
        .eq("user_id", userId)
        .in("id", chunk);
      if (!error) deleted += chunk.length;
    }
  }

  // Step 5: Reset sync cursor so next sync re-fetches all data with fixed code
  const { error: cursorError } = await supabase
    .from("broker_connections")
    .update({ last_sync_at: null, last_error: null })
    .eq("id", connectionId);

  return NextResponse.json({
    message: `Removed ${deleted} duplicate${deleted !== 1 ? "s" : ""} from ${dupGroups} groups. Cursor reset — click Full Re-sync to re-pair trades with fixed code.`,
    total_trades: allTrades.length,
    null_id_trades: nullIdCount,
    duplicate_groups: dupGroups,
    deleted,
    cursor_reset: !cursorError,
  });
}

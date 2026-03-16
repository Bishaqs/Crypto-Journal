import type { TargetTable } from "@/lib/import-export-types";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Shared dedup logic for CSV import.
 * Both csv-import-modal.tsx and upload-file-tab.tsx use these
 * to build identical dedup signatures.
 */

/** SELECT columns for fetchAllTrades per table (forex uses different column names) */
export function getDedupSelect(table: TargetTable): string {
  if (table === "forex_trades") {
    return "pair, position, entry_price, lot_size, open_timestamp";
  }
  return "symbol, position, entry_price, quantity, open_timestamp";
}

/** Build signature from an existing DB row */
export function getExistingSig(
  row: Record<string, unknown>,
  table: TargetTable,
): string {
  if (table === "forex_trades") {
    return [row.pair, row.position, row.entry_price, row.lot_size, row.open_timestamp]
      .map((v) => String(v ?? ""))
      .join("|");
  }
  return [row.symbol, row.position, row.entry_price, row.quantity, row.open_timestamp]
    .map((v) => String(v ?? ""))
    .join("|");
}

/** Build signature from a parsed CSV payload (always uses symbol/quantity keys) */
export function getPayloadSig(payload: Record<string, unknown>): string {
  return [payload.symbol, payload.position, payload.entry_price, payload.quantity, payload.open_timestamp]
    .map((v) => String(v ?? ""))
    .join("|");
}

/**
 * Find the earliest closed API-synced trade date for the user.
 * Returns null if no API-synced trades exist — CSV import proceeds normally.
 * Used to skip CSV trades that overlap with the API sync window.
 */
export async function getApiSyncCutoff(
  supabase: SupabaseClient,
  userId: string,
): Promise<string | null> {
  // Find earliest CLOSED API-synced trade (not open positions which have old dates)
  const { data } = await supabase
    .from("trades")
    .select("open_timestamp")
    .eq("user_id", userId)
    .contains("tags", ["bitget-api-sync"])
    .not("tags", "cs", '{"from-open-position"}')
    .not("exit_price", "is", null)
    .order("open_timestamp", { ascending: true })
    .limit(1)
    .maybeSingle();

  return data?.open_timestamp ?? null;
}

/**
 * Filter out CSV payloads that overlap with the API sync period.
 * Returns { filtered, apiSkipped } where apiSkipped is the count of skipped trades.
 */
export function filterApiOverlap(
  payloads: Record<string, unknown>[],
  apiCutoff: string | null,
): { filtered: Record<string, unknown>[]; apiSkipped: number } {
  if (!apiCutoff) return { filtered: payloads, apiSkipped: 0 };

  const cutoffMs = new Date(apiCutoff).getTime();
  if (isNaN(cutoffMs)) return { filtered: payloads, apiSkipped: 0 };

  const filtered: Record<string, unknown>[] = [];
  let apiSkipped = 0;

  for (const p of payloads) {
    // Check close_timestamp (for completed trades) or open_timestamp (for open-only)
    const closeTs = p.close_timestamp ? new Date(String(p.close_timestamp)).getTime() : NaN;
    const openTs = p.open_timestamp ? new Date(String(p.open_timestamp)).getTime() : NaN;
    const tradeTime = !isNaN(closeTs) ? closeTs : openTs;

    if (!isNaN(tradeTime) && tradeTime >= cutoffMs) {
      apiSkipped++;
    } else {
      filtered.push(p);
    }
  }

  return { filtered, apiSkipped };
}

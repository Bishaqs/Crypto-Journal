import type { TargetTable } from "@/lib/import-export-types";

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

import { SupabaseClient } from "@supabase/supabase-js";
import type { JournalNote, JournalNoteTradeLink, AssetType } from "./types";

/**
 * Link a journal note to a trade via the junction table.
 * Uses upsert to avoid duplicate constraint errors.
 */
export async function linkNoteToTrade(
  supabase: SupabaseClient,
  noteId: string,
  tradeId: string,
  tradeAssetType: AssetType
): Promise<void> {
  const { error } = await supabase
    .from("journal_note_trades")
    .upsert(
      { note_id: noteId, trade_id: tradeId, trade_asset_type: tradeAssetType },
      { onConflict: "note_id,trade_id" }
    );
  if (error) throw error;
}

/**
 * Unlink a journal note from a specific trade.
 */
export async function unlinkNoteFromTrade(
  supabase: SupabaseClient,
  noteId: string,
  tradeId: string
): Promise<void> {
  const { error } = await supabase
    .from("journal_note_trades")
    .delete()
    .eq("note_id", noteId)
    .eq("trade_id", tradeId);
  if (error) throw error;
}

/**
 * Get all trade links for a given note.
 */
export async function getLinkedTradesForNote(
  supabase: SupabaseClient,
  noteId: string
): Promise<JournalNoteTradeLink[]> {
  const { data, error } = await supabase
    .from("journal_note_trades")
    .select("*")
    .eq("note_id", noteId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as JournalNoteTradeLink[]) ?? [];
}

/**
 * Get all journal notes linked to a specific trade.
 */
export async function getLinkedNotesForTrade(
  supabase: SupabaseClient,
  tradeId: string
): Promise<JournalNote[]> {
  // Get note IDs from junction table
  const { data: links, error: linksError } = await supabase
    .from("journal_note_trades")
    .select("note_id")
    .eq("trade_id", tradeId);
  if (linksError) throw linksError;
  if (!links || links.length === 0) return [];

  const noteIds = links.map((l) => l.note_id);
  const { data: notes, error: notesError } = await supabase
    .from("journal_notes")
    .select("*")
    .in("id", noteIds)
    .order("created_at", { ascending: false });
  if (notesError) throw notesError;
  return (notes as JournalNote[]) ?? [];
}

/**
 * Replace all trade links for a note with a new set.
 * Deletes existing links and inserts the new ones.
 */
export async function setNoteTradeLinks(
  supabase: SupabaseClient,
  noteId: string,
  trades: { tradeId: string; assetType: AssetType }[]
): Promise<void> {
  // Delete all existing links for this note
  const { error: delError } = await supabase
    .from("journal_note_trades")
    .delete()
    .eq("note_id", noteId);
  if (delError) throw delError;

  // Insert new links
  if (trades.length > 0) {
    const rows = trades.map((t) => ({
      note_id: noteId,
      trade_id: t.tradeId,
      trade_asset_type: t.assetType,
    }));
    const { error: insError } = await supabase
      .from("journal_note_trades")
      .insert(rows);
    if (insError) throw insError;
  }
}

/**
 * Get a Set of note IDs that have at least one trade link.
 * Used for batch checking on the journal page.
 */
export async function getLinkedNoteIds(
  supabase: SupabaseClient
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("journal_note_trades")
    .select("note_id");
  if (error) return new Set();
  return new Set((data ?? []).map((r) => r.note_id));
}

/**
 * Get note IDs already linked to a specific trade.
 * Used by NoteLinkPicker to exclude already-linked notes.
 */
export async function getNoteIdsLinkedToTrade(
  supabase: SupabaseClient,
  tradeId: string
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("journal_note_trades")
    .select("note_id")
    .eq("trade_id", tradeId);
  if (error) return new Set();
  return new Set((data ?? []).map((r) => r.note_id));
}

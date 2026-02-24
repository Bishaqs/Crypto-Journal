import { SupabaseClient } from "@supabase/supabase-js";

/**
 * After a CSV import, find journal notes flagged with auto_link_on_import
 * and link each to the trade with the closest open_timestamp.
 */
export async function autoLinkNotesAfterImport(
  supabase: SupabaseClient
): Promise<number> {
  // Fetch notes flagged for auto-linking that have no trade linked yet
  const { data: notes } = await supabase
    .from("journal_notes")
    .select("id, created_at")
    .eq("auto_link_on_import", true)
    .is("trade_id", null);

  if (!notes || notes.length === 0) return 0;

  // Fetch all trades for matching
  const { data: trades } = await supabase
    .from("trades")
    .select("id, open_timestamp")
    .order("open_timestamp", { ascending: false });

  if (!trades || trades.length === 0) return 0;

  const sorted = trades
    .map((t) => ({ id: t.id as string, ts: new Date(t.open_timestamp).getTime() }))
    .sort((a, b) => a.ts - b.ts);

  let linked = 0;

  for (const note of notes) {
    const noteTs = new Date(note.created_at).getTime();

    let closestId = sorted[0].id;
    let closestDiff = Math.abs(sorted[0].ts - noteTs);

    for (let i = 1; i < sorted.length; i++) {
      const diff = Math.abs(sorted[i].ts - noteTs);
      if (diff < closestDiff) {
        closestDiff = diff;
        closestId = sorted[i].id;
      }
    }

    const { error } = await supabase
      .from("journal_notes")
      .update({ trade_id: closestId, auto_link_on_import: false })
      .eq("id", note.id);

    if (!error) linked++;
  }

  return linked;
}

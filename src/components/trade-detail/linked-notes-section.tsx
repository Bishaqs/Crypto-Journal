"use client";

import { useState } from "react";
import { JournalNote } from "@/lib/types";
import { FileText, Plus, Link2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { unlinkNoteFromTrade } from "@/lib/journal-links";

type LinkedNotesSectionProps = {
  tradeId: string;
  notes: JournalNote[];
  onCreateNote: () => void;
  onLinkExisting: () => void;
  onRefresh: () => void;
};

function stripHtml(html: string): string {
  const div = typeof document !== "undefined" ? document.createElement("div") : null;
  if (!div) return html.replace(/<[^>]*>/g, "");
  div.innerHTML = html;
  return div.textContent ?? div.innerText ?? "";
}

export function LinkedNotesSection({ tradeId, notes, onCreateNote, onLinkExisting, onRefresh }: LinkedNotesSectionProps) {
  const [unlinking, setUnlinking] = useState<string | null>(null);

  async function handleUnlink(noteId: string) {
    setUnlinking(noteId);
    try {
      const supabase = createClient();
      await unlinkNoteFromTrade(supabase, noteId, tradeId);
      onRefresh();
    } catch {
      // Fallback to legacy if junction table doesn't exist
      const supabase = createClient();
      await supabase
        .from("journal_notes")
        .update({ trade_id: null, trade_asset_type: null, note_type: "other" })
        .eq("id", noteId);
      onRefresh();
    } finally {
      setUnlinking(null);
    }
  }

  return (
    <div className="glass rounded-2xl border border-border/50 p-5 space-y-3" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5">
          <FileText size={14} className="text-accent" /> Linked Journal Notes
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={onLinkExisting}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-muted hover:text-foreground hover:bg-border/30 transition-colors border border-border/50"
          >
            <Link2 size={12} /> Link Existing
          </button>
          <button
            onClick={onCreateNote}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-accent bg-accent/10 hover:bg-accent/20 transition-colors"
          >
            <Plus size={12} /> New Note
          </button>
        </div>
      </div>

      {notes.length === 0 ? (
        <div className="py-6 text-center text-muted text-sm">
          No journal notes linked to this trade
        </div>
      ) : (
        <div className="space-y-2">
          {notes.map((note) => {
            const snippet = stripHtml(note.content).slice(0, 120);
            return (
              <div
                key={note.id}
                className="p-3 rounded-xl bg-background/50 border border-border/30 hover:border-border/60 transition-colors group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {note.title || "Untitled Note"}
                    </p>
                    <p className="text-xs text-muted mt-0.5 line-clamp-2 leading-relaxed">
                      {snippet}{snippet.length >= 120 ? "..." : ""}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] text-muted">
                        {new Date(note.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                      {note.tags?.length > 0 && (
                        <div className="flex gap-1">
                          {note.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-accent/10 text-accent font-medium">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleUnlink(note.id)}
                    disabled={unlinking === note.id}
                    title="Unlink note"
                    className="p-1.5 rounded-lg text-muted hover:text-loss hover:bg-loss/10 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { JournalNote, AssetType } from "@/lib/types";
import { Search, X, Link2 } from "lucide-react";

type NoteLinkPickerProps = {
  tradeId: string;
  assetType: AssetType;
  onLinked: () => void;
  onClose: () => void;
};

function stripHtml(html: string): string {
  const div = typeof document !== "undefined" ? document.createElement("div") : null;
  if (!div) return html.replace(/<[^>]*>/g, "");
  div.innerHTML = html;
  return div.textContent ?? div.innerText ?? "";
}

export function NoteLinkPicker({ tradeId, assetType, onLinked, onClose }: NoteLinkPickerProps) {
  const [notes, setNotes] = useState<JournalNote[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUnlinked() {
      const supabase = createClient();
      const { data } = await supabase
        .from("journal_notes")
        .select("*")
        .is("trade_id", null)
        .eq("asset_type", assetType)
        .order("created_at", { ascending: false })
        .limit(50);
      setNotes((data as JournalNote[]) ?? []);
      setLoading(false);
    }
    fetchUnlinked();
  }, [assetType]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const filtered = search
    ? notes.filter((n) => {
        const q = search.toLowerCase();
        return (
          (n.title?.toLowerCase().includes(q)) ||
          stripHtml(n.content).toLowerCase().includes(q) ||
          n.tags?.some((t) => t.toLowerCase().includes(q))
        );
      })
    : notes;

  async function handleLink(noteId: string) {
    setLinking(noteId);
    try {
      const supabase = createClient();
      await supabase
        .from("journal_notes")
        .update({ trade_id: tradeId, trade_asset_type: assetType, note_type: "trade" })
        .eq("id", noteId);
      onLinked();
    } finally {
      setLinking(null);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
        <div className="glass rounded-2xl border border-border/50 w-full max-w-lg max-h-[70vh] flex flex-col overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Link2 size={16} className="text-accent" /> Link Existing Note
            </h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-hover transition-colors text-muted hover:text-foreground">
              <X size={16} />
            </button>
          </div>

          {/* Search */}
          <div className="px-5 py-3 border-b border-border/30">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search notes..."
                autoFocus
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted/40 focus:border-accent/50 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Notes list */}
          <div className="flex-1 overflow-y-auto px-5 py-3">
            {loading ? (
              <div className="py-8 text-center text-muted text-sm">Loading notes...</div>
            ) : filtered.length === 0 ? (
              <div className="py-8 text-center text-muted text-sm">
                {search ? "No notes match your search" : "No unlinked notes available"}
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((note) => {
                  const snippet = stripHtml(note.content).slice(0, 80);
                  return (
                    <button
                      key={note.id}
                      onClick={() => handleLink(note.id)}
                      disabled={linking === note.id}
                      className="w-full text-left p-3 rounded-xl bg-background/50 border border-border/30 hover:border-accent/40 hover:bg-accent/5 transition-colors disabled:opacity-50"
                    >
                      <p className="text-sm font-medium text-foreground truncate">
                        {note.title || "Untitled Note"}
                      </p>
                      <p className="text-xs text-muted mt-0.5 line-clamp-1">
                        {snippet}{snippet.length >= 80 ? "..." : ""}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] text-muted">
                          {new Date(note.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                        {note.tags?.slice(0, 2).map((tag) => (
                          <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-accent/10 text-accent font-medium">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

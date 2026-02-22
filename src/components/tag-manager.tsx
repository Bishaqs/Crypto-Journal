"use client";

import { useState, useEffect } from "react";
import { X, Plus, Tag, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Trade, JournalNote } from "@/lib/types";
import {
  getCustomTagPresets,
  addCustomTagPreset,
  removeCustomTagPreset,
} from "@/lib/tag-manager";

type TagCount = { tag: string; count: number };

export function TagManager({
  trades,
  notes,
  onClose,
  onUpdate,
}: {
  trades: Trade[];
  notes: JournalNote[];
  onClose: () => void;
  onUpdate?: () => void;
}) {
  const [presets, setPresets] = useState<string[]>([]);
  const [newPreset, setNewPreset] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    setPresets(getCustomTagPresets());
  }, []);

  // Collect all unique tags with usage counts
  const tagCounts: TagCount[] = (() => {
    const counts = new Map<string, number>();
    for (const t of trades) {
      for (const tag of t.tags) {
        if (tag.startsWith("narrative:")) continue;
        counts.set(tag, (counts.get(tag) || 0) + 1);
      }
    }
    for (const n of notes) {
      for (const tag of n.tags) {
        counts.set(tag, (counts.get(tag) || 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  })();

  function handleAddPreset() {
    const trimmed = newPreset.trim().toLowerCase();
    if (!trimmed) return;
    const updated = addCustomTagPreset(trimmed);
    setPresets(updated);
    setNewPreset("");
  }

  function handleRemovePreset(tag: string) {
    const updated = removeCustomTagPreset(tag);
    setPresets(updated);
  }

  async function handleDeleteTag(tag: string) {
    setDeleting(tag);
    const supabase = createClient();

    // Remove from trades
    const { data: matchingTrades } = await supabase
      .from("trades")
      .select("id, tags")
      .contains("tags", [tag]);

    if (matchingTrades) {
      for (const trade of matchingTrades) {
        const newTags = (trade.tags as string[]).filter((t: string) => t !== tag);
        await supabase.from("trades").update({ tags: newTags }).eq("id", trade.id);
      }
    }

    // Remove from journal notes
    const { data: matchingNotes } = await supabase
      .from("journal_notes")
      .select("id, tags")
      .contains("tags", [tag]);

    if (matchingNotes) {
      for (const note of matchingNotes) {
        const newTags = (note.tags as string[]).filter((t: string) => t !== tag);
        await supabase
          .from("journal_notes")
          .update({ tags: newTags })
          .eq("id", note.id);
      }
    }

    // Also remove from presets if it exists there
    handleRemovePreset(tag);
    setDeleting(null);
    onUpdate?.();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddPreset();
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
        <div
          className="glass border border-border/50 rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
            <div className="flex items-center gap-2">
              <Tag size={18} className="text-accent" />
              <h2 className="text-lg font-bold text-foreground">Manage Tags</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-surface-hover text-muted hover:text-foreground transition-all"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            {/* Custom Presets */}
            <div>
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">
                Custom Presets
              </h3>
              <p className="text-[10px] text-muted mb-3">
                These tags appear as suggestions when adding tags to trades.
              </p>

              {/* Add new */}
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newPreset}
                  onChange={(e) => setNewPreset(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Add a preset tag..."
                  className="flex-1 px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground focus:outline-none focus:border-accent/50 transition-all placeholder-muted/40"
                />
                <button
                  onClick={handleAddPreset}
                  disabled={!newPreset.trim()}
                  className="px-3 py-2 rounded-lg bg-accent text-background text-sm font-medium hover:bg-accent-hover transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* Preset chips */}
              {presets.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {presets.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-accent/10 text-accent text-xs font-medium border border-accent/20"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemovePreset(tag)}
                        className="text-accent/50 hover:text-accent transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-muted/50 italic">
                  No presets yet. Add tags above to create quick-access
                  suggestions.
                </p>
              )}
            </div>

            {/* All tags in use */}
            <div>
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">
                All Tags in Use
              </h3>
              <p className="text-[10px] text-muted mb-3">
                Tags across all your trades and journal notes.
              </p>

              {tagCounts.length > 0 ? (
                <div className="space-y-1">
                  {tagCounts.map(({ tag, count }) => (
                    <div
                      key={tag}
                      className="flex items-center justify-between px-3 py-2 rounded-lg bg-background hover:bg-surface-hover transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-foreground font-medium">
                          {tag}
                        </span>
                        <span className="text-[9px] text-muted px-1.5 py-0.5 rounded-full bg-surface-hover">
                          {count}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteTag(tag)}
                        disabled={deleting === tag}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted hover:text-loss transition-all"
                        title={`Remove "${tag}" from all trades & notes`}
                      >
                        {deleting === tag ? (
                          <span className="text-[10px]">...</span>
                        ) : (
                          <Trash2 size={12} />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-muted/50 italic">
                  No tags found. Add tags to your trades to see them here.
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border/30">
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-surface-hover text-foreground text-sm font-medium hover:bg-border transition-all"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

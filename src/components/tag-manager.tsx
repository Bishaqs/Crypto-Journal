"use client";

import { useState, useEffect } from "react";
import { X, Plus, Tag, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Trade, JournalNote } from "@/lib/types";
import {
  getCustomTagPresets,
  addCustomTagPreset,
  removeCustomTagPreset,
  isSystemTag,
} from "@/lib/tag-manager";
import { getTagColor, setTagColor, TAG_PALETTE } from "@/lib/tag-colors";

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
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmRemovePreset, setConfirmRemovePreset] = useState<string | null>(null);
  const [colorPickerTag, setColorPickerTag] = useState<string | null>(null);
  const [pendingPresetColor, setPendingPresetColor] = useState<number | null>(null);
  // Force re-render when colors change
  const [colorVersion, setColorVersion] = useState(0);

  useEffect(() => {
    setPresets(getCustomTagPresets());
  }, []);

  // Collect all unique tags with usage counts
  const tagCounts: TagCount[] = (() => {
    const counts = new Map<string, number>();
    for (const t of trades) {
      for (const tag of t.tags) {
        if (tag.startsWith("narrative:") || isSystemTag(tag)) continue;
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
    if (pendingPresetColor !== null) {
      setTagColor(trimmed, pendingPresetColor);
      setPendingPresetColor(null);
      setColorVersion((v) => v + 1);
    }
    setPresets(updated);
    setNewPreset("");
  }

  function handleRemovePreset(tag: string) {
    const updated = removeCustomTagPreset(tag);
    setPresets(updated);
    setConfirmRemovePreset(null);
  }

  async function handleDeleteTag(tag: string) {
    setDeleting(tag);
    const supabase = createClient();

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

    handleRemovePreset(tag);
    setDeleting(null);
    setConfirmDelete(null);
    onUpdate?.();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddPreset();
    }
  }

  function handleColorPick(tag: string, colorIndex: number) {
    setTagColor(tag, colorIndex);
    setColorVersion((v) => v + 1);
    setColorPickerTag(null);
  }

  function ColorDots({ selectedTag, onPick }: { selectedTag: string; onPick: (idx: number) => void }) {
    return (
      <div className="flex items-center gap-1.5 py-1">
        {TAG_PALETTE.map((c, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onPick(i)}
            className="w-5 h-5 rounded-full border-2 transition-all hover:scale-110"
            style={{
              backgroundColor: c.text,
              borderColor: getTagColor(selectedTag).text === c.text ? "#fff" : "transparent",
            }}
            title={`Color ${i + 1}`}
          />
        ))}
      </div>
    );
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
              <div className="flex gap-2 mb-2">
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

              {/* Color picker for new preset */}
              {newPreset.trim() && (
                <div className="mb-3">
                  <p className="text-[10px] text-muted mb-1">Pick a color (optional):</p>
                  <div className="flex items-center gap-1.5">
                    {TAG_PALETTE.map((c, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setPendingPresetColor(pendingPresetColor === i ? null : i)}
                        className="w-5 h-5 rounded-full border-2 transition-all hover:scale-110"
                        style={{
                          backgroundColor: c.text,
                          borderColor: pendingPresetColor === i ? "#fff" : "transparent",
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Preset chips */}
              {presets.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {presets.map((tag) => {
                    const color = getTagColor(tag);

                    // Confirmation state — show remove confirmation
                    if (confirmRemovePreset === tag) {
                      return (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs font-medium border border-loss/30 bg-loss/10"
                        >
                          <span className="text-loss">Remove &quot;{tag}&quot;?</span>
                          <button
                            onClick={() => setConfirmRemovePreset(null)}
                            className="text-muted hover:text-foreground transition-colors text-[10px]"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleRemovePreset(tag)}
                            className="text-loss hover:text-loss/80 transition-colors text-[10px] font-bold"
                          >
                            Remove
                          </button>
                        </span>
                      );
                    }

                    return (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border cursor-pointer"
                        style={{
                          backgroundColor: color.bg,
                          color: color.text,
                          borderColor: color.border,
                        }}
                        onClick={() => setColorPickerTag(colorPickerTag === tag ? null : tag)}
                        title="Click to change color"
                      >
                        {tag}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmRemovePreset(tag);
                          }}
                          className="hover:opacity-70 transition-opacity ml-0.5"
                          style={{ color: color.text }}
                          title="Remove preset"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[11px] text-muted/50 italic">
                  No presets yet. Add tags above to create quick-access
                  suggestions.
                </p>
              )}

              {/* Inline color picker for existing preset */}
              {colorPickerTag && presets.includes(colorPickerTag) && (
                <div className="mt-2 px-2 py-2 rounded-lg bg-background border border-border/50">
                  <p className="text-[10px] text-muted mb-1.5">
                    Color for &quot;{colorPickerTag}&quot;:
                  </p>
                  <ColorDots
                    selectedTag={colorPickerTag}
                    onPick={(idx) => handleColorPick(colorPickerTag, idx)}
                  />
                </div>
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
                  {tagCounts.map(({ tag, count }) => {
                    const color = getTagColor(tag);

                    // Confirmation state — full-width confirmation bar
                    if (confirmDelete === tag) {
                      return (
                        <div
                          key={tag}
                          className="flex items-center justify-between px-3 py-2 rounded-lg bg-loss/10 border border-loss/20"
                        >
                          <span className="text-xs text-loss font-medium">
                            Remove &quot;{tag}&quot; from all trades & notes?
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setConfirmDelete(null)}
                              className="text-[10px] text-muted hover:text-foreground transition-colors px-2 py-0.5 rounded"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleDeleteTag(tag)}
                              disabled={deleting === tag}
                              className="text-[10px] text-loss font-bold hover:text-loss/80 transition-colors px-2 py-0.5 rounded bg-loss/10"
                            >
                              {deleting === tag ? "..." : "Remove"}
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={tag}>
                        <div
                          className="flex items-center justify-between px-3 py-2 rounded-lg bg-background hover:bg-surface-hover transition-colors group"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="text-xs px-2 py-0.5 rounded-md font-medium border cursor-pointer"
                              style={{
                                backgroundColor: color.bg,
                                color: color.text,
                                borderColor: color.border,
                              }}
                              onClick={() => setColorPickerTag(colorPickerTag === tag ? null : tag)}
                              title="Click to change color"
                            >
                              {tag}
                            </span>
                            <span className="text-[9px] text-muted px-1.5 py-0.5 rounded-full bg-surface-hover">
                              {count}
                            </span>
                          </div>
                          <button
                            onClick={() => setConfirmDelete(tag)}
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
                        {/* Inline color picker */}
                        {colorPickerTag === tag && (
                          <div className="px-3 py-1.5">
                            <ColorDots
                              selectedTag={tag}
                              onPick={(idx) => handleColorPick(tag, idx)}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
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

"use client";

import { useState } from "react";
import { X, Trash2, Brain, Pencil, Check, MessageSquare, BookOpen, BarChart3 } from "lucide-react";

export type CoachMemory = {
  id: string;
  content: string;
  category: string;
  created_at: string;
  last_referenced_at?: string | null;
  source_type?: string | null;
};

const CATEGORY_COLORS: Record<string, string> = {
  commitment: "text-blue-400 bg-blue-400/10",
  pattern: "text-amber-400 bg-amber-400/10",
  progress: "text-gain bg-gain/10",
  preference: "text-purple-400 bg-purple-400/10",
  insight: "text-cyan-400 bg-cyan-400/10",
  snapshot: "text-teal-400 bg-teal-400/10",
  general: "text-muted bg-muted/10",
};

const SOURCE_ICONS: Record<string, { icon: typeof MessageSquare; label: string }> = {
  conversation: { icon: MessageSquare, label: "From conversation" },
  journal: { icon: BookOpen, label: "From journal" },
  pattern_snapshot: { icon: BarChart3, label: "From trade data" },
  manual: { icon: Pencil, label: "Added manually" },
};

type Props = {
  memories: CoachMemory[];
  onDelete: (id: string) => void;
  onEdit: (id: string, content: string) => void;
  onClose: () => void;
};

function timeAgo(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days === 0) return "Used today";
  if (days === 1) return "Used yesterday";
  return `Used ${days}d ago`;
}

export function MemoryPanel({ memories, onDelete, onEdit, onClose }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  function startEdit(m: CoachMemory) {
    setEditingId(m.id);
    setEditContent(m.content);
  }

  function saveEdit() {
    if (editingId && editContent.trim().length > 0) {
      onEdit(editingId, editContent.trim());
    }
    setEditingId(null);
    setEditContent("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditContent("");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-lg max-h-[70vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Brain size={18} className="text-accent" />
            <h3 className="text-sm font-bold text-foreground">Nova&apos;s Memories</h3>
            <span className="text-[10px] text-muted bg-muted/10 px-2 py-0.5 rounded-full">
              {memories.length}
            </span>
          </div>
          <button onClick={onClose} className="p-1 text-muted hover:text-foreground">
            <X size={16} />
          </button>
        </div>

        {/* Memory list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {memories.length === 0 ? (
            <div className="text-center py-12">
              <Brain size={32} className="mx-auto text-muted/20 mb-3" />
              <p className="text-sm text-muted/50">
                No memories yet. Nova will remember key facts about your trading from conversations and journal entries.
              </p>
            </div>
          ) : (
            memories.map((m) => {
              const colors = CATEGORY_COLORS[m.category] || CATEGORY_COLORS.general;
              const isEditing = editingId === m.id;
              const refAgo = timeAgo(m.last_referenced_at);
              const isStale = m.last_referenced_at
                ? Date.now() - new Date(m.last_referenced_at).getTime() > 30 * 86400000
                : false;

              return (
                <div
                  key={m.id}
                  className={`group flex items-start gap-3 p-3 rounded-xl border border-border hover:border-accent/20 transition-all ${isStale ? "opacity-50" : ""}`}
                >
                  <div className="flex-1 min-w-0">
                    <span className={`inline-block text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${colors} mb-1`}>
                      {m.category}
                    </span>
                    {isEditing ? (
                      <div className="mt-1">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); saveEdit(); }
                            if (e.key === "Escape") cancelEdit();
                          }}
                          className="w-full text-sm text-foreground bg-background border border-accent/30 rounded-lg px-2 py-1.5 resize-none focus:outline-none focus:border-accent"
                          rows={2}
                          maxLength={500}
                          autoFocus
                        />
                        <div className="flex justify-end gap-1 mt-1">
                          <button onClick={cancelEdit} className="text-[10px] text-muted hover:text-foreground px-2 py-0.5">Cancel</button>
                          <button onClick={saveEdit} className="text-[10px] text-accent hover:text-accent-hover px-2 py-0.5 flex items-center gap-1">
                            <Check size={10} /> Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-foreground leading-snug">{m.content}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      {(() => {
                        const source = SOURCE_ICONS[m.source_type ?? "conversation"];
                        const Icon = source?.icon ?? MessageSquare;
                        return (
                          <span className="text-muted/30" title={source?.label ?? "From conversation"}>
                            <Icon size={10} />
                          </span>
                        );
                      })()}
                      <p className="text-[10px] text-muted/40">
                        {new Date(m.created_at).toLocaleDateString()}
                      </p>
                      {refAgo && (
                        <p className={`text-[10px] ${isStale ? "text-amber-400/60" : "text-muted/30"}`}>
                          {refAgo}
                        </p>
                      )}
                    </div>
                  </div>
                  {!isEditing && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={() => startEdit(m)}
                        className="p-1 text-muted hover:text-accent transition-all"
                        title="Edit"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => onDelete(m.id)}
                        className="p-1 text-muted hover:text-loss transition-all"
                        title="Forget this"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border">
          <p className="text-[10px] text-muted/40 text-center">
            Nova automatically remembers key patterns, commitments, and progress from your coaching sessions and journal entries.
            Edit or delete a memory to refine what Nova knows about you.
          </p>
        </div>
      </div>
    </div>
  );
}

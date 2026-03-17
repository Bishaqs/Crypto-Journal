"use client";

import { X, Trash2, Brain } from "lucide-react";

export type CoachMemory = {
  id: string;
  content: string;
  category: string;
  created_at: string;
};

const CATEGORY_COLORS: Record<string, string> = {
  commitment: "text-blue-400 bg-blue-400/10",
  pattern: "text-amber-400 bg-amber-400/10",
  progress: "text-gain bg-gain/10",
  preference: "text-purple-400 bg-purple-400/10",
  general: "text-muted bg-muted/10",
};

type Props = {
  memories: CoachMemory[];
  onDelete: (id: string) => void;
  onClose: () => void;
};

export function MemoryPanel({ memories, onDelete, onClose }: Props) {
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
                No memories yet. Nova will remember key facts about your trading after a few conversations.
              </p>
            </div>
          ) : (
            memories.map((m) => {
              const colors = CATEGORY_COLORS[m.category] || CATEGORY_COLORS.general;
              return (
                <div
                  key={m.id}
                  className="group flex items-start gap-3 p-3 rounded-xl border border-border hover:border-accent/20 transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <span className={`inline-block text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${colors} mb-1`}>
                      {m.category}
                    </span>
                    <p className="text-sm text-foreground leading-snug">{m.content}</p>
                    <p className="text-[10px] text-muted/40 mt-1">
                      {new Date(m.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => onDelete(m.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-muted hover:text-loss transition-all"
                    title="Forget this"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border">
          <p className="text-[10px] text-muted/40 text-center">
            Nova automatically remembers key patterns, commitments, and progress from your coaching sessions.
            Delete a memory to make Nova forget it.
          </p>
        </div>
      </div>
    </div>
  );
}

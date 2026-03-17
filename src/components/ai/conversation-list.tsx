"use client";

import { useState } from "react";
import {
  Plus,
  MessageSquare,
  Trash2,
  Pencil,
  Check,
  X,
} from "lucide-react";

export type Conversation = {
  id: string;
  title: string;
  model: string | null;
  message_count: number;
  created_at: string;
  updated_at: string;
};

function groupByDate(conversations: Conversation[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);

  const groups: { label: string; items: Conversation[] }[] = [
    { label: "Today", items: [] },
    { label: "Yesterday", items: [] },
    { label: "This Week", items: [] },
    { label: "Earlier", items: [] },
  ];

  for (const c of conversations) {
    const d = new Date(c.updated_at);
    if (d >= today) groups[0].items.push(c);
    else if (d >= yesterday) groups[1].items.push(c);
    else if (d >= weekAgo) groups[2].items.push(c);
    else groups[3].items.push(c);
  }

  return groups.filter((g) => g.items.length > 0);
}

type Props = {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
};

export function ConversationList({
  conversations,
  activeId,
  onSelect,
  onNewChat,
  onDelete,
  onRename,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  function startEditing(c: Conversation) {
    setEditingId(c.id);
    setEditTitle(c.title);
  }

  function confirmEdit() {
    if (editingId && editTitle.trim()) {
      onRename(editingId, editTitle.trim());
    }
    setEditingId(null);
  }

  const groups = groupByDate(conversations);

  return (
    <div className="flex flex-col h-full">
      <button
        onClick={onNewChat}
        className="flex items-center gap-2 w-full px-3 py-2.5 mb-2 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-accent/10 hover:border-accent/30 transition-all"
      >
        <Plus size={14} className="text-accent" />
        New Chat
      </button>

      <div className="flex-1 overflow-y-auto space-y-3">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="text-[10px] font-semibold text-muted/50 uppercase tracking-wider px-2 mb-1">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((c) => (
                <div
                  key={c.id}
                  className={`group flex items-center gap-1 rounded-lg px-2 py-1.5 cursor-pointer transition-all ${
                    c.id === activeId
                      ? "bg-accent/10 text-foreground"
                      : "text-muted hover:text-foreground hover:bg-surface-hover"
                  }`}
                  onClick={() => {
                    if (editingId !== c.id) onSelect(c.id);
                  }}
                >
                  <MessageSquare size={12} className="shrink-0 opacity-50" />
                  {editingId === c.id ? (
                    <div className="flex-1 flex items-center gap-1 min-w-0">
                      <input
                        className="flex-1 bg-transparent text-xs text-foreground border-b border-accent/40 outline-none px-1"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") confirmEdit();
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                      />
                      <button onClick={(e) => { e.stopPropagation(); confirmEdit(); }} className="p-0.5 hover:text-gain">
                        <Check size={12} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setEditingId(null); }} className="p-0.5 hover:text-loss">
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="flex-1 text-xs truncate">{c.title}</span>
                      <div className="hidden group-hover:flex items-center gap-0.5">
                        <button
                          onClick={(e) => { e.stopPropagation(); startEditing(c); }}
                          className="p-0.5 text-muted hover:text-foreground"
                          title="Rename"
                        >
                          <Pencil size={11} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
                          className="p-0.5 text-muted hover:text-loss"
                          title="Delete"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {conversations.length === 0 && (
          <p className="text-xs text-muted/40 text-center py-8">
            No conversations yet
          </p>
        )}
      </div>
    </div>
  );
}

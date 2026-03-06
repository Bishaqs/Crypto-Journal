"use client";

import { useState } from "react";
import { Circle, CheckCircle2, Bug, Lightbulb, MessageCircle } from "lucide-react";

export type FeedbackItem = {
  id: string;
  user_email: string;
  category: "bug" | "feature" | "general";
  message: string;
  is_read: boolean;
  created_at: string;
};

const FILTERS = ["all", "bug", "feature", "general"] as const;

const CATEGORY_META: Record<string, { label: string; icon: typeof Bug; color: string }> = {
  bug: { label: "Bug", icon: Bug, color: "text-loss" },
  feature: { label: "Feature", icon: Lightbulb, color: "text-accent" },
  general: { label: "General", icon: MessageCircle, color: "text-muted" },
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
    " " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function AdminFeedbackManager({ initialFeedback }: { initialFeedback: FeedbackItem[] }) {
  const [items, setItems] = useState(initialFeedback);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");

  const filtered = filter === "all" ? items : items.filter((f) => f.category === filter);
  const unreadCount = items.filter((f) => !f.is_read).length;

  async function markRead(id: string) {
    setItems((prev) => prev.map((f) => (f.id === id ? { ...f, is_read: true } : f)));
    try {
      await fetch("/api/admin/feedback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch {
      // Optimistic update — revert on failure
      setItems((prev) => prev.map((f) => (f.id === id ? { ...f, is_read: false } : f)));
    }
  }

  return (
    <div className="p-5 space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-2">
        {FILTERS.map((f) => {
          const count = f === "all" ? items.length : items.filter((i) => i.category === f).length;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === f
                  ? "bg-accent/15 text-accent border border-accent/30"
                  : "bg-surface border border-border text-muted hover:text-foreground"
              }`}
            >
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)} ({count})
            </button>
          );
        })}
        {unreadCount > 0 && (
          <span className="ml-auto text-[11px] text-accent font-medium">
            {unreadCount} unread
          </span>
        )}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <p className="text-xs text-muted py-8 text-center">No feedback yet</p>
      ) : (
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {filtered.map((item) => {
            const meta = CATEGORY_META[item.category] ?? CATEGORY_META.general;
            const Icon = meta.icon;
            return (
              <div
                key={item.id}
                className={`border rounded-xl px-4 py-3 space-y-1.5 transition-colors ${
                  item.is_read
                    ? "border-border/30 bg-surface/30"
                    : "border-accent/20 bg-accent/5"
                }`}
              >
                <div className="flex items-center gap-2 text-[11px]">
                  <Icon size={12} className={meta.color} />
                  <span className="font-medium text-foreground/70">{meta.label}</span>
                  <span className="text-muted">·</span>
                  <span className="text-muted">{item.user_email}</span>
                  <span className="text-muted">·</span>
                  <span className="text-muted">{formatDate(item.created_at)}</span>
                  <span className="ml-auto">
                    {item.is_read ? (
                      <CheckCircle2 size={12} className="text-muted/40" />
                    ) : (
                      <button
                        onClick={() => markRead(item.id)}
                        className="text-accent/60 hover:text-accent transition-colors"
                        title="Mark as read"
                      >
                        <Circle size={12} />
                      </button>
                    )}
                  </span>
                </div>
                <p className="text-xs text-foreground/80 leading-relaxed">{item.message}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

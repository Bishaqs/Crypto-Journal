"use client";

import { useState, useRef } from "react";
import { Circle, CheckCircle2, Bug, Lightbulb, MessageCircle, ChevronDown, ChevronUp, Send, Shield, Loader2 } from "lucide-react";

export type FeedbackItem = {
  id: string;
  user_email: string;
  category: "bug" | "feature" | "general";
  message: string;
  is_read: boolean;
  created_at: string;
};

type Comment = {
  id: string;
  feedback_id: string;
  user_id: string;
  message: string;
  display_name: string;
  is_owner_reply: boolean;
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

function formatRelative(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMin = Math.floor((now - then) / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return formatDate(dateStr);
}

export function AdminFeedbackManager({ initialFeedback }: { initialFeedback: FeedbackItem[] }) {
  const [items, setItems] = useState(initialFeedback);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [commentsCache, setCommentsCache] = useState<Record<string, Comment[]>>({});
  const [loadingComments, setLoadingComments] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  const replyInputRef = useRef<HTMLInputElement>(null);

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
      setItems((prev) => prev.map((f) => (f.id === id ? { ...f, is_read: false } : f)));
    }
  }

  async function toggleExpand(id: string) {
    if (expandedId === id) {
      setExpandedId(null);
      setReplyText("");
      setReplyError(null);
      return;
    }

    setExpandedId(id);
    setReplyText("");
    setReplyError(null);

    // Fetch comments if not cached
    if (!commentsCache[id]) {
      setLoadingComments(id);
      try {
        const res = await fetch(`/api/feedback/comments?feedbackId=${id}`);
        if (res.ok) {
          const data = await res.json();
          setCommentsCache((prev) => ({ ...prev, [id]: data.comments ?? [] }));
        }
      } catch {
        // Silently fail — show empty comments
      } finally {
        setLoadingComments(null);
      }
    }

    // Auto-mark as read when expanding
    const item = items.find((f) => f.id === id);
    if (item && !item.is_read) {
      markRead(id);
    }

    // Focus reply input after render
    setTimeout(() => replyInputRef.current?.focus(), 100);
  }

  async function sendReply(feedbackId: string) {
    const text = replyText.trim();
    if (!text) return;

    setSending(true);
    setReplyError(null);

    try {
      const res = await fetch("/api/feedback/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedbackId, message: text }),
      });

      if (res.ok) {
        // Optimistically add the reply
        const newComment: Comment = {
          id: crypto.randomUUID(),
          feedback_id: feedbackId,
          user_id: "",
          message: text,
          display_name: "You (Owner)",
          is_owner_reply: true,
          created_at: new Date().toISOString(),
        };
        setCommentsCache((prev) => ({
          ...prev,
          [feedbackId]: [...(prev[feedbackId] ?? []), newComment],
        }));
        setReplyText("");
      } else {
        const data = await res.json().catch(() => ({ error: "Failed to send reply" }));
        setReplyError(data.error || "Failed to send reply");
      }
    } catch {
      setReplyError("Network error — please try again");
    } finally {
      setSending(false);
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
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {filtered.map((item) => {
            const meta = CATEGORY_META[item.category] ?? CATEGORY_META.general;
            const Icon = meta.icon;
            const isExpanded = expandedId === item.id;
            const comments = commentsCache[item.id] ?? [];
            const isLoadingThis = loadingComments === item.id;

            return (
              <div
                key={item.id}
                className={`border rounded-xl transition-colors ${
                  item.is_read
                    ? "border-border/30 bg-surface/30"
                    : "border-accent/20 bg-accent/5"
                }`}
              >
                {/* Header + Message */}
                <div
                  className="px-4 py-3 space-y-1.5 cursor-pointer"
                  onClick={() => toggleExpand(item.id)}
                >
                  <div className="flex items-center gap-2 text-[11px]">
                    <Icon size={12} className={meta.color} />
                    <span className="font-medium text-foreground/70">{meta.label}</span>
                    <span className="text-muted">·</span>
                    <span className="text-muted">{item.user_email}</span>
                    <span className="text-muted">·</span>
                    <span className="text-muted">{formatDate(item.created_at)}</span>

                    {/* Comment count hint */}
                    {comments.length > 0 && !isExpanded && (
                      <>
                        <span className="text-muted">·</span>
                        <span className="text-accent/70 font-medium">{comments.length} {comments.length === 1 ? "reply" : "replies"}</span>
                      </>
                    )}

                    <span className="ml-auto flex items-center gap-2">
                      {item.is_read ? (
                        <CheckCircle2 size={12} className="text-muted/40" />
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); markRead(item.id); }}
                          className="text-accent/60 hover:text-accent transition-colors"
                          title="Mark as read"
                        >
                          <Circle size={12} />
                        </button>
                      )}
                      {isExpanded ? (
                        <ChevronUp size={12} className="text-muted" />
                      ) : (
                        <ChevronDown size={12} className="text-muted" />
                      )}
                    </span>
                  </div>
                  <p className="text-xs text-foreground/80 leading-relaxed">{item.message}</p>
                </div>

                {/* Expanded: Comment Thread + Reply */}
                {isExpanded && (
                  <div className="border-t border-border/30 px-4 py-3 space-y-3">
                    {/* Loading */}
                    {isLoadingThis && (
                      <div className="flex items-center gap-2 py-2">
                        <Loader2 size={12} className="text-muted animate-spin" />
                        <span className="text-[11px] text-muted">Loading replies...</span>
                      </div>
                    )}

                    {/* Comments */}
                    {!isLoadingThis && comments.length === 0 && (
                      <p className="text-[11px] text-muted py-1">No replies yet. Be the first to respond.</p>
                    )}

                    {comments.length > 0 && (
                      <div className="space-y-2">
                        {comments.map((c) => (
                          <div
                            key={c.id}
                            className={`rounded-lg px-3 py-2 ${
                              c.is_owner_reply
                                ? "bg-accent/8 border border-accent/15 ml-4"
                                : "bg-surface-hover border border-border/30 mr-4"
                            }`}
                          >
                            <div className="flex items-center gap-1.5 text-[10px] mb-1">
                              {c.is_owner_reply && <Shield size={10} className="text-accent" />}
                              <span className={`font-medium ${c.is_owner_reply ? "text-accent" : "text-foreground/70"}`}>
                                {c.display_name}
                              </span>
                              {c.is_owner_reply && (
                                <span className="text-[9px] font-semibold text-accent bg-accent/10 px-1 py-0.5 rounded">OWNER</span>
                              )}
                              <span className="text-muted ml-auto">{formatRelative(c.created_at)}</span>
                            </div>
                            <p className="text-xs text-foreground/80 leading-relaxed">{c.message}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Reply Error */}
                    {replyError && (
                      <p className="text-[11px] text-loss">{replyError}</p>
                    )}

                    {/* Reply Input */}
                    <div className="flex items-center gap-2">
                      <input
                        ref={replyInputRef}
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey && replyText.trim()) {
                            e.preventDefault();
                            sendReply(item.id);
                          }
                        }}
                        placeholder="Write a reply..."
                        disabled={sending}
                        className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
                        maxLength={1000}
                      />
                      <button
                        onClick={() => sendReply(item.id)}
                        disabled={sending || !replyText.trim()}
                        className="p-1.5 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors disabled:opacity-30"
                        title="Send reply"
                      >
                        {sending ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Send size={14} />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

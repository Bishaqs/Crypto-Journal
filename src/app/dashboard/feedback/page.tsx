"use client";

import { useState, useEffect, useCallback } from "react";
import {
  MessageSquareText,
  Send,
  Bug,
  Lightbulb,
  MessageCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Trash2,
  Star,
} from "lucide-react";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { useSubscriptionContext } from "@/lib/subscription-context";

type FeedbackEntry = {
  id: string;
  user_id: string;
  category: string;
  message: string;
  display_name: string | null;
  created_at: string;
};

type Comment = {
  id: string;
  feedback_id: string;
  user_id: string;
  message: string;
  display_name: string | null;
  is_owner_reply: boolean;
  created_at: string;
};

const CATEGORIES = [
  { value: "general", label: "General Feedback", icon: MessageCircle },
  { value: "bug", label: "Bug Report", icon: Bug },
  { value: "feature", label: "Feature Request", icon: Lightbulb },
] as const;

function categoryLabel(cat: string) {
  return CATEGORIES.find((c) => c.value === cat)?.label ?? cat;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function FeedbackPage() {
  const { isOwner } = useSubscriptionContext();

  // Submit form state
  const [category, setCategory] = useState("general");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Feedback list state
  const [feedbackList, setFeedbackList] = useState<FeedbackEntry[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  // Expanded item + comments state
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [commentsCache, setCommentsCache] = useState<Record<string, Comment[]>>({});
  const [loadingComments, setLoadingComments] = useState<string | null>(null);

  // Reply state
  const [replyText, setReplyText] = useState("");
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; type: "feedback" | "comment" } | null>(null);

  const fetchFeedback = useCallback(async () => {
    try {
      const res = await fetch("/api/feedback");
      const data = await res.json();
      if (res.ok) {
        setFeedbackList(data.feedback ?? []);
        setCurrentUserId(data.currentUserId ?? null);
      }
    } catch {
      // Network error — keep existing list
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  async function fetchComments(feedbackId: string) {
    if (commentsCache[feedbackId]) return; // Already loaded
    setLoadingComments(feedbackId);
    try {
      const res = await fetch(`/api/feedback/comments?feedbackId=${feedbackId}`);
      const data = await res.json();
      if (res.ok) {
        setCommentsCache((prev) => ({ ...prev, [feedbackId]: data.comments ?? [] }));
      }
    } catch {
      // Network error
    } finally {
      setLoadingComments(null);
    }
  }

  function toggleExpand(feedbackId: string) {
    if (expandedId === feedbackId) {
      setExpandedId(null);
      setReplyText("");
      setReplyError(null);
    } else {
      setExpandedId(feedbackId);
      setReplyText("");
      setReplyError(null);
      fetchComments(feedbackId);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, message }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data.error || "Failed to submit");
        return;
      }
      setSubmitted(true);
      setMessage("");
      setTimeout(() => setSubmitted(false), 3000);
      // Refresh the full list to get the new item with server-assigned display_name
      fetchFeedback();
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReply(feedbackId: string) {
    if (!replyText.trim()) return;
    setReplyError(null);
    setReplySubmitting(true);

    try {
      const res = await fetch("/api/feedback/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedbackId, message: replyText }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setReplyError(data.error || "Failed to post reply");
        return;
      }
      setReplyText("");
      // Refresh comments for this item
      setCommentsCache((prev) => {
        const copy = { ...prev };
        delete copy[feedbackId];
        return copy;
      });
      fetchComments(feedbackId);
    } catch {
      setReplyError("Network error. Please try again.");
    } finally {
      setReplySubmitting(false);
    }
  }

  async function handleDelete(id: string, type: "feedback" | "comment") {
    try {
      const res = await fetch("/api/admin/feedback", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, type }),
      });
      if (res.ok) {
        if (type === "feedback") {
          setFeedbackList((prev) => prev.filter((f) => f.id !== id));
          if (expandedId === id) setExpandedId(null);
        } else {
          // Remove comment from cache
          setCommentsCache((prev) => {
            const updated = { ...prev };
            for (const key of Object.keys(updated)) {
              updated[key] = updated[key].filter((c) => c.id !== id);
            }
            return updated;
          });
        }
      }
    } catch {
      // Network error
    } finally {
      setDeleteConfirm(null);
    }
  }

  const filtered = filter === "all"
    ? feedbackList
    : feedbackList.filter((f) => f.category === filter);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
          <MessageSquareText size={20} className="text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            Feedback
            <InfoTooltip text="Share your thoughts, report bugs, or request features. See what others are saying too." articleId="tj-journal" />
          </h1>
          <p className="text-sm text-muted">Community feedback board</p>
        </div>
      </div>

      {/* Toggle submit form */}
      <button
        type="button"
        onClick={() => setShowForm(!showForm)}
        className="flex items-center gap-2 text-sm font-medium text-accent hover:text-accent-hover transition-colors"
      >
        {showForm ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        {showForm ? "Hide form" : "Submit new feedback"}
      </button>

      {/* Submit form */}
      {showForm && (
        <form onSubmit={handleSubmit}>
          <div className="bg-surface rounded-2xl border border-border p-5 space-y-4" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="flex gap-2">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const active = category === cat.value;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      active
                        ? "bg-accent/15 text-accent border border-accent/30"
                        : "bg-surface border border-border text-muted hover:text-foreground hover:border-border/80"
                    }`}
                  >
                    <Icon size={13} />
                    {cat.label}
                  </button>
                );
              })}
            </div>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What's on your mind?"
              rows={4}
              maxLength={2000}
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent/50 resize-none"
            />
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted">{message.length}/2000</span>

              {formError && <span className="text-xs text-loss">{formError}</span>}

              {submitted ? (
                <span className="flex items-center gap-1.5 text-xs text-win font-medium">
                  <CheckCircle2 size={14} />
                  Sent! Thank you.
                </span>
              ) : (
                <button
                  type="submit"
                  disabled={submitting || message.trim().length < 10}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-accent text-background hover:bg-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send size={13} />
                  {submitting ? "Sending..." : "Send Feedback"}
                </button>
              )}
            </div>
          </div>
        </form>
      )}

      {/* Filter bar */}
      <div className="flex items-center gap-2">
        {[{ value: "all", label: "All" }, ...CATEGORIES].map((cat) => {
          const active = filter === cat.value;
          const count = cat.value === "all"
            ? feedbackList.length
            : feedbackList.filter((f) => f.category === cat.value).length;
          return (
            <button
              key={cat.value}
              type="button"
              onClick={() => setFilter(cat.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                active
                  ? "bg-accent/15 text-accent border border-accent/30"
                  : "bg-surface border border-border text-muted hover:text-foreground"
              }`}
            >
              {cat.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Feedback list */}
      {loading ? (
        <div className="text-xs text-muted/60 py-8 text-center">Loading feedback...</div>
      ) : filtered.length === 0 ? (
        <div className="text-sm text-muted py-8 text-center">
          No feedback yet. Be the first to share your thoughts!
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const isExpanded = expandedId === item.id;
            const isMine = item.user_id === currentUserId;
            const comments = commentsCache[item.id];
            const commentCount = comments?.length;
            const CatIcon = CATEGORIES.find((c) => c.value === item.category)?.icon ?? MessageCircle;

            return (
              <div
                key={item.id}
                className="bg-surface border border-border rounded-2xl overflow-hidden"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                {/* Feedback header + body */}
                <div className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-accent/70 bg-accent/10 px-2 py-0.5 rounded-full">
                        <CatIcon size={10} />
                        {categoryLabel(item.category)}
                      </span>
                      <span className="text-xs text-foreground/70 font-medium">
                        {item.display_name ?? "Anonymous"}
                        {isMine && (
                          <span className="ml-1 text-[10px] text-accent">(You)</span>
                        )}
                      </span>
                      <span className="text-[10px] text-muted">{timeAgo(item.created_at)}</span>
                    </div>

                    {isOwner && (
                      <DeleteButton
                        id={item.id}
                        type="feedback"
                        deleteConfirm={deleteConfirm}
                        setDeleteConfirm={setDeleteConfirm}
                        onDelete={handleDelete}
                      />
                    )}
                  </div>
                  <p className="mt-2 text-sm text-foreground/80 leading-relaxed">{item.message}</p>

                  {/* Expand / collapse */}
                  <button
                    type="button"
                    onClick={() => toggleExpand(item.id)}
                    className="mt-3 flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors"
                  >
                    <MessageCircle size={12} />
                    {commentCount != null ? `${commentCount} ${commentCount === 1 ? "reply" : "replies"}` : "Reply"}
                    {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                </div>

                {/* Expanded comments section */}
                {isExpanded && (
                  <div className="border-t border-border/50 bg-background/50 px-5 py-4 space-y-3">
                    {loadingComments === item.id ? (
                      <div className="text-xs text-muted/60">Loading replies...</div>
                    ) : comments && comments.length > 0 ? (
                      <div className="space-y-3">
                        {comments.map((comment) => (
                          <div
                            key={comment.id}
                            className={`rounded-xl px-4 py-3 text-sm ${
                              comment.is_owner_reply
                                ? "bg-accent/5 border border-accent/20"
                                : "bg-surface/50 border border-border/30"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                {comment.is_owner_reply && (
                                  <span className="flex items-center gap-1 text-[10px] font-semibold text-accent bg-accent/15 px-1.5 py-0.5 rounded-full">
                                    <Star size={8} />
                                    Dev
                                  </span>
                                )}
                                <span className="text-xs text-foreground/70 font-medium">
                                  {comment.display_name ?? "Anonymous"}
                                  {comment.user_id === currentUserId && (
                                    <span className="ml-1 text-[10px] text-accent">(You)</span>
                                  )}
                                </span>
                                <span className="text-[10px] text-muted">{timeAgo(comment.created_at)}</span>
                              </div>

                              {isOwner && (
                                <DeleteButton
                                  id={comment.id}
                                  type="comment"
                                  deleteConfirm={deleteConfirm}
                                  setDeleteConfirm={setDeleteConfirm}
                                  onDelete={handleDelete}
                                />
                              )}
                            </div>
                            <p className="mt-1.5 text-foreground/80 leading-relaxed text-xs">{comment.message}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-muted/60">No replies yet</div>
                    )}

                    {/* Reply form */}
                    <div className="flex gap-2 pt-1">
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleReply(item.id);
                          }
                        }}
                        placeholder="Write a reply..."
                        maxLength={1000}
                        className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent/50"
                      />
                      <button
                        type="button"
                        onClick={() => handleReply(item.id)}
                        disabled={replySubmitting || !replyText.trim()}
                        className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium bg-accent text-background hover:bg-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Send size={11} />
                        {replySubmitting ? "..." : "Send"}
                      </button>
                    </div>
                    {replyError && (
                      <p className="text-xs text-loss">{replyError}</p>
                    )}
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

/** Inline two-stage delete button */
function DeleteButton({
  id,
  type,
  deleteConfirm,
  setDeleteConfirm,
  onDelete,
}: {
  id: string;
  type: "feedback" | "comment";
  deleteConfirm: { id: string; type: "feedback" | "comment" } | null;
  setDeleteConfirm: (v: { id: string; type: "feedback" | "comment" } | null) => void;
  onDelete: (id: string, type: "feedback" | "comment") => void;
}) {
  const isConfirming = deleteConfirm?.id === id && deleteConfirm?.type === type;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (isConfirming) {
          onDelete(id, type);
        } else {
          setDeleteConfirm({ id, type });
        }
      }}
      onBlur={() => {
        if (isConfirming) setDeleteConfirm(null);
      }}
      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-colors ${
        isConfirming
          ? "bg-loss/15 text-loss border border-loss/30"
          : "text-muted hover:text-loss hover:bg-loss/10"
      }`}
      title={isConfirming ? "Click again to confirm" : "Delete"}
    >
      <Trash2 size={11} />
      {isConfirming ? "Delete?" : ""}
    </button>
  );
}

"use client";

import { useState, useEffect } from "react";
import { MessageSquareText, Send, Bug, Lightbulb, MessageCircle, CheckCircle2 } from "lucide-react";
import { InfoTooltip } from "@/components/ui/info-tooltip";

type FeedbackEntry = {
  id: string;
  category: string;
  message: string;
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
  const [category, setCategory] = useState("general");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<FeedbackEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    fetch("/api/feedback")
      .then((r) => r.json())
      .then((d) => setHistory(d.feedback ?? []))
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, message }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Failed to submit");
        return;
      }
      setSubmitted(true);
      setHistory((prev) => [
        { id: crypto.randomUUID(), category, message, created_at: new Date().toISOString() },
        ...prev,
      ]);
      setMessage("");
      setTimeout(() => setSubmitted(false), 3000);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
          <MessageSquareText size={20} className="text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            Feedback
            <InfoTooltip text="Share your thoughts, report bugs, or request features. Your feedback helps us improve." />
          </h1>
          <p className="text-sm text-muted">We read every submission</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="bg-surface rounded-2xl border border-border p-5 space-y-4" style={{ boxShadow: "var(--shadow-card)" }}>
          {/* Category selector */}
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

          {/* Message */}
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="What's on your mind?"
            rows={5}
            maxLength={2000}
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent/50 resize-none"
          />
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted">{message.length}/2000</span>

            {error && (
              <span className="text-xs text-loss">{error}</span>
            )}

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

      {/* Past submissions */}
      {(history.length > 0 || loadingHistory) && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted">Your previous feedback</h2>

          {loadingHistory ? (
            <div className="text-xs text-muted/60">Loading...</div>
          ) : (
            <div className="space-y-2">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="bg-surface/50 border border-border/50 rounded-xl px-4 py-3 space-y-1"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-accent/70 bg-accent/10 px-2 py-0.5 rounded-full">
                      {categoryLabel(item.category)}
                    </span>
                    <span className="text-[10px] text-muted">{timeAgo(item.created_at)}</span>
                  </div>
                  <p className="text-xs text-foreground/80 leading-relaxed">{item.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

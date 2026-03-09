"use client";

import { useState } from "react";
import { Check, X, ChevronDown, ChevronUp } from "lucide-react";

export type SubmittedQuestion = {
  id: string;
  user_id: string;
  question: string;
  status: string;
  display_name: string | null;
  created_at: string;
  reviewed_at: string | null;
};

const STATUS_FILTERS = ["all", "pending", "published", "rejected"] as const;

function formatDate(iso: string) {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
    " " +
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  );
}

export function AdminSubmittedQuestionsManager({
  initialQuestions,
}: {
  initialQuestions: SubmittedQuestion[];
}) {
  const [items, setItems] = useState(initialQuestions);
  const [filter, setFilter] = useState<(typeof STATUS_FILTERS)[number]>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const [category, setCategory] = useState("general");
  const [processing, setProcessing] = useState(false);

  const filtered =
    filter === "all" ? items : items.filter((q) => q.status === filter);
  const pendingCount = items.filter((q) => q.status === "pending").length;

  async function handleApprove(id: string) {
    if (!answer.trim()) return;
    setProcessing(true);
    try {
      const res = await fetch("/api/submitted-questions/admin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          action: "approve",
          answer: answer.trim(),
          category,
        }),
      });
      if (res.ok) {
        setItems((prev) =>
          prev.map((q) =>
            q.id === id
              ? { ...q, status: "published", reviewed_at: new Date().toISOString() }
              : q,
          ),
        );
        setExpandedId(null);
        setAnswer("");
        setCategory("general");
      }
    } catch {
      // Silent fail
    } finally {
      setProcessing(false);
    }
  }

  async function handleReject(id: string) {
    setProcessing(true);
    try {
      const res = await fetch("/api/submitted-questions/admin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "reject" }),
      });
      if (res.ok) {
        setItems((prev) =>
          prev.map((q) =>
            q.id === id
              ? { ...q, status: "rejected", reviewed_at: new Date().toISOString() }
              : q,
          ),
        );
      }
    } catch {
      // Silent fail
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="p-5 space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-2">
        {STATUS_FILTERS.map((f) => {
          const count =
            f === "all" ? items.length : items.filter((i) => i.status === f).length;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === f
                  ? "bg-accent/10 text-accent border border-accent/20"
                  : "text-muted hover:text-foreground hover:bg-surface-hover"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}{" "}
              <span className="opacity-60">({count})</span>
            </button>
          );
        })}
        {pendingCount > 0 && (
          <span className="ml-auto text-[10px] font-medium text-amber-400">
            {pendingCount} pending review
          </span>
        )}
      </div>

      {/* Questions list */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className="text-xs text-muted text-center py-8">
            No questions in this category
          </p>
        ) : (
          filtered.map((q) => (
            <div
              key={q.id}
              className={`rounded-xl border p-3 ${
                q.status === "pending"
                  ? "border-amber-500/20 bg-amber-500/5"
                  : q.status === "published"
                    ? "border-emerald-500/20 bg-emerald-500/5"
                    : "border-border bg-surface"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="text-xs font-medium text-foreground">
                    &quot;{q.question}&quot;
                  </p>
                  <p className="text-[10px] text-muted mt-1">
                    {q.display_name ?? "Anonymous"} &middot;{" "}
                    {formatDate(q.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${
                      q.status === "pending"
                        ? "bg-amber-500/10 text-amber-400"
                        : q.status === "published"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-surface text-muted"
                    }`}
                  >
                    {q.status}
                  </span>
                  {q.status === "pending" && (
                    <>
                      <button
                        onClick={() =>
                          setExpandedId(expandedId === q.id ? null : q.id)
                        }
                        className="p-1 rounded-md text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                        title="Approve & write answer"
                      >
                        {expandedId === q.id ? (
                          <ChevronUp size={14} />
                        ) : (
                          <ChevronDown size={14} />
                        )}
                      </button>
                      <button
                        onClick={() => handleReject(q.id)}
                        disabled={processing}
                        className="p-1 rounded-md text-loss hover:bg-loss/10 transition-colors disabled:opacity-40"
                        title="Reject"
                      >
                        <X size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Expanded approve form */}
              {expandedId === q.id && q.status === "pending" && (
                <div className="mt-3 pt-3 border-t border-border/30 space-y-2">
                  <div>
                    <label className="text-[10px] text-muted uppercase tracking-wider font-semibold mb-1 block">
                      Answer
                    </label>
                    <textarea
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder="Write the FAQ answer..."
                      rows={3}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted/40 focus:outline-none focus:border-accent/50 transition-all resize-none"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="bg-background border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-accent/50"
                    >
                      <option value="general">General</option>
                      <option value="getting-started">Getting Started</option>
                      <option value="trading-journal">Trading & Journal</option>
                      <option value="analytics">Analytics</option>
                      <option value="ai-coach">AI Coach</option>
                      <option value="market-tools">Market Tools</option>
                      <option value="billing">Billing</option>
                      <option value="account-settings">Account & Settings</option>
                      <option value="troubleshooting">Troubleshooting</option>
                      <option value="privacy-security">Privacy & Security</option>
                    </select>
                    <button
                      onClick={() => handleApprove(q.id)}
                      disabled={!answer.trim() || processing}
                      className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-medium hover:bg-emerald-600 transition-colors disabled:opacity-40"
                    >
                      <Check size={12} />
                      {processing ? "Publishing..." : "Publish to FAQ"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

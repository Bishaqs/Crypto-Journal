"use client";

import { useState } from "react";
import { Check, X, Clock, UserCheck, Search } from "lucide-react";

export type AccessRequest = {
  id: string;
  user_id: string;
  email: string;
  status: "pending" | "approved" | "denied";
  deny_reason: string | null;
  reviewed_at: string | null;
  created_at: string;
};

export function AccessRequestsManager({
  initialRequests,
}: {
  initialRequests: AccessRequest[];
}) {
  const [requests, setRequests] = useState<AccessRequest[]>(initialRequests);
  const [filter, setFilter] = useState<"pending" | "all">("pending");
  const [search, setSearch] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [denyId, setDenyId] = useState<string | null>(null);
  const [denyReason, setDenyReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  const filtered = requests.filter((r) => {
    if (filter === "pending" && r.status !== "pending") return false;
    if (search.trim()) {
      return r.email.toLowerCase().includes(search.toLowerCase());
    }
    return true;
  });

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  async function handleApprove(id: string) {
    setError(null);
    setProcessing(id);
    try {
      const res = await fetch("/api/admin/access-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "approve" }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Failed to approve");
        return;
      }
      setRequests((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, status: "approved" as const, reviewed_at: new Date().toISOString() }
            : r
        )
      );
    } catch {
      setError("Network error");
    } finally {
      setProcessing(null);
      setConfirmId(null);
    }
  }

  async function handleDeny(id: string) {
    setError(null);
    setProcessing(id);
    try {
      const res = await fetch("/api/admin/access-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "deny", reason: denyReason.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Failed to deny");
        return;
      }
      setRequests((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                status: "denied" as const,
                deny_reason: denyReason.trim() || null,
                reviewed_at: new Date().toISOString(),
              }
            : r
        )
      );
    } catch {
      setError("Network error");
    } finally {
      setProcessing(null);
      setDenyId(null);
      setDenyReason("");
    }
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

  return (
    <div className="p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserCheck size={14} className="text-accent" />
          <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
            Access Requests
          </span>
          {pendingCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-accent/15 text-accent border border-accent/25">
              {pendingCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setFilter("pending")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
              filter === "pending"
                ? "bg-accent/15 text-accent border border-accent/25"
                : "text-muted hover:text-foreground"
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter("all")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
              filter === "all"
                ? "bg-accent/15 text-accent border border-accent/25"
                : "text-muted hover:text-foreground"
            }`}
          >
            All
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by email..."
          className="w-full bg-background border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent/50"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-loss bg-loss/10 border border-loss/20 rounded-xl px-4 py-2">
          <X size={14} />
          {error}
        </div>
      )}

      {/* Request list */}
      {filtered.length === 0 ? (
        <div className="text-sm text-muted py-8 text-center">
          {filter === "pending" ? "No pending requests" : "No access requests yet"}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((req) => (
            <div
              key={req.id}
              className="bg-background border border-border/50 rounded-xl px-4 py-3 flex items-center gap-3"
            >
              {/* Status icon */}
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  req.status === "pending"
                    ? "bg-amber-500/10 border border-amber-500/20"
                    : req.status === "approved"
                      ? "bg-emerald-500/10 border border-emerald-500/20"
                      : "bg-red-500/10 border border-red-500/20"
                }`}
              >
                {req.status === "pending" ? (
                  <Clock size={13} className="text-amber-400" />
                ) : req.status === "approved" ? (
                  <Check size={13} className="text-emerald-400" />
                ) : (
                  <X size={13} className="text-red-400" />
                )}
              </div>

              {/* Email + meta */}
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-foreground truncate block">
                  {req.email}
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-muted">{timeAgo(req.created_at)}</span>
                  {req.status !== "pending" && (
                    <span
                      className={`text-[10px] font-medium ${
                        req.status === "approved" ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {req.status}
                    </span>
                  )}
                  {req.deny_reason && (
                    <span className="text-[10px] text-muted/60">{req.deny_reason}</span>
                  )}
                </div>
              </div>

              {/* Actions (only for pending) */}
              {req.status === "pending" && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  {denyId === req.id ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={denyReason}
                        onChange={(e) => setDenyReason(e.target.value)}
                        placeholder="Reason (optional)"
                        className="w-28 bg-background border border-border rounded-lg px-2 py-1 text-[11px] text-foreground placeholder:text-muted/50 focus:outline-none"
                      />
                      <button
                        onClick={() => handleDeny(req.id)}
                        disabled={processing === req.id}
                        className="px-2 py-1 rounded-lg text-[10px] font-medium bg-loss/15 text-loss border border-loss/30 hover:bg-loss/25 transition-colors disabled:opacity-50"
                      >
                        Deny
                      </button>
                      <button
                        onClick={() => {
                          setDenyId(null);
                          setDenyReason("");
                        }}
                        className="px-1.5 py-1 text-[10px] text-muted hover:text-foreground transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : confirmId === req.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleApprove(req.id)}
                        disabled={processing === req.id}
                        className="px-2 py-1 rounded-lg text-[10px] font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                      >
                        {processing === req.id ? "..." : "Confirm approve"}
                      </button>
                      <button
                        onClick={() => setConfirmId(null)}
                        className="px-1.5 py-1 text-[10px] text-muted hover:text-foreground transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => setConfirmId(req.id)}
                        className="p-1.5 rounded-lg text-muted hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                        title="Approve"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={() => setDenyId(req.id)}
                        className="p-1.5 rounded-lg text-muted hover:text-loss hover:bg-loss/10 transition-colors"
                        title="Deny"
                      >
                        <X size={14} />
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

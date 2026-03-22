"use client";

import { useState } from "react";
import { Trash2, Copy, Check, Search, Mail, AlertTriangle, UserPlus, Shield } from "lucide-react";

export type WaitlistSignup = {
  id: string;
  email: string;
  position: number;
  discount_code: string | null;
  email_confirmed: boolean;
  ip_address: string | null;
  referral_source: string | null;
  created_at: string;
};

export type EarlyAccessEmail = {
  id: string;
  email: string;
  granted_by: string | null;
  note: string | null;
  created_at: string;
};

export function AdminWaitlistManager({
  initialSignups,
  initialEarlyAccess = [],
}: {
  initialSignups: WaitlistSignup[];
  initialEarlyAccess?: EarlyAccessEmail[];
}) {
  const [signups, setSignups] = useState<WaitlistSignup[]>(initialSignups);
  const [earlyAccess, setEarlyAccess] = useState<EarlyAccessEmail[]>(initialEarlyAccess);
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteStep, setDeleteStep] = useState<{ id: string; step: 1 | 2 | 3 } | null>(null);
  const [blockStep, setBlockStep] = useState<{ id: string; step: 1 | 2 | 3 } | null>(null);
  const [revokeStep, setRevokeStep] = useState<{ id: string; step: 1 | 2 } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Grant access form
  const [grantEmail, setGrantEmail] = useState("");
  const [grantNote, setGrantNote] = useState("");
  const [granting, setGranting] = useState(false);
  const [grantSuccess, setGrantSuccess] = useState<string | null>(null);

  const filtered = search.trim()
    ? signups.filter((s) =>
        s.email.toLowerCase().includes(search.toLowerCase()) ||
        s.discount_code?.toLowerCase().includes(search.toLowerCase()) ||
        String(s.position).includes(search)
      )
    : signups;

  function copyEmail(email: string, id: string) {
    navigator.clipboard.writeText(email);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function handleGrantAccess(e: React.FormEvent) {
    e.preventDefault();
    if (!grantEmail.trim()) return;
    setError(null);
    setGrantSuccess(null);
    setGranting(true);

    try {
      const res = await fetch("/api/admin/early-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: grantEmail.trim(), note: grantNote.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Failed to grant access");
        return;
      }
      setEarlyAccess((prev) => [data.entry, ...prev]);
      setGrantSuccess(`Access granted to ${grantEmail.trim()}`);
      setGrantEmail("");
      setGrantNote("");
      setTimeout(() => setGrantSuccess(null), 3000);
    } catch {
      setError("Network error");
    } finally {
      setGranting(false);
    }
  }

  async function handleRevokeAccess(id: string) {
    setError(null);
    try {
      const res = await fetch("/api/admin/early-access", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Failed to revoke");
        return;
      }
      setEarlyAccess((prev) => prev.filter((e) => e.id !== id));
    } catch {
      setError("Network error");
    } finally {
      setRevokeStep(null);
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    try {
      const res = await fetch("/api/admin/waitlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "delete" }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Failed to delete");
        return;
      }
      setSignups((prev) => prev.filter((s) => s.id !== id));
    } catch {
      setError("Network error");
    } finally {
      setDeleteStep(null);
    }
  }

  async function handleBlock(id: string) {
    setError(null);
    try {
      const res = await fetch("/api/admin/waitlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "block" }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Failed to block");
        return;
      }
      setSignups((prev) => prev.filter((s) => s.id !== id));
    } catch {
      setError("Network error");
    } finally {
      setBlockStep(null);
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
    <div className="p-5 space-y-6">
      {/* Grant Early Access */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Shield size={14} className="text-accent" />
          <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Grant Early Access</span>
        </div>
        <form onSubmit={handleGrantAccess} className="flex gap-2">
          <input
            type="email"
            value={grantEmail}
            onChange={(e) => setGrantEmail(e.target.value)}
            placeholder="Email address..."
            required
            className="flex-1 bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent/50"
          />
          <input
            type="text"
            value={grantNote}
            onChange={(e) => setGrantNote(e.target.value)}
            placeholder="Note (optional)"
            className="w-40 bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent/50"
          />
          <button
            type="submit"
            disabled={granting || !grantEmail.trim()}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium bg-accent/15 text-accent border border-accent/25 hover:bg-accent/25 transition-colors disabled:opacity-50"
          >
            <UserPlus size={14} />
            {granting ? "Granting..." : "Grant"}
          </button>
        </form>

        {grantSuccess && (
          <div className="flex items-center gap-2 text-xs text-win bg-win/10 border border-win/20 rounded-xl px-4 py-2">
            <Check size={14} />
            {grantSuccess}
          </div>
        )}

        {/* Manual early access list */}
        {earlyAccess.length > 0 && (
          <div className="space-y-1.5">
            {earlyAccess.map((entry) => (
              <div
                key={entry.id}
                className="bg-background border border-accent/10 rounded-xl px-4 py-2.5 flex items-center gap-3"
              >
                <div
                  className="w-6 h-6 rounded-md bg-accent/10 flex items-center justify-center flex-shrink-0"
                >
                  <Shield size={11} className="text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-foreground truncate block">
                    {entry.email}
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-muted">{timeAgo(entry.created_at)}</span>
                    {entry.note && (
                      <span className="text-[10px] text-muted/60">{entry.note}</span>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {revokeStep?.id === entry.id ? (
                    <div className="flex items-center gap-1">
                      {revokeStep.step === 1 && (
                        <button
                          onClick={() => setRevokeStep({ id: entry.id, step: 2 })}
                          className="px-2 py-1 rounded-lg text-[10px] font-medium bg-loss/10 text-loss border border-loss/20 hover:bg-loss/20 transition-colors"
                        >
                          Revoke?
                        </button>
                      )}
                      {revokeStep.step === 2 && (
                        <button
                          onClick={() => handleRevokeAccess(entry.id)}
                          className="px-2 py-1 rounded-lg text-[10px] font-medium bg-loss/20 text-loss border border-loss/40 hover:bg-loss/30 transition-colors animate-pulse"
                        >
                          Confirm revoke
                        </button>
                      )}
                      <button
                        onClick={() => setRevokeStep(null)}
                        className="px-1.5 py-1 text-[10px] text-muted hover:text-foreground transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setRevokeStep({ id: entry.id, step: 1 })}
                      className="p-1.5 rounded-lg text-muted hover:text-loss hover:bg-loss/10 transition-colors"
                      title="Revoke access"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-border/50" />

      {/* Waitlist Signups */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Mail size={14} className="text-accent" />
          <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Waitlist Signups ({signups.length}/2,000)</span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email, code, or position..."
            className="w-full bg-background border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent/50"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 text-xs text-loss bg-loss/10 border border-loss/20 rounded-xl px-4 py-2">
            <AlertTriangle size={14} />
            {error}
          </div>
        )}

        {/* Signup list */}
        {filtered.length === 0 ? (
          <div className="text-sm text-muted py-8 text-center">
            {search ? "No matching signups" : "No waitlist signups yet"}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((signup) => (
              <div
                key={signup.id}
                className="bg-background border border-border/50 rounded-xl px-4 py-3 flex items-center gap-4"
              >
                {/* Position badge */}
                <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-mono font-bold text-accent">
                    {signup.position}
                  </span>
                </div>

                {/* Email + meta */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground truncate">
                      {signup.email}
                    </span>
                    <button
                      onClick={() => copyEmail(signup.email, signup.id)}
                      className="text-muted hover:text-foreground transition-colors flex-shrink-0"
                      title="Copy email"
                    >
                      {copiedId === signup.id ? (
                        <Check size={12} className="text-win" />
                      ) : (
                        <Copy size={12} />
                      )}
                    </button>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[10px] text-muted">{timeAgo(signup.created_at)}</span>
                    {signup.discount_code && (
                      <span className="text-[10px] font-mono text-accent/60">
                        {signup.discount_code}
                      </span>
                    )}
                    {signup.referral_source && (
                      <span className="text-[10px] text-muted/60">
                        via {signup.referral_source}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* Delete — 3-step confirmation */}
                  {deleteStep?.id === signup.id ? (
                    <div className="flex items-center gap-1">
                      {deleteStep.step === 1 && (
                        <button
                          onClick={() => setDeleteStep({ id: signup.id, step: 2 })}
                          className="px-2 py-1 rounded-lg text-[10px] font-medium bg-loss/10 text-loss border border-loss/20 hover:bg-loss/20 transition-colors"
                        >
                          Delete? (1/3)
                        </button>
                      )}
                      {deleteStep.step === 2 && (
                        <button
                          onClick={() => setDeleteStep({ id: signup.id, step: 3 })}
                          className="px-2 py-1 rounded-lg text-[10px] font-medium bg-loss/15 text-loss border border-loss/30 hover:bg-loss/25 transition-colors"
                        >
                          Are you sure? (2/3)
                        </button>
                      )}
                      {deleteStep.step === 3 && (
                        <button
                          onClick={() => handleDelete(signup.id)}
                          className="px-2 py-1 rounded-lg text-[10px] font-medium bg-loss/20 text-loss border border-loss/40 hover:bg-loss/30 transition-colors animate-pulse"
                        >
                          Confirm delete (3/3)
                        </button>
                      )}
                      <button
                        onClick={() => setDeleteStep(null)}
                        className="px-1.5 py-1 text-[10px] text-muted hover:text-foreground transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : blockStep?.id === signup.id ? (
                    <div className="flex items-center gap-1">
                      {blockStep.step === 1 && (
                        <button
                          onClick={() => setBlockStep({ id: signup.id, step: 2 })}
                          className="px-2 py-1 rounded-lg text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
                        >
                          Block? (1/3)
                        </button>
                      )}
                      {blockStep.step === 2 && (
                        <button
                          onClick={() => setBlockStep({ id: signup.id, step: 3 })}
                          className="px-2 py-1 rounded-lg text-[10px] font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 transition-colors"
                        >
                          Are you sure? (2/3)
                        </button>
                      )}
                      {blockStep.step === 3 && (
                        <button
                          onClick={() => handleBlock(signup.id)}
                          className="px-2 py-1 rounded-lg text-[10px] font-medium bg-amber-500/20 text-amber-400 border border-amber-500/40 hover:bg-amber-500/30 transition-colors animate-pulse"
                        >
                          Confirm block (3/3)
                        </button>
                      )}
                      <button
                        onClick={() => setBlockStep(null)}
                        className="px-1.5 py-1 text-[10px] text-muted hover:text-foreground transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => setBlockStep({ id: signup.id, step: 1 })}
                        className="p-1.5 rounded-lg text-muted hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                        title="Block email"
                      >
                        <Mail size={13} />
                      </button>
                      <button
                        onClick={() => setDeleteStep({ id: signup.id, step: 1 })}
                        className="p-1.5 rounded-lg text-muted hover:text-loss hover:bg-loss/10 transition-colors"
                        title="Delete signup"
                      >
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

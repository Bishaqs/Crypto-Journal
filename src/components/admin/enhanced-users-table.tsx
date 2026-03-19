"use client";

import { useState, useMemo } from "react";
import { Trash2, AlertTriangle, X, ShieldBan, Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { UserDetailPanel } from "./user-detail-panel";

export type EnrichedUser = {
  id: string;
  email: string;
  tier: string | null;
  isOwner: boolean;
  isTrial: boolean;
  isBanned: boolean;
  bannedReason: string | null;
  createdAt: string;
  updatedAt: string | null;
  level: number;
  totalXp: number;
  currentStreak: number;
  achievementCount: number;
  tradeCount: number;
  lastSeen: string | null;
};

type SortKey = "email" | "tier" | "level" | "totalXp" | "currentStreak" | "achievementCount" | "tradeCount" | "lastSeen" | "createdAt";
type SortDir = "asc" | "desc";

type DeleteState =
  | { step: "idle" }
  | { step: "confirm"; user: EnrichedUser }
  | { step: "final"; user: EnrichedUser }
  | { step: "deleting"; user: EnrichedUser };

type BanState =
  | { step: "idle" }
  | { step: "confirm"; user: EnrichedUser; reason: string }
  | { step: "warning"; user: EnrichedUser; reason: string }
  | { step: "type-email"; user: EnrichedUser; reason: string; typedEmail: string }
  | { step: "banning"; user: EnrichedUser };

const PAGE_SIZE = 25;

export function EnhancedUsersTable({ initialUsers }: { initialUsers: EnrichedUser[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(0);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [deleteState, setDeleteState] = useState<DeleteState>({ step: "idle" });
  const [banState, setBanState] = useState<BanState>({ step: "idle" });
  const [error, setError] = useState<string | null>(null);

  // Filter + sort
  const filtered = useMemo(() => {
    let result = users;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((u) => u.email.toLowerCase().includes(q));
    }
    result = [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "email": cmp = a.email.localeCompare(b.email); break;
        case "tier": cmp = (a.tier ?? "").localeCompare(b.tier ?? ""); break;
        case "level": cmp = a.level - b.level; break;
        case "totalXp": cmp = a.totalXp - b.totalXp; break;
        case "currentStreak": cmp = a.currentStreak - b.currentStreak; break;
        case "achievementCount": cmp = a.achievementCount - b.achievementCount; break;
        case "tradeCount": cmp = a.tradeCount - b.tradeCount; break;
        case "lastSeen": cmp = (a.lastSeen ?? "").localeCompare(b.lastSeen ?? ""); break;
        case "createdAt": cmp = a.createdAt.localeCompare(b.createdAt); break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return result;
  }, [users, search, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageUsers = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
    setPage(0);
  }

  const selectedUser = selectedUserId ? users.find((u) => u.id === selectedUserId) : null;

  async function deleteUser(userId: string) {
    setDeleteState((prev) => prev.step === "final" ? { step: "deleting", user: prev.user } : prev);
    setError(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        setDeleteState({ step: "idle" });
      } else {
        const data = await res.json().catch(() => ({ error: "Unknown error" }));
        setError(data.error || "Failed to delete user");
        setDeleteState({ step: "idle" });
      }
    } catch {
      setError("Network error — please try again");
      setDeleteState({ step: "idle" });
    }
  }

  async function banUser(userId: string, reason: string) {
    setBanState((prev) => prev.step === "type-email" ? { step: "banning", user: prev.user } : prev);
    setError(null);
    try {
      const res = await fetch("/api/admin/users/ban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, reason: reason || undefined }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => u.id === userId ? { ...u, isBanned: true, bannedReason: reason || null } : u)
        );
        setBanState({ step: "idle" });
      } else {
        const data = await res.json().catch(() => ({ error: "Unknown error" }));
        setError(data.error || "Failed to ban user");
        setBanState({ step: "idle" });
      }
    } catch {
      setError("Network error — please try again");
      setBanState({ step: "idle" });
    }
  }

  return (
    <>
      {/* Error banner */}
      {error && (
        <div className="mx-5 mt-4 rounded-xl border border-loss/20 bg-loss/5 p-3 flex items-center gap-2">
          <AlertTriangle size={14} className="text-loss shrink-0" />
          <p className="text-sm text-loss flex-1">{error}</p>
          <button onClick={() => setError(null)} className="text-loss/60 hover:text-loss"><X size={14} /></button>
        </div>
      )}

      {/* Search bar */}
      <div className="px-5 py-3 border-b border-border">
        <div className="relative max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search by email..."
            className="w-full pl-8 pr-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted">
              <SortHeader label="Email" sortKey="email" current={sortKey} dir={sortDir} onToggle={toggleSort} />
              <SortHeader label="Tier" sortKey="tier" current={sortKey} dir={sortDir} onToggle={toggleSort} />
              <SortHeader label="Level" sortKey="level" current={sortKey} dir={sortDir} onToggle={toggleSort} />
              <SortHeader label="XP" sortKey="totalXp" current={sortKey} dir={sortDir} onToggle={toggleSort} />
              <SortHeader label="Streak" sortKey="currentStreak" current={sortKey} dir={sortDir} onToggle={toggleSort} />
              <SortHeader label="Achiev." sortKey="achievementCount" current={sortKey} dir={sortDir} onToggle={toggleSort} />
              <SortHeader label="Trades" sortKey="tradeCount" current={sortKey} dir={sortDir} onToggle={toggleSort} />
              <SortHeader label="Last Active" sortKey="lastSeen" current={sortKey} dir={sortDir} onToggle={toggleSort} />
              <th className="px-3 py-3 font-medium w-20" />
            </tr>
          </thead>
          <tbody>
            {pageUsers.map((u) => (
              <tr
                key={u.id}
                className={`border-b border-border/50 hover:bg-surface-hover transition-colors cursor-pointer ${u.isBanned ? "opacity-60" : ""}`}
                onClick={() => setSelectedUserId(u.id)}
              >
                <td className="px-3 py-3 text-foreground font-medium max-w-[200px] truncate">
                  {u.email}
                  {u.isOwner && <Badge text="OWNER" className="text-accent bg-accent/10" />}
                  {u.isBanned && <Badge text="BANNED" className="text-loss bg-loss/10" />}
                </td>
                <td className="px-3 py-3">{u.tier ? <TierBadge tier={u.tier} /> : <span className="text-xs text-muted">—</span>}</td>
                <td className="px-3 py-3 text-foreground tabular-nums font-semibold">{u.level}</td>
                <td className="px-3 py-3 text-muted tabular-nums">{u.totalXp.toLocaleString()}</td>
                <td className="px-3 py-3 text-muted tabular-nums">
                  {u.currentStreak > 0 ? (
                    <span className="text-amber-400">{u.currentStreak}d</span>
                  ) : (
                    <span>0</span>
                  )}
                </td>
                <td className="px-3 py-3 text-muted tabular-nums">{u.achievementCount}</td>
                <td className="px-3 py-3 text-muted tabular-nums">{u.tradeCount}</td>
                <td className="px-3 py-3 text-muted tabular-nums text-xs">
                  {u.lastSeen ? formatRelative(u.lastSeen) : "Never"}
                </td>
                <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                  {!u.isOwner && !u.isBanned && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setBanState({ step: "confirm", user: u, reason: "" })}
                        className="p-1.5 rounded-lg hover:bg-amber-500/10 transition-colors"
                        title="Ban user"
                      >
                        <ShieldBan size={14} className="text-amber-500" />
                      </button>
                      <button
                        onClick={() => setDeleteState({ step: "confirm", user: u })}
                        className="p-1.5 rounded-lg hover:bg-loss/10 transition-colors"
                        title="Delete user"
                      >
                        <Trash2 size={14} className="text-loss" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {pageUsers.length === 0 && (
              <tr><td colSpan={9} className="px-5 py-8 text-center text-muted">{search ? "No users match your search" : "No users yet"}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-5 py-3 border-t border-border flex items-center justify-between">
          <span className="text-xs text-muted">
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-1.5 rounded-lg hover:bg-surface-hover transition-colors disabled:opacity-30"
            >
              <ChevronLeft size={14} className="text-muted" />
            </button>
            <span className="text-xs text-muted px-2 tabular-nums">
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="p-1.5 rounded-lg hover:bg-surface-hover transition-colors disabled:opacity-30"
            >
              <ChevronRight size={14} className="text-muted" />
            </button>
          </div>
        </div>
      )}

      {/* User Detail Panel */}
      {selectedUser && (
        <UserDetailPanel
          userId={selectedUser.id}
          email={selectedUser.email}
          onClose={() => setSelectedUserId(null)}
        />
      )}

      {/* Delete Modal Step 1 */}
      {deleteState.step === "confirm" && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass border border-border/50 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-loss/10 border border-loss/20 flex items-center justify-center">
                <Trash2 size={18} className="text-loss" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Delete Account?</h3>
            </div>
            <p className="text-sm text-muted leading-relaxed">
              Are you sure you want to delete <span className="text-foreground font-medium">{deleteState.user.email}</span>?
              All their trades, journal entries, and data will be removed.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setDeleteState({ step: "idle" })} className="px-4 py-2 rounded-xl text-sm font-medium text-muted hover:text-foreground hover:bg-surface-hover transition-all">Cancel</button>
              <button onClick={() => setDeleteState({ step: "final", user: deleteState.user })} className="px-4 py-2 rounded-xl text-sm font-semibold bg-loss/10 text-loss border border-loss/20 hover:bg-loss/20 transition-all">Continue</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal Step 2 */}
      {(deleteState.step === "final" || deleteState.step === "deleting") && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass border border-border/50 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-loss/10 border border-loss/20 flex items-center justify-center">
                <AlertTriangle size={18} className="text-loss" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">This Cannot Be Undone</h3>
            </div>
            <p className="text-sm text-muted leading-relaxed">
              Once deleted, there is no way to recover <span className="text-foreground font-medium">{deleteState.user.email}</span>&apos;s account or any of their data.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setDeleteState({ step: "confirm", user: deleteState.user })} disabled={deleteState.step === "deleting"} className="px-4 py-2 rounded-xl text-sm font-medium text-muted hover:text-foreground hover:bg-surface-hover transition-all disabled:opacity-50">Go Back</button>
              <button onClick={() => deleteUser(deleteState.user.id)} disabled={deleteState.step === "deleting"} className="px-4 py-2 rounded-xl text-sm font-semibold bg-loss text-white hover:bg-loss/80 transition-all disabled:opacity-50">
                {deleteState.step === "deleting" ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ban Modal Step 1 */}
      {banState.step === "confirm" && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass border border-border/50 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center"><ShieldBan size={18} className="text-amber-500" /></div>
              <h3 className="text-lg font-semibold text-foreground">Ban Account?</h3>
            </div>
            <p className="text-sm text-muted">Ban <span className="text-foreground font-medium">{banState.user.email}</span> from accessing Traverse Journal?</p>
            <div>
              <label className="text-xs font-medium text-muted mb-1 block">Reason (optional)</label>
              <textarea value={banState.reason} onChange={(e) => setBanState({ ...banState, reason: e.target.value })} placeholder="e.g., Violation of terms of service" className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-1 focus:ring-accent resize-none" rows={2} maxLength={500} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setBanState({ step: "idle" })} className="px-4 py-2 rounded-xl text-sm font-medium text-muted hover:text-foreground hover:bg-surface-hover transition-all">Cancel</button>
              <button onClick={() => setBanState({ step: "warning", user: banState.user, reason: banState.reason })} className="px-4 py-2 rounded-xl text-sm font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20 transition-all">Continue</button>
            </div>
          </div>
        </div>
      )}

      {/* Ban Modal Step 2: Warning */}
      {banState.step === "warning" && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass border border-border/50 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center"><AlertTriangle size={18} className="text-amber-500" /></div>
              <h3 className="text-lg font-semibold text-foreground">Confirm Ban</h3>
            </div>
            <p className="text-sm text-muted">This will immediately lock <span className="text-foreground font-medium">{banState.user.email}</span> out. They will be signed out and receive an email notification.</p>
            {banState.reason && (
              <div className="rounded-lg border border-border/50 bg-surface-hover px-3 py-2">
                <p className="text-xs text-muted mb-0.5">Reason</p>
                <p className="text-sm text-foreground">{banState.reason}</p>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setBanState({ step: "confirm", user: banState.user, reason: banState.reason })} className="px-4 py-2 rounded-xl text-sm font-medium text-muted hover:text-foreground hover:bg-surface-hover transition-all">Go Back</button>
              <button onClick={() => setBanState({ step: "type-email", user: banState.user, reason: banState.reason, typedEmail: "" })} className="px-4 py-2 rounded-xl text-sm font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20 transition-all">Continue</button>
            </div>
          </div>
        </div>
      )}

      {/* Ban Modal Step 3: Type email */}
      {(banState.step === "type-email" || banState.step === "banning") && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass border border-border/50 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-loss/10 border border-loss/20 flex items-center justify-center"><ShieldBan size={18} className="text-loss" /></div>
              <h3 className="text-lg font-semibold text-foreground">Final Confirmation</h3>
            </div>
            <p className="text-sm text-muted">Type <span className="text-foreground font-medium">{banState.user.email}</span> to confirm the ban.</p>
            <input
              type="text"
              value={banState.step === "type-email" ? banState.typedEmail : ""}
              onChange={(e) => { if (banState.step === "type-email") setBanState({ ...banState, typedEmail: e.target.value }); }}
              disabled={banState.step === "banning"}
              placeholder="Type email address"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-1 focus:ring-loss disabled:opacity-50"
              autoComplete="off"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => { if (banState.step === "type-email") setBanState({ step: "warning", user: banState.user, reason: banState.reason }); }} disabled={banState.step === "banning"} className="px-4 py-2 rounded-xl text-sm font-medium text-muted hover:text-foreground hover:bg-surface-hover transition-all disabled:opacity-50">Go Back</button>
              <button onClick={() => { if (banState.step === "type-email") banUser(banState.user.id, banState.reason); }} disabled={banState.step === "banning" || (banState.step === "type-email" && banState.typedEmail.toLowerCase() !== banState.user.email.toLowerCase())} className="px-4 py-2 rounded-xl text-sm font-semibold bg-loss text-white hover:bg-loss/80 transition-all disabled:opacity-50">
                {banState.step === "banning" ? "Banning..." : "Ban Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SortHeader({
  label,
  sortKey,
  current,
  dir,
  onToggle,
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  dir: SortDir;
  onToggle: (k: SortKey) => void;
}) {
  const isActive = current === sortKey;
  return (
    <th
      className="px-3 py-3 font-medium cursor-pointer select-none hover:text-foreground transition-colors"
      onClick={() => onToggle(sortKey)}
    >
      <div className="flex items-center gap-1">
        <span>{label}</span>
        {isActive && (dir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
      </div>
    </th>
  );
}

function Badge({ text, className }: { text: string; className: string }) {
  return (
    <span className={`ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${className}`}>
      {text}
    </span>
  );
}

function TierBadge({ tier }: { tier: string }) {
  const styles: Record<string, string> = {
    free: "text-muted bg-surface-hover",
    pro: "text-amber-400 bg-amber-400/10",
    max: "text-accent bg-accent/10",
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${styles[tier] ?? styles.free}`}>
      {tier}
    </span>
  );
}

function formatRelative(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

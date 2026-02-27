"use client";

import { useState } from "react";
import { Trash2, AlertTriangle, X } from "lucide-react";

type AdminUser = {
  id: string;
  email: string;
  tier: string | null;
  isOwner: boolean;
  isTrial: boolean;
  createdAt: string;
  updatedAt: string | null;
};

type DeleteState =
  | { step: "idle" }
  | { step: "confirm"; user: AdminUser }
  | { step: "final"; user: AdminUser }
  | { step: "deleting"; user: AdminUser };

export function AdminUsersManager({ initialUsers }: { initialUsers: AdminUser[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [deleteState, setDeleteState] = useState<DeleteState>({ step: "idle" });
  const [error, setError] = useState<string | null>(null);

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

  return (
    <>
      {/* Error banner */}
      {error && (
        <div className="mx-5 mt-4 rounded-xl border border-loss/20 bg-loss/5 p-3 flex items-center gap-2">
          <AlertTriangle size={14} className="text-loss shrink-0" />
          <p className="text-sm text-loss flex-1">{error}</p>
          <button onClick={() => setError(null)} className="text-loss/60 hover:text-loss">
            <X size={14} />
          </button>
        </div>
      )}

      {/* User table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted">
              <th className="px-5 py-3 font-medium">Email</th>
              <th className="px-5 py-3 font-medium">Tier</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Signed Up</th>
              <th className="px-5 py-3 font-medium">Last Updated</th>
              <th className="px-5 py-3 font-medium w-24" />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-border/50 hover:bg-surface-hover transition-colors">
                <td className="px-5 py-3 text-foreground font-medium">
                  {u.email}
                  {u.isOwner && (
                    <span className="ml-2 text-[10px] font-semibold text-accent bg-accent/10 px-1.5 py-0.5 rounded-full">
                      OWNER
                    </span>
                  )}
                </td>
                <td className="px-5 py-3">
                  {u.tier ? <TierBadge tier={u.tier} /> : <span className="text-xs text-muted">—</span>}
                </td>
                <td className="px-5 py-3 text-muted">
                  {u.tier ? (u.isTrial ? "Trial" : "Active") : "No subscription"}
                </td>
                <td className="px-5 py-3 text-muted tabular-nums">
                  {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                </td>
                <td className="px-5 py-3 text-muted tabular-nums">
                  {u.updatedAt ? new Date(u.updatedAt).toLocaleDateString() : "—"}
                </td>
                <td className="px-5 py-3">
                  {!u.isOwner && (
                    <button
                      onClick={() => setDeleteState({ step: "confirm", user: u })}
                      className="p-1.5 rounded-lg hover:bg-loss/10 transition-colors"
                      title="Delete user"
                    >
                      <Trash2 size={14} className="text-loss" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-muted">
                  No users yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Step 1: "Are you sure?" */}
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
              <button
                onClick={() => setDeleteState({ step: "idle" })}
                className="px-4 py-2 rounded-xl text-sm font-medium text-muted hover:text-foreground hover:bg-surface-hover transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => setDeleteState({ step: "final", user: deleteState.user })}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-loss/10 text-loss border border-loss/20 hover:bg-loss/20 transition-all"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Step 2: "No way back" */}
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
              Once deleted, there is no way to recover <span className="text-foreground font-medium">{deleteState.user.email}</span>&apos;s
              account or any of their data. Only proceed if you are certain.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteState({ step: "confirm", user: deleteState.user })}
                disabled={deleteState.step === "deleting"}
                className="px-4 py-2 rounded-xl text-sm font-medium text-muted hover:text-foreground hover:bg-surface-hover transition-all disabled:opacity-50"
              >
                Go Back
              </button>
              <button
                onClick={() => deleteUser(deleteState.user.id)}
                disabled={deleteState.step === "deleting"}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-loss text-white hover:bg-loss/80 transition-all disabled:opacity-50"
              >
                {deleteState.step === "deleting" ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
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

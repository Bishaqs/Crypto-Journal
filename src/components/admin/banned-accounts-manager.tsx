"use client";

import { useState } from "react";
import { ShieldBan, ShieldCheck, AlertTriangle, X } from "lucide-react";

type BannedUser = {
  id: string;
  email: string;
  bannedAt: string | null;
  reason: string | null;
};

type UnbanState =
  | { step: "idle" }
  | { step: "confirm"; user: BannedUser }
  | { step: "unbanning"; user: BannedUser };

export function AdminBannedAccountsManager({ initialBannedUsers }: { initialBannedUsers: BannedUser[] }) {
  const [bannedUsers, setBannedUsers] = useState(initialBannedUsers);
  const [unbanState, setUnbanState] = useState<UnbanState>({ step: "idle" });
  const [error, setError] = useState<string | null>(null);

  async function unbanUser(userId: string) {
    setUnbanState((prev) => prev.step === "confirm" ? { step: "unbanning", user: prev.user } : prev);
    setError(null);
    try {
      const res = await fetch("/api/admin/users/ban", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        setBannedUsers((prev) => prev.filter((u) => u.id !== userId));
        setUnbanState({ step: "idle" });
      } else {
        const data = await res.json().catch(() => ({ error: "Unknown error" }));
        setError(data.error || "Failed to unban user");
        setUnbanState({ step: "idle" });
      }
    } catch {
      setError("Network error — please try again");
      setUnbanState({ step: "idle" });
    }
  }

  if (bannedUsers.length === 0) {
    return (
      <p className="text-sm text-muted py-4">No banned accounts</p>
    );
  }

  return (
    <>
      {error && (
        <div className="mb-4 rounded-xl border border-loss/20 bg-loss/5 p-3 flex items-center gap-2">
          <AlertTriangle size={14} className="text-loss shrink-0" />
          <p className="text-sm text-loss flex-1">{error}</p>
          <button onClick={() => setError(null)} className="text-loss/60 hover:text-loss">
            <X size={14} />
          </button>
        </div>
      )}

      <div className="space-y-3">
        {bannedUsers.map((u) => (
          <div
            key={u.id}
            className="flex items-center justify-between gap-4 rounded-xl border border-loss/10 bg-loss/5 px-4 py-3"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <ShieldBan size={14} className="text-loss shrink-0" />
                <span className="text-sm font-medium text-foreground truncate">{u.email}</span>
              </div>
              <div className="flex items-center gap-3 mt-1">
                {u.bannedAt && (
                  <span className="text-xs text-muted">
                    Banned {new Date(u.bannedAt).toLocaleDateString()}
                  </span>
                )}
                {u.reason && (
                  <span className="text-xs text-muted truncate max-w-[200px]" title={u.reason}>
                    {u.reason}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => setUnbanState({ step: "confirm", user: u })}
              className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 hover:bg-emerald-400/20 transition-all"
            >
              Unban
            </button>
          </div>
        ))}
      </div>

      {/* Unban confirmation modal */}
      {(unbanState.step === "confirm" || unbanState.step === "unbanning") && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass border border-border/50 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center">
                <ShieldCheck size={18} className="text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Unban Account?</h3>
            </div>
            <p className="text-sm text-muted leading-relaxed">
              Are you sure you want to unban <span className="text-foreground font-medium">{unbanState.user.email}</span>?
              They will be able to log in and access Traverse Journal again.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setUnbanState({ step: "idle" })}
                disabled={unbanState.step === "unbanning"}
                className="px-4 py-2 rounded-xl text-sm font-medium text-muted hover:text-foreground hover:bg-surface-hover transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => unbanUser(unbanState.user.id)}
                disabled={unbanState.step === "unbanning"}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 hover:bg-emerald-400/20 transition-all disabled:opacity-50"
              >
                {unbanState.step === "unbanning" ? "Unbanning..." : "Unban Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

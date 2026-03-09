"use client";

import { useState } from "react";
import { RefreshCw, Trash2, Clock, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import type { BrokerConnection, ConnectionStatus } from "@/lib/import-export-types";

const STATUS_CONFIG: Record<ConnectionStatus, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-yellow-500/10 text-yellow-400" },
  active: { label: "Active", className: "bg-win/10 text-win" },
  error: { label: "Error", className: "bg-loss/10 text-loss" },
  paused: { label: "Paused", className: "bg-muted/10 text-muted" },
  disconnected: { label: "Disconnected", className: "bg-loss/10 text-loss" },
};

export function ConnectionCard({
  connection,
  onSync,
  onDelete,
}: {
  connection: BrokerConnection;
  onSync: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [syncing, setSyncing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const status = STATUS_CONFIG[connection.status] ?? STATUS_CONFIG.pending;

  async function handleSync() {
    setSyncing(true);
    try {
      await onSync(connection.id);
    } finally {
      setSyncing(false);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    setDeleting(true);
    try {
      await onDelete(connection.id);
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <div className="glass border border-border/50 rounded-xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-semibold text-foreground truncate">
              {connection.broker_name}
            </h4>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${status.className}`}>
              {status.label}
            </span>
          </div>

          {connection.account_label && (
            <p className="text-xs text-muted mb-1">{connection.account_label}</p>
          )}

          <div className="flex items-center gap-4 text-xs text-muted mt-2">
            <span>{connection.total_trades_synced} trades synced</span>
            {connection.last_sync_at && (
              <span className="flex items-center gap-1">
                <Clock size={10} />
                Last: {new Date(connection.last_sync_at).toLocaleDateString()}
              </span>
            )}
            {connection.api_key_last4 && (
              <span className="font-mono">***{connection.api_key_last4}</span>
            )}
          </div>

          {connection.last_error && (
            <p className="flex items-center gap-1 text-xs text-loss mt-1.5">
              <AlertTriangle size={10} />
              {connection.last_error}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="p-2 rounded-lg border border-border text-muted hover:text-accent hover:border-accent/30 transition-all disabled:opacity-30"
            title="Sync now"
          >
            {syncing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className={`p-2 rounded-lg border transition-all ${
              confirmDelete
                ? "border-loss/50 bg-loss/10 text-loss"
                : "border-border text-muted hover:text-loss hover:border-loss/30"
            }`}
            title={confirmDelete ? "Click again to confirm" : "Delete connection"}
          >
            {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { RefreshCw, RotateCcw, Trash2, Clock, AlertTriangle, CheckCircle2, Loader2, Wrench, Bug } from "lucide-react";
import type { BrokerConnection, ConnectionStatus, SyncResult } from "@/lib/import-export-types";

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
  onFullSync,
  onRepair,
  onDelete,
  syncResult,
}: {
  connection: BrokerConnection;
  onSync: (id: string) => Promise<void>;
  onFullSync: (id: string) => Promise<void>;
  onRepair: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  syncResult?: SyncResult;
}) {
  const [syncing, setSyncing] = useState(false);
  const [fullSyncing, setFullSyncing] = useState(false);
  const [repairing, setRepairing] = useState(false);
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

  async function handleFullSync() {
    setFullSyncing(true);
    try {
      await onFullSync(connection.id);
    } finally {
      setFullSyncing(false);
    }
  }

  async function handleRepair() {
    setRepairing(true);
    try {
      await onRepair(connection.id);
    } finally {
      setRepairing(false);
    }
  }

  async function handleDelete() {
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
                Last: {(() => { const d = new Date(connection.last_sync_at); return isNaN(d.getTime()) ? "—" : d.toLocaleDateString(); })()}
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

          {syncResult && (
            <div className={`flex items-center gap-1.5 text-xs mt-2 px-2.5 py-1.5 rounded-lg ${
              syncResult.status === "success" ? "bg-win/10 text-win" :
              syncResult.status === "error" ? "bg-loss/10 text-loss" :
              "bg-accent/10 text-accent"
            }`}>
              {syncResult.status === "success" ? <CheckCircle2 size={12} /> :
               syncResult.status === "error" ? <AlertTriangle size={12} /> :
               <RefreshCw size={12} />}
              {syncResult.message}
            </div>
          )}
        </div>

        {/* Actions */}
        {confirmDelete ? (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-loss font-medium whitespace-nowrap">Delete?</span>
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted hover:text-foreground transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-3 py-1.5 rounded-lg bg-loss text-white text-xs font-semibold hover:bg-loss/80 transition-all disabled:opacity-50"
            >
              {deleting ? <Loader2 size={12} className="animate-spin" /> : "Delete"}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 shrink-0">
            {(syncing || fullSyncing) && (
              <span className="text-[10px] text-accent animate-pulse mr-1">
                {syncResult?.progress?.currentRetry
                  ? `Syncing... (retry ${syncResult.progress.currentRetry}/${syncResult.progress.maxRetries})`
                  : fullSyncing ? "Re-syncing..." : "Syncing..."}
              </span>
            )}
            <button
              onClick={handleSync}
              disabled={syncing || fullSyncing || repairing}
              className="p-2 rounded-lg border border-border text-muted hover:text-accent hover:border-accent/30 transition-all disabled:opacity-30"
              title="Sync new trades"
            >
              {syncing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            </button>
            <button
              onClick={handleFullSync}
              disabled={syncing || fullSyncing || repairing}
              className="p-2 rounded-lg border border-border text-muted hover:text-accent hover:border-accent/30 transition-all disabled:opacity-30"
              title="Full re-sync (re-fetch all trades)"
            >
              {fullSyncing ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
            </button>
            <button
              onClick={handleRepair}
              disabled={syncing || fullSyncing || repairing}
              className="p-2 rounded-lg border border-border text-muted hover:text-yellow-400 hover:border-yellow-400/30 transition-all disabled:opacity-30"
              title="Fix duplicates + reset cursor"
            >
              {repairing ? <Loader2 size={14} className="animate-spin" /> : <Wrench size={14} />}
            </button>
            <a
              href={`/api/connections/${connection.id}/debug`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg border border-border text-muted hover:text-accent hover:border-accent/30 transition-all"
              title="View raw API debug data"
            >
              <Bug size={14} />
            </a>
            <button
              onClick={() => setConfirmDelete(true)}
              className="p-2 rounded-lg border border-border text-muted hover:text-loss hover:border-loss/30 transition-all"
              title="Delete connection"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { Activity, RefreshCw, Loader2, Link2, Plus } from "lucide-react";
import { ConnectionCard } from "./connection-card";
import type { BrokerConnection } from "@/lib/import-export-types";

export function ViewConnectionsTab() {
  const [connections, setConnections] = useState<BrokerConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingAll, setSyncingAll] = useState(false);
  const [error, setError] = useState("");

  const fetchConnections = useCallback(async () => {
    setError("");
    try {
      const res = await fetch("/api/connections");
      if (!res.ok) {
        setError("Failed to load connections");
        return;
      }
      const data = await res.json();
      setConnections(data.connections ?? []);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  async function handleSync(id: string) {
    try {
      const res = await fetch(`/api/connections/${id}/sync`, { method: "POST" });
      if (res.ok) {
        await fetchConnections();
      }
    } catch {
      // sync failed
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/connections/${id}`, { method: "DELETE" });
      if (res.ok) {
        setConnections((prev) => prev.filter((c) => c.id !== id));
      }
    } catch {
      // delete failed
    }
  }

  async function handleSyncAll() {
    setSyncingAll(true);
    try {
      for (const conn of connections) {
        await handleSync(conn.id);
      }
    } finally {
      setSyncingAll(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="glass border border-border/50 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Activity size={16} className="text-accent" />
              Your Connections
            </h3>
            <p className="text-xs text-muted mt-0.5">
              {connections.length} connection{connections.length !== 1 ? "s" : ""} configured
            </p>
          </div>
          {connections.length > 0 && (
            <button
              onClick={handleSyncAll}
              disabled={syncingAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-muted hover:text-foreground transition-all disabled:opacity-30"
            >
              {syncingAll ? (
                <><Loader2 size={12} className="animate-spin" /> Syncing All...</>
              ) : (
                <><RefreshCw size={12} /> Sync All</>
              )}
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-10">
            <Loader2 size={24} className="animate-spin text-accent mx-auto mb-2" />
            <p className="text-xs text-muted">Loading connections...</p>
          </div>
        ) : error ? (
          <div className="text-center py-10">
            <p className="text-sm text-loss mb-2">{error}</p>
            <button
              onClick={fetchConnections}
              className="text-xs text-accent hover:underline"
            >
              Retry
            </button>
          </div>
        ) : connections.length === 0 ? (
          <div className="text-center py-10">
            <Link2 size={32} className="text-muted/30 mx-auto mb-3" />
            <p className="text-sm text-muted mb-1">No connections yet</p>
            <p className="text-xs text-muted/60 mb-4">
              Connect your exchange or broker to automatically import trades.
            </p>
            <p className="text-xs text-accent">
              Use the &quot;Add Auto-sync&quot; tab to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {connections.map((conn) => (
              <ConnectionCard
                key={conn.id}
                connection={conn}
                onSync={handleSync}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

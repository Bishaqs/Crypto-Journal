"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trash2, Loader2, AlertTriangle, CheckCircle2, Package } from "lucide-react";
import type { TargetTable } from "@/lib/import-export-types";

const TABLES: { id: TargetTable; label: string }[] = [
  { id: "trades", label: "Crypto Trades" },
  { id: "stock_trades", label: "Stock Trades" },
  { id: "commodity_trades", label: "Commodity Trades" },
  { id: "forex_trades", label: "Forex Trades" },
];

type TableCount = { table: TargetTable; label: string; count: number };

export function ManageImportsTab() {
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<TableCount[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [confirmStage, setConfirmStage] = useState(0); // 0 = idle, 1 = first click, 2 = confirmed
  const [deleted, setDeleted] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchCounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const results: TableCount[] = [];

      for (const t of TABLES) {
        const { count, error: err } = await supabase
          .from(t.id)
          .select("*", { count: "exact", head: true });

        if (err) {
          // Table might not exist or RLS issue — treat as 0
          results.push({ table: t.id, label: t.label, count: 0 });
        } else {
          results.push({ table: t.id, label: t.label, count: count ?? 0 });
        }
      }

      setCounts(results);
      setTotalCount(results.reduce((s, r) => s + r.count, 0));
    } catch {
      setError("Failed to load import counts");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchCounts();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleDelete() {
    if (confirmStage === 0) {
      setConfirmStage(1);
      return;
    }
    if (confirmStage === 1) {
      setConfirmStage(2);
      return;
    }

    setDeleting(true);
    setError(null);
    let totalDeleted = 0;

    try {
      for (const t of TABLES) {
        const tableCount = counts.find((c) => c.table === t.id)?.count ?? 0;
        if (tableCount === 0) continue;

        const { error: delErr } = await supabase
          .from(t.id)
          .delete()
          .gte("id", "00000000-0000-0000-0000-000000000000");

        if (delErr) {
          setError(`Failed to delete from ${t.label}: ${delErr.message}`);
          break;
        }
        totalDeleted += tableCount;
      }

      setDeleted(totalDeleted);
      setConfirmStage(0);
      await fetchCounts();
    } catch {
      setError("An unexpected error occurred during deletion");
    } finally {
      setDeleting(false);
    }
  }

  function cancelDelete() {
    setConfirmStage(0);
  }

  return (
    <div className="space-y-5">
      {/* Import summary */}
      <div className="glass border border-border/50 rounded-2xl p-5">
        <h3 className="text-base font-semibold text-foreground mb-1 flex items-center gap-2">
          <Package size={16} className="text-accent" />
          Your Trades
        </h3>
        <p className="text-xs text-muted mb-4">
          All trades across your account, by table.
        </p>

        {loading ? (
          <div className="flex items-center gap-2 text-muted text-sm py-4">
            <Loader2 size={16} className="animate-spin" />
            Loading import data...
          </div>
        ) : (
          <div className="space-y-2">
            {counts.map((c) => (
              <div
                key={c.table}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-surface border border-border/50"
              >
                <span className="text-sm text-foreground font-medium">{c.label}</span>
                <span className={`text-sm font-semibold ${c.count > 0 ? "text-accent" : "text-muted"}`}>
                  {c.count.toLocaleString()} trades
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-accent/10 border border-accent/20">
              <span className="text-sm text-foreground font-semibold">Total</span>
              <span className="text-sm font-bold text-accent">{totalCount.toLocaleString()} trades</span>
            </div>
          </div>
        )}
      </div>

      {/* Delete section */}
      {!loading && totalCount > 0 && (
        <div className="glass border border-border/50 rounded-2xl p-5">
          <h3 className="text-base font-semibold text-foreground mb-1 flex items-center gap-2">
            <Trash2 size={16} className="text-loss" />
            Delete All Trades
          </h3>
          <p className="text-xs text-muted mb-4">
            Remove all trades so you can re-import with updated settings.
          </p>

          {confirmStage === 0 && (
            <button
              onClick={handleDelete}
              className="w-full py-3 rounded-xl bg-loss/15 text-loss border border-loss/20 font-semibold text-sm hover:bg-loss/25 transition-all flex items-center justify-center gap-2"
            >
              <Trash2 size={16} />
              Delete All Trades ({totalCount.toLocaleString()})
            </button>
          )}

          {confirmStage === 1 && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-loss/10 border border-loss/20">
                <AlertTriangle size={18} className="text-loss shrink-0" />
                <p className="text-sm text-foreground">
                  This will delete <strong>{totalCount.toLocaleString()}</strong> trades across all tables. Are you sure?
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={cancelDelete}
                  className="flex-1 py-2.5 rounded-lg bg-surface border border-border text-muted font-medium hover:text-foreground hover:border-accent/30 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-2.5 rounded-lg bg-loss/80 text-white font-medium hover:bg-loss transition-colors"
                >
                  Yes, Delete All
                </button>
              </div>
            </div>
          )}

          {confirmStage === 2 && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/15 border border-red-500/30">
                <AlertTriangle size={18} className="text-red-400 shrink-0" />
                <p className="text-sm text-foreground font-semibold">
                  This is permanent and cannot be undone.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={cancelDelete}
                  className="flex-1 py-2.5 rounded-lg bg-surface border border-border text-muted font-medium hover:text-foreground hover:border-accent/30 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 py-2.5 rounded-lg bg-red-600 text-white font-medium hover:bg-red-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Permanently Delete"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Success message */}
      {deleted !== null && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-profit/10 border border-profit/20">
          <CheckCircle2 size={18} className="text-profit shrink-0" />
          <p className="text-sm text-foreground">
            Successfully deleted <strong>{deleted.toLocaleString()}</strong> trades. You can now re-import your data.
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-loss/10 border border-loss/20">
          <AlertTriangle size={18} className="text-loss shrink-0" />
          <p className="text-sm text-loss">{error}</p>
        </div>
      )}
    </div>
  );
}

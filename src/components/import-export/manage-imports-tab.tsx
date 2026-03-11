"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trash2, Loader2, AlertTriangle, CheckCircle2, Package, FileText } from "lucide-react";
import type { TargetTable } from "@/lib/import-export-types";

const TABLES: { id: TargetTable; label: string }[] = [
  { id: "trades", label: "Crypto Trades" },
  { id: "stock_trades", label: "Stock Trades" },
  { id: "commodity_trades", label: "Commodity Trades" },
  { id: "forex_trades", label: "Forex Trades" },
];

type ImportBatch = {
  id: string;
  filename: string | null;
  exchange_preset: string | null;
  detected_format: string | null;
  target_table: string;
  total_rows: number;
  imported_count: number;
  skipped_count: number;
  failed_count: number;
  created_at: string;
};

export function ManageImportsTab() {
  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState<ImportBatch[]>([]);
  const [untrackedCount, setUntrackedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [tableCounts, setTableCounts] = useState<{ id: string; label: string; count: number }[]>([]);
  const [deletingBatchId, setDeletingBatchId] = useState<string | null>(null);
  const [confirmBatchId, setConfirmBatchId] = useState<string | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);
  const [confirmAllStage, setConfirmAllStage] = useState(0);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch batches
      const { data: batchData, error: batchErr } = await supabase
        .from("import_batches")
        .select("*")
        .order("created_at", { ascending: false });

      if (batchErr) {
        // Table might not exist yet — fall back to trade counts only
        setBatches([]);
      } else {
        setBatches(batchData ?? []);
      }

      // Count total trades across all tables
      let total = 0;
      let untracked = 0;
      const perTable: { id: string; label: string; count: number }[] = [];
      for (const t of TABLES) {
        const { count } = await supabase
          .from(t.id)
          .select("*", { count: "exact", head: true });
        const c = count ?? 0;
        total += c;
        perTable.push({ id: t.id, label: t.label, count: c });

        // Count trades without a batch (pre-existing / untracked)
        const { count: nullCount } = await supabase
          .from(t.id)
          .select("*", { count: "exact", head: true })
          .is("import_batch_id", null);
        untracked += nullCount ?? 0;
      }
      setTotalCount(total);
      setUntrackedCount(untracked);
      setTableCounts(perTable);
    } catch {
      setError("Failed to load import data");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleDeleteBatch(batchId: string) {
    if (confirmBatchId !== batchId) {
      setConfirmBatchId(batchId);
      return;
    }

    setDeletingBatchId(batchId);
    setError(null);
    try {
      // CASCADE delete: removing the batch deletes all linked trades
      const { error: delErr } = await supabase
        .from("import_batches")
        .delete()
        .eq("id", batchId);

      if (delErr) {
        setError(`Failed to delete batch: ${delErr.message}`);
      } else {
        const batch = batches.find((b) => b.id === batchId);
        setSuccessMsg(`Deleted "${batch?.filename || "import"}" (${batch?.imported_count ?? 0} trades)`);
        setConfirmBatchId(null);
        await fetchData();
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setDeletingBatchId(null);
    }
  }

  async function handleDeleteAll() {
    if (confirmAllStage < 2) {
      setConfirmAllStage(confirmAllStage + 1);
      return;
    }

    setDeletingAll(true);
    setError(null);
    try {
      // Delete all batches (CASCADE deletes linked trades)
      await supabase
        .from("import_batches")
        .delete()
        .gte("id", "00000000-0000-0000-0000-000000000000");

      // Delete untracked trades (no batch_id)
      for (const t of TABLES) {
        await supabase
          .from(t.id)
          .delete()
          .gte("id", "00000000-0000-0000-0000-000000000000");
      }

      setSuccessMsg(`Deleted all ${totalCount.toLocaleString()} trades`);
      setConfirmAllStage(0);
      await fetchData();
    } catch {
      setError("An unexpected error occurred during deletion");
    } finally {
      setDeletingAll(false);
    }
  }

  async function handleDeleteUntracked() {
    setError(null);
    try {
      for (const t of TABLES) {
        await supabase
          .from(t.id)
          .delete()
          .is("import_batch_id", null);
      }
      setSuccessMsg(`Deleted ${untrackedCount.toLocaleString()} untracked trades`);
      await fetchData();
    } catch {
      setError("Failed to delete untracked trades");
    }
  }

  const TABLE_LABELS: Record<string, string> = {
    trades: "Crypto",
    stock_trades: "Stocks",
    commodity_trades: "Commodities",
    forex_trades: "Forex",
  };

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="glass border border-border/50 rounded-2xl p-5">
        <h3 className="text-base font-semibold text-foreground mb-1 flex items-center gap-2">
          <Package size={16} className="text-accent" />
          Import History
        </h3>
        <p className="text-xs text-muted mb-3">
          {totalCount.toLocaleString()} total trades across all tables.
        </p>

        {!loading && tableCounts.some((t) => t.count > 0) && (
          <div className="grid grid-cols-2 gap-2 mb-4">
            {tableCounts.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-lg bg-surface/50 border border-border/30 px-3 py-2">
                <span className="text-xs text-muted">{t.label}</span>
                <span className="text-xs font-semibold text-foreground">{t.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-2 text-muted text-sm py-4">
            <Loader2 size={16} className="animate-spin" />
            Loading...
          </div>
        ) : batches.length === 0 && untrackedCount === 0 ? (
          <p className="text-sm text-muted py-4">No imports found. Upload a CSV to get started.</p>
        ) : (
          <div className="space-y-3">
            {/* Batch list */}
            {batches.map((batch) => (
              <div key={batch.id} className="rounded-xl bg-surface border border-border/50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                      <FileText size={16} className="text-accent" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {batch.filename || "Unknown file"}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-muted mt-0.5">
                        <span>{TABLE_LABELS[batch.target_table] || batch.target_table}</span>
                        {batch.exchange_preset && (
                          <>
                            <span>&middot;</span>
                            <span>{batch.exchange_preset}</span>
                          </>
                        )}
                        {batch.detected_format && (
                          <>
                            <span>&middot;</span>
                            <span className="text-accent">{batch.detected_format}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-accent">
                      {batch.imported_count.toLocaleString()} trades
                    </p>
                    <p className="text-[10px] text-muted">
                      {new Date(batch.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Batch details row */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
                  <div className="flex gap-3 text-[10px] text-muted">
                    <span>{batch.total_rows} rows in file</span>
                    {batch.skipped_count > 0 && <span>{batch.skipped_count} duplicates skipped</span>}
                    {batch.failed_count > 0 && <span className="text-loss">{batch.failed_count} failed</span>}
                  </div>

                  {confirmBatchId === batch.id ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setConfirmBatchId(null)}
                        className="text-[10px] px-2.5 py-1.5 rounded-lg text-muted hover:text-foreground border border-border transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDeleteBatch(batch.id)}
                        disabled={deletingBatchId === batch.id}
                        className="text-[10px] px-2.5 py-1.5 rounded-lg bg-red-600 text-white font-medium hover:bg-red-500 transition-colors disabled:opacity-50 flex items-center gap-1"
                      >
                        {deletingBatchId === batch.id ? (
                          <Loader2 size={10} className="animate-spin" />
                        ) : (
                          <Trash2 size={10} />
                        )}
                        Confirm Delete
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleDeleteBatch(batch.id)}
                      className="text-[10px] px-2.5 py-1.5 rounded-lg text-loss/70 hover:text-loss hover:bg-loss/10 border border-transparent hover:border-loss/20 transition-all flex items-center gap-1"
                    >
                      <Trash2 size={10} />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Untracked trades */}
            {untrackedCount > 0 && (
              <div className="rounded-xl bg-surface border border-border/50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-muted/10 flex items-center justify-center shrink-0">
                      <AlertTriangle size={16} className="text-muted" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Untracked imports</p>
                      <p className="text-[10px] text-muted">Trades imported before batch tracking was added</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-muted">{untrackedCount.toLocaleString()} trades</p>
                </div>
                <div className="flex justify-end mt-3 pt-3 border-t border-border/30">
                  <button
                    onClick={handleDeleteUntracked}
                    className="text-[10px] px-2.5 py-1.5 rounded-lg text-loss/70 hover:text-loss hover:bg-loss/10 border border-transparent hover:border-loss/20 transition-all flex items-center gap-1"
                  >
                    <Trash2 size={10} />
                    Delete Untracked
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete All section */}
      {!loading && totalCount > 0 && (
        <div className="glass border border-border/50 rounded-2xl p-5">
          <h3 className="text-base font-semibold text-foreground mb-1 flex items-center gap-2">
            <Trash2 size={16} className="text-loss" />
            Delete All Trades
          </h3>
          <p className="text-xs text-muted mb-4">
            Remove everything and start fresh.
          </p>

          {confirmAllStage === 0 && (
            <button
              onClick={handleDeleteAll}
              className="w-full py-3 rounded-xl bg-loss/15 text-loss border border-loss/20 font-semibold text-sm hover:bg-loss/25 transition-all flex items-center justify-center gap-2"
            >
              <Trash2 size={16} />
              Delete All Trades ({totalCount.toLocaleString()})
            </button>
          )}

          {confirmAllStage === 1 && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-loss/10 border border-loss/20">
                <AlertTriangle size={18} className="text-loss shrink-0" />
                <p className="text-sm text-foreground">
                  This will delete <strong>{totalCount.toLocaleString()}</strong> trades across all tables. Are you sure?
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmAllStage(0)}
                  className="flex-1 py-2.5 rounded-lg bg-surface border border-border text-muted font-medium hover:text-foreground hover:border-accent/30 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAll}
                  className="flex-1 py-2.5 rounded-lg bg-loss/80 text-white font-medium hover:bg-loss transition-colors"
                >
                  Yes, Delete All
                </button>
              </div>
            </div>
          )}

          {confirmAllStage === 2 && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/15 border border-red-500/30">
                <AlertTriangle size={18} className="text-red-400 shrink-0" />
                <p className="text-sm text-foreground font-semibold">
                  This is permanent and cannot be undone.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmAllStage(0)}
                  className="flex-1 py-2.5 rounded-lg bg-surface border border-border text-muted font-medium hover:text-foreground hover:border-accent/30 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAll}
                  disabled={deletingAll}
                  className="flex-1 py-2.5 rounded-lg bg-red-600 text-white font-medium hover:bg-red-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deletingAll ? (
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

      {/* Success */}
      {successMsg && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-profit/10 border border-profit/20">
          <CheckCircle2 size={18} className="text-profit shrink-0" />
          <p className="text-sm text-foreground">{successMsg}</p>
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

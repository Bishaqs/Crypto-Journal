"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Download, Loader2, CheckCircle2, FileText } from "lucide-react";
import { exportToCSV, exportToJSON, downloadFile, getExportFilename } from "@/lib/export-trades";
import type { TargetTable, ExportFormat } from "@/lib/import-export-types";

const TABLE_OPTIONS: { id: TargetTable; label: string }[] = [
  { id: "trades", label: "Crypto Trades" },
  { id: "stock_trades", label: "Stock Trades" },
  { id: "commodity_trades", label: "Commodity Trades" },
  { id: "forex_trades", label: "Forex Trades" },
];

type ExportRecord = {
  filename: string;
  table: string;
  rowCount: number;
  timestamp: string;
};

export function ManageExportTab() {
  const [selectedTables, setSelectedTables] = useState<Set<TargetTable>>(new Set(["trades"]));
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportingNotes, setExportingNotes] = useState(false);
  const [exportHistory, setExportHistory] = useState<ExportRecord[]>(() => {
    try {
      const raw = localStorage.getItem("stargate-export-history");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const supabase = createClient();

  function toggleTable(table: TargetTable) {
    setSelectedTables((prev) => {
      const next = new Set(prev);
      if (next.has(table)) {
        next.delete(table);
      } else {
        next.add(table);
      }
      return next;
    });
  }

  async function handleExport() {
    if (selectedTables.size === 0) return;
    setExporting(true);

    try {
      for (const table of selectedTables) {
        let query = supabase.from(table).select("*").order("open_timestamp", { ascending: false });

        if (dateFrom) {
          query = query.gte("open_timestamp", new Date(dateFrom).toISOString());
        }
        if (dateTo) {
          query = query.lte("open_timestamp", new Date(dateTo + "T23:59:59").toISOString());
        }

        const { data, error } = await query;
        if (error) {
          console.error(`Export error for ${table}:`, error.message);
          continue;
        }
        if (!data || data.length === 0) continue;

        // Remove user_id from export
        const cleanedData = data.map(({ user_id, ...rest }: Record<string, unknown>) => rest);

        const filename = getExportFilename(table, format);
        const content = format === "csv" ? exportToCSV(cleanedData) : exportToJSON(cleanedData);
        const mimeType = format === "csv" ? "text/csv;charset=utf-8" : "application/json";
        downloadFile(filename, content, mimeType);

        // Track in history
        const record: ExportRecord = {
          filename,
          table,
          rowCount: cleanedData.length,
          timestamp: new Date().toISOString(),
        };
        const updatedHistory = [record, ...exportHistory].slice(0, 20);
        setExportHistory(updatedHistory);
        try {
          localStorage.setItem("stargate-export-history", JSON.stringify(updatedHistory));
        } catch { /* full storage */ }
      }
    } finally {
      setExporting(false);
    }
  }

  async function handleExportNotes() {
    setExportingNotes(true);
    try {
      const { data, error } = await supabase
        .from("journal_notes")
        .select("*")
        .order("note_date", { ascending: false });

      if (error || !data || data.length === 0) {
        setExportingNotes(false);
        return;
      }

      const cleanedData = data.map(({ user_id, ...rest }: Record<string, unknown>) => rest);
      const date = new Date().toISOString().split("T")[0];
      const filename = `journal_notes_${date}.${format}`;
      const content = format === "csv" ? exportToCSV(cleanedData) : exportToJSON(cleanedData);
      const mimeType = format === "csv" ? "text/csv;charset=utf-8" : "application/json";
      downloadFile(filename, content, mimeType);

      const record: ExportRecord = {
        filename,
        table: "journal_notes",
        rowCount: cleanedData.length,
        timestamp: new Date().toISOString(),
      };
      const updatedHistory = [record, ...exportHistory].slice(0, 20);
      setExportHistory(updatedHistory);
      try {
        localStorage.setItem("stargate-export-history", JSON.stringify(updatedHistory));
      } catch { /* full storage */ }
    } finally {
      setExportingNotes(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="glass border border-border/50 rounded-2xl p-5">
        <h3 className="text-base font-semibold text-foreground mb-1 flex items-center gap-2">
          <Download size={16} className="text-accent" />
          Export Trade Data
        </h3>
        <p className="text-xs text-muted mb-4">
          Download your trade data as CSV or JSON files.
        </p>

        <div className="space-y-4">
          {/* Table selection */}
          <div>
            <p className="text-[10px] text-muted uppercase tracking-wider font-semibold mb-2">Select Tables to Export</p>
            <div className="grid grid-cols-2 gap-2">
              {TABLE_OPTIONS.map((opt) => {
                const isSelected = selectedTables.has(opt.id);
                return (
                  <button
                    key={opt.id}
                    onClick={() => toggleTable(opt.id)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                      isSelected
                        ? "bg-accent/15 text-accent border border-accent/20"
                        : "text-muted hover:text-foreground border border-border"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                      isSelected ? "border-accent bg-accent" : "border-border"
                    }`}>
                      {isSelected && <CheckCircle2 size={10} className="text-background" />}
                    </div>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Format */}
          <div>
            <p className="text-[10px] text-muted uppercase tracking-wider font-semibold mb-2">Export Format</p>
            <div className="flex gap-2">
              <button
                onClick={() => setFormat("csv")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  format === "csv"
                    ? "bg-accent/15 text-accent border border-accent/20"
                    : "text-muted hover:text-foreground border border-border"
                }`}
              >
                CSV
              </button>
              <button
                onClick={() => setFormat("json")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  format === "json"
                    ? "bg-accent/15 text-accent border border-accent/20"
                    : "text-muted hover:text-foreground border border-border"
                }`}
              >
                JSON
              </button>
            </div>
          </div>

          {/* Date range */}
          <div>
            <p className="text-[10px] text-muted uppercase tracking-wider font-semibold mb-2">Date Range (Optional)</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-muted mb-1 block">From</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted mb-1 block">To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50"
                />
              </div>
            </div>
          </div>

          {/* Export button */}
          <button
            onClick={handleExport}
            disabled={selectedTables.size === 0 || exporting}
            className="w-full py-3 rounded-xl bg-accent text-background font-semibold text-sm hover:bg-accent-hover transition-all disabled:opacity-30 flex items-center justify-center gap-2"
          >
            {exporting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download size={16} />
                Download {selectedTables.size} Table{selectedTables.size !== 1 ? "s" : ""}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Export Journal Notes */}
      <div className="glass border border-border/50 rounded-2xl p-5">
        <h3 className="text-base font-semibold text-foreground mb-1 flex items-center gap-2">
          <FileText size={16} className="text-accent" />
          Export Journal Notes
        </h3>
        <p className="text-xs text-muted mb-4">
          Download your journal notes as {format.toUpperCase()}.
        </p>
        <button
          onClick={handleExportNotes}
          disabled={exportingNotes}
          className="w-full py-3 rounded-xl bg-accent text-background font-semibold text-sm hover:bg-accent-hover transition-all disabled:opacity-30 flex items-center justify-center gap-2"
        >
          {exportingNotes ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download size={16} />
              Download Notes
            </>
          )}
        </button>
      </div>

      {/* Export history */}
      {exportHistory.length > 0 && (
        <div className="glass border border-border/50 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <FileText size={14} className="text-muted" />
            Recent Exports
          </h3>
          <div className="space-y-2">
            {exportHistory.slice(0, 5).map((record, i) => (
              <div key={i} className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-surface border border-border/50">
                <div>
                  <span className="text-foreground font-medium">{record.filename}</span>
                  <span className="text-muted ml-2">{record.rowCount} rows</span>
                </div>
                <span className="text-muted">
                  {new Date(record.timestamp).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

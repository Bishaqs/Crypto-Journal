"use client";

import { useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { validateImportData, ImportResult } from "@/lib/csv-import";
import {
  X,
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

interface CSVImportModalProps {
  onClose: () => void;
  onImported: () => void;
}

type Step = "upload" | "preview" | "importing" | "done";

type ExchangePreset = {
  label: string;
  group: "cex" | "stocks" | "dex";
  tip: string;
};

const EXCHANGE_PRESETS: ExchangePreset[] = [
  { label: "Binance", group: "cex", tip: "Binance > Orders > Trade History > Export" },
  { label: "Bybit", group: "cex", tip: "Bybit > Assets > Trade History > Export CSV" },
  { label: "OKX", group: "cex", tip: "OKX > Assets > Order History > Export" },
  { label: "Coinbase", group: "cex", tip: "Coinbase > Taxes > Generate Report > Download CSV" },
  { label: "Kraken", group: "cex", tip: "Kraken > History > Export" },
  { label: "KuCoin", group: "cex", tip: "KuCoin > Orders > Trade History > Export" },
  { label: "Gate.io", group: "cex", tip: "Gate.io > Orders > Trade History > Export" },
  { label: "Bitget", group: "cex", tip: "Bitget > Orders > Spot Orders > Export" },
  { label: "MEXC", group: "cex", tip: "MEXC > Orders > Trade History > Export" },
  { label: "HTX", group: "cex", tip: "HTX > Orders > Trade History > Export" },
  { label: "Crypto.com", group: "cex", tip: "Crypto.com > Accounts > Transaction History > Export" },
  { label: "Gemini", group: "cex", tip: "Gemini > Account > Balances > Download History" },
  { label: "Bitstamp", group: "cex", tip: "Bitstamp > Transactions > Export" },
  { label: "Robinhood", group: "stocks", tip: "Robinhood > Account > Statements > Download CSV" },
  { label: "Schwab", group: "stocks", tip: "Schwab > Accounts > History > Export" },
  { label: "IBKR", group: "stocks", tip: "IBKR > Reports > Activity Statements > CSV" },
  { label: "Webull", group: "stocks", tip: "Webull > Orders > History > Export" },
  { label: "Fidelity", group: "stocks", tip: "Fidelity > Activity & Orders > Download" },
  { label: "E*Trade", group: "stocks", tip: "E*Trade > Accounts > Transactions > Download" },
  { label: "Etherscan", group: "dex", tip: "Etherscan > Address > Download CSV Export" },
  { label: "Solscan", group: "dex", tip: "Solscan > Account > Export Transactions" },
  { label: "Zerion", group: "dex", tip: "Zerion > History > Export to CSV" },
];

export function CSVImportModal({ onClose, onImported }: CSVImportModalProps) {
  const [step, setStep] = useState<Step>("upload");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedExchange, setSelectedExchange] = useState("");
  const [importProgress, setImportProgress] = useState(0);
  const [importedCount, setImportedCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [showErrors, setShowErrors] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const processFile = useCallback((file: File) => {
    if (!file.name.endsWith(".csv")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const validationResult = validateImportData(text);
      setResult(validationResult);
      setStep("preview");
    };
    reader.readAsText(file);
  }, []);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  async function startImport() {
    if (!result) return;
    setStep("importing");
    let success = 0;
    let failed = 0;

    // Batch insert in chunks of 20
    const chunks: Record<string, unknown>[][] = [];
    const payloads = result.validRows.map((r) => r.parsed!);
    for (let i = 0; i < payloads.length; i += 20) {
      chunks.push(payloads.slice(i, i + 20));
    }

    for (let i = 0; i < chunks.length; i++) {
      const { error } = await supabase.from("trades").insert(chunks[i]);
      if (error) {
        failed += chunks[i].length;
      } else {
        success += chunks[i].length;
      }
      setImportProgress(Math.round(((i + 1) / chunks.length) * 100));
      setImportedCount(success);
      setFailedCount(failed);
    }

    setStep("done");
    onImported();
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass border border-border/50 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Upload size={18} className="text-accent" />
            Import Trades
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          {/* Step: Upload */}
          {step === "upload" && (
            <div className="space-y-4">
              {/* Exchange selector */}
              <div>
                <p className="text-[10px] text-muted uppercase tracking-wider font-semibold mb-2">Select your exchange (optional)</p>
                <select
                  value={selectedExchange}
                  onChange={(e) => setSelectedExchange(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50 transition-all"
                >
                  <option value="">Auto-detect (Recommended)</option>
                  <optgroup label="Crypto Exchanges">
                    {EXCHANGE_PRESETS.filter((p) => p.group === "cex").map((p) => (
                      <option key={p.label} value={p.label}>{p.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Stock Brokers">
                    {EXCHANGE_PRESETS.filter((p) => p.group === "stocks").map((p) => (
                      <option key={p.label} value={p.label}>{p.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="DEX / Blockchain">
                    {EXCHANGE_PRESETS.filter((p) => p.group === "dex").map((p) => (
                      <option key={p.label} value={p.label}>{p.label}</option>
                    ))}
                  </optgroup>
                </select>
                {selectedExchange && (
                  <p className="text-[10px] text-accent mt-1.5 px-1">
                    {EXCHANGE_PRESETS.find((p) => p.label === selectedExchange)?.tip}
                  </p>
                )}
              </div>

              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
                  dragOver ? "border-accent bg-accent/5" : "border-border hover:border-accent/30"
                }`}
              >
                <FileText size={40} className="text-accent/40 mx-auto mb-4" />
                <p className="text-sm font-medium text-foreground mb-1">
                  Drop your CSV file here
                </p>
                <p className="text-xs text-muted mb-4">
                  or click to browse
                </p>
                <p className="text-[10px] text-muted/50">
                  Supports 13+ exchanges, 6 stock brokers, and DEX exports
                </p>
                <input ref={fileRef} type="file" accept=".csv" onChange={handleFileSelect} className="hidden" />
              </div>
            </div>
          )}

          {/* Step: Preview */}
          {step === "preview" && result && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-win/10 text-win text-sm font-medium">
                  <CheckCircle2 size={14} />
                  {result.validRows.length} valid
                </div>
                {result.invalidRows.length > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-loss/10 text-loss text-sm font-medium">
                    <XCircle size={14} />
                    {result.invalidRows.length} with errors
                  </div>
                )}
                <span className="text-xs text-muted ml-auto">
                  {result.totalRows} total rows
                </span>
              </div>

              {/* Column mapping */}
              <div>
                <p className="text-[10px] text-muted uppercase tracking-wider font-semibold mb-2">Column Mapping</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.headers.map((h) => (
                    <span key={h} className="text-[10px] px-2 py-1 rounded-md bg-surface border border-border text-muted">
                      {h} &rarr; <span className="text-accent font-medium">{result.mappedHeaders[h]}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Preview table */}
              <div>
                <p className="text-[10px] text-muted uppercase tracking-wider font-semibold mb-2">Preview (first 5)</p>
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-surface border-b border-border">
                        <th className="px-3 py-2 text-left text-muted font-semibold">#</th>
                        <th className="px-3 py-2 text-left text-muted font-semibold">Symbol</th>
                        <th className="px-3 py-2 text-left text-muted font-semibold">Side</th>
                        <th className="px-3 py-2 text-left text-muted font-semibold">Entry</th>
                        <th className="px-3 py-2 text-left text-muted font-semibold">Exit</th>
                        <th className="px-3 py-2 text-left text-muted font-semibold">Qty</th>
                        <th className="px-3 py-2 text-left text-muted font-semibold">P&L</th>
                        <th className="px-3 py-2 text-left text-muted font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.validRows.slice(0, 5).map((row) => (
                        <tr key={row.rowNumber} className="border-b border-border/30">
                          <td className="px-3 py-2 text-muted">{row.rowNumber}</td>
                          <td className="px-3 py-2 text-foreground font-medium">{row.data.symbol}</td>
                          <td className="px-3 py-2 text-foreground">{row.data.position}</td>
                          <td className="px-3 py-2 text-foreground">{row.data.entry_price}</td>
                          <td className="px-3 py-2 text-foreground">{row.data.exit_price || "—"}</td>
                          <td className="px-3 py-2 text-foreground">{row.data.quantity}</td>
                          <td className="px-3 py-2 text-foreground">{row.data.pnl || "—"}</td>
                          <td className="px-3 py-2"><CheckCircle2 size={12} className="text-win" /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Errors */}
              {result.invalidRows.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowErrors(!showErrors)}
                    className="flex items-center gap-1.5 text-xs text-loss font-medium"
                  >
                    {showErrors ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    {result.invalidRows.length} rows with errors
                  </button>
                  {showErrors && (
                    <div className="mt-2 space-y-2">
                      {result.invalidRows.slice(0, 10).map((row) => (
                        <div key={row.rowNumber} className="text-xs px-3 py-2 rounded-lg bg-loss/5 border border-loss/10">
                          <span className="text-muted">Row {row.rowNumber}:</span>{" "}
                          <span className="text-loss">{row.errors.join(", ")}</span>
                        </div>
                      ))}
                      {result.invalidRows.length > 10 && (
                        <p className="text-[10px] text-muted">...and {result.invalidRows.length - 10} more</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Action */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={startImport}
                  disabled={result.validRows.length === 0}
                  className="flex-1 py-3 rounded-xl bg-accent text-background font-semibold text-sm hover:bg-accent-hover transition-all disabled:opacity-30"
                >
                  Import {result.validRows.length} Trade{result.validRows.length !== 1 ? "s" : ""}
                </button>
                <button
                  onClick={() => { setStep("upload"); setResult(null); }}
                  className="px-4 py-3 rounded-xl border border-border text-sm text-muted hover:text-foreground transition-all"
                >
                  Choose Different File
                </button>
              </div>
            </div>
          )}

          {/* Step: Importing */}
          {step === "importing" && (
            <div className="text-center py-12">
              <Loader2 size={32} className="animate-spin text-accent mx-auto mb-4" />
              <p className="text-sm font-medium text-foreground mb-2">Importing trades...</p>
              <div className="w-full max-w-xs mx-auto bg-surface rounded-full h-2 overflow-hidden">
                <div className="h-full bg-accent transition-all duration-300 rounded-full" style={{ width: `${importProgress}%` }} />
              </div>
              <p className="text-xs text-muted mt-2">{importProgress}%</p>
            </div>
          )}

          {/* Step: Done */}
          {step === "done" && (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-win/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={28} className="text-win" />
              </div>
              <p className="text-lg font-bold text-foreground mb-2">Import Complete</p>
              <p className="text-sm text-muted mb-1">
                {importedCount} trade{importedCount !== 1 ? "s" : ""} imported successfully
              </p>
              {failedCount > 0 && (
                <p className="text-sm text-loss flex items-center justify-center gap-1.5 mb-4">
                  <AlertTriangle size={14} />
                  {failedCount} failed to insert
                </p>
              )}
              <button
                onClick={onClose}
                className="mt-4 px-6 py-2.5 rounded-xl bg-accent text-background font-semibold text-sm hover:bg-accent-hover transition-all"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { validateImportData, type ImportResult } from "@/lib/csv-import";
import { parseFileToCSV, isAcceptedFileType } from "@/lib/file-parser";
import { fetchAllTrades } from "@/lib/supabase/fetch-all-trades";
import { getDedupSelect, getExistingSig, getPayloadSig } from "@/lib/import-dedup";
import {
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  ChevronDown,
  ChevronRight,
  Settings2,
} from "lucide-react";
import { BROKER_INSTRUCTIONS, getBrokerInstruction } from "./broker-instructions-data";
import { BrokerInstructions } from "./broker-instructions";
import { TargetTableSelector } from "./target-table-selector";
import type { TargetTable } from "@/lib/import-export-types";

type Step = "upload" | "preview" | "importing" | "done";

export function UploadFileTab() {
  const [step, setStep] = useState<Step>("upload");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedBroker, setSelectedBroker] = useState("");
  const [targetTable, setTargetTable] = useState<TargetTable>("trades");
  const [importProgress, setImportProgress] = useState(0);
  const [importedCount, setImportedCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [showErrors, setShowErrors] = useState(false);
  const [skippedCount, setSkippedCount] = useState(0);
  const [fileName, setFileName] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [timezone, setTimezone] = useState("UTC");
  const [currency, setCurrency] = useState("USD");
  const fileRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  // Auto-suggest target table when broker changes
  function handleBrokerChange(brokerId: string) {
    setSelectedBroker(brokerId);
    const instruction = getBrokerInstruction(brokerId);
    if (instruction) {
      setTargetTable(instruction.targetTable);
    }
  }

  const processFile = useCallback(async (file: File) => {
    if (!isAcceptedFileType(file.name)) return;
    try {
      setFileName(file.name);
      const { csvText } = await parseFileToCSV(file);
      const validationResult = validateImportData(csvText);
      setResult(validationResult);
      setStep("preview");
    } catch {
      setResult(null);
    }
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

    // 1. Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setStep("done");
      setFailedCount(result.validRows.length);
      return;
    }

    // 2. Create batch record
    let batchId: string | null = null;
    const { data: batchData } = await supabase
      .from("import_batches")
      .insert({
        user_id: user.id,
        filename: fileName || null,
        exchange_preset: selectedBroker || null,
        detected_format: result.detectedFormat || null,
        target_table: targetTable,
        total_rows: result.totalRows,
      })
      .select("id")
      .single();
    if (batchData) batchId = batchData.id;

    // 3. Dedup: fetch existing trades and skip duplicates
    const dedupSelect = getDedupSelect(targetTable);
    const { data: existing } = await fetchAllTrades(supabase, dedupSelect, targetTable);
    const existingSet = new Set(
      (existing ?? []).map((t: Record<string, unknown>) =>
        getExistingSig(t, targetTable),
      ),
    );

    const allPayloads = result.validRows.map((r) => r.parsed!);
    const payloads = allPayloads.filter(
      (p) => !existingSet.has(getPayloadSig(p as Record<string, unknown>)),
    );
    const skipped = allPayloads.length - payloads.length;
    setSkippedCount(skipped);

    // 4. Attach batch ID
    if (batchId) {
      for (const p of payloads) {
        (p as Record<string, unknown>).import_batch_id = batchId;
      }
    }

    // 5. Chunked insert
    const chunks: Record<string, unknown>[][] = [];
    for (let i = 0; i < payloads.length; i += 20) {
      chunks.push(payloads.slice(i, i + 20));
    }

    for (let i = 0; i < chunks.length; i++) {
      const { error } = await supabase.from(targetTable).insert(chunks[i]);
      if (error) {
        failed += chunks[i].length;
      } else {
        success += chunks[i].length;
      }
      setImportProgress(Math.round(((i + 1) / chunks.length) * 100));
      setImportedCount(success);
      setFailedCount(failed);
    }

    // 6. Update batch with final counts
    if (batchId) {
      await supabase
        .from("import_batches")
        .update({ imported_count: success, skipped_count: skipped, failed_count: failed })
        .eq("id", batchId);
    }

    setStep("done");
  }

  function reset() {
    setStep("upload");
    setResult(null);
    setImportProgress(0);
    setImportedCount(0);
    setFailedCount(0);
    setSkippedCount(0);
    setFileName("");
    setShowErrors(false);
  }

  const brokerInstruction = selectedBroker ? getBrokerInstruction(selectedBroker) : null;

  return (
    <div className="space-y-5">
      <div className="glass border border-border/50 rounded-2xl p-5">
        <h3 className="text-base font-semibold text-foreground mb-1 flex items-center gap-2">
          <Upload size={16} className="text-accent" />
          Upload Trade File
        </h3>
        <p className="text-xs text-muted mb-4">
          Import your trade history from any supported broker or exchange.
        </p>

        {/* Step: Upload */}
        {step === "upload" && (
          <div className="space-y-4">
            {/* Target table selector */}
            <TargetTableSelector value={targetTable} onChange={setTargetTable} />

            {/* Broker selector */}
            <div>
              <p className="text-[10px] text-muted uppercase tracking-wider font-semibold mb-2">Select your broker/platform</p>
              <select
                value={selectedBroker}
                onChange={(e) => handleBrokerChange(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50 transition-all"
              >
                <option value="">Auto-detect (Recommended)</option>
                <optgroup label="Crypto Exchanges">
                  {BROKER_INSTRUCTIONS.filter((b) => b.group === "cex").map((b) => (
                    <option key={b.brokerId} value={b.brokerId}>{b.brokerName}</option>
                  ))}
                </optgroup>
                <optgroup label="Stock Brokers">
                  {BROKER_INSTRUCTIONS.filter((b) => b.group === "stocks").map((b) => (
                    <option key={b.brokerId} value={b.brokerId}>{b.brokerName}</option>
                  ))}
                </optgroup>
                <optgroup label="DEX / Blockchain">
                  {BROKER_INSTRUCTIONS.filter((b) => b.group === "dex").map((b) => (
                    <option key={b.brokerId} value={b.brokerId}>{b.brokerName}</option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Broker-specific instructions */}
            {brokerInstruction && <BrokerInstructions instruction={brokerInstruction} />}

            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
                dragOver ? "border-accent bg-accent/5" : "border-border hover:border-accent/30"
              }`}
            >
              <FileText size={36} className="text-accent/40 mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">
                Drop your CSV or Excel file here
              </p>
              <p className="text-xs text-muted mb-3">or click to browse</p>
              <p className="text-[10px] text-muted/50">
                Supports 13+ crypto exchanges, 6 stock brokers, and DEX exports
              </p>
              <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFileSelect} className="hidden" />
            </div>

            {/* Advanced settings */}
            <div>
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors"
              >
                <Settings2 size={12} />
                Advanced Import Settings
                {showAdvanced ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              </button>
              {showAdvanced && (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-muted uppercase tracking-wider font-semibold mb-1">Timezone</p>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50"
                    >
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">America/New_York</option>
                      <option value="America/Chicago">America/Chicago</option>
                      <option value="America/Los_Angeles">America/Los_Angeles</option>
                      <option value="Europe/London">Europe/London</option>
                      <option value="Europe/Berlin">Europe/Berlin</option>
                      <option value="Asia/Tokyo">Asia/Tokyo</option>
                      <option value="Asia/Singapore">Asia/Singapore</option>
                      <option value="Asia/Hong_Kong">Asia/Hong_Kong</option>
                    </select>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted uppercase tracking-wider font-semibold mb-1">Currency</p>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50"
                    >
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                      <option value="JPY">JPY - Japanese Yen</option>
                      <option value="BTC">BTC - Bitcoin</option>
                      <option value="ETH">ETH - Ethereum</option>
                      <option value="USDT">USDT - Tether</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step: Preview */}
        {step === "preview" && result && (
          <div className="space-y-4">
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

            {/* Import target info */}
            <div className="text-xs text-muted px-3 py-2 rounded-lg bg-surface border border-border">
              Importing to: <span className="text-accent font-medium">{targetTable === "trades" ? "Crypto Trades" : targetTable === "stock_trades" ? "Stock Trades" : targetTable === "commodity_trades" ? "Commodity Trades" : "Forex Trades"}</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={startImport}
                disabled={result.validRows.length === 0}
                className="flex-1 py-3 rounded-xl bg-accent text-background font-semibold text-sm hover:bg-accent-hover transition-all disabled:opacity-30"
              >
                Import {result.validRows.length} Trade{result.validRows.length !== 1 ? "s" : ""}
              </button>
              <button
                onClick={reset}
                className="px-4 py-3 rounded-xl border border-border text-sm text-muted hover:text-foreground transition-all"
              >
                Choose Different File
              </button>
            </div>
          </div>
        )}

        {/* Step: Importing */}
        {step === "importing" && (
          <div className="text-center py-10">
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
          <div className="text-center py-10">
            <div className="w-16 h-16 rounded-2xl bg-win/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={28} className="text-win" />
            </div>
            <p className="text-lg font-bold text-foreground mb-2">Import Complete</p>
            <p className="text-sm text-muted mb-1">
              {importedCount} trade{importedCount !== 1 ? "s" : ""} imported successfully
            </p>
            {skippedCount > 0 && (
              <p className="text-xs text-muted mb-1">
                {skippedCount} duplicate{skippedCount !== 1 ? "s" : ""} skipped
              </p>
            )}
            {failedCount > 0 && (
              <p className="text-sm text-loss flex items-center justify-center gap-1.5 mb-4">
                <AlertTriangle size={14} />
                {failedCount} failed to insert
              </p>
            )}
            <button
              onClick={reset}
              className="mt-4 px-6 py-2.5 rounded-xl bg-accent text-background font-semibold text-sm hover:bg-accent-hover transition-all"
            >
              Import More
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

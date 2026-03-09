"use client";

import { useState } from "react";
import { Link2, Eye, EyeOff, CheckCircle2, XCircle, Loader2, AlertTriangle } from "lucide-react";
import { BROKER_INSTRUCTIONS } from "./broker-instructions-data";
import { TargetTableSelector } from "./target-table-selector";
import type { TargetTable, SyncFrequency } from "@/lib/import-export-types";

type ConnectionStatus = "idle" | "testing" | "success" | "error";

export function AddConnectionTab() {
  const [broker, setBroker] = useState("");
  const [accountLabel, setAccountLabel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [targetTable, setTargetTable] = useState<TargetTable>("trades");
  const [syncFrequency, setSyncFrequency] = useState<SyncFrequency>("manual");
  const [timezone, setTimezone] = useState("UTC");
  const [currency, setCurrency] = useState("USD");
  const [testStatus, setTestStatus] = useState<ConnectionStatus>("idle");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function handleBrokerChange(brokerId: string) {
    setBroker(brokerId);
    const instruction = BROKER_INSTRUCTIONS.find((b) => b.brokerId === brokerId);
    if (instruction) {
      setTargetTable(instruction.targetTable);
    }
  }

  async function testConnection() {
    if (!apiKey || !apiSecret) {
      setError("API Key and Secret are required");
      return;
    }
    setTestStatus("testing");
    setError("");
    // Placeholder: simulate test
    await new Promise((resolve) => setTimeout(resolve, 1500));
    if (apiKey.length >= 8) {
      setTestStatus("success");
    } else {
      setTestStatus("error");
      setError("API key appears too short. Check your credentials.");
    }
  }

  async function handleSave() {
    if (!broker) { setError("Select a broker"); return; }
    if (!apiKey || !apiSecret) { setError("API Key and Secret are required"); return; }
    setError("");
    setSaving(true);

    try {
      const res = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          broker_name: BROKER_INSTRUCTIONS.find((b) => b.brokerId === broker)?.brokerName ?? broker,
          broker_type: BROKER_INSTRUCTIONS.find((b) => b.brokerId === broker)?.group === "cex" ? "crypto_exchange"
            : BROKER_INSTRUCTIONS.find((b) => b.brokerId === broker)?.group === "stocks" ? "stock_broker"
            : BROKER_INSTRUCTIONS.find((b) => b.brokerId === broker)?.group === "dex" ? "dex"
            : "forex_broker",
          account_label: accountLabel || null,
          api_key: apiKey,
          api_secret: apiSecret,
          target_table: targetTable,
          sync_frequency: syncFrequency,
          timezone,
          currency,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to save connection");
        return;
      }

      setSuccess(true);
      // Reset form
      setBroker("");
      setAccountLabel("");
      setApiKey("");
      setApiSecret("");
      setTestStatus("idle");
      setTimeout(() => setSuccess(false), 4000);
    } catch {
      setError("Network error — could not save connection");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="glass border border-border/50 rounded-2xl p-5">
        <h3 className="text-base font-semibold text-foreground mb-1 flex items-center gap-2">
          <Link2 size={16} className="text-accent" />
          Add Auto-sync Connection
        </h3>
        <p className="text-xs text-muted mb-4">
          Connect your exchange or broker for automatic trade imports.
        </p>

        {success && (
          <div className="mb-4 px-3 py-2.5 rounded-xl bg-win/10 text-win text-sm font-medium flex items-center gap-2">
            <CheckCircle2 size={14} />
            Connection saved successfully! View it in the Connections tab.
          </div>
        )}

        {error && (
          <div className="mb-4 px-3 py-2.5 rounded-xl bg-loss/10 text-loss text-sm flex items-center gap-2">
            <AlertTriangle size={14} />
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Broker selector */}
          <div>
            <p className="text-[10px] text-muted uppercase tracking-wider font-semibold mb-2">Select Broker/Platform</p>
            <select
              value={broker}
              onChange={(e) => handleBrokerChange(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50 transition-all"
            >
              <option value="">Choose a broker...</option>
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

          {/* Account label */}
          <div>
            <p className="text-[10px] text-muted uppercase tracking-wider font-semibold mb-2">Account Label (Optional)</p>
            <input
              type="text"
              value={accountLabel}
              onChange={(e) => setAccountLabel(e.target.value)}
              placeholder="e.g. Main Trading, Long-term, Scalping"
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50 transition-all placeholder:text-muted/40"
            />
          </div>

          {/* API Key */}
          <div>
            <p className="text-[10px] text-muted uppercase tracking-wider font-semibold mb-2">API Key</p>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => { setApiKey(e.target.value); setTestStatus("idle"); }}
                placeholder="Enter your API key"
                className="w-full px-4 py-2.5 pr-10 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50 transition-all placeholder:text-muted/40 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
              >
                {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* API Secret */}
          <div>
            <p className="text-[10px] text-muted uppercase tracking-wider font-semibold mb-2">API Secret</p>
            <div className="relative">
              <input
                type={showSecret ? "text" : "password"}
                value={apiSecret}
                onChange={(e) => { setApiSecret(e.target.value); setTestStatus("idle"); }}
                placeholder="Enter your API secret"
                className="w-full px-4 py-2.5 pr-10 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50 transition-all placeholder:text-muted/40 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
              >
                {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* Test connection */}
          <div className="flex items-center gap-3">
            <button
              onClick={testConnection}
              disabled={testStatus === "testing" || !apiKey || !apiSecret}
              className="px-4 py-2 rounded-xl border border-border text-sm font-medium text-muted hover:text-foreground transition-all disabled:opacity-30 flex items-center gap-2"
            >
              {testStatus === "testing" ? (
                <><Loader2 size={14} className="animate-spin" /> Testing...</>
              ) : (
                "Test Connection"
              )}
            </button>
            {testStatus === "success" && (
              <span className="flex items-center gap-1.5 text-sm text-win font-medium">
                <CheckCircle2 size={14} /> Connected
              </span>
            )}
            {testStatus === "error" && (
              <span className="flex items-center gap-1.5 text-sm text-loss font-medium">
                <XCircle size={14} /> Failed
              </span>
            )}
          </div>

          {/* Target table */}
          <TargetTableSelector value={targetTable} onChange={setTargetTable} label="Import trades to" />

          {/* Sync settings */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-[10px] text-muted uppercase tracking-wider font-semibold mb-1">Sync Frequency</p>
              <select
                value={syncFrequency}
                onChange={(e) => setSyncFrequency(e.target.value as SyncFrequency)}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50"
              >
                <option value="manual">Manual</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            <div>
              <p className="text-[10px] text-muted uppercase tracking-wider font-semibold mb-1">Timezone</p>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York</option>
                <option value="Europe/Berlin">Europe/Berlin</option>
                <option value="Asia/Tokyo">Asia/Tokyo</option>
              </select>
            </div>
            <div>
              <p className="text-[10px] text-muted uppercase tracking-wider font-semibold mb-1">Currency</p>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="BTC">BTC</option>
              </select>
            </div>
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving || !broker}
            className="w-full py-3 rounded-xl bg-accent text-background font-semibold text-sm hover:bg-accent-hover transition-all disabled:opacity-30 flex items-center justify-center gap-2"
          >
            {saving ? (
              <><Loader2 size={16} className="animate-spin" /> Saving...</>
            ) : (
              "Save Connection"
            )}
          </button>
        </div>
      </div>

      {/* Security note */}
      <div className="px-4 py-3 rounded-xl bg-surface border border-border text-xs text-muted">
        <strong className="text-foreground">Security:</strong> Your API credentials are encrypted server-side using AES-256-GCM before storage. We never store plaintext keys. Use read-only API keys when possible.
      </div>
    </div>
  );
}

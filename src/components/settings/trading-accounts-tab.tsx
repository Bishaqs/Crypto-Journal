"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Key,
  Plus,
  Wallet,
  RefreshCw,
  Trash2,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Eye,
  EyeOff,
  Link2,
  Info,
} from "lucide-react";
import { BROKER_INSTRUCTIONS } from "@/components/import-export/broker-instructions-data";
import type { BrokerConnection, SyncResult, TargetTable } from "@/lib/import-export-types";
import type { Chain, Wallet as WalletType } from "@/lib/types";
import { CHAINS } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Trading Accounts Tab — Unified API keys + accounts                 */
/* ------------------------------------------------------------------ */

export function TradingAccountsTab() {
  // ─── Connections state ───
  const [connections, setConnections] = useState<BrokerConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [syncResults, setSyncResults] = useState<Record<string, SyncResult>>({});

  // ─── Add account form state ───
  const [showAdd, setShowAdd] = useState(false);
  const [broker, setBroker] = useState("");
  const [accountLabel, setAccountLabel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [passphrase, setPassphrase] = useState("");
  const [targetTable, setTargetTable] = useState<TargetTable>("trades");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState(false);

  // ─── Wallet state ───
  const [wallets, setWallets] = useState<WalletType[]>([]);
  const [newWallet, setNewWallet] = useState({ address: "", chain: "ethereum" as Chain, label: "" });

  // ─── Fetch connections ───
  const fetchConnections = useCallback(async () => {
    setError("");
    try {
      const res = await fetch("/api/connections");
      if (!res.ok) { setError("Failed to load accounts"); return; }
      const data = await res.json();
      setConnections(data.connections ?? []);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchConnections(); }, [fetchConnections]);

  // Load wallets from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("stargate-wallets");
    if (stored) setWallets(JSON.parse(stored));
  }, []);

  // ─── Sync handler ───
  async function handleSync(id: string) {
    try {
      const res = await fetch(`/api/connections/${id}/sync`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      let result: SyncResult;
      if (res.status === 429) {
        result = { status: "error", message: data.error || "Rate limited — wait 1 minute." };
      } else if (res.status === 401) {
        result = { status: "error", message: "Session expired. Please log in again." };
      } else if (!res.ok) {
        result = { status: "error", message: data.error || "Sync failed." };
      } else {
        const imported = data.trades_imported ?? 0;
        result = imported > 0
          ? { status: "success", message: `${imported} trade${imported !== 1 ? "s" : ""} imported.`, trades_imported: imported }
          : { status: "info", message: data.message || "Sync complete. No new trades." };
        await fetchConnections();
      }
      setSyncResults((prev) => ({ ...prev, [id]: result }));
      setTimeout(() => setSyncResults((prev) => { const next = { ...prev }; delete next[id]; return next; }), 6000);
    } catch {
      const result: SyncResult = { status: "error", message: "Network error during sync." };
      setSyncResults((prev) => ({ ...prev, [id]: result }));
      setTimeout(() => setSyncResults((prev) => { const next = { ...prev }; delete next[id]; return next; }), 6000);
    }
  }

  // ─── Delete handler ───
  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/connections/${id}`, { method: "DELETE" });
      if (res.ok) {
        setConnections((prev) => prev.filter((c) => c.id !== id));
        setSyncResults((prev) => { const next = { ...prev }; delete next[id]; return next; });
      }
    } catch {
      // silent
    }
  }

  // ─── Save new connection ───
  async function handleSave() {
    if (!broker) { setFormError("Select an exchange"); return; }
    if (!apiKey || !apiSecret) { setFormError("API Key and Secret are required"); return; }
    setFormError("");
    setSaving(true);
    try {
      const instruction = BROKER_INSTRUCTIONS.find((b) => b.brokerId === broker);
      const res = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          broker_name: instruction?.brokerName ?? broker,
          broker_type: instruction?.group === "cex" ? "crypto_exchange"
            : instruction?.group === "stocks" ? "stock_broker"
            : instruction?.group === "dex" ? "dex"
            : "forex_broker",
          account_label: accountLabel || null,
          api_key: apiKey,
          api_secret: apiSecret,
          passphrase: passphrase || undefined,
          target_table: targetTable,
          sync_frequency: "manual",
          timezone: "UTC",
          currency: "USD",
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setFormError(data.error || "Failed to save");
        return;
      }
      setFormSuccess(true);
      setBroker(""); setAccountLabel(""); setApiKey(""); setApiSecret(""); setPassphrase("");
      setShowAdd(false);
      await fetchConnections();
      setTimeout(() => setFormSuccess(false), 4000);
    } catch {
      setFormError("Network error — could not save");
    } finally {
      setSaving(false);
    }
  }

  // ─── Wallet helpers ───
  function saveWallets(w: WalletType[]) {
    setWallets(w);
    localStorage.setItem("stargate-wallets", JSON.stringify(w));
  }
  function addWallet() {
    if (!newWallet.address.trim()) return;
    const w: WalletType = {
      id: Date.now().toString(),
      address: newWallet.address.trim(),
      chain: newWallet.chain,
      label: newWallet.label.trim() || "Untitled Wallet",
    };
    saveWallets([...wallets, w]);
    setNewWallet({ address: "", chain: "ethereum", label: "" });
  }

  function handleBrokerChange(brokerId: string) {
    setBroker(brokerId);
    const instruction = BROKER_INSTRUCTIONS.find((b) => b.brokerId === brokerId);
    if (instruction) setTargetTable(instruction.targetTable);
  }

  return (
    <div className="space-y-6">
      {/* ─── Success banner ─── */}
      {formSuccess && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-win/10 border border-win/20 text-win text-sm font-medium">
          <CheckCircle2 size={14} />
          Trading account added successfully!
        </div>
      )}

      {/* ═══ TRADING ACCOUNTS SECTION ═══ */}
      <div className="glass rounded-2xl border border-border/50 p-6 space-y-5" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/10">
              <Key size={18} className="text-accent" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Trading Accounts</h3>
              <p className="text-xs text-muted">Your exchange connections with encrypted API keys.</p>
            </div>
          </div>
          <span className="text-xs text-muted">{connections.length} account{connections.length !== 1 ? "s" : ""}</span>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-8">
            <Loader2 size={24} className="animate-spin text-accent mx-auto mb-2" />
            <p className="text-xs text-muted">Loading accounts...</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="text-center py-8">
            <p className="text-sm text-loss mb-2">{error}</p>
            <button onClick={fetchConnections} className="text-xs text-accent hover:underline">Retry</button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && connections.length === 0 && !showAdd && (
          <div className="text-center py-8">
            <Link2 size={32} className="text-muted/30 mx-auto mb-3" />
            <p className="text-sm text-muted mb-1">No trading accounts yet</p>
            <p className="text-xs text-muted/60">Add your first exchange connection to start importing trades.</p>
          </div>
        )}

        {/* Connection list */}
        {!loading && connections.length > 0 && (
          <div className="space-y-3">
            {connections.map((conn) => (
              <AccountCard
                key={conn.id}
                connection={conn}
                syncResult={syncResults[conn.id]}
                onSync={() => handleSync(conn.id)}
                onDelete={() => handleDelete(conn.id)}
              />
            ))}
          </div>
        )}

        {/* ─── Add account form ─── */}
        {showAdd && (
          <div className="space-y-4 p-4 rounded-xl border border-accent/20 bg-accent/5">
            {formError && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-loss/10 text-loss text-xs">
                <AlertTriangle size={12} /> {formError}
              </div>
            )}

            {/* Account label */}
            <div>
              <label className="block text-xs text-muted mb-1.5 font-medium">Account Name</label>
              <input
                type="text"
                value={accountLabel}
                onChange={(e) => setAccountLabel(e.target.value)}
                placeholder="e.g., Main Trading, Scalping, Long-term"
                className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50 transition-all placeholder-muted/50"
              />
            </div>

            {/* Exchange selector */}
            <div>
              <label className="block text-xs text-muted mb-1.5 font-medium">Exchange</label>
              <select
                value={broker}
                onChange={(e) => handleBrokerChange(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50 transition-all"
              >
                <option value="">Choose an exchange...</option>
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
                <optgroup label="Forex Brokers">
                  {BROKER_INSTRUCTIONS.filter((b) => b.group === "forex").map((b) => (
                    <option key={b.brokerId} value={b.brokerId}>{b.brokerName}</option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* API Key */}
            <div>
              <label className="block text-xs text-muted mb-1.5 font-medium">API Key</label>
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your API key"
                  className="w-full px-4 py-3 pr-10 rounded-xl bg-background border border-border text-foreground text-sm font-mono focus:outline-none focus:border-accent/50 transition-all placeholder-muted/50"
                />
                <button type="button" onClick={() => setShowKey(!showKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors">
                  {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* API Secret */}
            <div>
              <label className="block text-xs text-muted mb-1.5 font-medium">API Secret</label>
              <div className="relative">
                <input
                  type={showSecret ? "text" : "password"}
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
                  placeholder="Enter your API secret"
                  className="w-full px-4 py-3 pr-10 rounded-xl bg-background border border-border text-foreground text-sm font-mono focus:outline-none focus:border-accent/50 transition-all placeholder-muted/50"
                />
                <button type="button" onClick={() => setShowSecret(!showSecret)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors">
                  {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Passphrase (Bitget) */}
            {broker === "bitget" && (
              <div>
                <label className="block text-xs text-muted mb-1.5 font-medium">API Passphrase</label>
                <input
                  type="password"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  placeholder="Enter the passphrase you set when creating the API key"
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm font-mono focus:outline-none focus:border-accent/50 transition-all placeholder-muted/50"
                />
                <p className="text-[10px] text-muted mt-1">Required for Bitget — this is the passphrase you chose during API key creation.</p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving || !broker}
                className="flex-1 py-3 rounded-xl bg-accent text-background font-semibold text-sm hover:bg-accent-hover transition-all disabled:opacity-30 flex items-center justify-center gap-2"
              >
                {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : "Save Account"}
              </button>
              <button
                onClick={() => { setShowAdd(false); setFormError(""); }}
                className="px-4 py-3 rounded-xl bg-surface-hover border border-border text-sm text-muted hover:text-foreground transition-all"
              >
                Cancel
              </button>
            </div>

            <div className="flex items-start gap-2 p-3 rounded-xl bg-accent/5 border border-accent/10">
              <Info size={14} className="text-accent mt-0.5 shrink-0" />
              <p className="text-xs text-muted leading-relaxed">
                Credentials are encrypted server-side (AES-256) before storage. Use <strong className="text-foreground">read-only</strong> API keys when possible.
              </p>
            </div>
          </div>
        )}

        {/* Add button */}
        {!showAdd && !loading && (
          <button
            onClick={() => setShowAdd(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border text-sm text-muted hover:text-accent hover:border-accent/30 transition-all"
          >
            <Plus size={16} />
            Add Trading Account
          </button>
        )}
      </div>

      {/* ═══ WALLETS SECTION ═══ */}
      <div className="glass rounded-2xl border border-border/50 p-6 space-y-5" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-accent/10">
            <Wallet size={18} className="text-accent" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">Wallets</h3>
            <p className="text-xs text-muted">Track your on-chain wallets for DEX trade logging.</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-muted mb-1.5 font-medium">Wallet Address</label>
            <input
              type="text"
              value={newWallet.address}
              onChange={(e) => setNewWallet({ ...newWallet, address: e.target.value })}
              placeholder="0x... or So1..."
              className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm font-mono focus:outline-none focus:border-accent/50 transition-all placeholder-muted/50"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1.5 font-medium">Chain</label>
            <select
              value={newWallet.chain}
              onChange={(e) => setNewWallet({ ...newWallet, chain: e.target.value as Chain })}
              className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50 transition-all"
            >
              {CHAINS.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted mb-1.5 font-medium">Label</label>
            <input
              type="text"
              value={newWallet.label}
              onChange={(e) => setNewWallet({ ...newWallet, label: e.target.value })}
              placeholder="Main Trading Wallet"
              className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50 transition-all placeholder-muted/50"
            />
          </div>
          <button
            onClick={addWallet}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent text-background text-sm font-semibold hover:bg-accent-hover transition-all"
          >
            <Plus size={14} />
            Add Wallet
          </button>
        </div>

        {wallets.length > 0 && (
          <div className="space-y-2 mt-4">
            {wallets.map((w) => (
              <div key={w.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-background border border-border">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{w.label}</p>
                  <p className="text-[10px] text-muted font-mono truncate">{w.address}</p>
                  <p className="text-[10px] text-accent">{CHAINS.find((c) => c.id === w.chain)?.label ?? w.chain}</p>
                </div>
                <button
                  onClick={() => saveWallets(wallets.filter((ww) => ww.id !== w.id))}
                  className="ml-3 p-1.5 rounded-lg text-muted hover:text-loss hover:bg-loss/10 transition-all shrink-0"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-start gap-2 p-3 rounded-xl bg-accent/5 border border-accent/10 mt-3">
          <Info size={14} className="text-accent mt-0.5 shrink-0" />
          <p className="text-xs text-muted leading-relaxed">
            Wallet scanning coming soon — for now, log DEX trades manually with the CEX/DEX toggle.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Account Card — inline in this file for simplicity                  */
/* ------------------------------------------------------------------ */

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-yellow-500/10 text-yellow-400" },
  active: { label: "Active", className: "bg-win/10 text-win" },
  error: { label: "Error", className: "bg-loss/10 text-loss" },
  paused: { label: "Paused", className: "bg-muted/10 text-muted" },
  disconnected: { label: "Disconnected", className: "bg-loss/10 text-loss" },
};

function AccountCard({
  connection,
  syncResult,
  onSync,
  onDelete,
}: {
  connection: BrokerConnection;
  syncResult?: SyncResult;
  onSync: () => void;
  onDelete: () => void;
}) {
  const [syncing, setSyncing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const status = STATUS_CONFIG[connection.status] ?? STATUS_CONFIG.pending;

  async function handleSync() {
    setSyncing(true);
    try { await onSync(); } finally { setSyncing(false); }
  }

  function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    onDelete();
    setConfirmDelete(false);
  }

  return (
    <div className="flex items-start justify-between gap-3 px-4 py-3 rounded-xl bg-background border border-border">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h4 className="text-sm font-semibold text-foreground truncate">
            {connection.account_label || connection.broker_name}
          </h4>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${status.className}`}>
            {status.label}
          </span>
        </div>

        {connection.account_label && (
          <p className="text-[10px] text-muted">{connection.broker_name}</p>
        )}

        <div className="flex items-center gap-4 text-xs text-muted mt-1.5">
          <span>{connection.total_trades_synced} trades</span>
          {connection.last_sync_at && (
            <span className="flex items-center gap-1">
              <Clock size={10} />
              {new Date(connection.last_sync_at).toLocaleDateString()}
            </span>
          )}
          {connection.api_key_last4 && (
            <span className="font-mono">***{connection.api_key_last4}</span>
          )}
        </div>

        {connection.last_error && (
          <p className="flex items-center gap-1 text-xs text-loss mt-1.5">
            <AlertTriangle size={10} /> {connection.last_error}
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
          className={`p-2 rounded-lg border transition-all ${
            confirmDelete
              ? "border-loss/50 bg-loss/10 text-loss"
              : "border-border text-muted hover:text-loss hover:border-loss/30"
          }`}
          title={confirmDelete ? "Click again to confirm" : "Delete"}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

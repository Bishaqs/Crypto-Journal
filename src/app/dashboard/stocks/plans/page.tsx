"use client";

import { useState } from "react";
import {
  Eye,
  Plus,
  X,
  TrendingUp,
  TrendingDown,
  Target,
  Bell,
  Star,
  Trash2,
} from "lucide-react";
import { Header } from "@/components/header";
import { STOCK_SECTORS } from "@/lib/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type WatchlistItem = {
  id: string;
  symbol: string;
  name: string;
  sector: string;
  targetBuy: string;
  targetSell: string;
  notes: string;
  alert: boolean;
  starred: boolean;
  addedAt: string;
};

const STORAGE_KEY = "stargate-stock-watchlist";

function loadWatchlist(): WatchlistItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveWatchlist(items: WatchlistItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function StockWatchlistPage() {
  const [items, setItems] = useState<WatchlistItem[]>(loadWatchlist);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<"all" | "starred">("all");

  // Form state
  const [symbol, setSymbol] = useState("");
  const [name, setName] = useState("");
  const [sector, setSector] = useState("");
  const [targetBuy, setTargetBuy] = useState("");
  const [targetSell, setTargetSell] = useState("");
  const [notes, setNotes] = useState("");

  const filtered = filter === "starred" ? items.filter((i) => i.starred) : items;

  function addItem() {
    if (!symbol.trim()) return;
    const newItem: WatchlistItem = {
      id: crypto.randomUUID(),
      symbol: symbol.toUpperCase().trim(),
      name: name.trim(),
      sector,
      targetBuy: targetBuy.trim(),
      targetSell: targetSell.trim(),
      notes: notes.trim(),
      alert: false,
      starred: false,
      addedAt: new Date().toISOString(),
    };
    const updated = [newItem, ...items];
    setItems(updated);
    saveWatchlist(updated);
    resetForm();
  }

  function removeItem(id: string) {
    const updated = items.filter((i) => i.id !== id);
    setItems(updated);
    saveWatchlist(updated);
  }

  function toggleStar(id: string) {
    const updated = items.map((i) => (i.id === id ? { ...i, starred: !i.starred } : i));
    setItems(updated);
    saveWatchlist(updated);
  }

  function toggleAlert(id: string) {
    const updated = items.map((i) => (i.id === id ? { ...i, alert: !i.alert } : i));
    setItems(updated);
    saveWatchlist(updated);
  }

  function resetForm() {
    setSymbol("");
    setName("");
    setSector("");
    setTargetBuy("");
    setTargetSell("");
    setNotes("");
    setShowForm(false);
  }

  return (
    <div className="space-y-6 mx-auto max-w-[1600px]">
      <Header />

      {/* Title + Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Eye size={24} className="text-accent" />
            Watchlist
          </h2>
          <p className="text-sm text-muted mt-0.5">
            Stocks you&apos;re watching — set targets and track opportunities
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-background font-semibold text-sm hover:bg-accent-hover transition-all"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? "Cancel" : "Add Symbol"}
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div
          className="glass rounded-2xl border border-border/50 p-6 space-y-4"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-muted font-semibold mb-1.5">
                Symbol *
              </label>
              <input
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="AAPL"
                className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-muted font-semibold mb-1.5">
                Company
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Apple Inc."
                className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-muted font-semibold mb-1.5">
                Target Buy
              </label>
              <input
                value={targetBuy}
                onChange={(e) => setTargetBuy(e.target.value)}
                placeholder="$150.00"
                className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-muted font-semibold mb-1.5">
                Target Sell
              </label>
              <input
                value={targetSell}
                onChange={(e) => setTargetSell(e.target.value)}
                placeholder="$180.00"
                className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-muted font-semibold mb-1.5">
                Sector
              </label>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50"
              >
                <option value="">Select sector...</option>
                {STOCK_SECTORS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-muted font-semibold mb-1.5">
                Notes
              </label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Earnings next week, good dip buy..."
                className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50"
              />
            </div>
          </div>
          <button
            onClick={addItem}
            disabled={!symbol.trim()}
            className="px-6 py-2.5 rounded-xl bg-accent text-background font-semibold text-sm hover:bg-accent-hover transition-all disabled:opacity-40"
          >
            Add to Watchlist
          </button>
        </div>
      )}

      {/* Filter pills */}
      <div className="flex items-center gap-2">
        {(["all", "starred"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === f
                ? "bg-accent/10 text-accent border border-accent/30"
                : "text-muted hover:text-foreground"
            }`}
          >
            {f === "all" ? `All (${items.length})` : `Starred (${items.filter((i) => i.starred).length})`}
          </button>
        ))}
      </div>

      {/* Watchlist Grid */}
      {filtered.length === 0 ? (
        <div className="glass rounded-2xl border border-border/50 p-12 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
          <Eye size={48} className="text-muted/30 mx-auto mb-4" />
          <p className="text-muted text-sm">
            {filter === "starred" ? "No starred symbols yet." : "Your watchlist is empty. Add symbols to start tracking."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="glass rounded-2xl border border-border/50 p-5 space-y-3 group"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-foreground">{item.symbol}</span>
                  {item.sector && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-semibold">
                      {item.sector}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => toggleStar(item.id)} className="p-1 rounded-lg hover:bg-surface-hover">
                    <Star size={14} className={item.starred ? "text-yellow-400 fill-yellow-400" : "text-muted"} />
                  </button>
                  <button onClick={() => toggleAlert(item.id)} className="p-1 rounded-lg hover:bg-surface-hover">
                    <Bell size={14} className={item.alert ? "text-accent fill-accent" : "text-muted"} />
                  </button>
                  <button onClick={() => removeItem(item.id)} className="p-1 rounded-lg hover:bg-loss/10">
                    <Trash2 size={14} className="text-muted hover:text-loss" />
                  </button>
                </div>
              </div>

              {item.name && (
                <p className="text-xs text-muted -mt-1">{item.name}</p>
              )}

              {/* Targets */}
              {(item.targetBuy || item.targetSell) && (
                <div className="flex items-center gap-4">
                  {item.targetBuy && (
                    <div className="flex items-center gap-1.5">
                      <TrendingDown size={12} className="text-win" />
                      <span className="text-xs text-muted">Buy:</span>
                      <span className="text-xs font-semibold text-win">{item.targetBuy}</span>
                    </div>
                  )}
                  {item.targetSell && (
                    <div className="flex items-center gap-1.5">
                      <TrendingUp size={12} className="text-accent" />
                      <span className="text-xs text-muted">Sell:</span>
                      <span className="text-xs font-semibold text-accent">{item.targetSell}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              {item.notes && (
                <p className="text-xs text-muted bg-background/50 rounded-lg p-2 border border-border/30">
                  {item.notes}
                </p>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-muted/50">
                  Added {new Date(item.addedAt).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-1">
                  {item.starred && <Star size={10} className="text-yellow-400 fill-yellow-400" />}
                  {item.alert && <Bell size={10} className="text-accent" />}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import {
  Eye,
  Plus,
  X,
  Star,
  Trash2,
  DollarSign,
} from "lucide-react";
import { Header } from "@/components/header";
import { FOREX_PAIRS } from "@/lib/types";
import { InfoTooltip } from "@/components/ui/info-tooltip";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type WatchlistItem = {
  id: string;
  pair: string;
  category: string;
  targetBuy: string;
  targetSell: string;
  notes: string;
  starred: boolean;
  addedAt: string;
};

const STORAGE_KEY = "stargate-forex-watchlist";

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

// Detect pair category
function getPairCategory(pair: string): string {
  if (FOREX_PAIRS.major.includes(pair)) return "major";
  if (FOREX_PAIRS.minor.includes(pair)) return "minor";
  if (FOREX_PAIRS.exotic.includes(pair)) return "exotic";
  return "";
}

const CATEGORY_LABELS: Record<string, string> = {
  major: "Major", minor: "Minor", exotic: "Exotic",
};

// Flatten all pairs
const ALL_PAIRS = [...FOREX_PAIRS.major, ...FOREX_PAIRS.minor, ...FOREX_PAIRS.exotic];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ForexWatchlistPage() {
  const [items, setItems] = useState<WatchlistItem[]>(loadWatchlist);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<"all" | "starred">("all");

  // Form state
  const [pair, setPair] = useState("");
  const [targetBuy, setTargetBuy] = useState("");
  const [targetSell, setTargetSell] = useState("");
  const [notes, setNotes] = useState("");

  const filtered = filter === "starred" ? items.filter((i) => i.starred) : items;

  function addItem() {
    if (!pair) return;
    const newItem: WatchlistItem = {
      id: crypto.randomUUID(),
      pair,
      category: getPairCategory(pair),
      targetBuy: targetBuy.trim(),
      targetSell: targetSell.trim(),
      notes: notes.trim(),
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

  function resetForm() {
    setPair("");
    setTargetBuy("");
    setTargetSell("");
    setNotes("");
    setShowForm(false);
  }

  return (
    <div className="space-y-6 mx-auto max-w-[1600px]">
      <Header />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Eye size={24} className="text-accent" />
            Forex Watchlist
            <InfoTooltip text="Track currency pairs with price targets and notes" articleId="tj-trade-plans" />
          </h2>
          <p className="text-sm text-muted mt-0.5">
            Pairs you&apos;re watching — set targets and track opportunities
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-background font-semibold text-sm hover:bg-accent-hover transition-all"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? "Cancel" : "Add Pair"}
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="glass rounded-2xl border border-border/50 p-6 space-y-4" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-muted font-semibold mb-1.5">Pair *</label>
              <select
                value={pair}
                onChange={(e) => setPair(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50"
              >
                <option value="">Select...</option>
                <optgroup label="Major">
                  {FOREX_PAIRS.major.map((p) => <option key={p} value={p}>{p}</option>)}
                </optgroup>
                <optgroup label="Minor">
                  {FOREX_PAIRS.minor.map((p) => <option key={p} value={p}>{p}</option>)}
                </optgroup>
                <optgroup label="Exotic">
                  {FOREX_PAIRS.exotic.map((p) => <option key={p} value={p}>{p}</option>)}
                </optgroup>
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-muted font-semibold mb-1.5">Target Buy</label>
              <input value={targetBuy} onChange={(e) => setTargetBuy(e.target.value)} placeholder="1.0800"
                className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50" />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-muted font-semibold mb-1.5">Target Sell</label>
              <input value={targetSell} onChange={(e) => setTargetSell(e.target.value)} placeholder="1.1000"
                className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50" />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-muted font-semibold mb-1.5">Notes</label>
              <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Watching for ECB decision..."
                className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50" />
            </div>
          </div>
          <button onClick={addItem} disabled={!pair}
            className="px-6 py-2.5 rounded-xl bg-accent text-background font-semibold text-sm hover:bg-accent-hover transition-all disabled:opacity-40">
            Add to Watchlist
          </button>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-2">
        {(["all", "starred"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === f ? "bg-accent/10 text-accent border border-accent/30" : "text-muted hover:text-foreground"
            }`}>
            {f === "all" ? `All (${items.length})` : `Starred (${items.filter((i) => i.starred).length})`}
          </button>
        ))}
      </div>

      {/* Watchlist Grid */}
      {filtered.length === 0 ? (
        <div className="glass rounded-2xl border border-border/50 p-12 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
          <DollarSign size={48} className="text-muted/30 mx-auto mb-4" />
          <p className="text-muted text-sm">
            {filter === "starred" ? "No starred pairs yet." : "Your watchlist is empty. Add pairs to start tracking."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <div key={item.id} className="glass rounded-2xl border border-border/50 p-5 space-y-2"
              style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-foreground">{item.pair}</span>
                  {item.category && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-semibold">
                      {CATEGORY_LABELS[item.category] ?? item.category}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => toggleStar(item.id)} className="p-1 rounded-lg hover:bg-surface-hover">
                    <Star size={14} className={item.starred ? "text-yellow-400 fill-yellow-400" : "text-muted"} />
                  </button>
                  <button onClick={() => removeItem(item.id)} className="p-1 rounded-lg hover:bg-loss/10">
                    <Trash2 size={14} className="text-muted hover:text-loss" />
                  </button>
                </div>
              </div>
              {(item.targetBuy || item.targetSell) && (
                <div className="flex items-center gap-4 text-xs">
                  {item.targetBuy && <span className="text-win">Buy: {item.targetBuy}</span>}
                  {item.targetSell && <span className="text-accent">Sell: {item.targetSell}</span>}
                </div>
              )}
              {item.notes && (
                <p className="text-xs text-muted bg-background/50 rounded-lg p-2 border border-border/30">{item.notes}</p>
              )}
              <span className="text-[10px] text-muted/50">Added {new Date(item.addedAt).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

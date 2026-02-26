"use client";

import { useState, useEffect, useRef } from "react";
import {
  Eye,
  Plus,
  X,
  TrendingUp,
  TrendingDown,
  Bell,
  Star,
  Trash2,
  BarChart2,
  ChevronDown,
  ChevronUp,
  Settings2,
} from "lucide-react";
import { Header } from "@/components/header";
import { STOCK_SECTORS } from "@/lib/types";
import { useTheme } from "@/lib/theme-context";
import { PageInfoButton } from "@/components/ui/page-info-button";
import { usePageTour } from "@/lib/use-page-tour";

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
// TradingView Widgets
// ---------------------------------------------------------------------------

function TradingViewMiniChart({ symbol, colorTheme }: { symbol: string; colorTheme: "dark" | "light" }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.innerHTML = "";

    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    el.appendChild(widgetDiv);

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";
    script.async = true;
    script.textContent = JSON.stringify({
      symbol: symbol.includes(":") ? symbol : `NASDAQ:${symbol}`,
      width: "100%",
      height: 200,
      locale: "en",
      dateRange: "1M",
      colorTheme,
      isTransparent: true,
      autosize: false,
      largeChartUrl: "",
      trendLineColor: "rgba(139, 92, 246, 1)",
      underLineColor: "rgba(139, 92, 246, 0.1)",
      underLineBottomColor: "rgba(139, 92, 246, 0)",
    });
    el.appendChild(script);

    return () => { el.innerHTML = ""; };
  }, [symbol, colorTheme]);

  return <div ref={containerRef} className="tradingview-widget-container rounded-xl overflow-hidden" />;
}

function TradingViewTickerTape({ colorTheme }: { colorTheme: "dark" | "light" }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.innerHTML = "";

    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    el.appendChild(widgetDiv);

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
    script.async = true;
    script.textContent = JSON.stringify({
      symbols: [
        { proName: "FOREXCOM:SPXUSD", title: "S&P 500" },
        { proName: "NASDAQ:AAPL", title: "Apple" },
        { proName: "NASDAQ:NVDA", title: "NVIDIA" },
        { proName: "NASDAQ:MSFT", title: "Microsoft" },
        { proName: "NASDAQ:TSLA", title: "Tesla" },
        { proName: "NASDAQ:AMZN", title: "Amazon" },
        { proName: "NASDAQ:GOOGL", title: "Alphabet" },
        { proName: "NASDAQ:META", title: "Meta" },
      ],
      showSymbolLogo: true,
      isTransparent: true,
      displayMode: "adaptive",
      colorTheme,
      locale: "en",
    });
    el.appendChild(script);

    return () => { el.innerHTML = ""; };
  }, [colorTheme]);

  return <div ref={containerRef} className="tradingview-widget-container rounded-xl overflow-hidden" />;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function StockWatchlistPage() {
  usePageTour("stocks-watchlist-page");
  const { theme } = useTheme();
  const tvColorTheme = theme === "light" ? "light" : "dark";
  const [items, setItems] = useState<WatchlistItem[]>(loadWatchlist);
  const [showForm, setShowForm] = useState(false);
  const [showFormAdvanced, setShowFormAdvanced] = useState(false);
  const [filter, setFilter] = useState<"all" | "starred">("all");
  const [openCharts, setOpenCharts] = useState<Set<string>>(new Set());
  const [openDetails, setOpenDetails] = useState<Set<string>>(new Set());

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

  function toggleChart(id: string) {
    setOpenCharts((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleDetails(id: string) {
    setOpenDetails((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function resetForm() {
    setSymbol("");
    setName("");
    setSector("");
    setTargetBuy("");
    setTargetSell("");
    setNotes("");
    setShowForm(false);
    setShowFormAdvanced(false);
  }

  return (
    <div className="space-y-6 mx-auto max-w-[1600px]">
      <Header />

      {/* Ticker Tape */}
      <TradingViewTickerTape colorTheme={tvColorTheme} />

      {/* Title + Actions */}
      <div id="tour-watchlist-header" className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Eye size={24} className="text-accent" />
            Watchlist
            <PageInfoButton tourName="stocks-watchlist-page" />
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
        <div className="glass rounded-2xl border border-border/50 p-6 space-y-4" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-muted font-semibold mb-1.5">Symbol *</label>
              <input value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="AAPL"
                className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50" />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-muted font-semibold mb-1.5">Company</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Apple Inc."
                className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50" />
            </div>
          </div>

          {/* Advanced fields toggle */}
          <button onClick={() => setShowFormAdvanced(!showFormAdvanced)}
            className="flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors">
            <Settings2 size={12} />
            {showFormAdvanced ? "Less options" : "More options"}
            {showFormAdvanced ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>

          {showFormAdvanced && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-muted font-semibold mb-1.5">Target Buy</label>
                  <input value={targetBuy} onChange={(e) => setTargetBuy(e.target.value)} placeholder="$150.00"
                    className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-muted font-semibold mb-1.5">Target Sell</label>
                  <input value={targetSell} onChange={(e) => setTargetSell(e.target.value)} placeholder="$180.00"
                    className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-muted font-semibold mb-1.5">Sector</label>
                  <select value={sector} onChange={(e) => setSector(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50">
                    <option value="">Select...</option>
                    {STOCK_SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-muted font-semibold mb-1.5">Notes</label>
                  <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Earnings next week..."
                    className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50" />
                </div>
              </div>
            </div>
          )}

          <button onClick={addItem} disabled={!symbol.trim()}
            className="px-6 py-2.5 rounded-xl bg-accent text-background font-semibold text-sm hover:bg-accent-hover transition-all disabled:opacity-40">
            Add to Watchlist
          </button>
        </div>
      )}

      {/* Filter pills */}
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
          <Eye size={48} className="text-muted/30 mx-auto mb-4" />
          <p className="text-muted text-sm">
            {filter === "starred" ? "No starred symbols yet." : "Your watchlist is empty. Add symbols to start tracking."}
          </p>
        </div>
      ) : (
        <div id="tour-watchlist-cards" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => {
            const chartOpen = openCharts.has(item.id);
            const detailsOpen = openDetails.has(item.id);
            return (
              <div key={item.id} className="glass rounded-2xl border border-border/50 p-5 space-y-2 group"
                style={{ boxShadow: "var(--shadow-card)" }}>
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-foreground">{item.symbol}</span>
                    {item.sector && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-semibold">{item.sector}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => toggleChart(item.id)} className="p-1 rounded-lg hover:bg-surface-hover" title="Toggle chart">
                      <BarChart2 size={14} className={chartOpen ? "text-accent" : "text-muted"} />
                    </button>
                    <button onClick={() => toggleDetails(item.id)} className="p-1 rounded-lg hover:bg-surface-hover" title="Toggle details">
                      {detailsOpen ? <ChevronUp size={14} className="text-accent" /> : <ChevronDown size={14} className="text-muted" />}
                    </button>
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

                {item.name && <p className="text-xs text-muted">{item.name}</p>}

                {/* Expandable Chart */}
                {chartOpen && <TradingViewMiniChart symbol={item.symbol} colorTheme={tvColorTheme} />}

                {/* Expandable Details */}
                {detailsOpen && (
                  <div className="space-y-2 pt-1 border-t border-border/30">
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
                    {item.notes && (
                      <p className="text-xs text-muted bg-background/50 rounded-lg p-2 border border-border/30">{item.notes}</p>
                    )}
                    {!item.targetBuy && !item.targetSell && !item.notes && (
                      <p className="text-xs text-muted/50 italic">No targets or notes set.</p>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-muted/50">Added {new Date(item.addedAt).toLocaleDateString()}</span>
                  <div className="flex items-center gap-1">
                    {item.starred && <Star size={10} className="text-yellow-400 fill-yellow-400" />}
                    {item.alert && <Bell size={10} className="text-accent" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

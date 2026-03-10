"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/lib/theme-context";
import {
  Table2,
  Search,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Plus,
  X,
  Filter,
} from "lucide-react";
import { Header } from "@/components/header";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { formatDuration, getReturnPct, calculateRMultiple, formatRMultiple, getTotalCommitment, getQuarterLabel, calculateTradeMAE, calculateTradeMFE, getMfeMaeRatio, getPriceMfePct, calculateBestExitPnl, calculateExitEfficiency, calculateBestExitR } from "@/lib/calculations";
import type { CommodityTrade } from "@/lib/types";
import { CommodityTradeForm } from "@/components/commodity-trade-form";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_COMMODITY_TRADES: CommodityTrade[] = [
  {
    id: "ct-1", user_id: "u1", symbol: "GC", commodity_name: "Gold",
    commodity_category: "metals", contract_type: "futures", position: "long",
    entry_price: 2340.50, exit_price: 2368.20, quantity: 2,
    contract_size: 100, tick_size: 0.10, tick_value: 10,
    fees: 12, open_timestamp: "2026-02-20T09:00:00Z",
    close_timestamp: "2026-02-20T14:30:00Z", exchange: "COMEX",
    contract_month: "2026-04", expiration_date: "2026-04-28",
    margin_required: 11000, option_type: null, strike_price: null,
    premium_per_contract: null, underlying_contract: null,
    emotion: "Confident", confidence: 8, setup_type: "Trend Follow",
    process_score: 9, checklist: null, review: null,
    notes: "Gold breaking above resistance.", tags: ["momentum", "metals"],
    stop_loss: 2325.00, profit_target: 2375.00, pnl: 5528, price_mae: null, price_mfe: null, mfe_timestamp: null, created_at: "2026-02-20T09:00:00Z",
  },
  {
    id: "ct-2", user_id: "u1", symbol: "CL", commodity_name: "Crude Oil (WTI)",
    commodity_category: "energy", contract_type: "futures", position: "short",
    entry_price: 78.45, exit_price: 76.20, quantity: 3,
    contract_size: 1000, tick_size: 0.01, tick_value: 10,
    fees: 18, open_timestamp: "2026-02-19T08:30:00Z",
    close_timestamp: "2026-02-19T15:00:00Z", exchange: "NYMEX",
    contract_month: "2026-03", expiration_date: "2026-03-20",
    margin_required: 6500, option_type: null, strike_price: null,
    premium_per_contract: null, underlying_contract: null,
    emotion: "Calm", confidence: 7, setup_type: "Breakout",
    process_score: 8, checklist: null, review: null,
    notes: "Short crude on inventory build.", tags: ["energy", "news"],
    stop_loss: null, profit_target: null, pnl: 6732, price_mae: null, price_mfe: null, mfe_timestamp: null, created_at: "2026-02-19T08:30:00Z",
  },
  {
    id: "ct-3", user_id: "u1", symbol: "ZW", commodity_name: "Wheat",
    commodity_category: "grains", contract_type: "futures", position: "long",
    entry_price: 625.50, exit_price: 618.00, quantity: 1,
    contract_size: 5000, tick_size: 0.25, tick_value: 12.50,
    fees: 6, open_timestamp: "2026-02-18T10:00:00Z",
    close_timestamp: "2026-02-18T14:00:00Z", exchange: "CBOT",
    contract_month: "2026-05", expiration_date: "2026-05-14",
    margin_required: 1800, option_type: null, strike_price: null,
    premium_per_contract: null, underlying_contract: null,
    emotion: "Anxious", confidence: 5, setup_type: "Reversal",
    process_score: 4, checklist: null, review: null,
    notes: "Wheat reversal, stopped out.", tags: ["grains"],
    stop_loss: null, profit_target: null, pnl: -381, price_mae: null, price_mfe: null, mfe_timestamp: null, created_at: "2026-02-18T10:00:00Z",
  },
  {
    id: "ct-4", user_id: "u1", symbol: "NG", commodity_name: "Natural Gas",
    commodity_category: "energy", contract_type: "futures", position: "long",
    entry_price: 2.85, exit_price: 3.12, quantity: 5,
    contract_size: 10000, tick_size: 0.001, tick_value: 10,
    fees: 25, open_timestamp: "2026-02-17T09:30:00Z",
    close_timestamp: "2026-02-18T11:00:00Z", exchange: "NYMEX",
    contract_month: "2026-03", expiration_date: "2026-03-26",
    margin_required: 3200, option_type: null, strike_price: null,
    premium_per_contract: null, underlying_contract: null,
    emotion: "Excited", confidence: 7, setup_type: "News",
    process_score: 7, checklist: null, review: null,
    notes: "Cold weather forecast driving nat gas.", tags: ["energy", "weather"],
    stop_loss: null, profit_target: null, pnl: 13475, price_mae: null, price_mfe: null, mfe_timestamp: null, created_at: "2026-02-17T09:30:00Z",
  },
  {
    id: "ct-5", user_id: "u1", symbol: "ZC", commodity_name: "Corn",
    commodity_category: "grains", contract_type: "futures", position: "short",
    entry_price: 458.00, exit_price: null, quantity: 2,
    contract_size: 5000, tick_size: 0.25, tick_value: 12.50,
    fees: 8, open_timestamp: "2026-02-21T10:00:00Z",
    close_timestamp: null, exchange: "CBOT",
    contract_month: "2026-05", expiration_date: "2026-05-14",
    margin_required: 1500, option_type: null, strike_price: null,
    premium_per_contract: null, underlying_contract: null,
    emotion: "Confident", confidence: 7, setup_type: "Breakdown",
    process_score: null, checklist: null, review: null,
    notes: "Short corn on weak demand.", tags: ["grains", "swing"],
    stop_loss: null, profit_target: null, pnl: null, price_mae: null, price_mfe: null, mfe_timestamp: null, created_at: "2026-02-21T10:00:00Z",
  },
];

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORY_OPTIONS = ["All", "metals", "energy", "grains", "softs", "livestock"];
const EXCHANGE_OPTIONS = ["All", "COMEX", "NYMEX", "CBOT", "ICE", "CME"];

const CATEGORY_LABELS: Record<string, string> = {
  metals: "Metals", energy: "Energy", grains: "Grains", softs: "Softs", livestock: "Livestock",
};

type SortKey = "date" | "symbol" | "pnl" | "category" | "exchange";
type SortDir = "asc" | "desc";

const COMMODITY_COLUMNS: { key: SortKey | null; label: string; simple?: boolean }[] = [
  { key: "date", label: "Date", simple: true },
  { key: "symbol", label: "Symbol", simple: true },
  { key: "category", label: "Category" },
  { key: null, label: "Contract" },
  { key: "exchange", label: "Exchange" },
  { key: null, label: "Entry", simple: true },
  { key: null, label: "Exit", simple: true },
  { key: null, label: "Duration" },
  { key: null, label: "Return" },
  { key: null, label: "SL" },
  { key: null, label: "TP" },
  { key: null, label: "R" },
  { key: "pnl", label: "P&L", simple: true },
  { key: null, label: "Tags" },
  { key: null, label: "Emotion" },
  { key: null, label: "Process" },
  { key: null, label: "Notes" },
  { key: null, label: "Commit" },
  { key: null, label: "Quarter" },
  { key: null, label: "MAE $" },
  { key: null, label: "MFE $" },
  { key: null, label: "Pr. MAE" },
  { key: null, label: "Pr. MFE" },
  { key: null, label: "MFE/MAE" },
  { key: null, label: "MFE %" },
  { key: null, label: "Best Exit" },
  { key: null, label: "Effic." },
  { key: null, label: "Best R" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CommodityTradesPage() {
  const router = useRouter();
  const { viewMode } = useTheme();
  const supabase = createClient();
  const [trades, setTrades] = useState<CommodityTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingDemo, setUsingDemo] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [exchangeFilter, setExchangeFilter] = useState("All");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const visibleColumns = viewMode === "simple"
    ? COMMODITY_COLUMNS.filter((c) => c.simple)
    : COMMODITY_COLUMNS;
  const visibleLabels = new Set(visibleColumns.map((c) => c.label));

  useEffect(() => {
    if (sortKey === "date") return;
    const col = COMMODITY_COLUMNS.find((c) => c.key === sortKey);
    if (col && !visibleLabels.has(col.label)) {
      setSortKey("date");
    }
  }, [viewMode]);

  const fetchTrades = useCallback(async () => {
    const { data, error } = await supabase
      .from("commodity_trades")
      .select("*")
      .order("open_timestamp", { ascending: false });
    if (error) {
      console.error("[CommodityTrades] fetchTrades error:", error.message);
      setLoading(false);
      return;
    }
    const dbTrades = (data as CommodityTrade[]) ?? [];
    if (dbTrades.length === 0) {
      setTrades(MOCK_COMMODITY_TRADES);
      setUsingDemo(true);
    } else {
      setTrades(dbTrades);
      setUsingDemo(false);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  const filtered = useMemo(() => {
    let result = trades;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.symbol.toLowerCase().includes(q) ||
          t.commodity_name?.toLowerCase().includes(q) ||
          t.notes?.toLowerCase().includes(q) ||
          t.tags?.some((tag) => tag.toLowerCase().includes(q))
      );
    }

    if (categoryFilter !== "All") {
      result = result.filter((t) => t.commodity_category === categoryFilter);
    }

    if (exchangeFilter !== "All") {
      result = result.filter((t) => t.exchange === exchangeFilter);
    }

    result = [...result].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      switch (sortKey) {
        case "date": return dir * a.open_timestamp.localeCompare(b.open_timestamp);
        case "symbol": return dir * a.symbol.localeCompare(b.symbol);
        case "pnl": return dir * ((a.pnl ?? 0) - (b.pnl ?? 0));
        case "category": return dir * ((a.commodity_category ?? "").localeCompare(b.commodity_category ?? ""));
        case "exchange": return dir * ((a.exchange ?? "").localeCompare(b.exchange ?? ""));
        default: return 0;
      }
    });

    return result;
  }, [trades, search, categoryFilter, exchangeFilter, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ArrowUpDown size={12} className="text-muted/40" />;
    return sortDir === "asc" ? (
      <ChevronUp size={12} className="text-accent" />
    ) : (
      <ChevronDown size={12} className="text-accent" />
    );
  }

  return (
    <div className="space-y-6 mx-auto max-w-[1600px]">
      <Header />

      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Table2 size={24} className="text-accent" />
            Commodity Trade Log
            <InfoTooltip text="Complete log of your commodity trades — filter, sort, and review" />
          </h2>
          <p className="text-sm text-muted mt-0.5">
            {filtered.length} of {trades.length} trades
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-background font-semibold text-sm hover:bg-accent-hover transition-all duration-300"
        >
          <Plus size={18} />
          Add Trade
        </button>
      </div>

      {/* Trade Form Modal */}
      {showForm && (
        <CommodityTradeForm
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); fetchTrades(); }}
        />
      )}

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search symbol, name, notes..."
            className="w-full bg-surface border border-border rounded-xl pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Filter size={14} className="text-muted/40" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-surface border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30"
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>{c === "All" ? "All Categories" : CATEGORY_LABELS[c] ?? c}</option>
            ))}
          </select>
        </div>
        <select
          value={exchangeFilter}
          onChange={(e) => setExchangeFilter(e.target.value)}
          className="bg-surface border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30"
        >
          {EXCHANGE_OPTIONS.map((e) => (
            <option key={e} value={e}>{e === "All" ? "All Exchanges" : e}</option>
          ))}
        </select>
      </div>

      {/* Mobile Card Layout */}
      <div className="md:hidden space-y-3">
        {filtered.map((trade) => {
          const pnl = trade.pnl ?? 0;
          const isOpen = trade.exit_price === null;
          return (
            <div
              key={trade.id}
              className="glass rounded-xl border border-border/50 p-4"
              style={{ boxShadow: "var(--shadow-card)" }}
              onClick={() => router.push(`/dashboard/commodities/trades/${trade.id}`)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{trade.symbol}</span>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${trade.position === "long" ? "bg-win/10 text-win" : "bg-loss/10 text-loss"}`}>
                    {trade.position.toUpperCase()}
                  </span>
                </div>
                <span className={`text-sm font-bold ${isOpen ? "text-accent" : pnl >= 0 ? "text-win" : "text-loss"}`}>
                  {isOpen ? "Open" : `${pnl >= 0 ? "+" : "-"}$${Math.abs(pnl).toFixed(2)}`}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted">
                <span>{new Date(trade.open_timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                <div className="flex items-center gap-2">
                  {trade.commodity_category && (
                    <span className="px-1.5 py-0.5 rounded-md bg-accent/10 text-accent text-[10px]">
                      {CATEGORY_LABELS[trade.commodity_category]}
                    </span>
                  )}
                  {trade.exchange && (
                    <span className="px-1.5 py-0.5 rounded-md bg-purple-500/10 text-purple-400 text-[10px]">
                      {trade.exchange}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted">No trades match your filters</div>
        )}
      </div>

      {/* Desktop Table */}
      <div
        className="hidden md:block bg-surface rounded-2xl border border-border overflow-hidden"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {visibleColumns.map((col) => (
                  <th
                    key={col.label}
                    className={`text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold px-4 py-3 ${col.key ? "cursor-pointer hover:text-muted select-none" : ""}`}
                    onClick={() => col.key && toggleSort(col.key)}
                  >
                    <span className="flex items-center gap-1">
                      {col.label}
                      {col.key && <SortIcon col={col.key} />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((trade) => {
                const pnl = trade.pnl ?? 0;
                const isOpen = trade.exit_price === null;
                return (
                  <tr
                    key={trade.id}
                    className="border-b border-border/50 cursor-pointer hover:bg-surface-hover transition-colors"
                    onClick={() => router.push(`/dashboard/commodities/trades/${trade.id}`)}
                  >
                    {visibleLabels.has("Date") && (
                    <td className="px-4 py-3 text-muted whitespace-nowrap">
                      {new Date(trade.open_timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </td>
                    )}
                    {visibleLabels.has("Symbol") && (
                    <td className="px-4 py-3">
                      <span className="font-semibold text-foreground">{trade.symbol}</span>
                      {trade.commodity_name && <span className="text-[10px] text-muted/50 ml-1.5">{trade.commodity_name}</span>}
                    </td>
                    )}
                    {visibleLabels.has("Category") && (
                    <td className="px-4 py-3">
                      {trade.commodity_category ? (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-accent/10 text-accent">
                          {CATEGORY_LABELS[trade.commodity_category]}
                        </span>
                      ) : <span className="text-muted/30">&mdash;</span>}
                    </td>
                    )}
                    {visibleLabels.has("Contract") && (
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-border/50 text-muted">
                        {trade.contract_type}
                      </span>
                      {trade.contract_month && <span className="text-[10px] text-muted/40 ml-1.5">{trade.contract_month}</span>}
                    </td>
                    )}
                    {visibleLabels.has("Exchange") && (
                    <td className="px-4 py-3">
                      {trade.exchange ? (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400">
                          {trade.exchange}
                        </span>
                      ) : <span className="text-muted/30">&mdash;</span>}
                    </td>
                    )}
                    {visibleLabels.has("Entry") && (
                    <td className="px-4 py-3 text-muted tabular-nums">${trade.entry_price.toFixed(2)}</td>
                    )}
                    {visibleLabels.has("Exit") && (
                    <td className="px-4 py-3 text-muted tabular-nums">
                      {trade.exit_price !== null ? `$${trade.exit_price.toFixed(2)}` : "\u2014"}
                    </td>
                    )}
                    {visibleLabels.has("Duration") && (
                    <td className="px-4 py-3 text-muted whitespace-nowrap">
                      {formatDuration(trade.open_timestamp, trade.close_timestamp)}
                      {!trade.close_timestamp && <span className="text-accent/60 text-[10px]"> (open)</span>}
                    </td>
                    )}
                    {visibleLabels.has("Return") && (
                    <td className="px-4 py-3 tabular-nums">
                      {(() => {
                        const ret = getReturnPct(trade);
                        if (!ret) return <span className="text-muted/30">&mdash;</span>;
                        return (
                          <span className={`font-semibold ${ret.startsWith("+") ? "text-win" : "text-loss"}`}>
                            {ret}
                          </span>
                        );
                      })()}
                    </td>
                    )}
                    {visibleLabels.has("SL") && (
                    <td className="px-3 py-2 text-right text-muted tabular-nums">
                      {trade.stop_loss !== null ? `$${trade.stop_loss.toFixed(2)}` : "\u2014"}
                    </td>
                    )}
                    {visibleLabels.has("TP") && (
                    <td className="px-3 py-2 text-right text-muted tabular-nums">
                      {trade.profit_target !== null ? `$${trade.profit_target.toFixed(2)}` : "\u2014"}
                    </td>
                    )}
                    {visibleLabels.has("R") && (
                    <td className="px-3 py-2 text-right">
                      {(() => {
                        const r = calculateRMultiple({ ...trade, tick_size: trade.tick_size, tick_value: trade.tick_value });
                        const fmt = formatRMultiple(r);
                        if (!fmt) return <span className="text-muted/30">{"\u2014"}</span>;
                        return <span className={`font-semibold ${r! >= 0 ? "text-win" : "text-loss"}`}>{fmt}</span>;
                      })()}
                    </td>
                    )}
                    {visibleLabels.has("P&L") && (
                    <td className={`px-4 py-3 font-semibold tabular-nums ${isOpen ? "text-accent" : pnl >= 0 ? "text-win" : "text-loss"}`}>
                      {isOpen ? "Open" : `${pnl >= 0 ? "+" : "-"}$${Math.abs(pnl).toFixed(2)}`}
                    </td>
                    )}
                    {visibleLabels.has("Tags") && (
                    <td className="px-3 py-2">
                      {trade.tags && trade.tags.length > 0 ? (
                        <div className="flex gap-1 flex-wrap">
                          {trade.tags.slice(0, 2).map((tag) => (
                            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-border/50 text-muted">{tag}</span>
                          ))}
                          {trade.tags.length > 2 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-border/50 text-muted">+{trade.tags.length - 2}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted/30">&mdash;</span>
                      )}
                    </td>
                    )}
                    {visibleLabels.has("Emotion") && (
                    <td className="px-3 py-2">
                      {trade.emotion ? (
                        <span className="px-1.5 py-0.5 rounded-md bg-accent/10 text-accent text-[10px]">{trade.emotion}</span>
                      ) : (
                        <span className="text-muted/30">&mdash;</span>
                      )}
                    </td>
                    )}
                    {visibleLabels.has("Process") && (
                    <td className="px-3 py-2">
                      {trade.process_score !== null ? (
                        <span className={`text-xs font-semibold tabular-nums ${trade.process_score >= 7 ? "text-win" : trade.process_score >= 4 ? "text-amber-400" : "text-loss"}`}>
                          {trade.process_score}/10
                        </span>
                      ) : (
                        <span className="text-muted/30">&mdash;</span>
                      )}
                    </td>
                    )}
                    {visibleLabels.has("Notes") && (
                    <td className="px-3 py-2">
                      {trade.notes ? (
                        <span className="text-xs text-muted">{trade.notes.length > 30 ? trade.notes.slice(0, 30) + "\u2026" : trade.notes}</span>
                      ) : (
                        <span className="text-muted/30">&mdash;</span>
                      )}
                    </td>
                    )}
                    {visibleLabels.has("Commit") && (
                    <td className="px-3 py-2 text-xs tabular-nums text-muted">
                      ${getTotalCommitment(trade).toLocaleString("en-US", { maximumFractionDigits: 0 })}
                    </td>
                    )}
                    {visibleLabels.has("Quarter") && (
                    <td className="px-3 py-2 text-xs text-muted">
                      {getQuarterLabel(trade.open_timestamp) ?? "\u2014"}
                    </td>
                    )}
                    {visibleLabels.has("MAE $") && (
                    <td className="px-3 py-2">
                      {(() => {
                        const mae = calculateTradeMAE(trade);
                        if (mae === null) return <span className="text-muted/30">&mdash;</span>;
                        return <span className="text-xs tabular-nums text-loss">${mae.toFixed(2)}</span>;
                      })()}
                    </td>
                    )}
                    {visibleLabels.has("MFE $") && (
                    <td className="px-3 py-2">
                      {(() => {
                        const mfe = calculateTradeMFE(trade);
                        if (mfe === null) return <span className="text-muted/30">&mdash;</span>;
                        return <span className="text-xs tabular-nums text-win">${mfe.toFixed(2)}</span>;
                      })()}
                    </td>
                    )}
                    {visibleLabels.has("Pr. MAE") && (
                    <td className="px-3 py-2 text-xs tabular-nums text-muted">
                      {trade.price_mae !== null ? `$${trade.price_mae.toFixed(2)}` : "\u2014"}
                    </td>
                    )}
                    {visibleLabels.has("Pr. MFE") && (
                    <td className="px-3 py-2 text-xs tabular-nums text-muted">
                      {trade.price_mfe !== null ? `$${trade.price_mfe.toFixed(2)}` : "\u2014"}
                    </td>
                    )}
                    {visibleLabels.has("MFE/MAE") && (
                    <td className="px-3 py-2">
                      {(() => {
                        const ratio = getMfeMaeRatio(trade);
                        if (ratio === null) return <span className="text-muted/30">&mdash;</span>;
                        return <span className="text-xs tabular-nums text-muted">{ratio.toFixed(2)}</span>;
                      })()}
                    </td>
                    )}
                    {visibleLabels.has("MFE %") && (
                    <td className="px-3 py-2">
                      {(() => {
                        const pct = getPriceMfePct(trade);
                        if (pct === null) return <span className="text-muted/30">&mdash;</span>;
                        return <span className={`text-xs tabular-nums font-semibold ${pct >= 0 ? "text-win" : "text-loss"}`}>{pct >= 0 ? "+" : ""}{pct.toFixed(2)}%</span>;
                      })()}
                    </td>
                    )}
                    {visibleLabels.has("Best Exit") && (
                    <td className="px-3 py-2">
                      {(() => {
                        const best = calculateBestExitPnl(trade);
                        if (best === null) return <span className="text-muted/30">&mdash;</span>;
                        return <span className={`text-xs tabular-nums font-semibold ${best >= 0 ? "text-win" : "text-loss"}`}>{best >= 0 ? "+" : "-"}${Math.abs(best).toFixed(2)}</span>;
                      })()}
                    </td>
                    )}
                    {visibleLabels.has("Effic.") && (
                    <td className="px-3 py-2">
                      {(() => {
                        const eff = calculateExitEfficiency(trade);
                        if (eff === null) return <span className="text-muted/30">&mdash;</span>;
                        return <span className={`text-xs tabular-nums font-semibold ${eff >= 80 ? "text-win" : eff < 50 ? "text-loss" : "text-muted"}`}>{eff.toFixed(1)}%</span>;
                      })()}
                    </td>
                    )}
                    {visibleLabels.has("Best R") && (
                    <td className="px-3 py-2">
                      {(() => {
                        const r = calculateBestExitR(trade);
                        const fmt = formatRMultiple(r);
                        if (!fmt) return <span className="text-muted/30">&mdash;</span>;
                        return <span className={`text-xs tabular-nums font-semibold ${r! >= 0 ? "text-win" : "text-loss"}`}>{fmt}</span>;
                      })()}
                    </td>
                    )}
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={visibleColumns.length} className="px-4 py-12 text-center text-muted">No trades match your filters</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

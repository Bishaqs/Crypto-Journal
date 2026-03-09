"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
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
    pnl: 5528, created_at: "2026-02-20T09:00:00Z",
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
    pnl: 6732, created_at: "2026-02-19T08:30:00Z",
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
    pnl: -381, created_at: "2026-02-18T10:00:00Z",
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
    pnl: 13475, created_at: "2026-02-17T09:30:00Z",
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
    pnl: null, created_at: "2026-02-21T10:00:00Z",
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CommodityTradesPage() {
  const router = useRouter();
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
                {[
                  { key: "date" as SortKey, label: "Date" },
                  { key: "symbol" as SortKey, label: "Symbol" },
                  { key: "category" as SortKey, label: "Category" },
                  { key: null, label: "Contract" },
                  { key: "exchange" as SortKey, label: "Exchange" },
                  { key: null, label: "Entry" },
                  { key: null, label: "Exit" },
                  { key: "pnl" as SortKey, label: "P&L" },
                ].map((col) => (
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
                    <td className="px-4 py-3 text-muted whitespace-nowrap">
                      {new Date(trade.open_timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-foreground">{trade.symbol}</span>
                      {trade.commodity_name && <span className="text-[10px] text-muted/50 ml-1.5">{trade.commodity_name}</span>}
                    </td>
                    <td className="px-4 py-3">
                      {trade.commodity_category ? (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-accent/10 text-accent">
                          {CATEGORY_LABELS[trade.commodity_category]}
                        </span>
                      ) : <span className="text-muted/30">&mdash;</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-border/50 text-muted">
                        {trade.contract_type}
                      </span>
                      {trade.contract_month && <span className="text-[10px] text-muted/40 ml-1.5">{trade.contract_month}</span>}
                    </td>
                    <td className="px-4 py-3">
                      {trade.exchange ? (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400">
                          {trade.exchange}
                        </span>
                      ) : <span className="text-muted/30">&mdash;</span>}
                    </td>
                    <td className="px-4 py-3 text-muted tabular-nums">${trade.entry_price.toFixed(2)}</td>
                    <td className="px-4 py-3 text-muted tabular-nums">
                      {trade.exit_price !== null ? `$${trade.exit_price.toFixed(2)}` : "\u2014"}
                    </td>
                    <td className={`px-4 py-3 font-semibold tabular-nums ${isOpen ? "text-accent" : pnl >= 0 ? "text-win" : "text-loss"}`}>
                      {isOpen ? "Open" : `${pnl >= 0 ? "+" : "-"}$${Math.abs(pnl).toFixed(2)}`}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted">No trades match your filters</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

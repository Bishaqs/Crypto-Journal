"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StockTrade {
  id: string;
  user_id: string;
  symbol: string;
  company_name: string | null;
  asset_type: "stock" | "option";
  position: "long" | "short";
  entry_price: number;
  exit_price: number | null;
  quantity: number;
  fees: number;
  open_timestamp: string;
  close_timestamp: string | null;
  sector: string | null;
  industry: string | null;
  market_session: "pre_market" | "regular" | "after_hours" | null;
  option_type: "call" | "put" | null;
  strike_price: number | null;
  expiration_date: string | null;
  premium_per_contract: number | null;
  contracts: number | null;
  underlying_symbol: string | null;
  emotion: string | null;
  confidence: number | null;
  setup_type: string | null;
  process_score: number | null;
  checklist: Record<string, boolean> | null;
  review: Record<string, string> | null;
  notes: string | null;
  tags: string[];
  pnl: number | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_STOCK_TRADES: StockTrade[] = [
  {
    id: "st-1", user_id: "u1", symbol: "AAPL", company_name: "Apple Inc.",
    asset_type: "stock", position: "long", entry_price: 178.50, exit_price: 185.20,
    quantity: 50, fees: 1.00, open_timestamp: "2026-02-20T10:30:00Z",
    close_timestamp: "2026-02-20T14:15:00Z", sector: "Technology", industry: "Consumer Electronics",
    market_session: "regular", option_type: null, strike_price: null,
    expiration_date: null, premium_per_contract: null, contracts: null,
    underlying_symbol: null, emotion: "Confident", confidence: 8,
    setup_type: "Breakout", process_score: 9, checklist: null, review: null,
    notes: "Clean breakout above 178 resistance. Volume confirmed the move. Exited near close for solid gain.",
    tags: ["momentum"], pnl: 334.00, created_at: "2026-02-20T10:30:00Z",
  },
  {
    id: "st-2", user_id: "u1", symbol: "TSLA", company_name: "Tesla Inc.",
    asset_type: "option", position: "long", entry_price: 4.20, exit_price: 6.80,
    quantity: 10, fees: 6.50, open_timestamp: "2026-02-19T09:35:00Z",
    close_timestamp: "2026-02-19T11:00:00Z", sector: "Technology", industry: "Auto Manufacturers",
    market_session: "regular", option_type: "call", strike_price: 260,
    expiration_date: "2026-02-28", premium_per_contract: 4.20, contracts: 10,
    underlying_symbol: "TSLA", emotion: "Excited", confidence: 7,
    setup_type: "Earnings Play", process_score: 7, checklist: null, review: null,
    notes: "Weekly calls on TSLA pre-earnings momentum. IV was reasonable, exited before theta decay kicked in.",
    tags: ["options", "earnings"], pnl: 2593.50, created_at: "2026-02-19T09:35:00Z",
  },
  {
    id: "st-3", user_id: "u1", symbol: "NVDA", company_name: "NVIDIA Corp.",
    asset_type: "stock", position: "long", entry_price: 875.00, exit_price: 862.30,
    quantity: 10, fees: 1.00, open_timestamp: "2026-02-18T07:15:00Z",
    close_timestamp: "2026-02-18T09:31:00Z", sector: "Technology", industry: "Semiconductors",
    market_session: "pre_market", option_type: null, strike_price: null,
    expiration_date: null, premium_per_contract: null, contracts: null,
    underlying_symbol: null, emotion: "Anxious", confidence: 5,
    setup_type: "Gap Fill", process_score: 4, checklist: null, review: null,
    notes: "Pre-market gap down play. Got stopped out right before the reversal. Need better stops in pre-market.",
    tags: ["gap"], pnl: -128.00, created_at: "2026-02-18T07:15:00Z",
  },
  {
    id: "st-4", user_id: "u1", symbol: "JPM", company_name: "JPMorgan Chase",
    asset_type: "stock", position: "long", entry_price: 198.40, exit_price: 203.10,
    quantity: 30, fees: 1.00, open_timestamp: "2026-02-18T10:00:00Z",
    close_timestamp: "2026-02-18T15:30:00Z", sector: "Financials", industry: "Banks",
    market_session: "regular", option_type: null, strike_price: null,
    expiration_date: null, premium_per_contract: null, contracts: null,
    underlying_symbol: null, emotion: "Calm", confidence: 8,
    setup_type: "Support Bounce", process_score: 8, checklist: null,
    review: { what_went_well: "Perfect entry at 50 DMA", lesson: "Financials respond well to support levels" },
    notes: "Bounce off 50 DMA with strong volume. Textbook support bounce.",
    tags: ["support"], pnl: 140.00, created_at: "2026-02-18T10:00:00Z",
  },
  {
    id: "st-5", user_id: "u1", symbol: "AMZN", company_name: "Amazon.com",
    asset_type: "stock", position: "short", entry_price: 188.50, exit_price: 185.20,
    quantity: 25, fees: 1.00, open_timestamp: "2026-02-17T16:05:00Z",
    close_timestamp: "2026-02-17T17:45:00Z", sector: "Technology", industry: "Internet Retail",
    market_session: "after_hours", option_type: null, strike_price: null,
    expiration_date: null, premium_per_contract: null, contracts: null,
    underlying_symbol: null, emotion: "Confident", confidence: 7,
    setup_type: "Breakdown", process_score: 8, checklist: null, review: null,
    notes: "After-hours short on weak guidance. Covered before close for a quick scalp.",
    tags: ["short", "after-hours"], pnl: 81.50, created_at: "2026-02-17T16:05:00Z",
  },
  {
    id: "st-6", user_id: "u1", symbol: "MSFT", company_name: "Microsoft Corp.",
    asset_type: "option", position: "long", entry_price: 3.10, exit_price: 1.80,
    quantity: 5, fees: 3.25, open_timestamp: "2026-02-17T10:15:00Z",
    close_timestamp: "2026-02-17T14:30:00Z", sector: "Technology", industry: "Software",
    market_session: "regular", option_type: "put", strike_price: 410,
    expiration_date: "2026-02-21", premium_per_contract: 3.10, contracts: 5,
    underlying_symbol: "MSFT", emotion: "FOMO", confidence: 4,
    setup_type: "Speculative", process_score: 3, checklist: null, review: null,
    notes: "Chased put entry on MSFT weakness. Bad timing, MSFT reversed hard. FOMO trade.",
    tags: ["options"], pnl: -653.25, created_at: "2026-02-17T10:15:00Z",
  },
];

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SECTOR_OPTIONS = ["All", "Technology", "Financials", "Healthcare", "Energy", "Consumer Discretionary"];
const SESSION_OPTIONS = ["All", "pre_market", "regular", "after_hours"];

const SESSION_LABELS: Record<string, string> = {
  pre_market: "Pre-Market",
  regular: "Regular",
  after_hours: "After-Hours",
};

type SortKey = "date" | "symbol" | "pnl" | "sector" | "session";
type SortDir = "asc" | "desc";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function StockTradesPage() {
  const router = useRouter();
  const [trades] = useState<StockTrade[]>(MOCK_STOCK_TRADES);
  const [search, setSearch] = useState("");
  const [sectorFilter, setSectorFilter] = useState("All");
  const [sessionFilter, setSessionFilter] = useState("All");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = trades;

    // Search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.symbol.toLowerCase().includes(q) ||
          t.company_name?.toLowerCase().includes(q) ||
          t.notes?.toLowerCase().includes(q) ||
          t.tags?.some((tag) => tag.toLowerCase().includes(q))
      );
    }

    // Sector
    if (sectorFilter !== "All") {
      result = result.filter((t) => t.sector === sectorFilter);
    }

    // Session
    if (sessionFilter !== "All") {
      result = result.filter((t) => t.market_session === sessionFilter);
    }

    // Sort
    result = [...result].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      switch (sortKey) {
        case "date":
          return dir * a.open_timestamp.localeCompare(b.open_timestamp);
        case "symbol":
          return dir * a.symbol.localeCompare(b.symbol);
        case "pnl":
          return dir * ((a.pnl ?? 0) - (b.pnl ?? 0));
        case "sector":
          return dir * ((a.sector ?? "").localeCompare(b.sector ?? ""));
        case "session":
          return dir * ((a.market_session ?? "").localeCompare(b.market_session ?? ""));
        default:
          return 0;
      }
    });

    return result;
  }, [trades, search, sectorFilter, sessionFilter, sortKey, sortDir]);

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
            Stock Trade Log
          </h2>
          <p className="text-sm text-muted mt-0.5">
            {filtered.length} of {trades.length} trades
          </p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-background font-semibold text-sm hover:bg-accent-hover transition-all duration-300">
          <Plus size={18} />
          Add Trade
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search symbol, company, notes..."
            className="w-full bg-surface border border-border rounded-xl pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Filter size={14} className="text-muted/40" />
          <select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
            className="bg-surface border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30"
          >
            {SECTOR_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s === "All" ? "All Sectors" : s}
              </option>
            ))}
          </select>
        </div>
        <select
          value={sessionFilter}
          onChange={(e) => setSessionFilter(e.target.value)}
          className="bg-surface border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30"
        >
          {SESSION_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s === "All" ? "All Sessions" : SESSION_LABELS[s] ?? s}
            </option>
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
              onClick={() => router.push(`/dashboard/stocks/trades/${trade.id}`)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{trade.symbol}</span>
                  <span
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${
                      trade.position === "long" ? "bg-win/10 text-win" : "bg-loss/10 text-loss"
                    }`}
                  >
                    {trade.position.toUpperCase()}
                  </span>
                  {trade.asset_type === "option" && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400">
                      {trade.option_type?.toUpperCase()}
                    </span>
                  )}
                </div>
                <span
                  className={`text-sm font-bold ${
                    isOpen ? "text-accent" : pnl >= 0 ? "text-win" : "text-loss"
                  }`}
                >
                  {isOpen ? "Open" : `$${pnl.toFixed(2)}`}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted">
                <span>
                  {new Date(trade.open_timestamp).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <div className="flex items-center gap-2">
                  {trade.sector && (
                    <span className="px-1.5 py-0.5 rounded-md bg-accent/10 text-accent text-[10px]">
                      {trade.sector}
                    </span>
                  )}
                  {trade.market_session && (
                    <span
                      className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                        trade.market_session === "pre_market"
                          ? "bg-amber-500/10 text-amber-400"
                          : trade.market_session === "after_hours"
                          ? "bg-purple-500/10 text-purple-400"
                          : "bg-win/10 text-win"
                      }`}
                    >
                      {SESSION_LABELS[trade.market_session]}
                    </span>
                  )}
                </div>
              </div>
              {expandedId === trade.id && trade.notes && (
                <div className="mt-3 pt-3 border-t border-border/30">
                  <span className="text-muted/60 uppercase tracking-wider text-[10px]">Notes</span>
                  <p className="text-xs text-muted mt-0.5 leading-relaxed">{trade.notes}</p>
                </div>
              )}
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
                  { key: "sector" as SortKey, label: "Sector" },
                  { key: null, label: "Type" },
                  { key: "session" as SortKey, label: "Session" },
                  { key: null, label: "Entry" },
                  { key: null, label: "Exit" },
                  { key: "pnl" as SortKey, label: "P&L" },
                ].map((col) => (
                  <th
                    key={col.label}
                    className={`text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold px-4 py-3 ${
                      col.key ? "cursor-pointer hover:text-muted select-none" : ""
                    }`}
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
                const isExpanded = expandedId === trade.id;
                return (
                  <tr key={trade.id} className="group">
                    <td colSpan={8} className="p-0">
                      <div
                        className="grid cursor-pointer hover:bg-surface-hover transition-colors"
                        style={{ gridTemplateColumns: "repeat(8, auto)" }}
                        onClick={() => router.push(`/dashboard/stocks/trades/${trade.id}`)}
                      >
                        {/* Date */}
                        <div className="px-4 py-3 text-muted whitespace-nowrap border-b border-border/50">
                          {new Date(trade.open_timestamp).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </div>

                        {/* Symbol */}
                        <div className="px-4 py-3 border-b border-border/50">
                          <span className="font-semibold text-foreground">{trade.symbol}</span>
                          {trade.company_name && (
                            <span className="text-[10px] text-muted/50 ml-1.5">{trade.company_name}</span>
                          )}
                        </div>

                        {/* Sector */}
                        <div className="px-4 py-3 border-b border-border/50">
                          {trade.sector ? (
                            <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-accent/10 text-accent">
                              {trade.sector}
                            </span>
                          ) : (
                            <span className="text-muted/30">&mdash;</span>
                          )}
                        </div>

                        {/* Type */}
                        <div className="px-4 py-3 border-b border-border/50">
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-md ${
                              trade.asset_type === "option"
                                ? "bg-blue-500/10 text-blue-400"
                                : "bg-border/50 text-muted"
                            }`}
                          >
                            {trade.asset_type === "option"
                              ? `${trade.option_type?.toUpperCase()} $${trade.strike_price}`
                              : "Stock"}
                          </span>
                          {trade.asset_type === "option" && trade.expiration_date && (
                            <span className="text-[10px] text-muted/40 ml-1.5">
                              exp {new Date(trade.expiration_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                          )}
                        </div>

                        {/* Session */}
                        <div className="px-4 py-3 border-b border-border/50">
                          {trade.market_session ? (
                            <span
                              className={`text-xs font-medium px-2 py-0.5 rounded-md ${
                                trade.market_session === "pre_market"
                                  ? "bg-amber-500/10 text-amber-400"
                                  : trade.market_session === "after_hours"
                                  ? "bg-purple-500/10 text-purple-400"
                                  : "bg-win/10 text-win"
                              }`}
                            >
                              {SESSION_LABELS[trade.market_session]}
                            </span>
                          ) : (
                            <span className="text-muted/30">&mdash;</span>
                          )}
                        </div>

                        {/* Entry */}
                        <div className="px-4 py-3 text-muted tabular-nums border-b border-border/50">
                          ${trade.entry_price.toFixed(2)}
                          {trade.asset_type === "option" && trade.premium_per_contract && (
                            <span className="text-[10px] text-muted/40 ml-1">
                              ({trade.contracts}x)
                            </span>
                          )}
                        </div>

                        {/* Exit */}
                        <div className="px-4 py-3 text-muted tabular-nums border-b border-border/50">
                          {trade.exit_price !== null ? `$${trade.exit_price.toFixed(2)}` : "\u2014"}
                        </div>

                        {/* P&L */}
                        <div
                          className={`px-4 py-3 font-semibold tabular-nums border-b border-border/50 ${
                            isOpen ? "text-accent" : pnl >= 0 ? "text-win" : "text-loss"
                          }`}
                        >
                          {isOpen
                            ? "Open"
                            : `${pnl >= 0 ? "+" : "-"}$${Math.abs(pnl).toFixed(2)}`}
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="px-4 py-4 bg-background/50 border-b border-border/50 space-y-3">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                            <div>
                              <span className="text-muted/60 uppercase tracking-wider text-[10px]">
                                Position
                              </span>
                              <p className="text-foreground font-medium mt-0.5">
                                <span
                                  className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                                    trade.position === "long" ? "bg-win/10 text-win" : "bg-loss/10 text-loss"
                                  }`}
                                >
                                  {trade.position.toUpperCase()}
                                </span>
                              </p>
                            </div>
                            <div>
                              <span className="text-muted/60 uppercase tracking-wider text-[10px]">
                                Quantity
                              </span>
                              <p className="text-foreground font-medium mt-0.5">
                                {trade.asset_type === "option"
                                  ? `${trade.contracts} contracts`
                                  : `${trade.quantity} shares`}
                              </p>
                            </div>
                            <div>
                              <span className="text-muted/60 uppercase tracking-wider text-[10px]">
                                Fees
                              </span>
                              <p className="text-foreground font-medium mt-0.5">${trade.fees.toFixed(2)}</p>
                            </div>
                            <div>
                              <span className="text-muted/60 uppercase tracking-wider text-[10px]">
                                Setup
                              </span>
                              <p className="text-foreground font-medium mt-0.5">
                                {trade.setup_type ?? "\u2014"}
                              </p>
                            </div>
                          </div>

                          {trade.asset_type === "option" && (
                            <div className="flex flex-wrap gap-2">
                              <span className="text-[10px] px-2 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                {trade.option_type?.toUpperCase()} | Strike: ${trade.strike_price} | Exp: {trade.expiration_date} | Premium: ${trade.premium_per_contract?.toFixed(2)}
                              </span>
                            </div>
                          )}

                          {trade.notes && (
                            <div>
                              <span className="text-muted/60 uppercase tracking-wider text-[10px]">
                                Notes
                              </span>
                              <p className="text-xs text-muted mt-0.5 leading-relaxed">{trade.notes}</p>
                            </div>
                          )}

                          {trade.review && Object.keys(trade.review).length > 0 && (
                            <div>
                              <span className="text-muted/60 uppercase tracking-wider text-[10px]">
                                Post-Trade Review
                              </span>
                              <div className="mt-1 space-y-1">
                                {Object.entries(trade.review).map(([key, val]) => (
                                  <div key={key} className="text-xs">
                                    <span className="text-muted">{key.replace(/_/g, " ")}: </span>
                                    <span className="text-foreground">{val}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-2 flex-wrap">
                            {trade.emotion && (
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-accent/10 text-accent">
                                {trade.emotion}
                              </span>
                            )}
                            {trade.process_score !== null && (
                              <span
                                className={`text-[10px] font-semibold ${
                                  trade.process_score >= 7
                                    ? "text-win"
                                    : trade.process_score >= 4
                                    ? "text-amber-400"
                                    : "text-loss"
                                }`}
                              >
                                Process: {trade.process_score}/10
                              </span>
                            )}
                            {trade.tags?.map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-border/50 text-muted"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted">
                    No trades match your filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

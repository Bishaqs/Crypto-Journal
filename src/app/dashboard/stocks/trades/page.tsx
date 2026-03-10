"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Table2, Search, ChevronUp, ChevronDown, ArrowUpDown, Plus, X,
} from "lucide-react";
import { Header } from "@/components/header";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import {
  formatDuration, getReturnPct, calculateRMultiple, formatRMultiple,
  getTotalCommitment, getQuarterLabel, calculateTradeMAE, calculateTradeMFE,
  getMfeMaeRatio, getPriceMfePct, calculateBestExitPnl, calculateExitEfficiency,
  calculateBestExitR, getPriceMaePct, formatDurationMs, getTimeTillMfe,
  getTimeTillMae, getTimeAfterMfe, getTimeAfterMae,
} from "@/lib/calculations";
import {
  useTableState, Pagination, ViewTabs, TableSidebar,
  type TradeTableColumn, type FilterDef, type TableConfig,
} from "@/components/trade-table";

// ---------------------------------------------------------------------------
// Types (local — stock trades don't yet import from @/lib/types)
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
  stop_loss: number | null;
  profit_target: number | null;
  pnl: number | null;
  price_mae: number | null;
  price_mfe: number | null;
  mfe_timestamp: string | null;
  mae_timestamp: string | null;
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
    notes: "Clean breakout above 178 resistance. Volume confirmed the move.",
    tags: ["momentum"], stop_loss: 175.00, profit_target: 188.00, pnl: 334.00, price_mae: null, price_mfe: null, mae_timestamp: null, mfe_timestamp: null, created_at: "2026-02-20T10:30:00Z",
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
    notes: "Weekly calls on TSLA pre-earnings momentum.",
    tags: ["options", "earnings"], stop_loss: null, profit_target: null, pnl: 2593.50, price_mae: null, price_mfe: null, mae_timestamp: null, mfe_timestamp: null, created_at: "2026-02-19T09:35:00Z",
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
    notes: "Pre-market gap down play. Got stopped out right before the reversal.",
    tags: ["gap"], stop_loss: null, profit_target: null, pnl: -128.00, price_mae: null, price_mfe: null, mae_timestamp: null, mfe_timestamp: null, created_at: "2026-02-18T07:15:00Z",
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
    notes: "Bounce off 50 DMA with strong volume.",
    tags: ["support"], stop_loss: null, profit_target: null, pnl: 140.00, price_mae: null, price_mfe: null, mae_timestamp: null, mfe_timestamp: null, created_at: "2026-02-18T10:00:00Z",
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
    notes: "After-hours short on weak guidance.",
    tags: ["short", "after-hours"], stop_loss: null, profit_target: null, pnl: 81.50, price_mae: null, price_mfe: null, mae_timestamp: null, mfe_timestamp: null, created_at: "2026-02-17T16:05:00Z",
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
    notes: "Chased put entry on MSFT weakness. Bad timing, MSFT reversed hard.",
    tags: ["options"], stop_loss: null, profit_target: null, pnl: -653.25, price_mae: null, price_mfe: null, mae_timestamp: null, mfe_timestamp: null, created_at: "2026-02-17T10:15:00Z",
  },
];

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SESSION_LABELS: Record<string, string> = {
  pre_market: "Pre-Market", regular: "Regular", after_hours: "After-Hours",
};

const DASH = <span className="text-muted/30">{"\u2014"}</span>;

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

const STOCK_COLUMNS: TradeTableColumn<StockTrade>[] = [
  {
    id: "date", label: "Date", group: "Core", sortKey: "date", defaultVisible: true,
    sortFn: (a, b) => a.open_timestamp.localeCompare(b.open_timestamp),
    renderCell: (t) => (
      <span className="text-muted whitespace-nowrap">
        {new Date(t.open_timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
      </span>
    ),
  },
  {
    id: "symbol", label: "Symbol", group: "Core", sortKey: "symbol", defaultVisible: true,
    sortFn: (a, b) => a.symbol.localeCompare(b.symbol),
    renderCell: (t) => (
      <span>
        <span className="font-semibold text-foreground">{t.symbol}</span>
        {t.company_name && <span className="text-[10px] text-muted/50 ml-1.5">{t.company_name}</span>}
      </span>
    ),
  },
  {
    id: "sector", label: "Sector", group: "Core",
    renderCell: (t) => t.sector
      ? <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-accent/10 text-accent">{t.sector}</span>
      : DASH,
  },
  {
    id: "type", label: "Type", group: "Core",
    renderCell: (t) => (
      <span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${t.asset_type === "option" ? "bg-blue-500/10 text-blue-400" : "bg-border/50 text-muted"}`}>
          {t.asset_type === "option" ? `${t.option_type?.toUpperCase()} $${t.strike_price}` : "Stock"}
        </span>
        {t.asset_type === "option" && t.expiration_date && (
          <span className="text-[10px] text-muted/40 ml-1.5">exp {new Date(t.expiration_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
        )}
      </span>
    ),
  },
  {
    id: "session", label: "Session", group: "Core",
    renderCell: (t) => t.market_session
      ? <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${t.market_session === "pre_market" ? "bg-amber-500/10 text-amber-400" : t.market_session === "after_hours" ? "bg-purple-500/10 text-purple-400" : "bg-win/10 text-win"}`}>
          {SESSION_LABELS[t.market_session]}
        </span>
      : DASH,
  },
  {
    id: "side", label: "Side", group: "Core", defaultVisible: true,
    renderCell: (t) => (
      <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${t.position === "long" ? "bg-win/10 text-win" : "bg-loss/10 text-loss"}`}>
        {t.position.toUpperCase()}
      </span>
    ),
  },
  {
    id: "entry", label: "Entry", group: "Core", defaultVisible: true,
    renderCell: (t) => (
      <span className="text-muted tabular-nums">
        ${t.entry_price.toFixed(2)}
        {t.asset_type === "option" && t.contracts && (
          <span className="text-[10px] text-muted/40 ml-1">({t.contracts}x)</span>
        )}
      </span>
    ),
  },
  {
    id: "exit", label: "Exit", group: "Core", defaultVisible: true,
    renderCell: (t) => <span className="text-muted tabular-nums">{t.exit_price !== null ? `$${t.exit_price.toFixed(2)}` : "\u2014"}</span>,
  },
  {
    id: "duration", label: "Duration", group: "Core",
    renderCell: (t) => (
      <span className="text-muted whitespace-nowrap">
        {formatDuration(t.open_timestamp, t.close_timestamp)}
        {!t.close_timestamp && <span className="text-accent/60 text-[10px]"> (open)</span>}
      </span>
    ),
  },
  {
    id: "return", label: "Return", group: "Core",
    renderCell: (t) => {
      const ret = getReturnPct(t);
      if (!ret) return DASH;
      return <span className={`font-semibold ${ret.startsWith("+") ? "text-win" : "text-loss"}`}>{ret}</span>;
    },
  },
  {
    id: "sl", label: "SL", group: "Planning", align: "right",
    renderCell: (t) => <span className="text-muted tabular-nums">{t.stop_loss !== null ? `$${t.stop_loss.toFixed(2)}` : "\u2014"}</span>,
  },
  {
    id: "tp", label: "TP", group: "Planning", align: "right",
    renderCell: (t) => <span className="text-muted tabular-nums">{t.profit_target !== null ? `$${t.profit_target.toFixed(2)}` : "\u2014"}</span>,
  },
  {
    id: "r", label: "R", group: "Planning", align: "right",
    renderCell: (t) => {
      const r = calculateRMultiple(t);
      const fmt = formatRMultiple(r);
      if (!fmt) return DASH;
      return <span className={`font-semibold ${r! >= 0 ? "text-win" : "text-loss"}`}>{fmt}</span>;
    },
  },
  {
    id: "pnl", label: "P&L", group: "Core", sortKey: "pnl", defaultVisible: true,
    sortFn: (a, b) => (a.pnl ?? 0) - (b.pnl ?? 0),
    renderCell: (t) => {
      const pnl = t.pnl ?? 0;
      const isOpen = t.exit_price === null;
      return (
        <span className={`font-semibold tabular-nums ${isOpen ? "text-accent" : pnl >= 0 ? "text-win" : "text-loss"}`}>
          {isOpen ? "Open" : `${pnl >= 0 ? "+" : "-"}$${Math.abs(pnl).toFixed(2)}`}
        </span>
      );
    },
  },
  {
    id: "tags", label: "Tags", group: "Meta",
    renderCell: (t) => (
      <div className="flex gap-1 flex-wrap">
        {t.tags?.slice(0, 2).map((tag) => (
          <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-border/50 text-muted">{tag}</span>
        ))}
        {(t.tags?.length ?? 0) > 2 && <span className="text-[10px] text-muted/40">+{t.tags!.length - 2}</span>}
      </div>
    ),
  },
  {
    id: "emotion", label: "Emotion", group: "Psychology",
    renderCell: (t) => t.emotion
      ? <span className="text-xs px-2 py-0.5 rounded-md bg-accent/10 text-accent">{t.emotion}</span>
      : DASH,
  },
  {
    id: "process", label: "Process", group: "Psychology",
    renderCell: (t) => t.process_score !== null
      ? <span className={`text-xs font-semibold ${t.process_score >= 7 ? "text-win" : t.process_score >= 4 ? "text-amber-400" : "text-loss"}`}>{t.process_score}/10</span>
      : DASH,
  },
  {
    id: "notes", label: "Notes", group: "Meta",
    renderCell: (t) => t.notes
      ? <span className="text-xs text-muted">{t.notes.slice(0, 30)}{t.notes.length > 30 ? "..." : ""}</span>
      : DASH,
  },
  {
    id: "commit", label: "Commit", group: "Metrics", align: "right",
    renderCell: (t) => <span className="tabular-nums text-muted">${getTotalCommitment(t).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>,
  },
  {
    id: "quarter", label: "Quarter", group: "Meta",
    renderCell: (t) => {
      const q = getQuarterLabel(t.open_timestamp);
      return q ? <span className="text-muted">{q}</span> : DASH;
    },
  },
  // MAE/MFE
  {
    id: "mae_dollar", label: "MAE $", group: "MAE/MFE", align: "right",
    renderCell: (t) => { const v = calculateTradeMAE(t); return v === null ? DASH : <span className="text-loss">${v.toFixed(2)}</span>; },
  },
  {
    id: "mfe_dollar", label: "MFE $", group: "MAE/MFE", align: "right",
    renderCell: (t) => { const v = calculateTradeMFE(t); return v === null ? DASH : <span className="text-win">${v.toFixed(2)}</span>; },
  },
  {
    id: "price_mae", label: "Pr. MAE", group: "MAE/MFE", align: "right",
    renderCell: (t) => t.price_mae != null ? <span className="text-muted tabular-nums">${t.price_mae.toFixed(2)}</span> : DASH,
  },
  {
    id: "price_mfe", label: "Pr. MFE", group: "MAE/MFE", align: "right",
    renderCell: (t) => t.price_mfe != null ? <span className="text-muted tabular-nums">${t.price_mfe.toFixed(2)}</span> : DASH,
  },
  {
    id: "mfe_mae_ratio", label: "MFE/MAE", group: "MAE/MFE", align: "right",
    renderCell: (t) => { const v = getMfeMaeRatio(t); return v === null ? DASH : <span className="text-muted">{v.toFixed(2)}</span>; },
  },
  {
    id: "mfe_pct", label: "MFE %", group: "MAE/MFE", align: "right",
    renderCell: (t) => { const v = getPriceMfePct(t); return v === null ? DASH : <span className={v >= 0 ? "text-win" : "text-loss"}>{v >= 0 ? "+" : ""}{v.toFixed(2)}%</span>; },
  },
  {
    id: "mae_pct", label: "MAE %", group: "MAE/MFE", align: "right",
    renderCell: (t) => { const v = getPriceMaePct(t); return v === null ? DASH : <span className="text-loss">{v.toFixed(2)}%</span>; },
  },
  {
    id: "time_till_mfe", label: "Time till MFE", group: "MAE/MFE",
    renderCell: (t) => <span className="text-muted whitespace-nowrap">{formatDurationMs(getTimeTillMfe(t))}</span>,
  },
  {
    id: "time_till_mae", label: "Time till MAE", group: "MAE/MFE",
    renderCell: (t) => <span className="text-muted whitespace-nowrap">{formatDurationMs(getTimeTillMae(t))}</span>,
  },
  {
    id: "time_after_mfe", label: "Time after MFE", group: "MAE/MFE",
    renderCell: (t) => <span className="text-muted whitespace-nowrap">{formatDurationMs(getTimeAfterMfe(t))}</span>,
  },
  {
    id: "time_after_mae", label: "Time after MAE", group: "MAE/MFE",
    renderCell: (t) => <span className="text-muted whitespace-nowrap">{formatDurationMs(getTimeAfterMae(t))}</span>,
  },
  // Exit Quality
  {
    id: "best_exit", label: "Best Exit", group: "Exit Quality", align: "right",
    renderCell: (t) => { const v = calculateBestExitPnl(t); return v === null ? DASH : <span className={`font-semibold ${v >= 0 ? "text-win" : "text-loss"}`}>${v.toFixed(2)}</span>; },
  },
  {
    id: "efficiency", label: "Effic.", group: "Exit Quality", align: "right",
    renderCell: (t) => { const v = calculateExitEfficiency(t); return v === null ? DASH : <span className={v >= 80 ? "text-win" : v < 50 ? "text-loss" : "text-muted"}>{v.toFixed(1)}%</span>; },
  },
  {
    id: "best_r", label: "Best R", group: "Exit Quality", align: "right",
    renderCell: (t) => { const v = calculateBestExitR(t); const f = formatRMultiple(v); return !f ? DASH : <span className={`font-semibold ${v! >= 0 ? "text-win" : "text-loss"}`}>{f}</span>; },
  },
];

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------

const STOCK_FILTERS: FilterDef<StockTrade>[] = [
  {
    id: "sector", label: "Sector", type: "select",
    options: [
      { value: "All", label: "All Sectors" },
      { value: "Technology", label: "Technology" },
      { value: "Financials", label: "Financials" },
      { value: "Healthcare", label: "Healthcare" },
      { value: "Energy", label: "Energy" },
      { value: "Consumer Discretionary", label: "Consumer Disc." },
    ],
    filterFn: (t, val) => val === "All" || t.sector === val,
  },
  {
    id: "session", label: "Session", type: "select",
    options: [
      { value: "All", label: "All Sessions" },
      { value: "pre_market", label: "Pre-Market" },
      { value: "regular", label: "Regular" },
      { value: "after_hours", label: "After-Hours" },
    ],
    filterFn: (t, val) => val === "All" || t.market_session === val,
  },
  {
    id: "asset_type", label: "Asset Type", type: "select",
    options: [
      { value: "All", label: "All Types" },
      { value: "stock", label: "Stock" },
      { value: "option", label: "Option" },
    ],
    filterFn: (t, val) => val === "All" || t.asset_type === val,
  },
  {
    id: "emotion", label: "Emotion", type: "select",
    options: ["All", "Calm", "Confident", "Excited", "Anxious", "FOMO", "Frustrated"].map((e) => ({ value: e, label: e === "All" ? "All Emotions" : e })),
    filterFn: (t, val) => val === "All" || t.emotion === val,
  },
];

// ---------------------------------------------------------------------------
// Table config
// ---------------------------------------------------------------------------

const TABLE_CONFIG: TableConfig<StockTrade> = {
  columns: STOCK_COLUMNS,
  filters: STOCK_FILTERS,
  storageKey: "stargate-stock-table",
  tableName: "stock_trades",
  getId: (t) => t.id,
  getSymbol: (t) => t.symbol,
  getDate: (t) => t.open_timestamp.slice(0, 10),
  isOpen: (t) => t.exit_price === null,
  defaultSortKey: "date",
  defaultSortDir: "desc",
  defaultPageSize: 50,
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function StockTradesPage() {
  const router = useRouter();
  const [trades] = useState<StockTrade[]>(MOCK_STOCK_TRADES);

  const { state, visibleColumns, paginatedData, sortedFilteredData, totalItems, totalPages, actions } = useTableState(TABLE_CONFIG, trades);

  const exportData = useMemo(() => sortedFilteredData.map((t) => ({
    symbol: t.symbol, company_name: t.company_name, asset_type: t.asset_type,
    position: t.position, entry_price: t.entry_price, exit_price: t.exit_price,
    pnl: t.pnl, sector: t.sector, market_session: t.market_session,
    open_timestamp: t.open_timestamp, close_timestamp: t.close_timestamp,
    emotion: t.emotion, tags: t.tags?.join(", "), notes: t.notes,
  })), [sortedFilteredData]);

  const openCount = useMemo(() => trades.filter((t) => t.exit_price === null).length, [trades]);

  function SortIcon({ sortKey }: { sortKey: string }) {
    if (state.sortKey !== sortKey) return <ArrowUpDown size={12} className="text-muted/40" />;
    return state.sortDir === "asc" ? <ChevronUp size={12} className="text-accent" /> : <ChevronDown size={12} className="text-accent" />;
  }

  return (
    <div className="space-y-6 mx-auto max-w-[1600px]">
      <Header />

      <div id="tour-stock-trades-header" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Table2 size={24} className="text-accent" />
            Stock Trade Log
            <InfoTooltip text="Complete log of your stock trades — filter, sort, and review" />
          </h2>
          <p className="text-sm text-muted mt-0.5">
            {totalItems} of {trades.length} trades
          </p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-background font-semibold text-sm hover:bg-accent-hover transition-all duration-300">
          <Plus size={18} />
          Add Trade
        </button>
      </div>

      {/* View Tabs + Search */}
      <div id="tour-stock-trades-filters" className="flex flex-wrap items-center gap-3">
        <ViewTabs
          activeTab={state.activeTab}
          onTabChange={actions.setActiveTab}
          counts={{ trades: trades.length, open: openCount }}
        />
        <div className="flex-1" />
        <div className="relative min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/40" />
          <input
            type="text"
            value={state.search}
            onChange={(e) => actions.setSearch(e.target.value)}
            placeholder="Search symbol, company..."
            className="w-full bg-surface border border-border rounded-xl pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all"
          />
          {state.search && (
            <button onClick={() => actions.setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Mobile card layout */}
      <div className="md:hidden space-y-3">
        {paginatedData.map((trade) => {
          const pnl = trade.pnl ?? 0;
          const isOpen = trade.exit_price === null;
          return (
            <div key={trade.id} className="glass rounded-xl border border-border/50 p-4" style={{ boxShadow: "var(--shadow-card)" }}
              onClick={() => router.push(`/dashboard/stocks/trades/${trade.id}`)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{trade.symbol}</span>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${trade.position === "long" ? "bg-win/10 text-win" : "bg-loss/10 text-loss"}`}>
                    {trade.position.toUpperCase()}
                  </span>
                  {trade.asset_type === "option" && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400">
                      {trade.option_type?.toUpperCase()}
                    </span>
                  )}
                </div>
                <span className={`text-sm font-bold ${isOpen ? "text-accent" : pnl >= 0 ? "text-win" : "text-loss"}`}>
                  {isOpen ? "Open" : `$${pnl.toFixed(2)}`}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted">
                <span>{new Date(trade.open_timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                <div className="flex items-center gap-2">
                  {trade.sector && (
                    <span className="px-1.5 py-0.5 rounded-md bg-accent/10 text-accent text-[10px]">{trade.sector}</span>
                  )}
                  {trade.market_session && (
                    <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${trade.market_session === "pre_market" ? "bg-amber-500/10 text-amber-400" : trade.market_session === "after_hours" ? "bg-purple-500/10 text-purple-400" : "bg-win/10 text-win"}`}>
                      {SESSION_LABELS[trade.market_session]}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {paginatedData.length === 0 && <div className="text-center py-12 text-muted">No trades match your filters</div>}
        <Pagination page={state.page} pageSize={state.pageSize} totalItems={totalItems} totalPages={totalPages} onPageChange={actions.setPage} onPageSizeChange={actions.setPageSize} />
      </div>

      {/* Desktop table + sidebar */}
      <div id="tour-stock-trades-table" className="hidden md:flex bg-surface rounded-2xl border border-border overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="w-10 px-3 py-3">
                    <input
                      type="checkbox"
                      checked={state.selectedIds.size > 0 && state.selectedIds.size === paginatedData.length}
                      onChange={() => state.selectedIds.size === paginatedData.length ? actions.deselectAll() : actions.selectAll()}
                      className="w-3.5 h-3.5 rounded border-border text-accent focus:ring-accent/30 bg-background"
                    />
                  </th>
                  {visibleColumns.map((col) => (
                    <th
                      key={col.id}
                      className={`text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold px-4 py-3 whitespace-nowrap ${col.sortKey ? "cursor-pointer hover:text-muted select-none" : ""} ${col.align === "right" ? "text-right" : ""}`}
                      onClick={() => col.sortKey && actions.toggleSort(col.sortKey)}
                    >
                      <span className="flex items-center gap-1">
                        {col.label}
                        {col.sortKey && <SortIcon sortKey={col.sortKey} />}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((trade) => {
                  const isSelected = state.selectedIds.has(trade.id);
                  return (
                    <tr key={trade.id} className={`border-b border-border/50 cursor-pointer hover:bg-surface-hover transition-colors ${isSelected ? "bg-accent/5" : ""}`}
                      onClick={() => router.push(`/dashboard/stocks/trades/${trade.id}`)}
                    >
                      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={isSelected} onChange={() => actions.toggleRow(trade.id)}
                          className="w-3.5 h-3.5 rounded border-border text-accent focus:ring-accent/30 bg-background" />
                      </td>
                      {visibleColumns.map((col) => (
                        <td key={col.id} className={`px-4 py-3 ${col.align === "right" ? "text-right" : ""}`}>
                          {col.renderCell(trade)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
                {paginatedData.length === 0 && (
                  <tr><td colSpan={visibleColumns.length + 1} className="px-4 py-12 text-center text-muted">No trades match your filters</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination page={state.page} pageSize={state.pageSize} totalItems={totalItems} totalPages={totalPages} onPageChange={actions.setPage} onPageSizeChange={actions.setPageSize} />
        </div>
        <TableSidebar
          activeTab={state.sidebarTab}
          onToggleTab={actions.toggleSidebarTab}
          columns={TABLE_CONFIG.columns}
          visibleColumnIds={state.visibleColumnIds}
          onToggleColumn={actions.toggleColumn}
          onShowAll={actions.showAllColumns}
          onHideAll={actions.hideAllColumns}
          filters={STOCK_FILTERS}
          filterValues={state.filters}
          onSetFilter={actions.setFilter}
          onClearFilters={actions.clearFilters}
          selectedCount={state.selectedIds.size}
          totalCount={totalItems}
          onSelectAll={actions.selectAll}
          onDeselectAll={actions.deselectAll}
          onResetTable={actions.resetTable}
          allData={exportData as Record<string, unknown>[]}
          exportFileName="stock-trades"
        />
      </div>
    </div>
  );
}

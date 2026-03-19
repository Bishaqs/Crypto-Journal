"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
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
import type { CommodityTrade } from "@/lib/types";
import { CommodityTradeForm } from "@/components/commodity-trade-form";
import {
  useTableState, Pagination, ViewTabs, TableSidebar,
  type TradeTableColumn, type FilterDef, type TableConfig,
} from "@/components/trade-table";

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
    stop_loss: 2325.00, profit_target: 2375.00, pnl: 5528, price_mae: null, price_mfe: null, mae_timestamp: null, mfe_timestamp: null, playbook_id: null, idea_source: null, created_at: "2026-02-20T09:00:00Z",
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
    stop_loss: null, profit_target: null, pnl: 6732, price_mae: null, price_mfe: null, mae_timestamp: null, mfe_timestamp: null, playbook_id: null, idea_source: null, created_at: "2026-02-19T08:30:00Z",
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
    stop_loss: null, profit_target: null, pnl: -381, price_mae: null, price_mfe: null, mae_timestamp: null, mfe_timestamp: null, playbook_id: null, idea_source: null, created_at: "2026-02-18T10:00:00Z",
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
    stop_loss: null, profit_target: null, pnl: 13475, price_mae: null, price_mfe: null, mae_timestamp: null, mfe_timestamp: null, playbook_id: null, idea_source: null, created_at: "2026-02-17T09:30:00Z",
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
    stop_loss: null, profit_target: null, pnl: null, price_mae: null, price_mfe: null, mae_timestamp: null, mfe_timestamp: null, playbook_id: null, idea_source: null, created_at: "2026-02-21T10:00:00Z",
  },
];

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORY_LABELS: Record<string, string> = {
  metals: "Metals", energy: "Energy", grains: "Grains", softs: "Softs", livestock: "Livestock",
};

const DASH = <span className="text-muted/30">{"\u2014"}</span>;

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

const COMMODITY_COLUMNS: TradeTableColumn<CommodityTrade>[] = [
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
        {t.commodity_name && <span className="text-[10px] text-muted/50 ml-1.5">{t.commodity_name}</span>}
      </span>
    ),
  },
  {
    id: "category", label: "Category", group: "Core",
    renderCell: (t) => t.commodity_category
      ? <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-accent/10 text-accent">{CATEGORY_LABELS[t.commodity_category]}</span>
      : DASH,
  },
  {
    id: "contract", label: "Contract", group: "Core",
    renderCell: (t) => (
      <span>
        <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-border/50 text-muted">{t.contract_type}</span>
        {t.contract_month && <span className="text-[10px] text-muted/40 ml-1.5">{t.contract_month}</span>}
      </span>
    ),
  },
  {
    id: "exchange", label: "Exchange", group: "Core",
    renderCell: (t) => t.exchange
      ? <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400">{t.exchange}</span>
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
    renderCell: (t) => <span className="text-muted tabular-nums">${t.entry_price.toFixed(2)}</span>,
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
      const r = calculateRMultiple({ ...t, tick_size: t.tick_size, tick_value: t.tick_value });
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

const COMMODITY_FILTERS: FilterDef<CommodityTrade>[] = [
  {
    id: "category", label: "Category", type: "select",
    options: [
      { value: "All", label: "All Categories" },
      { value: "metals", label: "Metals" },
      { value: "energy", label: "Energy" },
      { value: "grains", label: "Grains" },
      { value: "softs", label: "Softs" },
      { value: "livestock", label: "Livestock" },
    ],
    filterFn: (t, val) => val === "All" || t.commodity_category === val,
  },
  {
    id: "exchange", label: "Exchange", type: "select",
    options: [
      { value: "All", label: "All Exchanges" },
      { value: "COMEX", label: "COMEX" },
      { value: "NYMEX", label: "NYMEX" },
      { value: "CBOT", label: "CBOT" },
      { value: "ICE", label: "ICE" },
      { value: "CME", label: "CME" },
    ],
    filterFn: (t, val) => val === "All" || t.exchange === val,
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

const TABLE_CONFIG: TableConfig<CommodityTrade> = {
  columns: COMMODITY_COLUMNS,
  filters: COMMODITY_FILTERS,
  storageKey: "stargate-commodity-table",
  tableName: "commodity_trades",
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

export default function CommodityTradesPage() {
  const router = useRouter();
  const supabase = createClient();
  const [trades, setTrades] = useState<CommodityTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingDemo, setUsingDemo] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const { state, visibleColumns, paginatedData, sortedFilteredData, totalItems, totalPages, actions } = useTableState(TABLE_CONFIG, trades);

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

  useEffect(() => { fetchTrades(); }, [fetchTrades]);

  const exportData = useMemo(() => sortedFilteredData.map((t) => ({
    symbol: t.symbol, commodity_name: t.commodity_name, position: t.position,
    entry_price: t.entry_price, exit_price: t.exit_price, pnl: t.pnl,
    quantity: t.quantity, exchange: t.exchange, commodity_category: t.commodity_category,
    open_timestamp: t.open_timestamp, close_timestamp: t.close_timestamp,
    emotion: t.emotion, tags: t.tags?.join(", "), notes: t.notes,
  })), [sortedFilteredData]);

  const openCount = useMemo(() => trades.filter((t) => t.exit_price === null).length, [trades]);

  function SortIcon({ sortKey }: { sortKey: string }) {
    if (state.sortKey !== sortKey) return <ArrowUpDown size={12} className="text-muted/40" />;
    return state.sortDir === "asc" ? <ChevronUp size={12} className="text-accent" /> : <ChevronDown size={12} className="text-accent" />;
  }

  if (loading) {
    return <div className="flex items-center justify-center h-full"><div className="animate-pulse text-accent">Loading...</div></div>;
  }

  return (
    <div className="space-y-6 mx-auto max-w-[1600px]">
      <Header />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Table2 size={24} className="text-accent" />
            Commodity Trade Log
            <InfoTooltip text="Complete log of your commodity trades — filter, sort, and review" articleId="tj-edit-trade" />
          </h2>
          <p className="text-sm text-muted mt-0.5">
            {usingDemo ? "Sample data" : `${totalItems} of ${trades.length} trades`}
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

      {showForm && (
        <CommodityTradeForm
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); fetchTrades(); }}
        />
      )}

      {/* View Tabs + Search */}
      <div className="flex flex-wrap items-center gap-3">
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
            placeholder="Search symbol, name..."
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
                    <span className="px-1.5 py-0.5 rounded-md bg-accent/10 text-accent text-[10px]">{CATEGORY_LABELS[trade.commodity_category]}</span>
                  )}
                  {trade.exchange && (
                    <span className="px-1.5 py-0.5 rounded-md bg-purple-500/10 text-purple-400 text-[10px]">{trade.exchange}</span>
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
      <div className="hidden md:flex bg-surface rounded-2xl border border-border overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
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
                      onClick={() => router.push(`/dashboard/commodities/trades/${trade.id}`)}
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
          filters={COMMODITY_FILTERS}
          filterValues={state.filters}
          onSetFilter={actions.setFilter}
          onClearFilters={actions.clearFilters}
          selectedCount={state.selectedIds.size}
          totalCount={totalItems}
          onSelectAll={actions.selectAll}
          onDeselectAll={actions.deselectAll}
          onResetTable={actions.resetTable}
          allData={exportData as Record<string, unknown>[]}
          exportFileName="commodity-trades"
        />
      </div>
    </div>
  );
}

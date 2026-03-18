"use client";

import { Fragment, useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/lib/theme-context";
import { createClient } from "@/lib/supabase/client";
import { Trade } from "@/lib/types";
import { DEMO_TRADES } from "@/lib/demo-data";
import { DemoBanner } from "@/components/demo-banner";
import {
  calculateTradePnl, formatDuration, getReturnPct,
  calculateRMultiple, formatRMultiple, getTotalCommitment, getQuarterLabel,
  calculateTradeMAE, calculateTradeMFE, getMfeMaeRatio, getPriceMfePct,
  calculateBestExitPnl, calculateExitEfficiency, calculateBestExitR,
  getPriceMaePct, formatDurationMs, getTimeTillMfe, getTimeTillMae,
  getTimeAfterMfe, getTimeAfterMae,
} from "@/lib/calculations";
import { CHAINS } from "@/lib/types";
import {
  Table2, Search, ChevronUp, ChevronDown, ArrowUpDown,
  Sparkles, X, ExternalLink, Fuel,
} from "lucide-react";
import { Header } from "@/components/header";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import {
  useTableState, Pagination, ViewTabs, TableSidebar, TradeRowActions,
  type TradeTableColumn, type FilterDef, type TableConfig,
} from "@/components/trade-table";
import { TradeForm } from "@/components/trade-form";

// --- Column definitions ---

const DASH = <span className="text-muted/30">{"\u2014"}</span>;

const TRADE_COLUMNS: TradeTableColumn<Trade>[] = [
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
      <span className="font-semibold text-foreground">
        <span className="flex items-center gap-1.5">
          {t.symbol}
          {t.trade_source === "dex" && t.chain && (
            <span className="text-[9px] font-medium px-1 py-0.5 rounded bg-accent/10 text-accent">
              {CHAINS.find((c) => c.id === t.chain)?.label ?? t.chain}
            </span>
          )}
        </span>
      </span>
    ),
  },
  {
    id: "side", label: "Side", group: "Core", defaultVisible: true,
    renderCell: (t) => (
      <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${
        t.position === "long" ? "bg-win/10 text-win" : "bg-loss/10 text-loss"
      }`}>
        {t.position.toUpperCase()}
      </span>
    ),
  },
  {
    id: "entry", label: "Entry", group: "Core",
    renderCell: (t) => <span className="text-muted tabular-nums">${t.entry_price.toFixed(2)}</span>,
  },
  {
    id: "exit", label: "Exit", group: "Core",
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
    id: "sl", label: "SL", group: "Planning",
    renderCell: (t) => <span className="text-muted tabular-nums">{t.stop_loss !== null ? `$${t.stop_loss.toFixed(2)}` : "\u2014"}</span>,
  },
  {
    id: "tp", label: "TP", group: "Planning",
    renderCell: (t) => <span className="text-muted tabular-nums">{t.profit_target !== null ? `$${t.profit_target.toFixed(2)}` : "\u2014"}</span>,
  },
  {
    id: "r", label: "R", group: "Planning",
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
      const pnl = t.pnl ?? calculateTradePnl(t) ?? 0;
      return (
        <span className={`font-semibold tabular-nums ${pnl >= 0 ? "text-win" : "text-loss"}`}>
          {t.exit_price !== null ? `$${pnl.toFixed(2)}` : "Open"}
        </span>
      );
    },
  },
  {
    id: "emotion", label: "Emotion", group: "Psychology", sortKey: "emotion",
    sortFn: (a, b) => (a.emotion ?? "").localeCompare(b.emotion ?? ""),
    renderCell: (t) => t.emotion
      ? <span className="text-xs px-2 py-0.5 rounded-md bg-accent/10 text-accent">{t.emotion}</span>
      : DASH,
  },
  {
    id: "process", label: "Process", group: "Psychology", sortKey: "process_score",
    sortFn: (a, b) => (a.process_score ?? 0) - (b.process_score ?? 0),
    renderCell: (t) => t.process_score !== null
      ? <span className={`text-xs font-semibold ${t.process_score >= 7 ? "text-win" : t.process_score >= 4 ? "text-amber-400" : "text-loss"}`}>{t.process_score}/10</span>
      : DASH,
  },
  {
    id: "tags", label: "Tags", group: "Meta",
    renderCell: (t) => (
      <div className="flex gap-1 flex-wrap">
        {t.tags?.slice(0, 3).map((tag) => (
          <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-border/50 text-muted">{tag}</span>
        ))}
        {(t.tags?.length ?? 0) > 3 && <span className="text-[10px] text-muted/40">+{t.tags!.length - 3}</span>}
      </div>
    ),
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
      const q = getQuarterLabel(t.close_timestamp);
      return q ? <span className="text-muted">{q}</span> : DASH;
    },
  },
  {
    id: "mae_dollar", label: "MAE $", group: "MAE/MFE", align: "right",
    renderCell: (t) => {
      const mae = calculateTradeMAE(t);
      if (mae === null) return DASH;
      return <span className="text-loss">${mae.toFixed(2)}</span>;
    },
  },
  {
    id: "mfe_dollar", label: "MFE $", group: "MAE/MFE", align: "right",
    renderCell: (t) => {
      const mfe = calculateTradeMFE(t);
      if (mfe === null) return DASH;
      return <span className="text-win">${mfe.toFixed(2)}</span>;
    },
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
    renderCell: (t) => {
      const ratio = getMfeMaeRatio(t);
      if (ratio === null) return DASH;
      return <span className="text-muted">{ratio.toFixed(2)}</span>;
    },
  },
  {
    id: "mfe_pct", label: "MFE %", group: "MAE/MFE", align: "right",
    renderCell: (t) => {
      const pct = getPriceMfePct(t);
      if (pct === null) return DASH;
      return <span className={pct >= 0 ? "text-win" : "text-loss"}>{pct >= 0 ? "+" : ""}{pct.toFixed(2)}%</span>;
    },
  },
  {
    id: "mae_pct", label: "MAE %", group: "MAE/MFE", align: "right",
    renderCell: (t) => {
      const pct = getPriceMaePct(t);
      if (pct === null) return DASH;
      return <span className="text-loss">{pct.toFixed(2)}%</span>;
    },
  },
  {
    id: "mfe_date", label: "MFE Date", group: "MAE/MFE",
    renderCell: (t) => t.mfe_timestamp
      ? <span className="text-muted whitespace-nowrap">{new Date(t.mfe_timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
      : DASH,
  },
  {
    id: "mae_date", label: "MAE Date", group: "MAE/MFE",
    renderCell: (t) => t.mae_timestamp
      ? <span className="text-muted whitespace-nowrap">{new Date(t.mae_timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
      : DASH,
  },
  {
    id: "time_till_mfe", label: "Time till MFE", group: "MAE/MFE",
    renderCell: (t) => {
      const ms = getTimeTillMfe(t);
      return <span className="text-muted whitespace-nowrap">{formatDurationMs(ms)}</span>;
    },
  },
  {
    id: "time_till_mae", label: "Time till MAE", group: "MAE/MFE",
    renderCell: (t) => {
      const ms = getTimeTillMae(t);
      return <span className="text-muted whitespace-nowrap">{formatDurationMs(ms)}</span>;
    },
  },
  {
    id: "time_after_mfe", label: "Time after MFE", group: "MAE/MFE",
    renderCell: (t) => {
      const ms = getTimeAfterMfe(t);
      return <span className="text-muted whitespace-nowrap">{formatDurationMs(ms)}</span>;
    },
  },
  {
    id: "time_after_mae", label: "Time after MAE", group: "MAE/MFE",
    renderCell: (t) => {
      const ms = getTimeAfterMae(t);
      return <span className="text-muted whitespace-nowrap">{formatDurationMs(ms)}</span>;
    },
  },
  // N/A placeholder columns (data infrastructure doesn't exist yet)
  {
    id: "eod_exit_pnl", label: "EOD Exit PnL", group: "EOD", align: "right",
    renderCell: () => <span className="text-muted/30">N/A</span>,
  },
  {
    id: "eod_exit_efficiency", label: "EOD Effic.", group: "EOD", align: "right",
    renderCell: () => <span className="text-muted/30">N/A</span>,
  },
  {
    id: "eod_exit_r", label: "EOD R-value", group: "EOD", align: "right",
    renderCell: () => <span className="text-muted/30">N/A</span>,
  },
  {
    id: "best_exit", label: "Best Exit", group: "Exit Quality", align: "right",
    renderCell: (t) => {
      const best = calculateBestExitPnl(t);
      if (best === null) return DASH;
      return <span className={`font-semibold ${best >= 0 ? "text-win" : "text-loss"}`}>${best.toFixed(2)}</span>;
    },
  },
  {
    id: "efficiency", label: "Effic.", group: "Exit Quality", align: "right",
    renderCell: (t) => {
      const eff = calculateExitEfficiency(t);
      if (eff === null) return DASH;
      return <span className={eff >= 80 ? "text-win" : eff < 50 ? "text-loss" : "text-muted"}>{eff.toFixed(1)}%</span>;
    },
  },
  {
    id: "best_r", label: "Best R", group: "Exit Quality", align: "right",
    renderCell: (t) => {
      const bestR = calculateBestExitR(t);
      const fmt = formatRMultiple(bestR);
      if (!fmt) return DASH;
      return <span className={`font-semibold ${bestR! >= 0 ? "text-win" : "text-loss"}`}>{fmt}</span>;
    },
  },
];

// --- Filters ---

const EMOTION_OPTIONS = ["All", "Calm", "Confident", "Excited", "Anxious", "FOMO", "Frustrated", "Revenge", "Bored"];

const TRADE_FILTERS: FilterDef<Trade>[] = [
  {
    id: "emotion",
    label: "Emotion",
    type: "select",
    options: EMOTION_OPTIONS.map((e) => ({ value: e, label: e === "All" ? "All Emotions" : e })),
    filterFn: (t, val) => val === "All" || t.emotion === val,
  },
  {
    id: "source",
    label: "Source",
    type: "select",
    options: [
      { value: "All", label: "All Sources" },
      { value: "cex", label: "CEX" },
      { value: "dex", label: "DEX" },
    ],
    filterFn: (t, val) => val === "All" || t.trade_source === val,
  },
];

// --- Table config ---

const TABLE_CONFIG: TableConfig<Trade> = {
  columns: TRADE_COLUMNS,
  filters: TRADE_FILTERS,
  storageKey: "stargate-crypto-table",
  tableName: "trades",
  getId: (t) => t.id,
  getSymbol: (t) => t.symbol,
  getDate: (t) => t.open_timestamp.slice(0, 10),
  isOpen: (t) => t.exit_price === null,
  defaultSortKey: "date",
  defaultSortDir: "desc",
  defaultPageSize: 50,
};

// --- Page ---

export default function TradesPage() {
  const router = useRouter();
  const { viewMode } = useTheme();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingDemo, setUsingDemo] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editTrade, setEditTrade] = useState<Trade | null>(null);
  const [showForm, setShowForm] = useState(false);
  const supabase = createClient();

  const { state, visibleColumns, paginatedData, sortedFilteredData, totalItems, totalPages, actions } = useTableState(TABLE_CONFIG, trades);

  // Show all columns when in advanced/full mode
  useEffect(() => {
    if (viewMode === "expert") {
      actions.showAllColumns();
    }
  }, [viewMode]);

  const fetchTrades = useCallback(async () => {
    const { data } = await supabase
      .from("trades")
      .select("*")
      .order("open_timestamp", { ascending: false });
    const dbTrades = (data as Trade[]) ?? [];
    if (dbTrades.length === 0) {
      setTrades(DEMO_TRADES);
      setUsingDemo(true);
    } else {
      setTrades(dbTrades);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  // Export helper
  const exportData = useMemo(() => {
    return sortedFilteredData.map((t) => ({
      symbol: t.symbol,
      position: t.position,
      entry_price: t.entry_price,
      exit_price: t.exit_price,
      pnl: t.pnl,
      open_timestamp: t.open_timestamp,
      close_timestamp: t.close_timestamp,
      fees: t.fees,
      emotion: t.emotion,
      tags: t.tags?.join(", "),
      notes: t.notes,
    }));
  }, [sortedFilteredData]);

  // Count open trades for tab badge
  const openCount = useMemo(() => trades.filter((t) => t.exit_price === null).length, [trades]);

  function SortIcon({ sortKey }: { sortKey: string }) {
    if (state.sortKey !== sortKey) return <ArrowUpDown size={12} className="text-muted/40" />;
    return state.sortDir === "asc" ? <ChevronUp size={12} className="text-accent" /> : <ChevronDown size={12} className="text-accent" />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-accent">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 mx-auto max-w-[1600px]">
      <Header />
      <div id="trades-header">
        <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <Table2 size={24} className="text-accent" />
          Trade Log <InfoTooltip text="All your trades in one place — filter, sort, and review" articleId="tj-edit-trade" />
        </h2>
        <p className="text-sm text-muted mt-0.5">
          {usingDemo ? "Sample data" : `${totalItems} of ${trades.length} trades`}
        </p>
      </div>
      {usingDemo && <DemoBanner feature="trade log" />}

      {/* View Tabs + Search */}
      <div id="trades-filters" className="flex flex-wrap items-center gap-3">
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
            placeholder="Search symbol..."
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
          const pnl = trade.pnl ?? calculateTradePnl(trade) ?? 0;
          return (
            <div
              key={trade.id}
              className="glass rounded-xl border border-border/50 p-4"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{trade.symbol}</span>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${
                    trade.position === "long" ? "bg-win/10 text-win" : "bg-loss/10 text-loss"
                  }`}>
                    {trade.position.toUpperCase()}
                  </span>
                </div>
                <span className={`text-sm font-bold ${pnl >= 0 ? "text-win" : "text-loss"}`}>
                  {trade.exit_price !== null ? `$${pnl.toFixed(2)}` : "Open"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted">
                <span>{new Date(trade.open_timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                <div className="flex items-center gap-2">
                  {trade.emotion && (
                    <span className="px-1.5 py-0.5 rounded-md bg-accent/10 text-accent text-[10px]">{trade.emotion}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {paginatedData.length === 0 && (
          <div className="text-center py-12 text-muted">No trades match your filters</div>
        )}
        <Pagination
          page={state.page}
          pageSize={state.pageSize}
          totalItems={totalItems}
          totalPages={totalPages}
          onPageChange={actions.setPage}
          onPageSizeChange={actions.setPageSize}
        />
      </div>

      {/* Desktop table + sidebar */}
      <div
        id="trades-table"
        className="hidden md:flex bg-surface rounded-2xl border border-border overflow-hidden"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        {/* Table area */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="overflow-x-auto flex-1">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {/* Selection checkbox header */}
                  <th className="w-10 px-3 py-3">
                    <input
                      type="checkbox"
                      checked={state.selectedIds.size > 0 && state.selectedIds.size === paginatedData.length}
                      onChange={() => state.selectedIds.size === paginatedData.length ? actions.deselectAll() : actions.selectAll()}
                      className="w-3.5 h-3.5 rounded border-border text-accent focus:ring-accent/30 bg-background"
                    />
                  </th>
                  {/* Actions column */}
                  <th className="w-[80px] px-2 py-3" />
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
                  const isExpanded = expandedId === trade.id;
                  const isSelected = state.selectedIds.has(trade.id);
                  return (
                    <Fragment key={trade.id}>
                      <tr
                        className={`border-b border-border/50 cursor-pointer hover:bg-surface-hover transition-colors ${isSelected ? "bg-accent/5" : ""}`}
                        onClick={() => router.push(`/dashboard/trades/${trade.id}`)}
                      >
                        <td className="w-10 px-3 py-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => actions.toggleRow(trade.id)}
                            className="w-3.5 h-3.5 rounded border-border text-accent focus:ring-accent/30 bg-background"
                          />
                        </td>
                        <td className="px-2 py-3" onClick={(e) => e.stopPropagation()}>
                          <TradeRowActions
                            onView={() => router.push(`/dashboard/trades/${trade.id}`)}
                            onEdit={() => { setEditTrade(trade); setShowForm(true); }}
                            onExpand={() => setExpandedId(isExpanded ? null : trade.id)}
                            isExpanded={isExpanded}
                          />
                        </td>
                        {visibleColumns.map((col) => (
                          <td
                            key={col.id}
                            className={`px-4 py-3 whitespace-nowrap ${col.align === "right" ? "text-right" : ""}`}
                          >
                            {col.renderCell(trade)}
                          </td>
                        ))}
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={visibleColumns.length + 2} className="p-0">
                            <div className="px-4 py-4 bg-background/50 border-b border-border/50 space-y-3">
                              {/* P&L + Core Metrics */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                {(() => {
                                  const pnl = trade.pnl ?? calculateTradePnl(trade);
                                  const isOpen = pnl === null;
                                  return (
                                    <div>
                                      <span className="text-muted/60 uppercase tracking-wider text-[10px]">P&L</span>
                                      <p className={`font-semibold mt-0.5 ${isOpen ? "text-muted" : pnl > 0 ? "text-win" : pnl < 0 ? "text-loss" : "text-foreground"}`}>
                                        {isOpen ? "Open" : `${pnl > 0 ? "+" : ""}$${pnl.toFixed(2)}`}
                                      </p>
                                    </div>
                                  );
                                })()}
                                <div>
                                  <span className="text-muted/60 uppercase tracking-wider text-[10px]">Quantity</span>
                                  <p className="text-foreground font-medium mt-0.5">{trade.quantity}</p>
                                </div>
                                <div>
                                  <span className="text-muted/60 uppercase tracking-wider text-[10px]">Fees</span>
                                  <p className="text-foreground font-medium mt-0.5">${trade.fees.toFixed(2)}</p>
                                </div>
                                {trade.emotion ? (
                                  <div>
                                    <span className="text-muted/60 uppercase tracking-wider text-[10px]">Emotion</span>
                                    <p className="text-foreground font-medium mt-0.5 capitalize">{trade.emotion}</p>
                                  </div>
                                ) : (
                                  <div>
                                    <span className="text-muted/60 uppercase tracking-wider text-[10px]">Confidence</span>
                                    <p className="text-foreground font-medium mt-0.5">{trade.confidence !== null ? `${trade.confidence}/10` : "\u2014"}</p>
                                  </div>
                                )}
                              </div>
                              {/* Psychology + Planning */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                {trade.emotion && (
                                  <div>
                                    <span className="text-muted/60 uppercase tracking-wider text-[10px]">Confidence</span>
                                    <p className="text-foreground font-medium mt-0.5">{trade.confidence !== null ? `${trade.confidence}/10` : "\u2014"}</p>
                                  </div>
                                )}
                                <div>
                                  <span className="text-muted/60 uppercase tracking-wider text-[10px]">Setup</span>
                                  <p className="text-foreground font-medium mt-0.5">{trade.setup_type ?? "\u2014"}</p>
                                </div>
                                {trade.process_score !== null && (
                                  <div>
                                    <span className="text-muted/60 uppercase tracking-wider text-[10px]">Process</span>
                                    <p className="text-foreground font-medium mt-0.5">{trade.process_score}/10</p>
                                  </div>
                                )}
                                {trade.stop_loss !== null && (
                                  <div>
                                    <span className="text-muted/60 uppercase tracking-wider text-[10px]">Stop Loss</span>
                                    <p className="text-loss font-medium mt-0.5">${trade.stop_loss}</p>
                                  </div>
                                )}
                                {trade.profit_target !== null && (
                                  <div>
                                    <span className="text-muted/60 uppercase tracking-wider text-[10px]">Target</span>
                                    <p className="text-win font-medium mt-0.5">${trade.profit_target}</p>
                                  </div>
                                )}
                              </div>
                              {trade.trade_source === "dex" && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                  <div>
                                    <span className="text-muted/60 uppercase tracking-wider text-[10px]">Chain</span>
                                    <p className="text-foreground font-medium mt-0.5">
                                      {CHAINS.find((c) => c.id === trade.chain)?.label ?? trade.chain ?? "\u2014"}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-muted/60 uppercase tracking-wider text-[10px]">Protocol</span>
                                    <p className="text-foreground font-medium mt-0.5">{trade.dex_protocol ?? "\u2014"}</p>
                                  </div>
                                  <div>
                                    <span className="text-muted/60 uppercase tracking-wider text-[10px]">Gas Fee</span>
                                    <p className="text-foreground font-medium mt-0.5 flex items-center gap-1">
                                      <Fuel size={10} className="text-muted/60" />
                                      ${(trade.gas_fee ?? 0).toFixed(2)}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-muted/60 uppercase tracking-wider text-[10px]">Tx Hash</span>
                                    {trade.tx_hash ? (() => {
                                      const explorer = CHAINS.find((c) => c.id === trade.chain)?.explorer ?? "";
                                      return (
                                        <a
                                          href={`${explorer}${trade.tx_hash}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-accent hover:text-accent-hover font-medium mt-0.5 flex items-center gap-1 transition-colors"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          {trade.tx_hash.slice(0, 8)}...{trade.tx_hash.slice(-6)}
                                          <ExternalLink size={10} />
                                        </a>
                                      );
                                    })() : (
                                      <p className="text-foreground font-medium mt-0.5">{"\u2014"}</p>
                                    )}
                                  </div>
                                </div>
                              )}
                              {trade.notes && (
                                <div>
                                  <span className="text-muted/60 uppercase tracking-wider text-[10px]">Notes</span>
                                  <p className="text-xs text-muted mt-0.5 leading-relaxed">{trade.notes}</p>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
                {paginatedData.length === 0 && (
                  <tr>
                    <td colSpan={visibleColumns.length + 2} className="px-4 py-12 text-center text-muted">
                      No trades match your filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <Pagination
            page={state.page}
            pageSize={state.pageSize}
            totalItems={totalItems}
            totalPages={totalPages}
            onPageChange={actions.setPage}
            onPageSizeChange={actions.setPageSize}
          />
        </div>

        {/* Right sidebar */}
        <TableSidebar
          activeTab={state.sidebarTab}
          onToggleTab={actions.toggleSidebarTab}
          columns={TABLE_CONFIG.columns}
          visibleColumnIds={state.visibleColumnIds}
          onToggleColumn={actions.toggleColumn}
          onShowAll={actions.showAllColumns}
          onHideAll={actions.hideAllColumns}
          filters={TRADE_FILTERS}
          filterValues={state.filters}
          onSetFilter={actions.setFilter}
          onClearFilters={actions.clearFilters}
          selectedCount={state.selectedIds.size}
          totalCount={totalItems}
          onSelectAll={actions.selectAll}
          onDeselectAll={actions.deselectAll}
          onResetTable={actions.resetTable}
          allData={exportData as Record<string, unknown>[]}
          exportFileName="crypto-trades"
        />
      </div>

      {/* Edit Trade Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 bg-black/60 overflow-y-auto">
          <div className="relative w-full max-w-2xl mx-4 mb-10">
            <TradeForm
              editTrade={editTrade}
              onClose={() => { setShowForm(false); setEditTrade(null); }}
              onSaved={() => { setShowForm(false); setEditTrade(null); fetchTrades(); }}
              variant="modal"
            />
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTrades } from "@/hooks/use-trades";
import {
  List, Search, ChevronUp, ChevronDown, ArrowUpDown, X,
} from "lucide-react";
import { DemoBanner } from "@/components/demo-banner";
import { Header } from "@/components/header";
import {
  calculateTradePnl, formatDuration, getReturnPct, calculateRMultiple,
  formatRMultiple, getTotalCommitment, getQuarterLabel, calculateTradeMAE,
  calculateTradeMFE, getMfeMaeRatio, getPriceMfePct, calculateBestExitPnl,
  calculateExitEfficiency, calculateBestExitR, getPriceMaePct, formatDurationMs,
  getTimeTillMfe, getTimeTillMae, getTimeAfterMfe, getTimeAfterMae,
} from "@/lib/calculations";
import { CHAINS } from "@/lib/types";
import type { Trade } from "@/lib/types";
import {
  useTableState, Pagination, ViewTabs, TableSidebar,
  type TradeTableColumn, type FilterDef, type TableConfig,
} from "@/components/trade-table";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DASH = <span className="text-muted/30">{"\u2014"}</span>;

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

const EXEC_COLUMNS: TradeTableColumn<Trade>[] = [
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
      <span className="flex items-center gap-1">
        <span className="font-semibold text-foreground">{t.symbol}</span>
        {t.trade_source === "dex" && t.chain && (
          <span className="text-[9px] px-1 py-0.5 rounded bg-accent/10 text-accent">
            {CHAINS.find((c) => c.id === t.chain)?.label ?? t.chain}
          </span>
        )}
      </span>
    ),
  },
  {
    id: "side", label: "Side", group: "Core", defaultVisible: true,
    renderCell: (t) => (
      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${t.position === "long" ? "bg-win/10 text-win" : "bg-loss/10 text-loss"}`}>
        {t.position.toUpperCase()}
      </span>
    ),
  },
  {
    id: "entry", label: "Entry", group: "Core", defaultVisible: true, align: "right",
    renderCell: (t) => <span className="text-muted tabular-nums">${t.entry_price.toFixed(2)}</span>,
  },
  {
    id: "exit", label: "Exit", group: "Core", defaultVisible: true, align: "right",
    renderCell: (t) => <span className="text-muted tabular-nums">{t.exit_price !== null ? `$${t.exit_price.toFixed(2)}` : "\u2014"}</span>,
  },
  {
    id: "qty", label: "Qty", group: "Core", sortKey: "quantity", align: "right",
    sortFn: (a, b) => a.quantity - b.quantity,
    renderCell: (t) => <span className="text-muted tabular-nums">{t.quantity}</span>,
  },
  {
    id: "fees", label: "Fees", group: "Core", sortKey: "fees", align: "right",
    sortFn: (a, b) => a.fees - b.fees,
    renderCell: (t) => <span className="text-muted tabular-nums">${t.fees.toFixed(2)}</span>,
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
    id: "return", label: "Return", group: "Core", align: "right",
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
    id: "pnl", label: "P&L", group: "Core", sortKey: "pnl", defaultVisible: true, align: "right",
    sortFn: (a, b) => (a.pnl ?? 0) - (b.pnl ?? 0),
    renderCell: (t) => {
      const pnl = t.pnl ?? calculateTradePnl(t) ?? 0;
      const isOpen = t.exit_price === null;
      return (
        <span className={`font-semibold tabular-nums ${isOpen ? "text-accent" : pnl >= 0 ? "text-win" : "text-loss"}`}>
          {isOpen ? "Open" : `$${pnl.toFixed(2)}`}
        </span>
      );
    },
  },
  {
    id: "emotion", label: "Emotion", group: "Psychology", sortKey: "emotion",
    sortFn: (a, b) => (a.emotion ?? "").localeCompare(b.emotion ?? ""),
    renderCell: (t) => t.emotion
      ? <span className="px-1.5 py-0.5 rounded-md bg-accent/10 text-accent text-[10px]">{t.emotion}</span>
      : DASH,
  },
  {
    id: "confidence", label: "Conf.", group: "Psychology", sortKey: "confidence", align: "right",
    sortFn: (a, b) => (a.confidence ?? 0) - (b.confidence ?? 0),
    renderCell: (t) => <span className="text-muted tabular-nums">{t.confidence !== null ? t.confidence : "\u2014"}</span>,
  },
  {
    id: "process", label: "Process", group: "Psychology", sortKey: "process_score", align: "right",
    sortFn: (a, b) => (a.process_score ?? 0) - (b.process_score ?? 0),
    renderCell: (t) => t.process_score !== null
      ? <span className={`font-semibold ${t.process_score >= 7 ? "text-win" : t.process_score >= 4 ? "text-amber-400" : "text-loss"}`}>{t.process_score}/10</span>
      : DASH,
  },
  {
    id: "setup", label: "Setup", group: "Meta",
    renderCell: (t) => <span className="text-muted">{t.setup_type ?? "\u2014"}</span>,
  },
  {
    id: "tags", label: "Tags", group: "Meta",
    renderCell: (t) => (
      <div className="flex gap-1 flex-wrap">
        {t.tags?.slice(0, 2).map((tag) => (
          <span key={tag} className="text-[9px] px-1 py-0.5 rounded bg-border/50 text-muted">{tag}</span>
        ))}
        {(t.tags?.length ?? 0) > 2 && <span className="text-[9px] text-muted/40">+{t.tags!.length - 2}</span>}
      </div>
    ),
  },
  {
    id: "source", label: "Source", group: "Meta",
    renderCell: (t) => <span className="text-muted uppercase text-[10px]">{t.trade_source}</span>,
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

const EXEC_FILTERS: FilterDef<Trade>[] = [
  {
    id: "emotion", label: "Emotion", type: "select",
    options: ["All", "Calm", "Confident", "Excited", "Anxious", "FOMO", "Frustrated"].map((e) => ({ value: e, label: e === "All" ? "All Emotions" : e })),
    filterFn: (t, val) => val === "All" || t.emotion === val,
  },
  {
    id: "source", label: "Source", type: "select",
    options: [
      { value: "All", label: "All Sources" },
      { value: "cex", label: "CEX" },
      { value: "dex", label: "DEX" },
    ],
    filterFn: (t, val) => val === "All" || t.trade_source === val,
  },
];

// ---------------------------------------------------------------------------
// Table config
// ---------------------------------------------------------------------------

const TABLE_CONFIG: TableConfig<Trade> = {
  columns: EXEC_COLUMNS,
  filters: EXEC_FILTERS,
  storageKey: "stargate-crypto-exec-table",
  tableName: "trades",
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

export default function ExecutionsPage() {
  const router = useRouter();
  const { trades, loading, usingDemo } = useTrades();

  const { state, visibleColumns, paginatedData, sortedFilteredData, totalItems, totalPages, actions } = useTableState(TABLE_CONFIG, trades);

  const exportData = useMemo(() => sortedFilteredData.map((t) => ({
    symbol: t.symbol, position: t.position, entry_price: t.entry_price, exit_price: t.exit_price,
    pnl: t.pnl, quantity: t.quantity, fees: t.fees, trade_source: t.trade_source,
    open_timestamp: t.open_timestamp, close_timestamp: t.close_timestamp,
    emotion: t.emotion, tags: t.tags?.join(", "), notes: t.notes,
  })), [sortedFilteredData]);

  const openCount = useMemo(() => trades.filter((t) => t.exit_price === null).length, [trades]);

  function SortIcon({ sortKey }: { sortKey: string }) {
    if (state.sortKey !== sortKey) return <ArrowUpDown size={10} className="text-muted/30" />;
    return state.sortDir === "asc" ? <ChevronUp size={10} className="text-accent" /> : <ChevronDown size={10} className="text-accent" />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-accent">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header />
      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <List size={24} className="text-accent" />
          Executions
        </h2>
        <p className="text-sm text-muted mt-0.5">
          {usingDemo ? "Sample data" : `${totalItems} of ${trades.length} trades`}
        </p>
      </div>
      {usingDemo && <DemoBanner feature="executions" />}

      {/* View Tabs + Search */}
      <div className="flex flex-wrap items-center gap-3">
        <ViewTabs
          activeTab={state.activeTab}
          onTabChange={actions.setActiveTab}
          counts={{ trades: trades.length, open: openCount }}
        />
        <div className="flex-1" />
        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/40" />
          <input
            type="text"
            value={state.search}
            onChange={(e) => actions.setSearch(e.target.value)}
            placeholder="Search symbol, tag, emotion..."
            className="w-full bg-surface border border-border rounded-xl pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all"
          />
          {state.search && (
            <button onClick={() => actions.setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Desktop table + sidebar */}
      <div className="flex bg-surface rounded-2xl border border-border overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="w-10 px-3 py-2.5">
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
                      className={`text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold px-3 py-2.5 whitespace-nowrap ${col.sortKey ? "cursor-pointer hover:text-muted select-none" : ""} ${col.align === "right" ? "text-right" : ""}`}
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
                    <tr key={trade.id}
                      onClick={() => router.push(`/dashboard/trades/${trade.id}`)}
                      className={`border-b border-border/30 hover:bg-surface-hover cursor-pointer transition-colors ${isSelected ? "bg-accent/5" : ""}`}
                    >
                      <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={isSelected} onChange={() => actions.toggleRow(trade.id)}
                          className="w-3.5 h-3.5 rounded border-border text-accent focus:ring-accent/30 bg-background" />
                      </td>
                      {visibleColumns.map((col) => (
                        <td key={col.id} className={`px-3 py-2 ${col.align === "right" ? "text-right" : ""}`}>
                          {col.renderCell(trade)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
                {paginatedData.length === 0 && (
                  <tr><td colSpan={visibleColumns.length + 1} className="px-3 py-12 text-center text-muted">No trades match your search</td></tr>
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
          filters={EXEC_FILTERS}
          filterValues={state.filters}
          onSetFilter={actions.setFilter}
          onClearFilters={actions.clearFilters}
          selectedCount={state.selectedIds.size}
          totalCount={totalItems}
          onSelectAll={actions.selectAll}
          onDeselectAll={actions.deselectAll}
          onResetTable={actions.resetTable}
          allData={exportData as Record<string, unknown>[]}
          exportFileName="crypto-executions"
        />
      </div>
    </div>
  );
}

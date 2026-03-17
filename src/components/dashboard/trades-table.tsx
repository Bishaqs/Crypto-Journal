"use client";

import { Fragment, useState } from "react";
import { Trade } from "@/lib/types";
import { useMemo } from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/lib/theme-context";
import {
  formatDuration, calculateRMultiple, formatRMultiple, getTotalCommitment,
  getQuarterLabel, calculateTradeMAE, calculateTradeMFE, getMfeMaeRatio,
  getPriceMfePct, calculateBestExitPnl, calculateExitEfficiency,
  calculateBestExitR, getPriceMaePct, formatDurationMs, getTimeTillMfe,
  getTimeTillMae, getTimeAfterMfe, getTimeAfterMae, calculateTradePnl,
} from "@/lib/calculations";
import {
  useTableState, Pagination, TradeRowActions,
  type TradeTableColumn, type TableConfig,
} from "@/components/trade-table";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DASH = <span className="text-muted/30">{"\u2014"}</span>;

function getReturnPct(trade: Trade): string | null {
  if (!trade.entry_price || trade.exit_price === null) return null;
  const direction = trade.position === "long" ? 1 : -1;
  const pct = ((trade.exit_price - trade.entry_price) / trade.entry_price) * 100 * direction;
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`;
}

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

const POSITIONS_COLUMNS: TradeTableColumn<Trade>[] = [
  {
    id: "symbol", label: "Pair", group: "Core", sortKey: "symbol", defaultVisible: true,
    sortFn: (a, b) => a.symbol.localeCompare(b.symbol),
    renderCell: (t) => <span className="text-sm font-bold text-foreground">{t.symbol}</span>,
  },
  {
    id: "side", label: "Side", group: "Core", defaultVisible: true,
    renderCell: (t) => (
      <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-semibold ${t.position === "long" ? "bg-win/10 text-win" : "bg-loss/10 text-loss"}`}>
        {t.position === "long" ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
        {t.position.toUpperCase()}
      </span>
    ),
  },
  {
    id: "entry", label: "Entry", group: "Core", sortKey: "entry_price", align: "right",
    sortFn: (a, b) => a.entry_price - b.entry_price,
    renderCell: (t) => <span className="text-xs text-muted tabular-nums">${t.entry_price.toFixed(2)}</span>,
  },
  {
    id: "exit", label: "Exit", group: "Core", align: "right",
    renderCell: (t) => <span className="text-xs text-muted tabular-nums">{t.exit_price !== null ? `$${t.exit_price.toFixed(2)}` : "\u2014"}</span>,
  },
  {
    id: "qty", label: "Qty", group: "Core", align: "right",
    renderCell: (t) => <span className="text-xs text-muted tabular-nums">{t.quantity}</span>,
  },
  {
    id: "opened", label: "Opened", group: "Core", sortKey: "open_timestamp", defaultVisible: true,
    sortFn: (a, b) => a.open_timestamp.localeCompare(b.open_timestamp),
    renderCell: (t) => (
      <span className="text-xs text-muted">
        {new Date(t.open_timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false })}
      </span>
    ),
  },
  {
    id: "closed", label: "Closed", group: "Core", sortKey: "close_timestamp", defaultVisible: true,
    sortFn: (a, b) => (a.close_timestamp ?? "").localeCompare(b.close_timestamp ?? ""),
    renderCell: (t) => (
      <span className="text-xs text-muted">
        {t.close_timestamp ? new Date(t.close_timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }) : "\u2014"}
      </span>
    ),
  },
  {
    id: "duration", label: "Duration", group: "Core",
    renderCell: (t) => (
      <span className="text-xs text-muted whitespace-nowrap">
        {formatDuration(t.open_timestamp, t.close_timestamp)}
        {!t.close_timestamp && <span className="text-accent/60"> (open)</span>}
      </span>
    ),
  },
  {
    id: "return", label: "Return", group: "Core", defaultVisible: true,
    renderCell: (t) => {
      const ret = getReturnPct(t);
      if (!ret) return DASH;
      return (
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${ret.startsWith("+") ? "bg-win/10 text-win" : "bg-loss/10 text-loss"}`}>
          {ret}
        </span>
      );
    },
  },
  {
    id: "fees", label: "Fees", group: "Core", sortKey: "fees", align: "right",
    sortFn: (a, b) => a.fees - b.fees,
    renderCell: (t) => <span className="text-xs text-muted tabular-nums">${t.fees.toFixed(2)}</span>,
  },
  {
    id: "emotion", label: "Emotion", group: "Psychology",
    renderCell: (t) => t.emotion
      ? <span className="px-1.5 py-0.5 rounded-md bg-accent/10 text-accent text-[10px]">{t.emotion}</span>
      : DASH,
  },
  {
    id: "setup", label: "Setup", group: "Meta",
    renderCell: (t) => <span className="text-xs text-muted">{t.setup_type ?? "\u2014"}</span>,
  },
  {
    id: "sl", label: "SL", group: "Planning", align: "right",
    renderCell: (t) => <span className="text-xs text-muted tabular-nums">{t.stop_loss !== null ? `$${t.stop_loss.toFixed(2)}` : "\u2014"}</span>,
  },
  {
    id: "tp", label: "TP", group: "Planning", align: "right",
    renderCell: (t) => <span className="text-xs text-muted tabular-nums">{t.profit_target !== null ? `$${t.profit_target.toFixed(2)}` : "\u2014"}</span>,
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
    id: "notes", label: "Notes", group: "Meta",
    renderCell: (t) => <span className="text-xs text-muted">{t.notes ? t.notes.slice(0, 30) + (t.notes.length > 30 ? "..." : "") : "\u2014"}</span>,
  },
  {
    id: "commit", label: "Commit", group: "Metrics", align: "right",
    renderCell: (t) => <span className="text-xs text-muted tabular-nums">${getTotalCommitment(t).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>,
  },
  {
    id: "quarter", label: "Quarter", group: "Meta",
    renderCell: (t) => {
      const q = getQuarterLabel(t.close_timestamp);
      return <span className="text-xs text-muted">{q ?? "\u2014"}</span>;
    },
  },
  // MAE/MFE
  {
    id: "mae_dollar", label: "MAE $", group: "MAE/MFE", align: "right",
    renderCell: (t) => { const v = calculateTradeMAE(t); return v === null ? DASH : <span className="text-xs text-loss">${v.toFixed(2)}</span>; },
  },
  {
    id: "mfe_dollar", label: "MFE $", group: "MAE/MFE", align: "right",
    renderCell: (t) => { const v = calculateTradeMFE(t); return v === null ? DASH : <span className="text-xs text-win">${v.toFixed(2)}</span>; },
  },
  {
    id: "price_mae", label: "Price MAE", group: "MAE/MFE", align: "right",
    renderCell: (t) => t.price_mae != null ? <span className="text-xs text-muted tabular-nums">${t.price_mae.toFixed(2)}</span> : DASH,
  },
  {
    id: "price_mfe", label: "Price MFE", group: "MAE/MFE", align: "right",
    renderCell: (t) => t.price_mfe != null ? <span className="text-xs text-muted tabular-nums">${t.price_mfe.toFixed(2)}</span> : DASH,
  },
  {
    id: "mfe_mae_ratio", label: "MFE/MAE", group: "MAE/MFE", align: "right",
    renderCell: (t) => { const v = getMfeMaeRatio(t); return v === null ? DASH : <span className="text-xs text-muted">{v.toFixed(2)}</span>; },
  },
  {
    id: "mfe_pct", label: "MFE %", group: "MAE/MFE", align: "right",
    renderCell: (t) => { const v = getPriceMfePct(t); return v === null ? DASH : <span className={`text-xs ${v >= 0 ? "text-win" : "text-loss"}`}>{v >= 0 ? "+" : ""}{v.toFixed(2)}%</span>; },
  },
  {
    id: "mae_pct", label: "MAE %", group: "MAE/MFE", align: "right",
    renderCell: (t) => { const v = getPriceMaePct(t); return v === null ? DASH : <span className="text-xs text-loss">{v.toFixed(2)}%</span>; },
  },
  {
    id: "time_till_mfe", label: "Time till MFE", group: "MAE/MFE",
    renderCell: (t) => <span className="text-xs text-muted whitespace-nowrap">{formatDurationMs(getTimeTillMfe(t))}</span>,
  },
  {
    id: "time_till_mae", label: "Time till MAE", group: "MAE/MFE",
    renderCell: (t) => <span className="text-xs text-muted whitespace-nowrap">{formatDurationMs(getTimeTillMae(t))}</span>,
  },
  {
    id: "time_after_mfe", label: "Time after MFE", group: "MAE/MFE",
    renderCell: (t) => <span className="text-xs text-muted whitespace-nowrap">{formatDurationMs(getTimeAfterMfe(t))}</span>,
  },
  {
    id: "time_after_mae", label: "Time after MAE", group: "MAE/MFE",
    renderCell: (t) => <span className="text-xs text-muted whitespace-nowrap">{formatDurationMs(getTimeAfterMae(t))}</span>,
  },
  // Exit Quality
  {
    id: "best_exit", label: "Best Exit", group: "Exit Quality", align: "right",
    renderCell: (t) => { const v = calculateBestExitPnl(t); return v === null ? DASH : <span className={`text-xs font-semibold ${v >= 0 ? "text-win" : "text-loss"}`}>${v.toFixed(2)}</span>; },
  },
  {
    id: "efficiency", label: "Efficiency", group: "Exit Quality", align: "right",
    renderCell: (t) => { const v = calculateExitEfficiency(t); return v === null ? DASH : <span className="text-xs text-muted">{v.toFixed(1)}%</span>; },
  },
  {
    id: "best_r", label: "Best R", group: "Exit Quality", align: "right",
    renderCell: (t) => { const v = calculateBestExitR(t); const f = formatRMultiple(v); return !f ? DASH : <span className={`text-xs font-semibold ${v! >= 0 ? "text-win" : "text-loss"}`}>{f}</span>; },
  },
  // P&L (last column to match original layout)
  {
    id: "pnl", label: "P&L", group: "Core", sortKey: "pnl", defaultVisible: true,
    sortFn: (a, b) => (a.pnl ?? 0) - (b.pnl ?? 0),
    renderCell: (t) => t.pnl !== null ? (
      <span className={`text-sm font-bold ${t.pnl >= 0 ? "text-win" : "text-loss"}`}>
        {t.pnl >= 0 ? "+" : ""}${t.pnl.toFixed(2)}
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 text-[10px] text-accent font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
        Live
      </span>
    ),
  },
];

// ---------------------------------------------------------------------------
// Table config (lightweight — no filters, no sidebar)
// ---------------------------------------------------------------------------

const TABLE_CONFIG: TableConfig<Trade> = {
  columns: POSITIONS_COLUMNS,
  filters: [],
  storageKey: "stargate-positions-table",
  tableName: "trades",
  getId: (t) => t.id,
  getSymbol: (t) => t.symbol,
  getDate: (t) => t.open_timestamp.slice(0, 10),
  isOpen: (t) => t.exit_price === null,
  defaultSortKey: "open_timestamp",
  defaultSortDir: "desc",
  defaultPageSize: 10,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TradesTable({
  trades,
  onEdit,
}: {
  trades: Trade[];
  onEdit?: (trade: Trade) => void;
}) {
  const router = useRouter();
  const { viewMode } = useTheme();
  const { paginatedData, totalItems, totalPages, state, actions } = useTableState(TABLE_CONFIG, trades);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Derive columns directly from viewMode — no localStorage race condition
  const displayColumns = useMemo(() =>
    viewMode === "expert" ? POSITIONS_COLUMNS : POSITIONS_COLUMNS.filter(c => c.defaultVisible),
    [viewMode]
  );

  const totalCols = displayColumns.length + 1; // +1 for actions column

  return (
    <div className="glass rounded-2xl border border-border/50 overflow-hidden flex flex-col" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Positions</h3>
        <span className="text-[10px] text-muted">{trades.length} total</span>
      </div>
      <div className="overflow-x-auto">
        <div className="max-h-[600px] overflow-y-auto">
          <table className="w-full">
            <thead className="bg-background/30 sticky top-0 z-10">
              <tr>
                <th className="w-[80px] px-2 py-2.5" />
                {displayColumns.map((col) => (
                  <th
                    key={col.id}
                    onClick={() => col.sortKey && actions.toggleSort(col.sortKey)}
                    className={`px-4 py-2.5 text-left text-[10px] text-muted uppercase tracking-widest font-semibold ${col.sortKey ? "cursor-pointer hover:text-foreground transition-colors" : ""} ${col.align === "right" ? "text-right" : ""}`}
                  >
                    {col.label} {state.sortKey === col.sortKey ? (state.sortDir === "asc" ? "\u2191" : "\u2193") : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={totalCols} className="px-4 py-10 text-center text-muted text-sm">
                    No positions. Log your first trade.
                  </td>
                </tr>
              ) : (
                paginatedData.map((trade) => {
                  const isExpanded = expandedId === trade.id;
                  return (
                    <Fragment key={trade.id}>
                      <tr className="hover:bg-surface-hover/50 transition-colors">
                        <td className="px-2 py-2.5">
                          <TradeRowActions
                            onView={() => router.push(`/dashboard/trades/${trade.id}`)}
                            onEdit={onEdit ? () => onEdit(trade) : undefined}
                            onExpand={() => setExpandedId(isExpanded ? null : trade.id)}
                            isExpanded={isExpanded}
                          />
                        </td>
                        {displayColumns.map((col) => (
                          <td key={col.id} className={`px-4 py-2.5 ${col.align === "right" ? "text-right" : ""}`}>
                            {col.renderCell(trade)}
                          </td>
                        ))}
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={totalCols} className="p-0">
                            <div className="px-6 py-4 bg-background/50 border-b border-border/50 space-y-3">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                <div>
                                  <span className="text-muted/60 uppercase tracking-wider text-[10px]">Entry Price</span>
                                  <p className="text-foreground font-medium mt-0.5">${trade.entry_price.toFixed(4)}</p>
                                </div>
                                <div>
                                  <span className="text-muted/60 uppercase tracking-wider text-[10px]">Exit Price</span>
                                  <p className="text-foreground font-medium mt-0.5">{trade.exit_price !== null ? `$${trade.exit_price.toFixed(4)}` : "—"}</p>
                                </div>
                                <div>
                                  <span className="text-muted/60 uppercase tracking-wider text-[10px]">Quantity</span>
                                  <p className="text-foreground font-medium mt-0.5">{trade.quantity}</p>
                                </div>
                                <div>
                                  <span className="text-muted/60 uppercase tracking-wider text-[10px]">Fees</span>
                                  <p className="text-foreground font-medium mt-0.5">${trade.fees.toFixed(2)}</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                <div>
                                  <span className="text-muted/60 uppercase tracking-wider text-[10px]">Setup</span>
                                  <p className="text-foreground font-medium mt-0.5">{trade.setup_type ?? "—"}</p>
                                </div>
                                <div>
                                  <span className="text-muted/60 uppercase tracking-wider text-[10px]">Emotion</span>
                                  <p className="text-foreground font-medium mt-0.5">{trade.emotion ?? "—"}</p>
                                </div>
                                <div>
                                  <span className="text-muted/60 uppercase tracking-wider text-[10px]">R-Multiple</span>
                                  <p className="text-foreground font-medium mt-0.5">{formatRMultiple(calculateRMultiple(trade)) ?? "—"}</p>
                                </div>
                                <div>
                                  <span className="text-muted/60 uppercase tracking-wider text-[10px]">Duration</span>
                                  <p className="text-foreground font-medium mt-0.5">{formatDuration(trade.open_timestamp, trade.close_timestamp)}</p>
                                </div>
                              </div>
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
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      {totalPages > 1 && (
        <Pagination
          page={state.page}
          pageSize={state.pageSize}
          totalItems={totalItems}
          totalPages={totalPages}
          onPageChange={actions.setPage}
          onPageSizeChange={actions.setPageSize}
        />
      )}
    </div>
  );
}

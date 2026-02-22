"use client";

import { Trade } from "@/lib/types";
import { useState } from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

type SortKey = "open_timestamp" | "close_timestamp" | "symbol" | "pnl";
type SortDir = "asc" | "desc";

export function TradesTable({
  trades,
  onEdit,
}: {
  trades: Trade[];
  onEdit?: (trade: Trade) => void;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("open_timestamp");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const sorted = [...trades].sort((a, b) => {
    const aVal = a[sortKey] ?? "";
    const bVal = b[sortKey] ?? "";
    const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    return sortDir === "asc" ? cmp : -cmp;
  });

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "\u2014";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getReturnPct(trade: Trade): string | null {
    if (trade.exit_price === null || trade.entry_price === 0) return null;
    const direction = trade.position === "long" ? 1 : -1;
    const pct = ((trade.exit_price - trade.entry_price) / trade.entry_price) * 100 * direction;
    return `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`;
  }

  const SortHeader = ({ label, field }: { label: string; field: SortKey }) => (
    <th
      onClick={() => handleSort(field)}
      className="px-4 py-2.5 text-left text-[10px] text-muted uppercase tracking-widest cursor-pointer hover:text-foreground transition-colors font-semibold"
    >
      {label} {sortKey === field ? (sortDir === "asc" ? "\u2191" : "\u2193") : ""}
    </th>
  );

  return (
    <div className="glass rounded-2xl border border-border/50 overflow-hidden flex flex-col" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Positions</h3>
        <span className="text-[10px] text-muted">{trades.length} total</span>
      </div>
      <div className="overflow-x-auto">
        <div className="max-h-[340px] overflow-y-auto">
          <table className="w-full">
            <thead className="bg-background/30 sticky top-0 z-10">
              <tr>
                <SortHeader label="Pair" field="symbol" />
                <th className="px-4 py-2.5 text-left text-[10px] text-muted uppercase tracking-widest font-semibold">
                  Side
                </th>
                <SortHeader label="Opened" field="open_timestamp" />
                <SortHeader label="Closed" field="close_timestamp" />
                <th className="px-4 py-2.5 text-left text-[10px] text-muted uppercase tracking-widest font-semibold">
                  Return
                </th>
                <SortHeader label="P&L" field="pnl" />
                {onEdit && <th className="px-4 py-2.5" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-muted text-sm">
                    No positions. Log your first trade.
                  </td>
                </tr>
              ) : (
                sorted.map((trade) => {
                  const returnPct = getReturnPct(trade);
                  return (
                    <tr
                      key={trade.id}
                      className="hover:bg-surface-hover/50 transition-colors"
                    >
                      <td className="px-4 py-2.5">
                        <span className="text-sm font-bold text-foreground">
                          {trade.symbol}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                            trade.position === "long"
                              ? "bg-win/10 text-win"
                              : "bg-loss/10 text-loss"
                          }`}
                        >
                          {trade.position === "long" ? (
                            <ArrowUpRight size={10} />
                          ) : (
                            <ArrowDownRight size={10} />
                          )}
                          {trade.position.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted">
                        {formatDate(trade.open_timestamp)}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted">
                        {formatDate(trade.close_timestamp)}
                      </td>
                      <td className="px-4 py-2.5">
                        {returnPct ? (
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                              returnPct.startsWith("+")
                                ? "bg-win/10 text-win"
                                : "bg-loss/10 text-loss"
                            }`}
                          >
                            {returnPct}
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted/50">\u2014</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        {trade.pnl !== null ? (
                          <span
                            className={`text-sm font-bold ${
                              trade.pnl >= 0 ? "text-win" : "text-loss"
                            }`}
                          >
                            {trade.pnl >= 0 ? "+" : ""}${trade.pnl.toFixed(2)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] text-accent font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                            Live
                          </span>
                        )}
                      </td>
                      {onEdit && (
                        <td className="px-4 py-2.5">
                          <button
                            onClick={() => onEdit(trade)}
                            className="text-[10px] text-muted hover:text-accent transition-colors px-1.5 py-0.5 rounded-md hover:bg-accent/10"
                          >
                            Edit
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

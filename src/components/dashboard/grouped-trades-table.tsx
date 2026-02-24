"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trade, CHAINS } from "@/lib/types";
import { calculateTradePnl } from "@/lib/calculations";
import { GroupSummary } from "@/lib/trade-grouping";
import { ChevronDown, ChevronRight, ArrowUpDown } from "lucide-react";

type SortKey = "pnl" | "count" | "winRate" | "avgPnl";

interface GroupedTradesTableProps {
  groups: GroupSummary[];
}

export function GroupedTradesTable({ groups }: GroupedTradesTableProps) {
  const router = useRouter();
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>("pnl");
  const [sortAsc, setSortAsc] = useState(false);

  const sorted = [...groups].sort((a, b) => {
    const dir = sortAsc ? 1 : -1;
    switch (sortKey) {
      case "pnl":
        return dir * (a.totalPnl - b.totalPnl);
      case "count":
        return dir * (a.tradeCount - b.tradeCount);
      case "winRate":
        return dir * (a.winRate - b.winRate);
      case "avgPnl":
        return dir * (a.avgPnl - b.avgPnl);
      default:
        return 0;
    }
  });

  function toggleExpand(key: string) {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(false);
    }
  }

  if (groups.length === 0) {
    return (
      <div className="text-center py-16 text-muted">
        <p className="text-lg font-semibold text-foreground mb-2">No trades yet</p>
        <p className="text-sm">Import or add trades to see grouped analysis.</p>
      </div>
    );
  }

  return (
    <div
      className="bg-surface rounded-2xl border border-border overflow-hidden"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      {/* Sort controls */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/50 text-[10px] uppercase tracking-wider text-muted/60 font-semibold">
        <span className="flex-1">Group</span>
        {(
          [
            { key: "count" as SortKey, label: "Trades" },
            { key: "winRate" as SortKey, label: "Win Rate" },
            { key: "pnl" as SortKey, label: "Total P&L" },
            { key: "avgPnl" as SortKey, label: "Avg P&L" },
          ] as const
        ).map((col) => (
          <button
            key={col.key}
            onClick={() => toggleSort(col.key)}
            className="w-24 text-right flex items-center justify-end gap-1 cursor-pointer hover:text-muted select-none"
          >
            {col.label}
            <ArrowUpDown
              size={10}
              className={sortKey === col.key ? "text-accent" : "text-muted/30"}
            />
          </button>
        ))}
      </div>

      {/* Group rows */}
      {sorted.map((group) => {
        const isExpanded = expandedKeys.has(group.key);
        return (
          <div key={group.key}>
            {/* Group header */}
            <button
              onClick={() => toggleExpand(group.key)}
              className="w-full flex items-center gap-2 px-4 py-3 hover:bg-surface-hover transition-colors border-b border-border/30 text-left"
            >
              {isExpanded ? (
                <ChevronDown size={14} className="text-accent shrink-0" />
              ) : (
                <ChevronRight size={14} className="text-muted shrink-0" />
              )}
              <span className="flex-1 font-semibold text-sm text-foreground">{group.label}</span>
              <span className="w-24 text-right text-xs text-muted tabular-nums">
                {group.tradeCount}
              </span>
              <span className="w-24 text-right text-xs tabular-nums">
                <span
                  className={group.winRate >= 50 ? "text-win" : "text-loss"}
                >
                  {group.winRate.toFixed(1)}%
                </span>
              </span>
              <span
                className={`w-24 text-right text-xs font-semibold tabular-nums ${
                  group.totalPnl >= 0 ? "text-win" : "text-loss"
                }`}
              >
                ${group.totalPnl.toFixed(2)}
              </span>
              <span
                className={`w-24 text-right text-xs tabular-nums ${
                  group.avgPnl >= 0 ? "text-win" : "text-loss"
                }`}
              >
                ${group.avgPnl.toFixed(2)}
              </span>
            </button>

            {/* Expanded child trades */}
            {isExpanded && (
              <div className="bg-background/50">
                <div className="grid grid-cols-[1fr_80px_60px_90px_90px_100px] gap-0 text-[10px] uppercase tracking-wider text-muted/50 font-semibold px-4 py-1.5 pl-10 border-b border-border/20">
                  <span>Date</span>
                  <span>Symbol</span>
                  <span>Side</span>
                  <span className="text-right">Entry</span>
                  <span className="text-right">Exit</span>
                  <span className="text-right">P&L</span>
                </div>
                {group.trades.map((trade) => {
                  const pnl = trade.pnl ?? calculateTradePnl(trade) ?? 0;
                  return (
                    <div
                      key={trade.id}
                      onClick={() => router.push(`/dashboard/trades/${trade.id}`)}
                      className="grid grid-cols-[1fr_80px_60px_90px_90px_100px] gap-0 px-4 py-2 pl-10 border-b border-border/10 hover:bg-surface-hover cursor-pointer transition-colors text-xs"
                    >
                      <span className="text-muted">
                        {new Date(trade.open_timestamp).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <span className="font-medium text-foreground flex items-center gap-1">
                        {trade.symbol}
                        {trade.trade_source === "dex" && trade.chain && (
                          <span className="text-[9px] px-1 py-0.5 rounded bg-accent/10 text-accent">
                            {CHAINS.find((c) => c.id === trade.chain)?.label ?? trade.chain}
                          </span>
                        )}
                      </span>
                      <span>
                        <span
                          className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${
                            trade.position === "long" ? "bg-win/10 text-win" : "bg-loss/10 text-loss"
                          }`}
                        >
                          {trade.position.toUpperCase()}
                        </span>
                      </span>
                      <span className="text-right text-muted tabular-nums">
                        ${trade.entry_price.toFixed(2)}
                      </span>
                      <span className="text-right text-muted tabular-nums">
                        {trade.exit_price !== null ? `$${trade.exit_price.toFixed(2)}` : "—"}
                      </span>
                      <span
                        className={`text-right font-semibold tabular-nums ${
                          pnl >= 0 ? "text-win" : "text-loss"
                        }`}
                      >
                        {trade.exit_price !== null ? `$${pnl.toFixed(2)}` : "Open"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

"use client";

import { ArrowUpDown } from "lucide-react";
import type { OptionsFlowRow, SortKey, SortDir } from "./options-flow-types";
import { formatPremium } from "./options-flow-utils";

interface FlowTableTabProps {
  flows: OptionsFlowRow[];
  onSymbolClick: (symbol: string) => void;
  visibleCount: number;
  onLoadMore: () => void;
  hasMore: boolean;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
}

function SentimentBadge({ sentiment }: { sentiment: "bullish" | "bearish" | "neutral" }) {
  const cls =
    sentiment === "bullish"
      ? "bg-win/10 text-win border-win/20"
      : sentiment === "bearish"
      ? "bg-loss/10 text-loss border-loss/20"
      : "bg-surface text-muted border-border/50";
  return (
    <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${cls}`}>
      {sentiment}
    </span>
  );
}

function SortableHeader({
  label,
  sortKey: key,
  currentKey,
  currentDir,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  currentKey: SortKey;
  currentDir: SortDir;
  onSort: (key: SortKey) => void;
}) {
  const isActive = currentKey === key;
  return (
    <th
      onClick={() => onSort(key)}
      className="px-3 py-3 text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold cursor-pointer hover:text-foreground transition-colors select-none"
    >
      <span className="flex items-center gap-1">
        {label}
        <ArrowUpDown
          size={10}
          className={isActive ? "text-accent" : "text-muted/30"}
          style={isActive && currentDir === "asc" ? { transform: "scaleY(-1)" } : undefined}
        />
      </span>
    </th>
  );
}

export default function FlowTableTab({
  flows,
  onSymbolClick,
  visibleCount,
  onLoadMore,
  hasMore,
  sortKey,
  sortDir,
  onSort,
}: FlowTableTabProps) {
  const visible = flows.slice(0, visibleCount);

  return (
    <div className="space-y-3">
      <div
        className="glass rounded-2xl border border-border/50 overflow-hidden"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-surface/30">
                <SortableHeader label="Time" sortKey="time" currentKey={sortKey} currentDir={sortDir} onSort={onSort} />
                <SortableHeader label="Symbol" sortKey="symbol" currentKey={sortKey} currentDir={sortDir} onSort={onSort} />
                <SortableHeader label="Expiry" sortKey="expiry" currentKey={sortKey} currentDir={sortDir} onSort={onSort} />
                <SortableHeader label="Strike" sortKey="strike" currentKey={sortKey} currentDir={sortDir} onSort={onSort} />
                <th className="px-3 py-3 text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold">Type</th>
                <SortableHeader label="Volume" sortKey="volume" currentKey={sortKey} currentDir={sortDir} onSort={onSort} />
                <SortableHeader label="OI" sortKey="openInterest" currentKey={sortKey} currentDir={sortDir} onSort={onSort} />
                <SortableHeader label="Premium" sortKey="premium" currentKey={sortKey} currentDir={sortDir} onSort={onSort} />
                <th className="px-3 py-3 text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold">Sentiment</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((f, idx) => (
                <tr
                  key={`${f.symbol}-${f.strike}-${f.rawTimestamp}-${idx}`}
                  className={`border-b border-border/20 hover:bg-surface-hover/50 transition-colors ${
                    idx % 2 === 1 ? "bg-surface/10" : ""
                  }`}
                >
                  <td className="px-3 py-2.5 text-xs text-muted tabular-nums">{f.time}</td>
                  <td className="px-3 py-2.5">
                    <button
                      onClick={() => onSymbolClick(f.symbol)}
                      className="text-xs font-bold text-accent hover:underline"
                    >
                      {f.symbol}
                    </button>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-muted tabular-nums">{f.expiry}</td>
                  <td className="px-3 py-2.5 text-xs font-semibold text-foreground tabular-nums">
                    ${f.strike.toLocaleString()}
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        f.type === "C"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-red-500/10 text-red-400"
                      }`}
                    >
                      {f.type === "C" ? "CALL" : "PUT"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-xs tabular-nums text-foreground">
                    {f.volume.toLocaleString()}
                  </td>
                  <td className="px-3 py-2.5 text-xs tabular-nums text-muted">
                    {f.openInterest.toLocaleString()}
                  </td>
                  <td className="px-3 py-2.5 text-xs font-bold tabular-nums text-foreground">
                    {formatPremium(f.premium)}
                  </td>
                  <td className="px-3 py-2.5">
                    <SentimentBadge sentiment={f.sentiment} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {hasMore && (
          <div className="flex justify-center py-3 border-t border-border/30">
            <button
              onClick={onLoadMore}
              className="px-6 py-2 rounded-lg text-xs font-semibold text-accent hover:bg-accent/10 transition-all"
            >
              Show More ({flows.length - visibleCount} remaining)
            </button>
          </div>
        )}
      </div>

      <p className="text-[10px] text-muted/40 text-center">
        Showing {Math.min(visibleCount, flows.length)} of {flows.length} entries
      </p>
    </div>
  );
}

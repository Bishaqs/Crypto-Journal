"use client";

import { useState } from "react";
import { ArrowUpDown } from "lucide-react";
import type { SymbolSummary } from "./options-flow-types";
import { formatPremium } from "./options-flow-utils";

type SymbolSortKey = "symbol" | "sector" | "totalFlows" | "totalPremium" | "avgPremium" | "bullishPct" | "bearishPct" | "callPutRatio";

interface SymbolSummaryTabProps {
  summaries: SymbolSummary[];
  onSymbolClick: (symbol: string) => void;
  selectedSymbol: string | null;
}

function StatBlock({ label, value, color = "text-foreground" }: { label: string; value: string; color?: string }) {
  return (
    <div className="glass rounded-xl border border-border/50 p-4 hover:border-accent/20 transition-all duration-300" style={{ boxShadow: "var(--shadow-card)" }}>
      <p className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}

function SortHeader({
  label,
  sortKey: key,
  currentKey,
  currentDir,
  onSort,
}: {
  label: string;
  sortKey: SymbolSortKey;
  currentKey: SymbolSortKey;
  currentDir: "asc" | "desc";
  onSort: (key: SymbolSortKey) => void;
}) {
  const isActive = currentKey === key;
  return (
    <th
      onClick={() => onSort(key)}
      className="px-3 py-3 text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold cursor-pointer hover:text-foreground transition-colors select-none"
    >
      <span className="flex items-center gap-1">
        {label}
        <ArrowUpDown size={10} className={isActive ? "text-accent" : "text-muted/30"} />
      </span>
    </th>
  );
}

export default function SymbolSummaryTab({ summaries, onSymbolClick, selectedSymbol }: SymbolSummaryTabProps) {
  const [sortKey, setSortKey] = useState<SymbolSortKey>("totalPremium");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  function handleSort(key: SymbolSortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const sorted = [...summaries].sort((a, b) => {
    const va = a[sortKey];
    const vb = b[sortKey];
    if (typeof va === "string" && typeof vb === "string") {
      return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    }
    const na = Number(va);
    const nb = Number(vb);
    return sortDir === "asc" ? na - nb : nb - na;
  });

  const mostActive = summaries.reduce((b, s) => (s.totalFlows > b.totalFlows ? s : b), summaries[0]);
  const highestPremium = summaries.reduce((b, s) => (s.totalPremium > b.totalPremium ? s : b), summaries[0]);
  const mostBullish = summaries.reduce((b, s) => (s.bullishPct > b.bullishPct ? s : b), summaries[0]);
  const mostBearish = summaries.reduce((b, s) => (s.bearishPct > b.bearishPct ? s : b), summaries[0]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatBlock
          label="Most Active"
          value={mostActive ? `${mostActive.symbol} (${mostActive.totalFlows} flows)` : "N/A"}
          color="text-accent"
        />
        <StatBlock
          label="Highest Premium"
          value={highestPremium ? `${highestPremium.symbol} (${formatPremium(highestPremium.totalPremium)})` : "N/A"}
          color="text-foreground"
        />
        <StatBlock
          label="Most Bullish"
          value={mostBullish ? `${mostBullish.symbol} (${mostBullish.bullishPct.toFixed(0)}%)` : "N/A"}
          color="text-win"
        />
        <StatBlock
          label="Most Bearish"
          value={mostBearish ? `${mostBearish.symbol} (${mostBearish.bearishPct.toFixed(0)}%)` : "N/A"}
          color="text-loss"
        />
      </div>

      <div
        className="glass rounded-2xl border border-border/50 overflow-hidden"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-surface/30">
                <SortHeader label="Symbol" sortKey="symbol" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
                <SortHeader label="Sector" sortKey="sector" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
                <SortHeader label="Flows" sortKey="totalFlows" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
                <SortHeader label="Total Premium" sortKey="totalPremium" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
                <SortHeader label="Avg Premium" sortKey="avgPremium" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
                <SortHeader label="Bullish %" sortKey="bullishPct" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
                <SortHeader label="Bearish %" sortKey="bearishPct" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
                <SortHeader label="C/P Ratio" sortKey="callPutRatio" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
              </tr>
            </thead>
            <tbody>
              {sorted.map((s, idx) => (
                <tr
                  key={s.symbol}
                  onClick={() => onSymbolClick(s.symbol)}
                  className={`border-b border-border/20 cursor-pointer transition-colors ${
                    selectedSymbol === s.symbol
                      ? "bg-accent/5 border-l-2 border-l-accent"
                      : idx % 2 === 1
                      ? "bg-surface/10 hover:bg-surface-hover/50"
                      : "hover:bg-surface-hover/50"
                  }`}
                >
                  <td className="px-3 py-2.5 text-xs font-bold text-accent">{s.symbol}</td>
                  <td className="px-3 py-2.5 text-xs text-muted">{s.sector}</td>
                  <td className="px-3 py-2.5 text-xs text-foreground tabular-nums">{s.totalFlows}</td>
                  <td className="px-3 py-2.5 text-xs font-bold text-foreground tabular-nums">{formatPremium(s.totalPremium)}</td>
                  <td className="px-3 py-2.5 text-xs text-muted tabular-nums">{formatPremium(s.avgPremium)}</td>
                  <td className="px-3 py-2.5 text-xs tabular-nums text-win">{s.bullishPct.toFixed(0)}%</td>
                  <td className="px-3 py-2.5 text-xs tabular-nums text-loss">{s.bearishPct.toFixed(0)}%</td>
                  <td className="px-3 py-2.5 text-xs tabular-nums text-foreground">
                    {s.callPutRatio === Infinity ? "∞" : s.callPutRatio.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-[10px] text-muted/40 text-center">
        Click a symbol row to filter the Options Flow table
      </p>
    </div>
  );
}

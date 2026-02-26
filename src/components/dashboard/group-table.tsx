"use client";

import { type GroupSummary } from "@/lib/trade-grouping";

export function GroupTable({
  groups,
  valueLabel = "P&L",
}: {
  groups: GroupSummary[];
  valueLabel?: string;
}) {
  if (groups.length === 0) {
    return (
      <div className="glass rounded-2xl border border-border/50 p-8 text-center">
        <p className="text-muted text-sm">No data available</p>
      </div>
    );
  }

  return (
    <div
      className="glass rounded-2xl border border-border/50 overflow-hidden"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 text-left">
              <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-muted font-semibold w-10">#</th>
              <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-muted font-semibold">Name</th>
              <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-muted font-semibold text-right">Trades</th>
              <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-muted font-semibold text-right">Win Rate</th>
              <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-muted font-semibold text-right">{valueLabel}</th>
              <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-muted font-semibold text-right">Avg P&L</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g, i) => (
              <tr
                key={g.key}
                className="border-b border-border/30 last:border-0 hover:bg-surface-hover/50 transition-colors"
              >
                <td className="px-4 py-2.5 text-muted/60 text-xs">{i + 1}</td>
                <td className="px-4 py-2.5 font-medium text-foreground">{g.label}</td>
                <td className="px-4 py-2.5 text-right text-muted">{g.tradeCount}</td>
                <td className="px-4 py-2.5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-16 h-1.5 rounded-full bg-border/50 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{ width: `${Math.min(g.winRate, 100)}%` }}
                      />
                    </div>
                    <span className="text-muted text-xs w-10 text-right">
                      {g.winRate.toFixed(0)}%
                    </span>
                  </div>
                </td>
                <td
                  className={`px-4 py-2.5 text-right font-semibold ${
                    g.totalPnl >= 0 ? "text-win" : "text-loss"
                  }`}
                >
                  {g.totalPnl >= 0 ? "+" : ""}${g.totalPnl.toFixed(2)}
                </td>
                <td
                  className={`px-4 py-2.5 text-right text-xs ${
                    g.avgPnl >= 0 ? "text-win/70" : "text-loss/70"
                  }`}
                >
                  {g.avgPnl >= 0 ? "+" : ""}${g.avgPnl.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

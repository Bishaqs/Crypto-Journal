"use client";

import { useMemo } from "react";
import type { PanelState } from "@/lib/simulator/multi-sim-reducer";
import { SUPPORTED_SYMBOLS } from "@/lib/simulator/types";

interface MultiSessionSummaryProps {
  panels: [PanelState, PanelState, PanelState, PanelState];
}

const PANEL_COLORS = ["text-blue-400", "text-purple-400", "text-amber-400", "text-cyan-400"];

export default function MultiSessionSummary({ panels }: MultiSessionSummaryProps) {
  const stats = useMemo(() => {
    let totalTrades = 0;
    let totalWins = 0;
    let totalClosed = 0;
    let totalNetPnl = 0;

    const perPanel = panels.map((panel) => {
      const closed = panel.account.trades.filter((t) => t.pnl !== null);
      const wins = closed.filter((t) => t.pnl! > 0);
      const netPnl = closed.reduce((s, t) => s + t.pnl!, 0) + panel.account.position.unrealizedPnl;
      totalTrades += panel.account.trades.length;
      totalWins += wins.length;
      totalClosed += closed.length;
      totalNetPnl += netPnl;
      return { symbol: panel.symbol, netPnl, tradeCount: closed.length };
    });

    const winRate = totalClosed > 0 ? (totalWins / totalClosed) * 100 : 0;

    return { totalTrades, totalClosed, totalNetPnl, winRate, perPanel };
  }, [panels]);

  if (stats.totalTrades === 0) return null;

  const symbolLabel = (value: string) =>
    SUPPORTED_SYMBOLS.find((s) => s.value === value)?.label.split(" ")[0] ?? value;

  return (
    <div className="flex items-center gap-4 px-4 py-1 bg-[#111118] border-t border-white/5 text-[10px] overflow-x-auto shrink-0">
      <div className="flex items-center gap-1.5">
        <span className="text-gray-600">Trades</span>
        <span className="text-white font-mono">{stats.totalClosed}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-gray-600">Win Rate</span>
        <span
          className={`font-mono ${stats.winRate >= 50 ? "text-emerald-400" : "text-red-400"}`}
        >
          {stats.winRate.toFixed(0)}%
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-gray-600">Net PnL</span>
        <span
          className={`font-mono font-medium ${
            stats.totalNetPnl >= 0 ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {stats.totalNetPnl >= 0 ? "+" : ""}${stats.totalNetPnl.toFixed(2)}
        </span>
      </div>

      {/* Per-panel breakdown */}
      <div className="ml-auto flex items-center gap-3">
        {stats.perPanel.map((p, i) => (
          <div key={i} className="flex items-center gap-1">
            <span className={`font-medium ${PANEL_COLORS[i]}`}>
              {symbolLabel(p.symbol)}
            </span>
            <span
              className={`font-mono ${
                p.netPnl >= 0 ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {p.netPnl >= 0 ? "+" : ""}${p.netPnl.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

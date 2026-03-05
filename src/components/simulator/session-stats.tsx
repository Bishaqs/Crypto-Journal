"use client";

import { useMemo } from "react";
import type { SimTrade } from "@/lib/simulator/types";

interface SessionStatsProps {
  trades: SimTrade[];
  balance: number;
  startingBalance: number;
}

export default function SessionStats({ trades, balance, startingBalance }: SessionStatsProps) {
  const stats = useMemo(() => {
    const closingTrades = trades.filter((t) => t.pnl !== null);
    const wins = closingTrades.filter((t) => t.pnl! > 0);
    const losses = closingTrades.filter((t) => t.pnl! < 0);

    const totalWinPnl = wins.reduce((s, t) => s + t.pnl!, 0);
    const totalLossPnl = losses.reduce((s, t) => s + t.pnl!, 0);

    return {
      totalTrades: trades.length,
      closedTrades: closingTrades.length,
      winRate: closingTrades.length > 0 ? (wins.length / closingTrades.length) * 100 : 0,
      profitFactor: totalLossPnl !== 0 ? Math.abs(totalWinPnl / totalLossPnl) : wins.length > 0 ? Infinity : 0,
      avgWin: wins.length > 0 ? totalWinPnl / wins.length : 0,
      avgLoss: losses.length > 0 ? totalLossPnl / losses.length : 0,
      netPnl: closingTrades.reduce((s, t) => s + t.pnl!, 0),
      returnPct: ((balance - startingBalance) / startingBalance) * 100,
    };
  }, [trades, balance, startingBalance]);

  if (trades.length === 0) return null;

  return (
    <div className="flex items-center gap-4 px-4 py-1.5 bg-[#111118] border-t border-white/5 text-[11px] overflow-x-auto">
      <Stat label="Trades" value={`${stats.closedTrades}`} />
      <Stat
        label="Win Rate"
        value={`${stats.winRate.toFixed(0)}%`}
        color={stats.winRate >= 50 ? "text-emerald-400" : "text-red-400"}
      />
      <Stat
        label="PF"
        value={stats.profitFactor === Infinity ? "∞" : stats.profitFactor.toFixed(2)}
        color={stats.profitFactor >= 1 ? "text-emerald-400" : "text-red-400"}
      />
      <Stat
        label="Avg Win"
        value={`$${stats.avgWin.toFixed(2)}`}
        color="text-emerald-400"
      />
      <Stat
        label="Avg Loss"
        value={`$${Math.abs(stats.avgLoss).toFixed(2)}`}
        color="text-red-400"
      />
      <Stat
        label="Net PnL"
        value={`${stats.netPnl >= 0 ? "+" : ""}$${stats.netPnl.toFixed(2)}`}
        color={stats.netPnl >= 0 ? "text-emerald-400" : "text-red-400"}
      />
      <Stat
        label="Return"
        value={`${stats.returnPct >= 0 ? "+" : ""}${stats.returnPct.toFixed(2)}%`}
        color={stats.returnPct >= 0 ? "text-emerald-400" : "text-red-400"}
      />
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <span className="text-gray-500">{label}</span>
      <span className={`font-mono font-medium ${color ?? "text-white"}`}>{value}</span>
    </div>
  );
}

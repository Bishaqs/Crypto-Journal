"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trade } from "@/lib/types";
import { DEMO_TRADES } from "@/lib/demo-data";
import { useDateRange } from "@/lib/date-range-context";
import {
  calculateStats,
  calculateAdvancedStats,
  calculateDailyPnl,
  buildEquityCurve,
} from "@/lib/calculations";
import { EquityCurve } from "@/components/dashboard/equity-curve";
import { BarChart3, TrendingUp, Target, Percent, Award, TrendingDown } from "lucide-react";

export default function AccountsStatisticsPage() {
  const supabase = createClient();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingDemo, setUsingDemo] = useState(false);
  const { filterTrades } = useDateRange();

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

  useEffect(() => { fetchTrades(); }, [fetchTrades]);

  const filtered = useMemo(() => filterTrades(trades), [trades, filterTrades]);
  const stats = useMemo(() => calculateStats(filtered), [filtered]);
  const adv = useMemo(() => calculateAdvancedStats(filtered), [filtered]);
  const dailyPnl = useMemo(() => calculateDailyPnl(filtered), [filtered]);
  const equityData = useMemo(() => buildEquityCurve(dailyPnl), [dailyPnl]);

  const monthlyPnl = useMemo(() => {
    const map = new Map<string, { pnl: number; trades: number; wins: number }>();
    for (const t of filtered) {
      if (!t.close_timestamp) continue;
      const month = t.close_timestamp.slice(0, 7);
      const entry = map.get(month) ?? { pnl: 0, trades: 0, wins: 0 };
      const pnl = t.pnl ?? 0;
      entry.pnl += pnl;
      entry.trades += 1;
      if (pnl > 0) entry.wins += 1;
      map.set(month, entry);
    }
    return Array.from(map.entries())
      .map(([month, d]) => ({ month, ...d, winRate: d.trades > 0 ? (d.wins / d.trades) * 100 : 0 }))
      .sort((a, b) => b.month.localeCompare(a.month));
  }, [filtered]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    { label: "Total P&L", value: `$${stats.closedPnl.toFixed(2)}`, icon: TrendingUp, positive: stats.closedPnl >= 0 },
    { label: "Win Rate", value: `${stats.winRate.toFixed(1)}%`, icon: Target, positive: stats.winRate >= 50 },
    { label: "Profit Factor", value: stats.profitFactor.toFixed(2), icon: Percent, positive: stats.profitFactor >= 1 },
    { label: "Total Trades", value: String(stats.totalTrades), icon: BarChart3, positive: true },
    { label: "Avg Winner", value: `$${adv.avgWinner.toFixed(2)}`, icon: Award, positive: true },
    { label: "Avg Loser", value: `$${adv.avgLoser.toFixed(2)}`, icon: TrendingDown, positive: false },
  ];

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
          <BarChart3 size={20} className="text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Accounts Statistics</h1>
          <p className="text-sm text-muted">
            {usingDemo ? "Sample data" : `${filtered.length} trades in range`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((s) => (
          <div
            key={s.label}
            className="glass rounded-2xl border border-border/50 p-4"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <s.icon size={13} className="text-accent" />
              <span className="text-[10px] uppercase tracking-wider text-muted font-semibold">{s.label}</span>
            </div>
            <p className={`text-xl font-bold ${s.positive ? "text-win" : "text-loss"}`}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <EquityCurve data={equityData} />

      {monthlyPnl.length > 0 && (
        <div className="glass rounded-2xl border border-border/50 overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="px-5 py-4 border-b border-border/50">
            <h3 className="text-sm font-semibold text-foreground">Monthly Breakdown</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-left">
                  <th className="px-5 py-3 text-[10px] uppercase tracking-wider text-muted font-semibold">Month</th>
                  <th className="px-5 py-3 text-[10px] uppercase tracking-wider text-muted font-semibold text-right">Trades</th>
                  <th className="px-5 py-3 text-[10px] uppercase tracking-wider text-muted font-semibold text-right">Win Rate</th>
                  <th className="px-5 py-3 text-[10px] uppercase tracking-wider text-muted font-semibold text-right">P&L</th>
                </tr>
              </thead>
              <tbody>
                {monthlyPnl.map((m) => (
                  <tr key={m.month} className="border-b border-border/30 last:border-0 hover:bg-surface-hover/50 transition-colors">
                    <td className="px-5 py-2.5 font-medium text-foreground">{m.month}</td>
                    <td className="px-5 py-2.5 text-right text-muted">{m.trades}</td>
                    <td className="px-5 py-2.5 text-right text-muted">{m.winRate.toFixed(0)}%</td>
                    <td className={`px-5 py-2.5 text-right font-semibold ${m.pnl >= 0 ? "text-win" : "text-loss"}`}>
                      {m.pnl >= 0 ? "+" : ""}${m.pnl.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
// cache-bust-v3

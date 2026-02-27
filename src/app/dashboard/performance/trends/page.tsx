"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trade } from "@/lib/types";
import { DEMO_TRADES } from "@/lib/demo-data";
import { DemoBanner } from "@/components/demo-banner";
import { useDateRange } from "@/lib/date-range-context";
import { useTheme } from "@/lib/theme-context";
import { getChartColors } from "@/lib/chart-colors";
import { calculateDailyPnl, buildEquityCurve } from "@/lib/calculations";
import { StatBlock } from "@/components/ui/stat-block";
import { EquityCurve } from "@/components/dashboard/equity-curve";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { TrendingUp, Calendar, TrendingDown, Target, Hash } from "lucide-react";

export default function TrendAnalysisPage() {
  const supabase = createClient();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingDemo, setUsingDemo] = useState(false);
  const { filterTrades } = useDateRange();
  const { theme } = useTheme();
  const colors = getChartColors(theme);

  const fetchTrades = useCallback(async () => {
    const { data } = await supabase.from("trades").select("*").order("open_timestamp", { ascending: false });
    const dbTrades = (data as Trade[]) ?? [];
    if (dbTrades.length === 0) { setTrades(DEMO_TRADES); setUsingDemo(true); } else { setTrades(dbTrades); }
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchTrades(); }, [fetchTrades]);

  const filtered = useMemo(() => filterTrades(trades), [trades, filterTrades]);
  const closedTrades = useMemo(() => filtered.filter(t => t.exit_price !== null), [filtered]);
  const dailyPnl = useMemo(() => calculateDailyPnl(closedTrades), [closedTrades]);
  const equityCurve = useMemo(() => buildEquityCurve(dailyPnl), [dailyPnl]);

  const monthlyData = useMemo(() => {
    const monthMap = new Map<string, { trades: Trade[]; pnl: number }>();
    const sorted = [...closedTrades].filter(t => t.close_timestamp).sort((a, b) => a.close_timestamp!.localeCompare(b.close_timestamp!));
    for (const t of sorted) {
      const month = t.close_timestamp!.slice(0, 7);
      const entry = monthMap.get(month) ?? { trades: [], pnl: 0 };
      entry.trades.push(t);
      entry.pnl += t.pnl ?? 0;
      monthMap.set(month, entry);
    }
    return Array.from(monthMap.entries()).map(([month, data]) => {
      const wins = data.trades.filter(t => (t.pnl ?? 0) > 0).length;
      const total = data.trades.length;
      const winRate = total > 0 ? (wins / total) * 100 : 0;
      const grossWin = data.trades.filter(t => (t.pnl ?? 0) > 0).reduce((s, t) => s + (t.pnl ?? 0), 0);
      const grossLoss = Math.abs(data.trades.filter(t => (t.pnl ?? 0) < 0).reduce((s, t) => s + (t.pnl ?? 0), 0));
      const pf = grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? 99 : 0;
      return { month, pnl: parseFloat(data.pnl.toFixed(2)), trades: total, winRate: parseFloat(winRate.toFixed(1)), pf: parseFloat(pf.toFixed(2)) };
    }).sort((a, b) => a.month.localeCompare(b.month));
  }, [closedTrades]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>;

  const tooltipStyle = { background: colors.tooltipBg, backdropFilter: "blur(16px)", border: colors.tooltipBorder, borderRadius: "12px", fontSize: "12px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" };

  const bestMonth = monthlyData.length > 0 ? monthlyData.reduce((best, m) => m.pnl > best.pnl ? m : best, monthlyData[0]) : null;
  const worstMonth = monthlyData.length > 0 ? monthlyData.reduce((worst, m) => m.pnl < worst.pnl ? m : worst, monthlyData[0]) : null;
  const greenMonths = monthlyData.filter(m => m.pnl > 0).length;
  const greenPct = monthlyData.length > 0 ? (greenMonths / monthlyData.length) * 100 : 0;
  const avgMonthly = monthlyData.length > 0 ? monthlyData.reduce((s, m) => s + m.pnl, 0) / monthlyData.length : 0;

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {usingDemo && <DemoBanner />}
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2"><TrendingUp size={24} className="text-accent" />Trend Analysis</h1>
        <p className="text-sm text-muted mt-0.5">Monthly performance breakdown and cumulative equity growth</p>
      </div>

      {/* Monthly P&L chart */}
      {monthlyData.length > 0 && (
        <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <h3 className="text-sm font-semibold text-foreground mb-4">Monthly P&L</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
              <XAxis dataKey="month" tick={{ fill: colors.tick, fontSize: 10 }} tickFormatter={(v: string) => v.slice(2)} />
              <YAxis tick={{ fill: colors.tick, fontSize: 10 }} tickFormatter={(v: number) => `$${v}`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`$${v.toFixed(2)}`, "P&L"]} />
              <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                {monthlyData.map((d, i) => <Cell key={i} fill={d.pnl >= 0 ? colors.win : colors.loss} fillOpacity={0.85} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Equity curve */}
      <EquityCurve data={equityCurve} />

      {/* Monthly table */}
      {monthlyData.length > 0 && (
        <div className="glass rounded-2xl border border-border/50 p-5 overflow-x-auto" style={{ boxShadow: "var(--shadow-card)" }}>
          <h3 className="text-sm font-semibold text-foreground mb-4">Performance by Month</h3>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-2 text-muted font-semibold">Month</th>
                <th className="text-right py-2 text-muted font-semibold">Trades</th>
                <th className="text-right py-2 text-muted font-semibold">Win Rate</th>
                <th className="text-right py-2 text-muted font-semibold">P&L</th>
                <th className="text-right py-2 text-muted font-semibold">PF</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.map(m => (
                <tr key={m.month} className="border-b border-border/30 hover:bg-surface-hover/50 transition-colors">
                  <td className="py-2 text-foreground font-medium">{m.month}</td>
                  <td className="py-2 text-right text-muted">{m.trades}</td>
                  <td className={`py-2 text-right ${m.winRate >= 50 ? "text-win" : "text-loss"}`}>{m.winRate}%</td>
                  <td className={`py-2 text-right font-semibold ${m.pnl >= 0 ? "text-win" : "text-loss"}`}>{m.pnl >= 0 ? "+" : ""}${m.pnl.toFixed(0)}</td>
                  <td className={`py-2 text-right ${m.pf >= 1 ? "text-win" : "text-loss"}`}>{m.pf >= 10 ? "∞" : m.pf.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBlock label="Best Month" value={bestMonth ? `+$${bestMonth.pnl.toFixed(0)}` : "—"} sub={bestMonth?.month} icon={TrendingUp} color="text-win" />
        <StatBlock label="Worst Month" value={worstMonth ? `$${worstMonth.pnl.toFixed(0)}` : "—"} sub={worstMonth?.month} icon={TrendingDown} color="text-loss" />
        <StatBlock label="Green Months" value={`${greenPct.toFixed(0)}%`} sub={`${greenMonths} of ${monthlyData.length}`} icon={Target} color={greenPct >= 50 ? "text-win" : "text-loss"} />
        <StatBlock label="Avg Monthly P&L" value={`${avgMonthly >= 0 ? "+" : ""}$${avgMonthly.toFixed(0)}`} icon={Calendar} color={avgMonthly >= 0 ? "text-win" : "text-loss"} />
      </div>
    </div>
  );
}

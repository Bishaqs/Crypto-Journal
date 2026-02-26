"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trade } from "@/lib/types";
import { DEMO_TRADES } from "@/lib/demo-data";
import { useDateRange } from "@/lib/date-range-context";
import { groupTradesBySymbol } from "@/lib/trade-grouping";
import { useTheme } from "@/lib/theme-context";
import { getChartColors } from "@/lib/chart-colors";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { BarChart, DollarSign, TrendingUp, ArrowUp, ArrowDown } from "lucide-react";

export default function VolumePage() {
  const supabase = createClient();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingDemo, setUsingDemo] = useState(false);
  const { filterTrades } = useDateRange();
  const { theme } = useTheme();
  const colors = getChartColors(theme);

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

  const volumeStats = useMemo(() => {
    const volumes = filtered.map((t) => t.quantity * t.entry_price);
    const total = volumes.reduce((s, v) => s + v, 0);
    const avg = volumes.length > 0 ? total / volumes.length : 0;
    const max = volumes.length > 0 ? Math.max(...volumes) : 0;
    const min = volumes.length > 0 ? Math.min(...volumes) : 0;
    return { total, avg, max, min };
  }, [filtered]);

  const symbolVolumes = useMemo(() => {
    const symbolGroups = groupTradesBySymbol(filtered);
    return symbolGroups.map((g) => ({
      ...g,
      volume: g.trades.reduce((s, t) => s + t.quantity * t.entry_price, 0),
    })).sort((a, b) => b.volume - a.volume);
  }, [filtered]);

  const chartData = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of filtered) {
      const day = t.open_timestamp.split("T")[0];
      map.set(day, (map.get(day) ?? 0) + t.quantity * t.entry_price);
    }
    return Array.from(map.entries())
      .map(([date, volume]) => ({ date, volume }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30);
  }, [filtered]);

  function formatVolume(v: number): string {
    if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
    if (v >= 1e3) return `$${(v / 1e3).toFixed(1)}K`;
    return `$${v.toFixed(2)}`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
          <BarChart size={20} className="text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Volume</h1>
          <p className="text-sm text-muted">
            {usingDemo ? "Sample data" : `Trading volume across ${filtered.length} trades`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass rounded-2xl border border-border/50 p-4" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center gap-1.5 mb-2"><DollarSign size={13} className="text-accent" /><span className="text-[10px] uppercase tracking-wider text-muted font-semibold">Total Volume</span></div>
          <p className="text-xl font-bold text-foreground">{formatVolume(volumeStats.total)}</p>
        </div>
        <div className="glass rounded-2xl border border-border/50 p-4" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center gap-1.5 mb-2"><TrendingUp size={13} className="text-accent" /><span className="text-[10px] uppercase tracking-wider text-muted font-semibold">Avg / Trade</span></div>
          <p className="text-xl font-bold text-foreground">{formatVolume(volumeStats.avg)}</p>
        </div>
        <div className="glass rounded-2xl border border-border/50 p-4" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center gap-1.5 mb-2"><ArrowUp size={13} className="text-win" /><span className="text-[10px] uppercase tracking-wider text-muted font-semibold">Largest</span></div>
          <p className="text-xl font-bold text-foreground">{formatVolume(volumeStats.max)}</p>
        </div>
        <div className="glass rounded-2xl border border-border/50 p-4" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center gap-1.5 mb-2"><ArrowDown size={13} className="text-muted" /><span className="text-[10px] uppercase tracking-wider text-muted font-semibold">Smallest</span></div>
          <p className="text-xl font-bold text-foreground">{formatVolume(volumeStats.min)}</p>
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <h3 className="text-sm font-semibold text-foreground mb-4">Daily Volume (last 30 days)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <RechartsBarChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: colors.tick }} tickFormatter={(v) => v.slice(5)} axisLine={{ stroke: colors.grid }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: colors.tick }} tickFormatter={(v) => formatVolume(v)} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: colors.tooltipBg, backdropFilter: "blur(16px)", border: colors.tooltipBorder, borderRadius: "12px", fontSize: "12px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}
                formatter={(value: any) => [formatVolume(Number(value ?? 0)), "Volume"]}
              />
              <Bar dataKey="volume" fill={colors.accent} fillOpacity={0.85} radius={[4, 4, 0, 0]} />
            </RechartsBarChart>
          </ResponsiveContainer>
        </div>
      )}

      {symbolVolumes.length > 0 && (
        <div className="glass rounded-2xl border border-border/50 overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="px-5 py-4 border-b border-border/50">
            <h3 className="text-sm font-semibold text-foreground">Volume by Symbol</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-left">
                  <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-muted font-semibold w-10">#</th>
                  <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-muted font-semibold">Symbol</th>
                  <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-muted font-semibold text-right">Trades</th>
                  <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-muted font-semibold text-right">Volume</th>
                  <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-muted font-semibold text-right">P&L</th>
                </tr>
              </thead>
              <tbody>
                {symbolVolumes.map((s, i) => (
                  <tr key={s.key} className="border-b border-border/30 last:border-0 hover:bg-surface-hover/50 transition-colors">
                    <td className="px-4 py-2.5 text-muted/60 text-xs">{i + 1}</td>
                    <td className="px-4 py-2.5 font-medium text-foreground">{s.label}</td>
                    <td className="px-4 py-2.5 text-right text-muted">{s.tradeCount}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-foreground">{formatVolume(s.volume)}</td>
                    <td className={`px-4 py-2.5 text-right font-semibold ${s.totalPnl >= 0 ? "text-win" : "text-loss"}`}>
                      {s.totalPnl >= 0 ? "+" : ""}${s.totalPnl.toFixed(2)}
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

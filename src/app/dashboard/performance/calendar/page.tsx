"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trade } from "@/lib/types";
import { DEMO_TRADES } from "@/lib/demo-data";
import { DemoBanner } from "@/components/demo-banner";
import { useDateRange } from "@/lib/date-range-context";
import { useTheme } from "@/lib/theme-context";
import { getChartColors } from "@/lib/chart-colors";
import { calculateDailyPnl } from "@/lib/calculations";
import { StatBlock } from "@/components/ui/stat-block";
import { CalendarHeatmap } from "@/components/dashboard/calendar-heatmap";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { CalendarCheck, TrendingUp, TrendingDown, Sun, Hash } from "lucide-react";

export default function CalendarGroupedPage() {
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

  const stats = useMemo(() => {
    if (dailyPnl.length === 0) return { greenDays: 0, redDays: 0, greenPct: 0, bestDay: null as typeof dailyPnl[0] | null, worstDay: null as typeof dailyPnl[0] | null, avgDaily: 0 };
    const greenDays = dailyPnl.filter(d => d.pnl > 0).length;
    const redDays = dailyPnl.filter(d => d.pnl < 0).length;
    const greenPct = (greenDays / dailyPnl.length) * 100;
    const sorted = [...dailyPnl].sort((a, b) => b.pnl - a.pnl);
    const bestDay = sorted[0];
    const worstDay = sorted[sorted.length - 1];
    const avgDaily = dailyPnl.reduce((s, d) => s + d.pnl, 0) / dailyPnl.length;
    return { greenDays, redDays, greenPct, bestDay, worstDay, avgDaily };
  }, [dailyPnl]);

  const recentDays = useMemo(() => {
    return [...dailyPnl].sort((a, b) => a.date.localeCompare(b.date)).slice(-30);
  }, [dailyPnl]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>;

  const tooltipStyle = { background: colors.tooltipBg, backdropFilter: "blur(16px)", border: colors.tooltipBorder, borderRadius: "12px", fontSize: "12px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {usingDemo && <DemoBanner />}
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2"><CalendarCheck size={24} className="text-accent" />Calendar Grouped</h1>
        <p className="text-sm text-muted mt-0.5">Daily P&L displayed as a calendar heatmap</p>
      </div>

      {/* Main metric */}
      <div className="glass rounded-2xl border border-border/50 p-6" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="flex items-center gap-4">
          <div>
            <p className="text-[10px] text-muted font-semibold uppercase tracking-widest mb-1">Green Days</p>
            <p className={`text-4xl font-bold tracking-tight ${stats.greenPct >= 50 ? "text-win" : "text-loss"}`}>{stats.greenPct.toFixed(0)}%</p>
          </div>
          <span className="text-sm text-muted">{stats.greenDays} green / {stats.redDays} red out of {dailyPnl.length} trading days</span>
        </div>
      </div>

      {/* Calendar heatmap */}
      <CalendarHeatmap dailyPnl={dailyPnl} />

      {/* Daily P&L bar chart */}
      {recentDays.length > 0 && (
        <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <h3 className="text-sm font-semibold text-foreground mb-4">Daily P&L (Last 30 Days)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={recentDays}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
              <XAxis dataKey="date" tick={{ fill: colors.tick, fontSize: 10 }} tickFormatter={(v: string) => v.slice(5)} />
              <YAxis tick={{ fill: colors.tick, fontSize: 10 }} tickFormatter={(v: number) => `$${v}`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number | undefined) => [`$${(v ?? 0).toFixed(2)}`, "P&L"]} />
              <Bar dataKey="pnl" radius={[2, 2, 0, 0]}>
                {recentDays.map((d, i) => <Cell key={i} fill={d.pnl >= 0 ? colors.win : colors.loss} fillOpacity={0.85} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBlock label="Green Days" value={String(stats.greenDays)} icon={Sun} color="text-win" />
        <StatBlock label="Red Days" value={String(stats.redDays)} icon={Hash} color="text-loss" />
        <StatBlock label="Best Day" value={stats.bestDay ? `+$${stats.bestDay.pnl.toFixed(0)}` : "—"} sub={stats.bestDay?.date} icon={TrendingUp} color="text-win" />
        <StatBlock label="Worst Day" value={stats.worstDay ? `$${stats.worstDay.pnl.toFixed(0)}` : "—"} sub={stats.worstDay?.date} icon={TrendingDown} color="text-loss" />
      </div>
    </div>
  );
}

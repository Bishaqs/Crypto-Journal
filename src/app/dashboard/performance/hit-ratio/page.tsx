"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trade } from "@/lib/types";
import { DEMO_TRADES } from "@/lib/demo-data";
import { DemoBanner } from "@/components/demo-banner";
import { useDateRange } from "@/lib/date-range-context";
import { useTheme } from "@/lib/theme-context";
import { getChartColors } from "@/lib/chart-colors";
import { calculateStats, calculateAdvancedStats } from "@/lib/calculations";
import { StatBlock } from "@/components/ui/stat-block";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, ReferenceLine } from "recharts";
import { Gauge, TrendingUp, TrendingDown, Flame, Zap, Hash } from "lucide-react";

export default function HitRatioPage() {
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
  const stats = useMemo(() => calculateStats(closedTrades), [closedTrades]);
  const advanced = useMemo(() => calculateAdvancedStats(closedTrades), [closedTrades]);

  const rollingWinRate = useMemo(() => {
    const sorted = [...closedTrades].filter(t => t.close_timestamp).sort((a, b) => a.close_timestamp!.localeCompare(b.close_timestamp!));
    const window = 10;
    if (sorted.length < window) return [];
    const points: { date: string; winRate: number }[] = [];
    for (let i = window - 1; i < sorted.length; i++) {
      const slice = sorted.slice(i - window + 1, i + 1);
      const wins = slice.filter(t => (t.pnl ?? 0) > 0).length;
      points.push({ date: sorted[i].close_timestamp!.split("T")[0], winRate: parseFloat(((wins / window) * 100).toFixed(1)) });
    }
    return points;
  }, [closedTrades]);

  const dayOfWeekData = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return (advanced.pnlByDayOfWeek ?? []).map(d => ({ day: days[Number(d.day)] ?? d.day, winRate: parseFloat(d.winRate.toFixed(1)), count: d.count, pnl: d.pnl }));
  }, [advanced.pnlByDayOfWeek]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>;

  const tooltipStyle = { background: colors.tooltipBg, backdropFilter: "blur(16px)", border: colors.tooltipBorder, borderRadius: "12px", fontSize: "12px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" };
  const wr = stats.winRate;
  const circumference = 2 * Math.PI * 50;

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {usingDemo && <DemoBanner />}
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2"><Gauge size={24} className="text-accent" />Hit Ratio</h1>
        <p className="text-sm text-muted mt-0.5">Your win rate percentage across all closed trades</p>
      </div>

      {/* Donut + main metric */}
      <div className="glass rounded-2xl border border-border/50 p-6 flex flex-col sm:flex-row items-center gap-8" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="relative">
          <svg viewBox="0 0 120 120" className="w-36 h-36">
            <circle cx="60" cy="60" r="50" fill="none" stroke={colors.loss} strokeWidth="10" opacity={0.2} />
            <circle cx="60" cy="60" r="50" fill="none" stroke={colors.win} strokeWidth="10"
              strokeDasharray={`${(wr / 100) * circumference} ${circumference}`}
              strokeLinecap="round" transform="rotate(-90 60 60)" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-2xl font-bold ${wr >= 50 ? "text-win" : "text-loss"}`}>{wr.toFixed(1)}%</span>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-sm text-muted">{stats.wins} wins out of {stats.totalTrades} trades</p>
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-win" /><span className="text-xs text-muted">Wins: {stats.wins}</span></div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-loss" /><span className="text-xs text-muted">Losses: {stats.losses}</span></div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        {rollingWinRate.length > 0 && (
          <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
            <h3 className="text-sm font-semibold text-foreground mb-4">Rolling Win Rate (10-trade)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={rollingWinRate}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                <XAxis dataKey="date" tick={{ fill: colors.tick, fontSize: 10 }} tickFormatter={(v: string) => v.slice(5)} />
                <YAxis tick={{ fill: colors.tick, fontSize: 10 }} domain={[0, 100]} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number | undefined) => [`${v ?? 0}%`, "Win Rate"]} />
                <ReferenceLine y={50} stroke={colors.tick} strokeDasharray="3 3" strokeOpacity={0.4} />
                <Line type="monotone" dataKey="winRate" stroke={colors.accent} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        {dayOfWeekData.length > 0 && (
          <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
            <h3 className="text-sm font-semibold text-foreground mb-4">Win Rate by Day of Week</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dayOfWeekData}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                <XAxis dataKey="day" tick={{ fill: colors.tick, fontSize: 10 }} />
                <YAxis tick={{ fill: colors.tick, fontSize: 10 }} domain={[0, 100]} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number | undefined) => [`${v ?? 0}%`, "Win Rate"]} />
                <ReferenceLine y={50} stroke={colors.tick} strokeDasharray="3 3" strokeOpacity={0.4} />
                <Bar dataKey="winRate" radius={[4, 4, 0, 0]}>
                  {dayOfWeekData.map((d, i) => <Cell key={i} fill={d.winRate >= 50 ? colors.win : colors.loss} fillOpacity={0.85} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBlock label="Best Win Streak" value={String(advanced.bestWinStreak)} icon={Flame} color="text-win" />
        <StatBlock label="Worst Lose Streak" value={String(advanced.worstLoseStreak)} icon={TrendingDown} color="text-loss" />
        <StatBlock label="Current Streak" value={`${advanced.currentStreak.count} ${advanced.currentStreak.type === "win" ? "W" : "L"}`} icon={Zap} color={advanced.currentStreak.type === "win" ? "text-win" : "text-loss"} />
        <StatBlock label="Total Trades" value={String(stats.totalTrades)} icon={Hash} />
      </div>
    </div>
  );
}

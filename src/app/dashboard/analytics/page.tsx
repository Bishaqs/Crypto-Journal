"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trade } from "@/lib/types";
import { DEMO_TRADES } from "@/lib/demo-data";
import { DemoBanner } from "@/components/demo-banner";
import { useDateRange } from "@/lib/date-range-context";
import { useTheme } from "@/lib/theme-context";
import { getChartColors } from "@/lib/chart-colors";
import {
  calculateStats,
  calculateDailyPnl,
  calculateAdvancedStats,
  buildEquityCurve,
} from "@/lib/calculations";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import {
  BarChart3,
  TrendingUp,
  PieChart,
  Tags,
  Coins,
  Sparkles,
} from "lucide-react";
import { Header } from "@/components/header";
import { PageInfoButton } from "@/components/ui/page-info-button";
import { usePageTour } from "@/lib/use-page-tour";

const TABS = [
  { id: "overview", label: "Overview", icon: TrendingUp },
  { id: "pnl", label: "P&L", icon: BarChart3 },
  { id: "winrate", label: "Win Rate", icon: PieChart },
  { id: "symbols", label: "Symbols", icon: Coins },
  { id: "tags", label: "Tags", icon: Tags },
] as const;

type TabId = (typeof TABS)[number]["id"];


export default function AnalyticsPage() {
  usePageTour("analytics-page");
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabId>("overview");
  const [usingDemo, setUsingDemo] = useState(false);
  const { filterTrades } = useDateRange();
  const { theme } = useTheme();
  const colors = getChartColors(theme);
  const chartTooltipStyle = {
    background: colors.tooltipBg, backdropFilter: "blur(16px)",
    border: colors.tooltipBorder,
    borderRadius: "12px",
    fontSize: "12px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
  };
  const supabase = createClient();

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

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  const filtered = useMemo(() => filterTrades(trades), [trades, filterTrades]);
  const stats = useMemo(() => calculateStats(filtered), [filtered]);
  const advanced = useMemo(() => calculateAdvancedStats(filtered), [filtered]);
  const dailyPnl = useMemo(() => calculateDailyPnl(filtered), [filtered]);
  const equityData = useMemo(() => buildEquityCurve(dailyPnl), [dailyPnl]);

  // Weekly P&L aggregation
  const weeklyPnl = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of dailyPnl) {
      const date = new Date(d.date);
      const monday = new Date(date);
      monday.setDate(date.getDate() - ((date.getDay() + 6) % 7));
      const key = monday.toISOString().split("T")[0];
      map.set(key, (map.get(key) ?? 0) + d.pnl);
    }
    return Array.from(map.entries())
      .map(([week, pnl]) => ({ week, pnl }))
      .sort((a, b) => a.week.localeCompare(b.week));
  }, [dailyPnl]);

  // Monthly P&L
  const monthlyPnl = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of dailyPnl) {
      const key = d.date.substring(0, 7);
      map.set(key, (map.get(key) ?? 0) + d.pnl);
    }
    return Array.from(map.entries())
      .map(([month, pnl]) => ({ month, pnl }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [dailyPnl]);

  // P&L distribution histogram
  const pnlDistribution = useMemo(() => {
    const closed = filtered.filter((t) => t.close_timestamp);
    const pnls = closed.map((t) => t.pnl ?? 0);
    if (pnls.length === 0) return [];
    const min = Math.min(...pnls);
    const max = Math.max(...pnls);
    const range = max - min || 1;
    const bucketSize = range / 10;
    const buckets = new Map<number, number>();
    for (const p of pnls) {
      const bucket = Math.floor((p - min) / bucketSize) * bucketSize + min;
      buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1);
    }
    return Array.from(buckets.entries())
      .map(([value, count]) => ({ value: Math.round(value), count }))
      .sort((a, b) => a.value - b.value);
  }, [filtered]);

  // Symbol performance
  const symbolPerf = useMemo(() => {
    const map = new Map<string, { pnl: number; wins: number; count: number; totalHold: number }>();
    for (const t of filtered.filter((t) => t.close_timestamp)) {
      const p = t.pnl ?? 0;
      const hold = t.close_timestamp
        ? (new Date(t.close_timestamp).getTime() - new Date(t.open_timestamp).getTime()) / 3600000
        : 0;
      const e = map.get(t.symbol) ?? { pnl: 0, wins: 0, count: 0, totalHold: 0 };
      map.set(t.symbol, {
        pnl: e.pnl + p,
        wins: e.wins + (p > 0 ? 1 : 0),
        count: e.count + 1,
        totalHold: e.totalHold + hold,
      });
    }
    return Array.from(map.entries())
      .map(([symbol, d]) => ({
        symbol,
        pnl: d.pnl,
        winRate: d.count > 0 ? (d.wins / d.count) * 100 : 0,
        count: d.count,
        avgHold: d.count > 0 ? d.totalHold / d.count : 0,
      }))
      .sort((a, b) => b.pnl - a.pnl);
  }, [filtered]);

  // Tag performance
  const tagPerf = useMemo(() => {
    const map = new Map<string, { pnl: number; wins: number; count: number }>();
    for (const t of filtered.filter((t) => t.close_timestamp)) {
      const p = t.pnl ?? 0;
      const tags = t.tags?.length ? t.tags : ["Untagged"];
      for (const tag of tags) {
        const e = map.get(tag) ?? { pnl: 0, wins: 0, count: 0 };
        map.set(tag, { pnl: e.pnl + p, wins: e.wins + (p > 0 ? 1 : 0), count: e.count + 1 });
      }
    }
    return Array.from(map.entries())
      .map(([tag, d]) => ({
        tag,
        pnl: d.pnl,
        winRate: d.count > 0 ? (d.wins / d.count) * 100 : 0,
        count: d.count,
      }))
      .sort((a, b) => b.pnl - a.pnl);
  }, [filtered]);

  // Setup type performance
  const setupPerf = useMemo(() => {
    const map = new Map<string, { pnl: number; wins: number; count: number }>();
    for (const t of filtered.filter((t) => t.close_timestamp && t.setup_type)) {
      const p = t.pnl ?? 0;
      const e = map.get(t.setup_type!) ?? { pnl: 0, wins: 0, count: 0 };
      map.set(t.setup_type!, { pnl: e.pnl + p, wins: e.wins + (p > 0 ? 1 : 0), count: e.count + 1 });
    }
    return Array.from(map.entries())
      .map(([setup, d]) => ({
        setup,
        pnl: d.pnl,
        winRate: d.count > 0 ? (d.wins / d.count) * 100 : 0,
        count: d.count,
      }))
      .sort((a, b) => b.pnl - a.pnl);
  }, [filtered]);

  // Drawdown curve
  const drawdownData = useMemo(() => {
    let peak = 0;
    let equity = 0;
    return dailyPnl.map((d) => {
      equity += d.pnl;
      if (equity > peak) peak = equity;
      return { date: d.date, drawdown: equity - peak };
    });
  }, [dailyPnl]);

  // Win rate over time (rolling 10-trade window)
  const winRateOverTime = useMemo(() => {
    const closed = [...filtered]
      .filter((t) => t.close_timestamp)
      .sort((a, b) => a.close_timestamp!.localeCompare(b.close_timestamp!));
    const window = 10;
    const points: { date: string; winRate: number }[] = [];
    for (let i = window - 1; i < closed.length; i++) {
      const slice = closed.slice(i - window + 1, i + 1);
      const wins = slice.filter((t) => (t.pnl ?? 0) > 0).length;
      points.push({
        date: closed[i].close_timestamp!.split("T")[0],
        winRate: (wins / window) * 100,
      });
    }
    return points;
  }, [filtered]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-accent">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 mx-auto max-w-[1600px]">
      <Header />
      <div>
        <h2 id="tour-analytics-header" className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <BarChart3 size={24} className="text-accent" />
          Analytics
          <PageInfoButton tourName="analytics-page" />
        </h2>
        <p className="text-sm text-muted mt-0.5">
          {usingDemo ? "Sample data" : `${filtered.length} trades in range`}
        </p>
      </div>
      {usingDemo && <DemoBanner feature="analytics" />}

      {/* Tabs */}
      <div className="flex gap-1 glass rounded-xl border border-border/50 p-1" style={{ boxShadow: "var(--shadow-card)" }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id
                ? "bg-accent/10 text-accent shadow-sm"
                : "text-muted hover:text-foreground hover:bg-surface-hover"
            }`}
          >
            <t.icon size={14} />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "overview" && (
        <div id="tour-analytics-charts" className="space-y-6">
          {/* Key stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Total P&L", value: `$${stats.closedPnl.toFixed(2)}`, color: stats.closedPnl >= 0 ? "text-win" : "text-loss" },
              { label: "Win Rate", value: `${stats.winRate.toFixed(1)}%`, color: stats.winRate >= 50 ? "text-win" : "text-loss" },
              { label: "Profit Factor", value: stats.profitFactor.toFixed(2), color: stats.profitFactor >= 1 ? "text-win" : "text-loss" },
              { label: "Sharpe Ratio", value: advanced.sharpeRatio.toFixed(2), color: advanced.sharpeRatio >= 1 ? "text-win" : "text-loss" },
              { label: "Max Drawdown", value: `$${advanced.maxDrawdown.toFixed(2)}`, color: "text-loss" },
              { label: "Expectancy", value: `${advanced.expectancy.toFixed(2)}R`, color: advanced.expectancy > 0 ? "text-win" : "text-loss" },
              { label: "Best Streak", value: `${advanced.bestWinStreak} wins`, color: "text-win" },
              { label: "Worst Streak", value: `${advanced.worstLoseStreak} losses`, color: "text-loss" },
            ].map((card) => (
              <div
                key={card.label}
                className="glass rounded-xl border border-border/50 p-4"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <p className="text-[10px] uppercase tracking-wider text-muted/60 font-semibold">{card.label}</p>
                <p className={`text-lg font-bold ${card.color} mt-1`}>{card.value}</p>
              </div>
            ))}
          </div>

          {/* Equity curve */}
          <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
            <h3 className="text-sm font-semibold text-foreground mb-4">Equity Curve</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={equityData}>
                <defs>
                  <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={colors.accent} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={colors.accent} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: colors.tick }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: colors.tick }} tickFormatter={(v) => `$${v}`} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={chartTooltipStyle} formatter={(value) => [`$${Number(value).toFixed(2)}`, "Equity"]} />
                <Area type="monotone" dataKey="equity" stroke={colors.accent} fill="url(#equityGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Drawdown chart */}
          <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
            <h3 className="text-sm font-semibold text-foreground mb-4">Drawdown</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={drawdownData}>
                <defs>
                  <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={colors.loss} stopOpacity={0} />
                    <stop offset="100%" stopColor={colors.loss} stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: colors.tick }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: colors.tick }} tickFormatter={(v) => `$${v}`} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={chartTooltipStyle} formatter={(value) => [`$${Number(value).toFixed(2)}`, "Drawdown"]} />
                <Area type="monotone" dataKey="drawdown" stroke={colors.loss} fill="url(#ddGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === "pnl" && (
        <div className="space-y-6">
          {/* Daily P&L */}
          <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
            <h3 className="text-sm font-semibold text-foreground mb-4">Daily P&L</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={dailyPnl}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: colors.tick }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: colors.tick }} tickFormatter={(v) => `$${v}`} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={chartTooltipStyle} formatter={(value) => [`$${Number(value).toFixed(2)}`, "P&L"]} />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                  {dailyPnl.map((d, i) => (
                    <Cell key={i} fill={d.pnl >= 0 ? colors.win : colors.loss} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Weekly P&L */}
          <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
            <h3 className="text-sm font-semibold text-foreground mb-4">Weekly P&L</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={weeklyPnl}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: colors.tick }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: colors.tick }} tickFormatter={(v) => `$${v}`} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={chartTooltipStyle} formatter={(value) => [`$${Number(value).toFixed(2)}`, "P&L"]} />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                  {weeklyPnl.map((d, i) => (
                    <Cell key={i} fill={d.pnl >= 0 ? colors.win : colors.loss} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly P&L */}
            <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
              <h3 className="text-sm font-semibold text-foreground mb-4">Monthly P&L</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={monthlyPnl}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: colors.tick }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: colors.tick }} tickFormatter={(v) => `$${v}`} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={chartTooltipStyle} formatter={(value) => [`$${Number(value).toFixed(2)}`, "P&L"]} />
                  <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                    {monthlyPnl.map((d, i) => (
                      <Cell key={i} fill={d.pnl >= 0 ? colors.win : colors.loss} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* P&L Distribution */}
            <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
              <h3 className="text-sm font-semibold text-foreground mb-4">P&L Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={pnlDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                  <XAxis dataKey="value" tick={{ fontSize: 10, fill: colors.tick }} tickFormatter={(v) => `$${v}`} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: colors.tick }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={chartTooltipStyle} formatter={(value, name) => [value, name === "count" ? "Trades" : name]} labelFormatter={(v) => `$${v}`} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {pnlDistribution.map((d, i) => (
                      <Cell key={i} fill={d.value >= 0 ? colors.win : colors.loss} fillOpacity={0.7} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cumulative P&L */}
          <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
            <h3 className="text-sm font-semibold text-foreground mb-4">Cumulative P&L</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={equityData}>
                <defs>
                  <linearGradient id="cumGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={colors.accent} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={colors.accent} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: colors.tick }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: colors.tick }} tickFormatter={(v) => `$${v}`} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={chartTooltipStyle} formatter={(value) => [`$${Number(value).toFixed(2)}`, "Total"]} />
                <Area type="monotone" dataKey="equity" stroke={colors.accent} fill="url(#cumGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === "winrate" && (
        <div className="space-y-6">
          {/* Win rate over time */}
          <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
            <h3 className="text-sm font-semibold text-foreground mb-1">Win Rate Over Time</h3>
            <p className="text-[11px] text-muted mb-4">Rolling 10-trade window</p>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={winRateOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: colors.tick }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: colors.tick }} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={chartTooltipStyle} formatter={(value) => [`${Number(value).toFixed(1)}%`, "Win Rate"]} />
                <Line type="monotone" dataKey="winRate" stroke={colors.accent} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* By day of week */}
            <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
              <h3 className="text-sm font-semibold text-foreground mb-4">Win Rate by Day</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={advanced.pnlByDayOfWeek.filter((d) => d.count > 0)}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: colors.tick }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: colors.tick }} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={chartTooltipStyle} formatter={(value) => [`${Number(value).toFixed(1)}%`, "Win Rate"]} />
                  <Bar dataKey="winRate" radius={[4, 4, 0, 0]} fill={colors.accent} fillOpacity={0.8} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* By hour */}
            <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
              <h3 className="text-sm font-semibold text-foreground mb-4">Win Rate by Hour</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={advanced.pnlByHour}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                  <XAxis dataKey="hour" tick={{ fontSize: 11, fill: colors.tick }} tickFormatter={(v) => `${v}:00`} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: colors.tick }} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={chartTooltipStyle} formatter={(value) => [`${Number(value).toFixed(1)}%`, "Win Rate"]} />
                  <Bar dataKey="winRate" radius={[4, 4, 0, 0]} fill={colors.accent} fillOpacity={0.8} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Win rate by symbol */}
          <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
            <h3 className="text-sm font-semibold text-foreground mb-4">Win Rate by Symbol</h3>
            <ResponsiveContainer width="100%" height={Math.max(200, symbolPerf.length * 40)}>
              <BarChart data={symbolPerf} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: colors.tick }} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="symbol" tick={{ fontSize: 11, fill: colors.tick }} width={90} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={chartTooltipStyle} formatter={(value) => [`${Number(value).toFixed(1)}%`, "Win Rate"]} />
                <Bar dataKey="winRate" radius={[0, 4, 4, 0]} fill={colors.accent} fillOpacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === "symbols" && (
        <div className="space-y-6">
          {/* Symbol table */}
          <div className="glass rounded-2xl border border-border/50 overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold px-4 py-3">Symbol</th>
                    <th className="text-right text-[10px] uppercase tracking-wider text-muted/60 font-semibold px-4 py-3">Trades</th>
                    <th className="text-right text-[10px] uppercase tracking-wider text-muted/60 font-semibold px-4 py-3">P&L</th>
                    <th className="text-right text-[10px] uppercase tracking-wider text-muted/60 font-semibold px-4 py-3">Win Rate</th>
                    <th className="text-right text-[10px] uppercase tracking-wider text-muted/60 font-semibold px-4 py-3">Avg Hold</th>
                  </tr>
                </thead>
                <tbody>
                  {symbolPerf.map((s) => (
                    <tr key={s.symbol} className="border-b border-border/50 hover:bg-surface-hover transition-colors">
                      <td className="px-4 py-3 font-semibold text-foreground">{s.symbol}</td>
                      <td className="px-4 py-3 text-right text-muted">{s.count}</td>
                      <td className={`px-4 py-3 text-right font-semibold ${s.pnl >= 0 ? "text-win" : "text-loss"}`}>
                        ${s.pnl.toFixed(2)}
                      </td>
                      <td className={`px-4 py-3 text-right ${s.winRate >= 50 ? "text-win" : "text-loss"}`}>
                        {s.winRate.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-right text-muted">{s.avgHold.toFixed(1)}h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Symbol P&L chart */}
          <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
            <h3 className="text-sm font-semibold text-foreground mb-4">P&L by Symbol</h3>
            <ResponsiveContainer width="100%" height={Math.max(200, symbolPerf.length * 40)}>
              <BarChart data={symbolPerf} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: colors.tick }} tickFormatter={(v) => `$${v}`} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="symbol" tick={{ fontSize: 11, fill: colors.tick }} width={90} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={chartTooltipStyle} formatter={(value) => [`$${Number(value).toFixed(2)}`, "P&L"]} />
                <Bar dataKey="pnl" radius={[0, 4, 4, 0]}>
                  {symbolPerf.map((s, i) => (
                    <Cell key={i} fill={s.pnl >= 0 ? colors.win : colors.loss} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === "tags" && (
        <div className="space-y-6">
          {/* Tags table */}
          <div className="glass rounded-2xl border border-border/50 overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold px-4 py-3">Tag</th>
                    <th className="text-right text-[10px] uppercase tracking-wider text-muted/60 font-semibold px-4 py-3">Trades</th>
                    <th className="text-right text-[10px] uppercase tracking-wider text-muted/60 font-semibold px-4 py-3">P&L</th>
                    <th className="text-right text-[10px] uppercase tracking-wider text-muted/60 font-semibold px-4 py-3">Win Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {tagPerf.map((t) => (
                    <tr key={t.tag} className="border-b border-border/50 hover:bg-surface-hover transition-colors">
                      <td className="px-4 py-3 font-semibold text-foreground">{t.tag}</td>
                      <td className="px-4 py-3 text-right text-muted">{t.count}</td>
                      <td className={`px-4 py-3 text-right font-semibold ${t.pnl >= 0 ? "text-win" : "text-loss"}`}>
                        ${t.pnl.toFixed(2)}
                      </td>
                      <td className={`px-4 py-3 text-right ${t.winRate >= 50 ? "text-win" : "text-loss"}`}>
                        {t.winRate.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Setup type performance */}
          {setupPerf.length > 0 && (
            <div className="glass rounded-2xl border border-border/50 overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="p-4 border-b border-border">
                <h3 className="text-sm font-semibold text-foreground">Setup Type Performance</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold px-4 py-3">Setup</th>
                      <th className="text-right text-[10px] uppercase tracking-wider text-muted/60 font-semibold px-4 py-3">Trades</th>
                      <th className="text-right text-[10px] uppercase tracking-wider text-muted/60 font-semibold px-4 py-3">P&L</th>
                      <th className="text-right text-[10px] uppercase tracking-wider text-muted/60 font-semibold px-4 py-3">Win Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {setupPerf.map((s) => (
                      <tr key={s.setup} className="border-b border-border/50 hover:bg-surface-hover transition-colors">
                        <td className="px-4 py-3 font-semibold text-foreground">{s.setup}</td>
                        <td className="px-4 py-3 text-right text-muted">{s.count}</td>
                        <td className={`px-4 py-3 text-right font-semibold ${s.pnl >= 0 ? "text-win" : "text-loss"}`}>
                          ${s.pnl.toFixed(2)}
                        </td>
                        <td className={`px-4 py-3 text-right ${s.winRate >= 50 ? "text-win" : "text-loss"}`}>
                          {s.winRate.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tag P&L chart */}
          <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
            <h3 className="text-sm font-semibold text-foreground mb-4">P&L by Tag</h3>
            <ResponsiveContainer width="100%" height={Math.max(200, tagPerf.length * 40)}>
              <BarChart data={tagPerf} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: colors.tick }} tickFormatter={(v) => `$${v}`} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="tag" tick={{ fontSize: 11, fill: colors.tick }} width={90} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={chartTooltipStyle} formatter={(value) => [`$${Number(value).toFixed(2)}`, "P&L"]} />
                <Bar dataKey="pnl" radius={[0, 4, 4, 0]}>
                  {tagPerf.map((t, i) => (
                    <Cell key={i} fill={t.pnl >= 0 ? colors.win : colors.loss} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

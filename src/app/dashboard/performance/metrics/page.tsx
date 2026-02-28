"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trade } from "@/lib/types";
import { DEMO_TRADES } from "@/lib/demo-data";
import { DemoBanner } from "@/components/demo-banner";
import { useDateRange } from "@/lib/date-range-context";
import { useTheme } from "@/lib/theme-context";
import { getChartColors } from "@/lib/chart-colors";
import { calculateStats, calculateAdvancedStats, calculateDailyPnl, buildEquityCurve } from "@/lib/calculations";
import { StatBlock } from "@/components/ui/stat-block";
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine,
} from "recharts";
import {
  Activity, TrendingUp, TrendingDown, Scale, Gauge, Flame, Zap,
  Clock, BarChart3, ArrowUpDown,
} from "lucide-react";

export default function MetricsPage() {
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
  const dailyPnl = useMemo(() => calculateDailyPnl(closedTrades), [closedTrades]);
  const equityData = useMemo(() => buildEquityCurve(dailyPnl), [dailyPnl]);

  // Drawdown series
  const drawdownData = useMemo(() => {
    let peak = 0;
    return equityData.map(d => {
      if (d.equity > peak) peak = d.equity;
      const dd = peak > 0 ? ((d.equity - peak) / peak) * 100 : 0;
      return { date: d.date, drawdown: parseFloat(dd.toFixed(2)) };
    });
  }, [equityData]);

  const riskReward = advanced.avgLoser > 0 ? advanced.avgWinner / advanced.avgLoser : 0;

  // Sortino ratio (downside deviation only)
  const sortinoRatio = useMemo(() => {
    const dailyReturns = dailyPnl.map(d => d.pnl);
    if (dailyReturns.length < 2) return 0;
    const avg = dailyReturns.reduce((s, r) => s + r, 0) / dailyReturns.length;
    const downsideReturns = dailyReturns.filter(r => r < 0);
    const downsideDev = downsideReturns.length > 0
      ? Math.sqrt(downsideReturns.reduce((s, r) => s + r ** 2, 0) / downsideReturns.length)
      : 0;
    return downsideDev > 0 ? (avg / downsideDev) * Math.sqrt(252) : 0;
  }, [dailyPnl]);

  // Calmar ratio (annualized return / max drawdown)
  const calmarRatio = useMemo(() => {
    if (advanced.maxDrawdown <= 0 || dailyPnl.length === 0) return 0;
    const totalReturn = dailyPnl.reduce((s, d) => s + d.pnl, 0);
    const days = dailyPnl.length;
    const annualizedReturn = (totalReturn / days) * 252;
    return annualizedReturn / advanced.maxDrawdown;
  }, [advanced.maxDrawdown, dailyPnl]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>;

  const tooltipStyle = { background: colors.tooltipBg, backdropFilter: "blur(16px)", border: colors.tooltipBorder, borderRadius: "12px", fontSize: "12px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {usingDemo && <DemoBanner />}
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <Activity size={24} className="text-accent" />Trading Metrics
        </h1>
        <p className="text-sm text-muted mt-0.5">All key performance indicators in one place</p>
      </div>

      {/* Risk-adjusted metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBlock label="Sharpe Ratio" value={advanced.sharpeRatio.toFixed(2)} icon={Activity} color={advanced.sharpeRatio >= 1 ? "text-win" : advanced.sharpeRatio >= 0 ? "text-accent" : "text-loss"} tooltip="Risk-adjusted return (annualized). Above 1.0 is good, above 2.0 is excellent." />
        <StatBlock label="Sortino Ratio" value={sortinoRatio.toFixed(2)} icon={TrendingUp} color={sortinoRatio >= 1 ? "text-win" : sortinoRatio >= 0 ? "text-accent" : "text-loss"} tooltip="Like Sharpe but only penalizes downside risk. Higher is better." />
        <StatBlock label="Calmar Ratio" value={calmarRatio.toFixed(2)} icon={ArrowUpDown} color={calmarRatio >= 1 ? "text-win" : calmarRatio >= 0 ? "text-accent" : "text-loss"} tooltip="Annualized return divided by max drawdown. Above 1.0 means you recover drawdowns within a year." />
        <StatBlock label="Profit Factor" value={advanced.profitFactor.toFixed(2)} icon={Scale} color={advanced.profitFactor >= 1.5 ? "text-win" : advanced.profitFactor >= 1 ? "text-accent" : "text-loss"} tooltip="Gross profits / gross losses. Above 1.5 is solid." />
      </div>

      {/* Core metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBlock label="Win Rate" value={`${stats.winRate.toFixed(1)}%`} icon={Gauge} color={stats.winRate >= 50 ? "text-win" : "text-loss"} />
        <StatBlock label="Expectancy" value={advanced.expectancy.toFixed(2)} sub="R-multiple" icon={TrendingUp} color={advanced.expectancy > 0 ? "text-win" : "text-loss"} tooltip="Average R-multiple per trade. Positive means your edge is working." />
        <StatBlock label="Risk/Reward" value={`1:${riskReward.toFixed(2)}`} icon={Scale} color={riskReward >= 1.5 ? "text-win" : riskReward >= 1 ? "text-accent" : "text-loss"} tooltip="Avg winner size / avg loser size." />
        <StatBlock label="Total Trades" value={String(stats.totalTrades)} icon={BarChart3} />
      </div>

      {/* Win/loss size metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBlock label="Avg Winner" value={`$${advanced.avgWinner.toFixed(2)}`} icon={TrendingUp} color="text-win" />
        <StatBlock label="Avg Loser" value={`$${advanced.avgLoser.toFixed(2)}`} icon={TrendingDown} color="text-loss" />
        <StatBlock label="Largest Win" value={`$${advanced.largestWin.toFixed(2)}`} icon={Flame} color="text-win" />
        <StatBlock label="Largest Loss" value={`$${Math.abs(advanced.largestLoss).toFixed(2)}`} icon={TrendingDown} color="text-loss" />
      </div>

      {/* Drawdown and timing */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBlock label="Max Drawdown" value={`$${advanced.maxDrawdown.toFixed(2)}`} sub={`${advanced.maxDrawdownPct.toFixed(1)}%`} icon={TrendingDown} color="text-loss" />
        <StatBlock label="DD Duration" value={`${advanced.maxDrawdownDuration}d`} icon={Clock} color="text-muted" tooltip="Longest drawdown period in trading days." />
        <StatBlock label="Best Win Streak" value={String(advanced.bestWinStreak)} icon={Flame} color="text-win" />
        <StatBlock label="Worst Lose Streak" value={String(advanced.worstLoseStreak)} icon={Zap} color="text-loss" />
      </div>

      {/* Hold time */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBlock label="Avg Hold (Winners)" value={`${advanced.avgHoldTimeWinners.toFixed(1)}h`} icon={Clock} color="text-win" />
        <StatBlock label="Avg Hold (Losers)" value={`${advanced.avgHoldTimeLosers.toFixed(1)}h`} icon={Clock} color="text-loss" />
        <StatBlock label="Current Streak" value={`${advanced.currentStreak.count} ${advanced.currentStreak.type === "win" ? "W" : advanced.currentStreak.type === "loss" ? "L" : "—"}`} icon={Zap} color={advanced.currentStreak.type === "win" ? "text-win" : "text-loss"} />
        <StatBlock label="Closed PnL" value={`$${stats.closedPnl.toFixed(2)}`} icon={TrendingUp} color={stats.closedPnl >= 0 ? "text-win" : "text-loss"} />
      </div>

      {/* Equity curve */}
      {equityData.length > 0 && (
        <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <h3 className="text-sm font-semibold text-foreground mb-4">Equity Curve</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={equityData}>
              <defs>
                <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors.accent} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={colors.accent} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
              <XAxis dataKey="date" tick={{ fill: colors.tick, fontSize: 10 }} tickFormatter={(v: string) => v.slice(5)} />
              <YAxis tick={{ fill: colors.tick, fontSize: 10 }} tickFormatter={(v) => `$${v}`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number | undefined) => [`$${(v ?? 0).toFixed(2)}`, "Equity"]} />
              <ReferenceLine y={0} stroke={colors.tick} strokeDasharray="3 3" strokeOpacity={0.4} />
              <Area type="monotone" dataKey="equity" stroke={colors.accent} strokeWidth={2} fill="url(#equityGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Drawdown chart */}
      {drawdownData.length > 0 && (
        <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <h3 className="text-sm font-semibold text-foreground mb-4">Drawdown Over Time</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={drawdownData}>
              <defs>
                <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors.loss} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={colors.loss} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
              <XAxis dataKey="date" tick={{ fill: colors.tick, fontSize: 10 }} tickFormatter={(v: string) => v.slice(5)} />
              <YAxis tick={{ fill: colors.tick, fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number | undefined) => [`${(v ?? 0).toFixed(2)}%`, "Drawdown"]} />
              <ReferenceLine y={0} stroke={colors.tick} strokeDasharray="3 3" strokeOpacity={0.4} />
              <Area type="monotone" dataKey="drawdown" stroke={colors.loss} strokeWidth={2} fill="url(#ddGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

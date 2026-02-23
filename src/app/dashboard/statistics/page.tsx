"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trade } from "@/lib/types";
import { DEMO_TRADES } from "@/lib/demo-data";
import { DemoBanner } from "@/components/demo-banner";
import { useDateRange } from "@/lib/date-range-context";
import { useTheme } from "@/lib/theme-context";
import { getChartColors } from "@/lib/chart-colors";
import { calculateAdvancedStats } from "@/lib/calculations";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import {
  BarChart3,
  TrendingDown,
  TrendingUp,
  Clock,
  Flame,
  Target,
  Activity,
  Zap,
  Calendar,
} from "lucide-react";
import { InfoTooltip } from "@/components/ui/info-tooltip";

function StatBlock({
  label,
  value,
  sub,
  icon: Icon,
  color = "text-foreground",
  tooltip,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  color?: string;
  tooltip?: string;
}) {
  return (
    <div
      className="glass rounded-2xl border border-border/50 p-5 group hover:border-accent/20 transition-all duration-300"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-muted font-semibold uppercase tracking-widest flex items-center gap-1">
          {label}{tooltip && <InfoTooltip text={tooltip} size={12} />}
        </span>
        <div className="p-1.5 rounded-lg bg-accent/8">
          <Icon size={14} className="text-accent" />
        </div>
      </div>
      <p className={`text-2xl font-bold tracking-tight ${color}`}>{value}</p>
      {sub && <p className="text-[11px] text-muted mt-1">{sub}</p>}
    </div>
  );
}

export default function StatisticsPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingDemo, setUsingDemo] = useState(false);
  const { filterTrades } = useDateRange();
  const { theme } = useTheme();
  const colors = getChartColors(theme);
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
  const stats = useMemo(() => calculateAdvancedStats(filtered), [filtered]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-accent">Loading...</div>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="max-w-[1600px] mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-6">
          Overall Statistics
        </h1>
        <div
          className="rounded-2xl border border-border p-12 flex flex-col items-center justify-center text-center"
          style={{ background: "var(--surface)", boxShadow: "var(--shadow-card)" }}
        >
          <BarChart3 size={48} className="text-accent/40 mb-4" />
          <p className="text-lg font-semibold text-foreground mb-2">
            No trades yet
          </p>
          <p className="text-sm text-muted max-w-md">
            Log some trades to see your comprehensive statistics.
          </p>
        </div>
      </div>
    );
  }

  function fmtHours(h: number): string {
    if (h < 1) return `${Math.round(h * 60)}m`;
    if (h < 24) return `${h.toFixed(1)}h`;
    return `${(h / 24).toFixed(1)}d`;
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Overall Statistics
        </h1>
        <p className="text-sm text-muted mt-0.5">
          {stats.totalTrades} closed trades in range
        </p>
      </div>
      {usingDemo && <DemoBanner feature="statistics" />}

      {/* Key metrics grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatBlock
          label="Win Rate"
          value={`${stats.winRate.toFixed(1)}%`}
          sub={`${Math.round((stats.winRate / 100) * stats.totalTrades)}W / ${stats.totalTrades - Math.round((stats.winRate / 100) * stats.totalTrades)}L`}
          icon={Target}
          color={stats.winRate >= 50 ? "text-win" : "text-loss"}
        />
        <StatBlock
          label="Profit Factor"
          value={stats.profitFactor.toFixed(2)}
          sub={stats.profitFactor >= 1 ? "edge positive" : "negative edge"}
          icon={TrendingUp}
          color={stats.profitFactor >= 1 ? "text-win" : "text-loss"}
        />
        <StatBlock
          label="Sharpe Ratio"
          value={stats.sharpeRatio.toFixed(2)}
          sub={stats.sharpeRatio >= 1 ? "risk-adjusted edge" : "below benchmark"}
          icon={Activity}
          color={stats.sharpeRatio >= 1 ? "text-win" : stats.sharpeRatio >= 0 ? "text-foreground" : "text-loss"}
          tooltip="Risk-adjusted return metric. Measures excess return per unit of volatility. Above 1.0 = good, above 2.0 = excellent."
        />
        <StatBlock
          label="Expectancy"
          value={`${stats.expectancy >= 0 ? "+" : ""}${stats.expectancy.toFixed(2)}R`}
          sub="avg return per unit of risk"
          icon={Zap}
          color={stats.expectancy >= 0 ? "text-win" : "text-loss"}
          tooltip="Average profit per unit of risk. Positive = your system has an edge over time."
        />
      </div>

      {/* Size & risk row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatBlock
          label="Avg Winner"
          value={`+$${stats.avgWinner.toFixed(0)}`}
          icon={TrendingUp}
          color="text-win"
        />
        <StatBlock
          label="Avg Loser"
          value={`−$${stats.avgLoser.toFixed(0)}`}
          icon={TrendingDown}
          color="text-loss"
        />
        <StatBlock
          label="Largest Win"
          value={`+$${stats.largestWin.toFixed(0)}`}
          icon={TrendingUp}
          color="text-win"
        />
        <StatBlock
          label="Largest Loss"
          value={`−$${Math.abs(stats.largestLoss).toFixed(0)}`}
          icon={TrendingDown}
          color="text-loss"
        />
        <StatBlock
          label="Max Drawdown"
          value={`−$${stats.maxDrawdown.toFixed(0)}`}
          sub={`${stats.maxDrawdownDuration}d duration`}
          icon={TrendingDown}
          color="text-loss"
        />
        <StatBlock
          label="Closed P&L"
          value={`${stats.closedPnl >= 0 ? "+" : ""}$${stats.closedPnl.toFixed(0)}`}
          icon={BarChart3}
          color={stats.closedPnl >= 0 ? "text-win" : "text-loss"}
        />
      </div>

      {/* Timing & streaks */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBlock
          label="Avg Hold (Winners)"
          value={fmtHours(stats.avgHoldTimeWinners)}
          icon={Clock}
        />
        <StatBlock
          label="Avg Hold (Losers)"
          value={fmtHours(stats.avgHoldTimeLosers)}
          icon={Clock}
        />
        <StatBlock
          label="Best Win Streak"
          value={`${stats.bestWinStreak}`}
          sub="consecutive wins"
          icon={Flame}
          color="text-win"
        />
        <StatBlock
          label="Worst Lose Streak"
          value={`${stats.worstLoseStreak}`}
          sub="consecutive losses"
          icon={Flame}
          color="text-loss"
        />
      </div>

      {/* Current streak banner */}
      {stats.currentStreak.count > 0 && (
        <div
          className={`rounded-xl border px-5 py-3 flex items-center gap-3 ${
            stats.currentStreak.type === "win"
              ? "border-win/20 bg-win/5"
              : "border-loss/20 bg-loss/5"
          }`}
        >
          <Flame
            size={18}
            className={stats.currentStreak.type === "win" ? "text-win" : "text-loss"}
          />
          <span className="text-sm font-medium text-foreground">
            Currently on a{" "}
            <span className={stats.currentStreak.type === "win" ? "text-win" : "text-loss"}>
              {stats.currentStreak.count}-trade {stats.currentStreak.type} streak
            </span>
          </span>
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* P&L by day of week */}
        <div
          className="glass rounded-2xl border border-border/50 p-5"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={14} className="text-accent" />
            <h3 className="text-sm font-semibold text-foreground">
              P&L by Day of Week
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.pnlByDayOfWeek}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: colors.tick }}
                axisLine={{ stroke: colors.grid }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: colors.tick }}
                tickFormatter={(v) => `$${v}`}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: colors.tooltipBg, backdropFilter: "blur(16px)",
                  border: colors.tooltipBorder,
                  borderRadius: "12px",
                  fontSize: "12px",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                }}
                labelStyle={{ color: colors.tick }}
                formatter={(value) => [
                  `$${Number(value ?? 0).toFixed(2)}`,
                  "P&L",
                ]}
              />
              <Bar dataKey="pnl" radius={[6, 6, 0, 0]}>
                {stats.pnlByDayOfWeek.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.pnl >= 0 ? colors.win : colors.loss}
                    fillOpacity={0.85}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* P&L by hour */}
        <div
          className="glass rounded-2xl border border-border/50 p-5"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Clock size={14} className="text-accent" />
            <h3 className="text-sm font-semibold text-foreground">
              P&L by Hour of Day
            </h3>
          </div>
          {stats.pnlByHour.length === 0 ? (
            <div className="h-[220px] flex items-center justify-center text-muted text-sm">
              Not enough data
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.pnlByHour}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                <XAxis
                  dataKey="hour"
                  tick={{ fontSize: 10, fill: colors.tick }}
                  tickFormatter={(v) => `${v}:00`}
                  axisLine={{ stroke: colors.grid }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: colors.tick }}
                  tickFormatter={(v) => `$${v}`}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: colors.tooltipBg, backdropFilter: "blur(16px)",
                    border: colors.tooltipBorder,
                    borderRadius: "12px",
                    fontSize: "12px",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                  }}
                  labelStyle={{ color: colors.tick }}
                  labelFormatter={(v) => `${v}:00`}
                  formatter={(value) => [
                    `$${Number(value ?? 0).toFixed(2)}`,
                    "P&L",
                  ]}
                />
                <Bar dataKey="pnl" radius={[6, 6, 0, 0]}>
                  {stats.pnlByHour.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.pnl >= 0 ? colors.win : colors.loss}
                      fillOpacity={0.85}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Win rate by day table */}
      <div
        className="glass rounded-2xl border border-border/50 p-5"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <h3 className="text-sm font-semibold text-foreground mb-4">
          Performance by Day of Week
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] text-muted uppercase tracking-wider border-b border-border">
                <th className="text-left py-2 px-3">Day</th>
                <th className="text-right py-2 px-3">Trades</th>
                <th className="text-right py-2 px-3">Win Rate</th>
                <th className="text-right py-2 px-3">Net P&L</th>
              </tr>
            </thead>
            <tbody>
              {stats.pnlByDayOfWeek
                .filter((d) => d.count > 0)
                .map((d) => (
                  <tr
                    key={d.day}
                    className="border-b border-border/50 hover:bg-surface-hover transition-colors"
                  >
                    <td className="py-2.5 px-3 font-medium text-foreground">
                      {d.day}
                    </td>
                    <td className="py-2.5 px-3 text-right text-muted">
                      {d.count}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span
                        className={`font-semibold ${
                          d.winRate >= 50 ? "text-win" : "text-loss"
                        }`}
                      >
                        {d.winRate.toFixed(0)}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span
                        className={`font-semibold ${
                          d.pnl >= 0 ? "text-win" : "text-loss"
                        }`}
                      >
                        {d.pnl >= 0 ? "+" : ""}${d.pnl.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

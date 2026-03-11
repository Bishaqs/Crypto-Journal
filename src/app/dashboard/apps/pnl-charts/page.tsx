"use client";

import { useMemo } from "react";
import { useTrades } from "@/hooks/use-trades";
import { useDateRange } from "@/lib/date-range-context";
import { useAccount } from "@/lib/account-context";
import { useTheme } from "@/lib/theme-context";
import { getChartColors } from "@/lib/chart-colors";
import {
  calculateDailyPnl,
  buildEquityCurve,
  calculateAdvancedStats,
  calculateStats,
} from "@/lib/calculations";
import {
  buildDrawdownSeries,
  buildRollingPnl,
  buildPnlDistribution,
} from "@/components/pnl-charts/pnl-charts-utils";
import { EquityCurve } from "@/components/dashboard/equity-curve";
import { DemoBanner } from "@/components/demo-banner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  AreaChart,
  Area,
  LineChart,
  Line,
  ReferenceLine,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Target,
  ArrowDown,
  BarChart3,
  Activity,
  Clock,
  Zap,
} from "lucide-react";
import { InfoTooltip } from "@/components/ui/info-tooltip";

export default function PnlChartsPage() {
  const { trades, loading, usingDemo } = useTrades();
  const { filterTrades } = useDateRange();
  const { filterByAccount } = useAccount();
  const { theme } = useTheme();
  const colors = getChartColors(theme);

  const filtered = useMemo(() => filterByAccount(filterTrades(trades)), [trades, filterTrades, filterByAccount]);
  const closedTrades = useMemo(
    () => filtered.filter((t) => t.exit_price !== null),
    [filtered]
  );

  const stats = useMemo(() => calculateStats(closedTrades), [closedTrades]);
  const adv = useMemo(
    () => calculateAdvancedStats(closedTrades),
    [closedTrades]
  );
  const dailyPnl = useMemo(
    () => calculateDailyPnl(closedTrades),
    [closedTrades]
  );
  const equityCurve = useMemo(() => buildEquityCurve(dailyPnl), [dailyPnl]);
  const drawdownData = useMemo(
    () => buildDrawdownSeries(dailyPnl),
    [dailyPnl]
  );
  const rollingData = useMemo(() => buildRollingPnl(dailyPnl), [dailyPnl]);
  const distribution = useMemo(
    () => buildPnlDistribution(closedTrades),
    [closedTrades]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const tooltipStyle = {
    background: colors.tooltipBg,
    backdropFilter: "blur(16px)",
    border: colors.tooltipBorder,
    borderRadius: "12px",
    fontSize: "12px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
  };

  const statCards = [
    {
      label: "Total P&L",
      value: `${stats.closedPnl >= 0 ? "+" : ""}$${stats.closedPnl.toFixed(2)}`,
      icon: TrendingUp,
      color: stats.closedPnl >= 0 ? "text-win" : "text-loss",
    },
    {
      label: "Win Rate",
      value: `${stats.winRate.toFixed(1)}%`,
      icon: Target,
      color: stats.winRate >= 50 ? "text-win" : "text-loss",
    },
    {
      label: "Profit Factor",
      value: stats.profitFactor >= 100 ? "∞" : stats.profitFactor.toFixed(2),
      icon: BarChart3,
      color: stats.profitFactor >= 1 ? "text-win" : "text-loss",
    },
    {
      label: "Sharpe Ratio",
      value: adv.sharpeRatio.toFixed(2),
      icon: Activity,
      color: adv.sharpeRatio >= 1 ? "text-win" : adv.sharpeRatio >= 0 ? "text-muted" : "text-loss",
    },
    {
      label: "Max Drawdown",
      value: `-$${adv.maxDrawdown.toFixed(2)}`,
      icon: ArrowDown,
      color: "text-loss",
    },
    {
      label: "Expectancy",
      value: adv.expectancy.toFixed(2) + "R",
      icon: Zap,
      color: adv.expectancy >= 0 ? "text-win" : "text-loss",
    },
    {
      label: "Best Trade",
      value: `+$${adv.largestWin.toFixed(2)}`,
      icon: TrendingUp,
      color: "text-win",
    },
    {
      label: "Worst Trade",
      value: `$${adv.largestLoss.toFixed(2)}`,
      icon: TrendingDown,
      color: "text-loss",
    },
  ];

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {usingDemo && <DemoBanner />}

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
          <BarChart3 size={20} className="text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">P&L Charts <InfoTooltip text="Comprehensive profit & loss analysis with equity curves, drawdowns, daily P&L, distribution histograms, and rolling averages." size={14} /></h1>
          <p className="text-sm text-muted">
            {usingDemo
              ? "Sample data"
              : `Comprehensive P&L analysis across ${closedTrades.length} closed trades`}
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((s) => (
          <div
            key={s.label}
            className="glass rounded-2xl border border-border/50 p-4 group hover:border-accent/20 transition-all duration-300"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-muted font-semibold uppercase tracking-widest">
                {s.label}
              </span>
              <div className="p-1.5 rounded-lg bg-accent/8">
                <s.icon size={14} className="text-accent" />
              </div>
            </div>
            <p className={`text-xl font-bold tracking-tight ${s.color}`}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Equity Curve */}
      <EquityCurve data={equityCurve} />

      {/* Daily P&L */}
      {dailyPnl.length > 0 && (
        <div
          className="glass rounded-2xl border border-border/50 p-5"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">
              Daily P&L
            </h3>
            <div className="flex gap-3 text-xs text-muted">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-win" />{" "}
                {dailyPnl.filter((d) => d.pnl >= 0).length} green
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-loss" />{" "}
                {dailyPnl.filter((d) => d.pnl < 0).length} red
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dailyPnl}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: colors.tick }}
                tickFormatter={(v: string) => v.slice(5)}
                axisLine={{ stroke: colors.grid }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: colors.tick }}
                tickFormatter={(v: number) => `$${v}`}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number | undefined) => [
                  `$${Number(value ?? 0).toFixed(2)}`,
                  "P&L",
                ]}
              />
              <ReferenceLine y={0} stroke={colors.grid} strokeDasharray="3 3" />
              <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                {dailyPnl.map((d, i) => (
                  <Cell
                    key={i}
                    fill={d.pnl >= 0 ? colors.win : colors.loss}
                    fillOpacity={0.85}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Drawdown Chart */}
      {drawdownData.length > 0 && (
        <div
          className="glass rounded-2xl border border-border/50 p-5"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">
              Drawdown from Peak
            </h3>
            <span className="text-xs text-loss font-semibold px-2.5 py-1 rounded-lg bg-loss/10">
              Max: {adv.maxDrawdownPct.toFixed(1)}%
            </span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={drawdownData}>
              <defs>
                <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colors.loss} stopOpacity={0.3} />
                  <stop
                    offset="100%"
                    stopColor={colors.loss}
                    stopOpacity={0.05}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: colors.tick }}
                tickFormatter={(v: string) => v.slice(5)}
                axisLine={{ stroke: colors.grid }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: colors.tick }}
                tickFormatter={(v: number) => `$${v}`}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number | undefined, name: string | undefined) => [
                  name === "drawdownPct"
                    ? `${Number(value ?? 0).toFixed(1)}%`
                    : `$${Number(value ?? 0).toFixed(2)}`,
                  name === "drawdownPct" ? "DD %" : "Drawdown",
                ]}
              />
              <ReferenceLine y={0} stroke={colors.grid} />
              <Area
                type="monotone"
                dataKey="drawdown"
                stroke={colors.loss}
                strokeWidth={2}
                fill="url(#ddGrad)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Two-column: Day of Week + Hour of Day */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* P&L by Day of Week */}
        {adv.pnlByDayOfWeek.length > 0 && (
          <div
            className="glass rounded-2xl border border-border/50 p-5"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <h3 className="text-sm font-semibold text-foreground mb-4">
              P&L by Day of Week
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={adv.pnlByDayOfWeek}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 10, fill: colors.tick }}
                  axisLine={{ stroke: colors.grid }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: colors.tick }}
                  tickFormatter={(v: number) => `$${v}`}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number | undefined, name: string | undefined) => {
                    if (String(name) === "winRate")
                      return [`${Number(value ?? 0).toFixed(1)}%`, "Win Rate"];
                    return [`$${Number(value ?? 0).toFixed(2)}`, "P&L"];
                  }}
                />
                <ReferenceLine y={0} stroke={colors.grid} strokeDasharray="3 3" />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                  {adv.pnlByDayOfWeek.map((d, i) => (
                    <Cell
                      key={i}
                      fill={d.pnl >= 0 ? colors.win : colors.loss}
                      fillOpacity={0.85}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {/* Mini stats below chart */}
            <div className="flex gap-4 mt-3 text-xs text-muted">
              {(() => {
                const best = adv.pnlByDayOfWeek.reduce((b, d) =>
                  d.pnl > b.pnl ? d : b
                );
                const worst = adv.pnlByDayOfWeek.reduce((w, d) =>
                  d.pnl < w.pnl ? d : w
                );
                return (
                  <>
                    <span>
                      Best:{" "}
                      <span className="text-win font-semibold">
                        {best.day}
                      </span>
                    </span>
                    <span>
                      Worst:{" "}
                      <span className="text-loss font-semibold">
                        {worst.day}
                      </span>
                    </span>
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* P&L by Hour */}
        {adv.pnlByHour.length > 0 && (
          <div
            className="glass rounded-2xl border border-border/50 p-5"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Clock size={14} className="text-accent" />
              P&L by Hour
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={adv.pnlByHour}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                <XAxis
                  dataKey="hour"
                  tick={{ fontSize: 10, fill: colors.tick }}
                  tickFormatter={(v: number) => `${v}:00`}
                  axisLine={{ stroke: colors.grid }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: colors.tick }}
                  tickFormatter={(v: number) => `$${v}`}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number | undefined, name: string | undefined) => {
                    if (String(name) === "winRate")
                      return [`${Number(value ?? 0).toFixed(1)}%`, "Win Rate"];
                    if (String(name) === "count")
                      return [Number(value ?? 0), "Trades"];
                    return [`$${Number(value ?? 0).toFixed(2)}`, "P&L"];
                  }}
                  labelFormatter={(label) => `${label}:00`}
                />
                <ReferenceLine y={0} stroke={colors.grid} strokeDasharray="3 3" />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                  {adv.pnlByHour.map((d, i) => (
                    <Cell
                      key={i}
                      fill={d.pnl >= 0 ? colors.win : colors.loss}
                      fillOpacity={0.85}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {/* Mini stats */}
            <div className="flex gap-4 mt-3 text-xs text-muted">
              {(() => {
                const best = adv.pnlByHour.reduce((b, d) =>
                  d.pnl > b.pnl ? d : b
                );
                const worst = adv.pnlByHour.reduce((w, d) =>
                  d.pnl < w.pnl ? d : w
                );
                return (
                  <>
                    <span>
                      Best:{" "}
                      <span className="text-win font-semibold">
                        {best.hour}:00
                      </span>
                    </span>
                    <span>
                      Worst:{" "}
                      <span className="text-loss font-semibold">
                        {worst.hour}:00
                      </span>
                    </span>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>

      {/* P&L Distribution */}
      {distribution.length > 0 && (
        <div
          className="glass rounded-2xl border border-border/50 p-5"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">
              P&L Distribution
            </h3>
            <div className="flex gap-3 text-xs text-muted">
              <span>
                Avg Winner:{" "}
                <span className="text-win font-semibold">
                  +${adv.avgWinner.toFixed(2)}
                </span>
              </span>
              <span>
                Avg Loser:{" "}
                <span className="text-loss font-semibold">
                  -${adv.avgLoser.toFixed(2)}
                </span>
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={distribution}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
              <XAxis
                dataKey="range"
                tick={{ fontSize: 9, fill: colors.tick }}
                axisLine={{ stroke: colors.grid }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: colors.tick }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number | undefined) => [
                  Number(value ?? 0),
                  "Trades",
                ]}
                labelFormatter={(label) => `Range: ${label}`}
              />
              <ReferenceLine x="$0" stroke={colors.grid} strokeDasharray="3 3" />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {distribution.map((d, i) => (
                  <Cell
                    key={i}
                    fill={d.midpoint >= 0 ? colors.win : colors.loss}
                    fillOpacity={0.85}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Rolling P&L */}
      {rollingData.length > 7 && (
        <div
          className="glass rounded-2xl border border-border/50 p-5"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">
              Rolling Average P&L
            </h3>
            <div className="flex gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span
                  className="w-3 h-0.5 rounded-full"
                  style={{ background: colors.accent }}
                />
                <span className="text-muted">7-day</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className="w-3 h-0.5 rounded-full"
                  style={{ background: colors.win }}
                />
                <span className="text-muted">30-day</span>
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={rollingData}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: colors.tick }}
                tickFormatter={(v: string) => v.slice(5)}
                axisLine={{ stroke: colors.grid }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: colors.tick }}
                tickFormatter={(v: number) => `$${v}`}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number | undefined, name: string | undefined) => {
                  const v = Number(value ?? 0);
                  if (String(name) === "rolling7")
                    return [`$${v.toFixed(2)}`, "7-Day Avg"];
                  if (String(name) === "rolling30")
                    return [`$${v.toFixed(2)}`, "30-Day Avg"];
                  return [`$${v.toFixed(2)}`, "Daily P&L"];
                }}
              />
              <ReferenceLine y={0} stroke={colors.grid} strokeDasharray="3 3" />
              <Line
                type="monotone"
                dataKey="rolling7"
                stroke={colors.accent}
                strokeWidth={2}
                dot={false}
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="rolling30"
                stroke={colors.win}
                strokeWidth={2}
                dot={false}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Streaks & Hold Time Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div
          className="glass rounded-2xl border border-border/50 p-4"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <span className="text-[10px] text-muted font-semibold uppercase tracking-widest">
            Best Win Streak
          </span>
          <p className="text-xl font-bold text-win mt-1">
            {adv.bestWinStreak}
          </p>
        </div>
        <div
          className="glass rounded-2xl border border-border/50 p-4"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <span className="text-[10px] text-muted font-semibold uppercase tracking-widest">
            Worst Lose Streak
          </span>
          <p className="text-xl font-bold text-loss mt-1">
            {adv.worstLoseStreak}
          </p>
        </div>
        <div
          className="glass rounded-2xl border border-border/50 p-4"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <span className="text-[10px] text-muted font-semibold uppercase tracking-widest">
            Avg Hold (Winners)
          </span>
          <p className="text-xl font-bold text-win mt-1">
            {adv.avgHoldTimeWinners.toFixed(1)}h
          </p>
        </div>
        <div
          className="glass rounded-2xl border border-border/50 p-4"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <span className="text-[10px] text-muted font-semibold uppercase tracking-widest">
            Avg Hold (Losers)
          </span>
          <p className="text-xl font-bold text-loss mt-1">
            {adv.avgHoldTimeLosers.toFixed(1)}h
          </p>
        </div>
      </div>
    </div>
  );
}

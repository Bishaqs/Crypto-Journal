"use client";

import { useState, useMemo } from "react";
import { useTrades } from "@/hooks/use-trades";
import { groupTradesByField } from "@/lib/trade-grouping";
import { useTheme } from "@/lib/theme-context";
import { getChartColors } from "@/lib/chart-colors";
import { DemoBanner } from "@/components/demo-banner";
import { Header } from "@/components/header";
import { BarChart3 } from "lucide-react";
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

type GroupByOption =
  | "symbol"
  | "emotion"
  | "setup_type"
  | "position"
  | "trade_source"
  | "day_of_week";

type MetricOption = "totalPnl" | "winRate" | "tradeCount" | "avgPnl";

const GROUP_OPTIONS: { value: GroupByOption; label: string }[] = [
  { value: "symbol", label: "Symbol" },
  { value: "emotion", label: "Emotion" },
  { value: "setup_type", label: "Setup Type" },
  { value: "position", label: "Position" },
  { value: "trade_source", label: "Source (CEX/DEX)" },
  { value: "day_of_week", label: "Day of Week" },
];

const METRIC_OPTIONS: { value: MetricOption; label: string; format: (v: number) => string }[] = [
  { value: "totalPnl", label: "Total P&L", format: (v) => `$${v.toFixed(2)}` },
  { value: "winRate", label: "Win Rate", format: (v) => `${v.toFixed(1)}%` },
  { value: "tradeCount", label: "Trade Count", format: (v) => `${v}` },
  { value: "avgPnl", label: "Avg P&L", format: (v) => `$${v.toFixed(2)}` },
];

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function PivotPage() {
  const { trades, loading, usingDemo } = useTrades();
  const { theme } = useTheme();
  const colors = getChartColors(theme);
  const [groupBy, setGroupBy] = useState<GroupByOption>("symbol");
  const [metric, setMetric] = useState<MetricOption>("totalPnl");

  const groups = useMemo(() => {
    if (groupBy === "day_of_week") {
      return groupTradesByField(trades, (t) => DAY_NAMES[new Date(t.open_timestamp).getDay()]);
    }
    return groupTradesByField(trades, (t) => String(t[groupBy] ?? "Unknown"));
  }, [trades, groupBy]);

  const metricConfig = METRIC_OPTIONS.find((m) => m.value === metric)!;

  const chartData = useMemo(() => {
    return groups.map((g) => ({
      name: g.label,
      value: g[metric],
    }));
  }, [groups, metric]);

  const tooltipStyle = {
    backgroundColor: colors.tooltipBg,
    border: colors.tooltipBorder,
    borderRadius: "12px",
    fontSize: "12px",
    color: "var(--color-foreground)",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-accent">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header />
      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <BarChart3 size={24} className="text-accent" />
          Pivot Analysis
        </h2>
        <p className="text-sm text-muted mt-0.5">
          {usingDemo ? "Sample data" : "Group and compare your trades by any dimension"}
        </p>
      </div>
      {usingDemo && <DemoBanner feature="pivot analysis" />}

      {/* Controls */}
      <div className="flex flex-wrap gap-3">
        <div>
          <label className="text-[10px] uppercase tracking-wider text-muted/60 font-semibold mb-1 block">
            Group By
          </label>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as GroupByOption)}
            className="bg-surface border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 min-w-[160px]"
          >
            {GROUP_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider text-muted/60 font-semibold mb-1 block">
            Metric
          </label>
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value as MetricOption)}
            className="bg-surface border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 min-w-[160px]"
          >
            {METRIC_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Chart */}
      <div
        className="bg-surface rounded-2xl border border-border p-4"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        {chartData.length === 0 ? (
          <div className="text-center py-16 text-muted">No data to display</div>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(300, chartData.length * 40 + 60)}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 30, bottom: 10, left: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} horizontal={false} />
              <XAxis
                type="number"
                tick={{ fill: colors.tick, fontSize: 11 }}
                stroke={colors.grid}
                tickFormatter={(v) => metricConfig.format(v)}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: colors.tick, fontSize: 11 }}
                stroke={colors.grid}
                width={70}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any) => [metricConfig.format(Number(value ?? 0)), metricConfig.label]}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={28}>
                {chartData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={
                      metric === "totalPnl" || metric === "avgPnl"
                        ? entry.value >= 0
                          ? colors.win
                          : colors.loss
                        : colors.accent
                    }
                    fillOpacity={0.8}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Table */}
      <div
        className="bg-surface rounded-2xl border border-border overflow-hidden"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold px-4 py-2.5">
                {GROUP_OPTIONS.find((o) => o.value === groupBy)?.label}
              </th>
              <th className="text-right text-[10px] uppercase tracking-wider text-muted/60 font-semibold px-4 py-2.5">
                Trades
              </th>
              <th className="text-right text-[10px] uppercase tracking-wider text-muted/60 font-semibold px-4 py-2.5">
                Win Rate
              </th>
              <th className="text-right text-[10px] uppercase tracking-wider text-muted/60 font-semibold px-4 py-2.5">
                Total P&L
              </th>
              <th className="text-right text-[10px] uppercase tracking-wider text-muted/60 font-semibold px-4 py-2.5">
                Avg P&L
              </th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <tr key={g.key} className="border-b border-border/30 hover:bg-surface-hover transition-colors">
                <td className="px-4 py-2.5 font-medium text-foreground">{g.label}</td>
                <td className="px-4 py-2.5 text-right text-muted tabular-nums">{g.tradeCount}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">
                  <span className={g.winRate >= 50 ? "text-win" : "text-loss"}>
                    {g.winRate.toFixed(1)}%
                  </span>
                </td>
                <td
                  className={`px-4 py-2.5 text-right font-semibold tabular-nums ${g.totalPnl >= 0 ? "text-win" : "text-loss"}`}
                >
                  ${g.totalPnl.toFixed(2)}
                </td>
                <td
                  className={`px-4 py-2.5 text-right tabular-nums ${g.avgPnl >= 0 ? "text-win" : "text-loss"}`}
                >
                  ${g.avgPnl.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

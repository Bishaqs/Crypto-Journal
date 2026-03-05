"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  Legend,
} from "recharts";
import type { FilterGroupResult } from "./filter-group-types";

interface FilterGroupResultsProps {
  results: FilterGroupResult[];
  colors: {
    grid: string;
    tick: string;
    tooltipBg: string;
    tooltipBorder: string;
  };
}

function StatCard({
  label,
  value,
  color = "text-foreground",
  dot,
}: {
  label: string;
  value: string;
  color?: string;
  dot?: string;
}) {
  return (
    <div
      className="glass rounded-xl border border-border/50 p-4 hover:border-accent/20 transition-all duration-300"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex items-center gap-2 mb-1">
        {dot && (
          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: dot }} />
        )}
        <p className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold">{label}</p>
      </div>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}

export default function FilterGroupResults({ results, colors }: FilterGroupResultsProps) {
  // Build chart data — one entry per metric, one key per group
  const pnlChartData = results.map((r) => ({
    name: r.config.name,
    value: r.stats.closedPnl,
    color: r.config.color,
  }));

  const winRateChartData = results.map((r) => ({
    name: r.config.name,
    value: r.stats.winRate,
    color: r.config.color,
  }));

  return (
    <div className="space-y-5">
      {/* Summary Cards */}
      <div className={`grid gap-3 ${results.length <= 2 ? "grid-cols-2" : "grid-cols-2 md:grid-cols-4"}`}>
        {results.map((r) => (
          <StatCard
            key={r.config.id}
            label={r.config.name}
            dot={r.config.color}
            value={
              r.stats.totalTrades === 0
                ? "No trades"
                : `${r.stats.totalTrades} trades · ${r.stats.closedPnl >= 0 ? "+" : ""}$${r.stats.closedPnl.toFixed(0)}`
            }
            color={
              r.stats.totalTrades === 0
                ? "text-muted"
                : r.stats.closedPnl >= 0
                  ? "text-win"
                  : "text-loss"
            }
          />
        ))}
      </div>

      {/* P&L Comparison Chart */}
      <div
        className="glass rounded-2xl border border-border/50 p-5"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
          Total P&L Comparison
        </h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={pnlChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: colors.tick }}
              axisLine={{ stroke: colors.grid }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: colors.tick }}
              tickFormatter={(v) => `$${Number(v ?? 0).toFixed(0)}`}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: colors.tooltipBg,
                backdropFilter: "blur(16px)",
                border: colors.tooltipBorder,
                borderRadius: "12px",
                fontSize: "12px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              }}
              formatter={(value) => [`$${Number(value ?? 0).toFixed(2)}`, "Total P&L"]}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {pnlChartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Win Rate Comparison Chart */}
      <div
        className="glass rounded-2xl border border-border/50 p-5"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
          Win Rate Comparison
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={winRateChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: colors.tick }}
              axisLine={{ stroke: colors.grid }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: colors.tick }}
              tickFormatter={(v) => `${Number(v ?? 0).toFixed(0)}%`}
              axisLine={false}
              tickLine={false}
              domain={[0, 100]}
            />
            <Tooltip
              contentStyle={{
                background: colors.tooltipBg,
                backdropFilter: "blur(16px)",
                border: colors.tooltipBorder,
                borderRadius: "12px",
                fontSize: "12px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              }}
              formatter={(value) => [`${Number(value ?? 0).toFixed(1)}%`, "Win Rate"]}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {winRateChartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Stats Comparison Table */}
      <div
        className="glass rounded-2xl border border-border/50 p-5 overflow-x-auto"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
          Detailed Comparison
        </h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50">
              <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold">
                Metric
              </th>
              {results.map((r) => (
                <th
                  key={r.config.id}
                  className="px-3 py-2 text-right text-[10px] uppercase tracking-wider text-muted/60 font-semibold"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: r.config.color }}
                    />
                    {r.config.name}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20">
            <tr>
              <td className="px-3 py-2.5 text-xs text-muted">Total Trades</td>
              {results.map((r) => (
                <td key={r.config.id} className="px-3 py-2.5 text-xs text-foreground font-semibold text-right tabular-nums">
                  {r.stats.totalTrades}
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-3 py-2.5 text-xs text-muted">Win Rate</td>
              {results.map((r) => (
                <td
                  key={r.config.id}
                  className={`px-3 py-2.5 text-xs font-semibold text-right tabular-nums ${
                    r.stats.winRate >= 50 ? "text-win" : "text-loss"
                  }`}
                >
                  {r.stats.winRate.toFixed(1)}%
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-3 py-2.5 text-xs text-muted">Total P&L</td>
              {results.map((r) => (
                <td
                  key={r.config.id}
                  className={`px-3 py-2.5 text-xs font-bold text-right tabular-nums ${
                    r.stats.closedPnl >= 0 ? "text-win" : "text-loss"
                  }`}
                >
                  {r.stats.closedPnl >= 0 ? "+" : ""}${r.stats.closedPnl.toFixed(2)}
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-3 py-2.5 text-xs text-muted">Avg P&L</td>
              {results.map((r) => (
                <td
                  key={r.config.id}
                  className={`px-3 py-2.5 text-xs font-semibold text-right tabular-nums ${
                    r.stats.avgTradePnl >= 0 ? "text-win" : "text-loss"
                  }`}
                >
                  {r.stats.avgTradePnl >= 0 ? "+" : ""}${r.stats.avgTradePnl.toFixed(2)}
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-3 py-2.5 text-xs text-muted">Profit Factor</td>
              {results.map((r) => (
                <td key={r.config.id} className="px-3 py-2.5 text-xs text-foreground font-semibold text-right tabular-nums">
                  {r.stats.profitFactor >= 999 ? "N/A" : r.stats.profitFactor.toFixed(2)}
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-3 py-2.5 text-xs text-muted">Wins / Losses</td>
              {results.map((r) => (
                <td key={r.config.id} className="px-3 py-2.5 text-xs text-foreground text-right tabular-nums">
                  <span className="text-win font-semibold">{r.stats.wins}</span>
                  <span className="text-muted/40"> / </span>
                  <span className="text-loss font-semibold">{r.stats.losses}</span>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

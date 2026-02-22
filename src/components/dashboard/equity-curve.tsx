"use client";

import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";
import { useTheme } from "@/lib/theme-context";
import { getChartColors } from "@/lib/chart-colors";

export function EquityCurve({
  data,
}: {
  data: { date: string; equity: number }[];
}) {
  const { theme } = useTheme();
  const colors = getChartColors(theme);

  if (data.length === 0) {
    return (
      <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
        <h3 className="text-sm font-semibold text-foreground mb-4">
          Equity Curve
        </h3>
        <div className="h-52 flex items-center justify-center text-muted text-sm">
          Close positions to build equity curve
        </div>
      </div>
    );
  }

  const isPositive = data[data.length - 1].equity >= 0;
  const color = isPositive ? colors.win : colors.loss;

  return (
    <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">Equity Curve</h3>
        <span
          className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
            isPositive ? "bg-win/10 text-win" : "bg-loss/10 text-loss"
          }`}
        >
          {isPositive ? "+" : ""}${data[data.length - 1].equity.toFixed(2)}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.2} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: colors.tick }}
            tickFormatter={(v) => v.slice(5)}
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
              background: colors.tooltipBg,
              backdropFilter: "blur(16px)",
              border: colors.tooltipBorder,
              borderRadius: "12px",
              fontSize: "12px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            }}
            labelStyle={{ color: colors.tick }}
            cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
            formatter={(value) => [
              `$${Number(value ?? 0).toFixed(2)}`,
              "Equity",
            ]}
          />
          <Area
            type="monotone"
            dataKey="equity"
            stroke={color}
            strokeWidth={2.5}
            fill="url(#equityGradient)"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

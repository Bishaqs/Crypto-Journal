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
} from "recharts";
import { DailyPnl } from "@/lib/types";
import { useTheme } from "@/lib/theme-context";
import { getChartColors } from "@/lib/chart-colors";

export function PnlChart({ data }: { data: DailyPnl[] }) {
  const { theme } = useTheme();
  const colors = getChartColors(theme);

  if (data.length === 0) {
    return (
      <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
        <h3 className="text-sm font-semibold text-foreground mb-4">
          Daily P&L
        </h3>
        <div className="h-52 flex items-center justify-center text-muted text-sm">
          No realized P&L in range
        </div>
      </div>
    );
  }

  const greenDays = data.filter((d) => d.pnl > 0).length;
  const redDays = data.filter((d) => d.pnl < 0).length;

  return (
    <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">Daily P&L</h3>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-win font-medium">{greenDays} green</span>
          <span className="text-[10px] text-loss font-medium">{redDays} red</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data}>
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
            cursor={{ fill: 'rgba(255,255,255,0.04)' }}
            formatter={(value) => [
              `$${Number(value ?? 0).toFixed(2)}`,
              "P&L",
            ]}
          />
          <Bar dataKey="pnl" radius={[6, 6, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.pnl >= 0 ? colors.win : colors.loss}
                fillOpacity={0.85}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

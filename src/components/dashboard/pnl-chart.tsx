"use client";

import { useId } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Area,
  AreaChart,
  ReferenceArea,
} from "recharts";
import { DailyPnl } from "@/lib/types";
import { useTheme } from "@/lib/theme-context";
import { getChartColors } from "@/lib/chart-colors";
import type { ChartVariant } from "@/components/dashboard/expandable-chart/types";

type PnlChartProps = {
  data: DailyPnl[];
  height?: number;
  variant?: ChartVariant;
  showCard?: boolean;
  zoomHandlers?: {
    onMouseDown: (e: { activeLabel?: string | number }) => void;
    onMouseMove: (e: { activeLabel?: string | number }) => void;
    onMouseUp: () => void;
    refAreaLeft: string | null;
    refAreaRight: string | null;
  };
};

export function PnlChart({
  data,
  height = 220,
  variant = "bar",
  showCard = true,
  zoomHandlers,
}: PnlChartProps) {
  const { theme } = useTheme();
  const colors = getChartColors(theme);
  const gradientId = useId().replace(/:/g, "");

  if (data.length === 0) {
    if (!showCard) {
      return (
        <div className="h-52 flex items-center justify-center text-muted text-sm">
          No realized P&L in range
        </div>
      );
    }
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

  const tooltipStyle = {
    contentStyle: {
      background: colors.tooltipBg,
      backdropFilter: "blur(16px)",
      border: colors.tooltipBorder,
      borderRadius: "12px",
      fontSize: "12px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    },
    labelStyle: { color: colors.tick },
    formatter: (value: number | string | undefined) => [
      `$${Number(value ?? 0).toFixed(2)}`,
      "P&L",
    ] as [string, string],
  };

  const xAxisProps = {
    dataKey: "date" as const,
    tick: { fontSize: 10, fill: colors.tick },
    tickFormatter: (v: string) => v.slice(5),
    axisLine: { stroke: colors.grid },
    tickLine: false,
  };

  const yAxisProps = {
    tick: { fontSize: 10, fill: colors.tick },
    tickFormatter: (v: number) => `$${v}`,
    axisLine: false,
    tickLine: false,
  };

  const mouseProps = zoomHandlers
    ? {
        onMouseDown: zoomHandlers.onMouseDown,
        onMouseMove: zoomHandlers.onMouseMove,
        onMouseUp: zoomHandlers.onMouseUp,
      }
    : {};

  const referenceArea =
    zoomHandlers?.refAreaLeft && zoomHandlers?.refAreaRight ? (
      <ReferenceArea
        x1={zoomHandlers.refAreaLeft}
        x2={zoomHandlers.refAreaRight}
        strokeOpacity={0.3}
        fill="rgba(0, 180, 216, 0.15)"
      />
    ) : null;

  function renderChart() {
    if (variant === "line") {
      return (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data} {...mouseProps}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip {...tooltipStyle} cursor={{ stroke: "rgba(255,255,255,0.1)", strokeWidth: 1 }} />
            <Line
              type="monotone"
              dataKey="pnl"
              stroke={colors.accent}
              strokeWidth={2.5}
              dot={(props: Record<string, unknown>) => {
                const { cx, cy, payload } = props as { cx: number; cy: number; payload: DailyPnl };
                return (
                  <circle
                    key={`${cx}-${cy}`}
                    cx={cx}
                    cy={cy}
                    r={3}
                    fill={payload.pnl >= 0 ? colors.win : colors.loss}
                    stroke="none"
                  />
                );
              }}
            />
            {referenceArea}
          </LineChart>
        </ResponsiveContainer>
      );
    }

    if (variant === "area") {
      const lastPnl = data[data.length - 1]?.pnl ?? 0;
      const areaColor = lastPnl >= 0 ? colors.win : colors.loss;
      return (
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={data} {...mouseProps}>
            <defs>
              <linearGradient id={`pnlGrad-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={areaColor} stopOpacity={0.2} />
                <stop offset="100%" stopColor={areaColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip {...tooltipStyle} cursor={{ stroke: "rgba(255,255,255,0.1)", strokeWidth: 1 }} />
            <Area
              type="monotone"
              dataKey="pnl"
              stroke={areaColor}
              strokeWidth={2.5}
              fill={`url(#pnlGrad-${gradientId})`}
              dot={false}
            />
            {referenceArea}
          </AreaChart>
        </ResponsiveContainer>
      );
    }

    // Default: bar
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} {...mouseProps}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
          <XAxis {...xAxisProps} />
          <YAxis {...yAxisProps} />
          <Tooltip {...tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
          <Bar dataKey="pnl" radius={[6, 6, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.pnl >= 0 ? colors.win : colors.loss}
                fillOpacity={0.85}
              />
            ))}
          </Bar>
          {referenceArea}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (!showCard) return renderChart();

  return (
    <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">Daily P&L</h3>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-win font-medium">{greenDays} green</span>
          <span className="text-[10px] text-loss font-medium">{redDays} red</span>
        </div>
      </div>
      {renderChart()}
    </div>
  );
}

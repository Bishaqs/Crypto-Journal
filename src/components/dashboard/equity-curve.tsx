"use client";

import { useId } from "react";
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Area,
  AreaChart,
  Line,
  LineChart,
  Bar,
  BarChart,
  Cell,
  ReferenceArea,
} from "recharts";
import { useTheme } from "@/lib/theme-context";
import { getChartColors } from "@/lib/chart-colors";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import type { ChartVariant } from "@/components/dashboard/expandable-chart/types";

type EquityCurveProps = {
  data: { date: string; equity: number }[];
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

export function EquityCurve({
  data,
  height = 220,
  variant = "area",
  showCard = true,
  zoomHandlers,
}: EquityCurveProps) {
  const { theme } = useTheme();
  const colors = getChartColors(theme);
  const gradientId = useId().replace(/:/g, "");

  if (data.length === 0) {
    if (!showCard) {
      return (
        <div className="h-52 flex items-center justify-center text-muted text-sm">
          Close positions to build equity curve
        </div>
      );
    }
    return (
      <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-1.5">
          Equity Curve <InfoTooltip text="Your cumulative P&L over time — shows growth trajectory" size={13} />
        </h3>
        <div className="h-52 flex items-center justify-center text-muted text-sm">
          Close positions to build equity curve
        </div>
      </div>
    );
  }

  const isPositive = data[data.length - 1].equity >= 0;
  const color = isPositive ? colors.win : colors.loss;

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
      "Equity",
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
              dataKey="equity"
              stroke={color}
              strokeWidth={2.5}
              dot={false}
            />
            {referenceArea}
          </LineChart>
        </ResponsiveContainer>
      );
    }

    if (variant === "bar") {
      return (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} {...mouseProps}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip {...tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
            <Bar dataKey="equity" radius={[6, 6, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.equity >= 0 ? colors.win : colors.loss}
                  fillOpacity={0.85}
                />
              ))}
            </Bar>
            {referenceArea}
          </BarChart>
        </ResponsiveContainer>
      );
    }

    // Default: area
    return (
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} {...mouseProps}>
          <defs>
            <linearGradient id={`eqGrad-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.2} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
          <XAxis {...xAxisProps} />
          <YAxis {...yAxisProps} />
          <Tooltip {...tooltipStyle} cursor={{ stroke: "rgba(255,255,255,0.1)", strokeWidth: 1 }} />
          <Area
            type="monotone"
            dataKey="equity"
            stroke={color}
            strokeWidth={2.5}
            fill={`url(#eqGrad-${gradientId})`}
            dot={false}
          />
          {referenceArea}
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  if (!showCard) return renderChart();

  return (
    <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          Equity Curve <InfoTooltip text="Your cumulative P&L over time — shows growth trajectory" size={13} />
        </h3>
        <span
          className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
            isPositive ? "bg-win/10 text-win" : "bg-loss/10 text-loss"
          }`}
        >
          {isPositive ? "+" : ""}${data[data.length - 1].equity.toFixed(2)}
        </span>
      </div>
      {renderChart()}
    </div>
  );
}

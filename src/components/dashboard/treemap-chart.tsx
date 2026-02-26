"use client";

import { useState } from "react";
import { Treemap, ResponsiveContainer, Tooltip } from "recharts";
import { useTheme } from "@/lib/theme-context";
import { getChartColors } from "@/lib/chart-colors";
import { type GroupSummary } from "@/lib/trade-grouping";

type Metric = "pnl" | "count";

function CustomContent(props: Record<string, unknown>) {
  const { x, y, width, height, name, value, pnlValue } = props as {
    x: number;
    y: number;
    width: number;
    height: number;
    name: string;
    value: number;
    pnlValue: number;
  };

  const colors = getChartColors("dark");
  const fill = pnlValue >= 0 ? colors.win : colors.loss;
  const showLabel = width > 50 && height > 30;
  const showValue = width > 60 && height > 45;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        fillOpacity={0.7}
        stroke="var(--background)"
        strokeWidth={2}
        rx={4}
      />
      {showLabel && (
        <text
          x={x + width / 2}
          y={y + height / 2 - (showValue ? 6 : 0)}
          textAnchor="middle"
          fill="#fff"
          fontSize={width > 80 ? 12 : 10}
          fontWeight={600}
        >
          {name}
        </text>
      )}
      {showValue && (
        <text
          x={x + width / 2}
          y={y + height / 2 + 12}
          textAnchor="middle"
          fill="rgba(255,255,255,0.7)"
          fontSize={10}
        >
          ${Number(value).toFixed(0)}
        </text>
      )}
    </g>
  );
}

export function TreemapChart({
  groups,
  title,
}: {
  groups: GroupSummary[];
  title: string;
}) {
  const { theme } = useTheme();
  const colors = getChartColors(theme);
  const [metric, setMetric] = useState<Metric>("pnl");

  const data = groups
    .filter((g) => (metric === "pnl" ? g.totalPnl !== 0 : g.tradeCount > 0))
    .map((g) => ({
      name: g.label,
      value: metric === "pnl" ? Math.abs(g.totalPnl) : g.tradeCount,
      pnlValue: g.totalPnl,
    }));

  if (data.length === 0) {
    return (
      <div
        className="glass rounded-2xl border border-border/50 p-8 text-center"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <p className="text-muted text-sm">No data to display</p>
      </div>
    );
  }

  return (
    <div
      className="glass rounded-2xl border border-border/50 p-5"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <div className="inline-flex rounded-lg bg-background border border-border/50 p-0.5">
          <button
            onClick={() => setMetric("pnl")}
            className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all ${
              metric === "pnl"
                ? "bg-accent/15 text-accent"
                : "text-muted hover:text-foreground"
            }`}
          >
            P&L
          </button>
          <button
            onClick={() => setMetric("count")}
            className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all ${
              metric === "count"
                ? "bg-accent/15 text-accent"
                : "text-muted hover:text-foreground"
            }`}
          >
            Count
          </button>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <Treemap
          data={data}
          dataKey="value"
          nameKey="name"
          content={<CustomContent />}
          aspectRatio={4 / 3}
          animationDuration={300}
        >
          <Tooltip
            contentStyle={{
              background: colors.tooltipBg,
              backdropFilter: "blur(16px)",
              border: colors.tooltipBorder,
              borderRadius: "12px",
              fontSize: "12px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            }}
            formatter={(value: any, _name: any, entry: any) => {
              const pnl = entry?.payload?.pnlValue ?? 0;
              if (metric === "pnl") {
                return [`$${Number(pnl).toFixed(2)}`, "P&L"];
              }
              return [value ?? 0, "Trades"];
            }}
          />
        </Treemap>
      </ResponsiveContainer>
    </div>
  );
}

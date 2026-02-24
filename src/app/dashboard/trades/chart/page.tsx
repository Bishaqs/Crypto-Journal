"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTrades } from "@/hooks/use-trades";
import { calculateTradePnl } from "@/lib/calculations";
import { useTheme } from "@/lib/theme-context";
import { getChartColors } from "@/lib/chart-colors";
import { DemoBanner } from "@/components/demo-banner";
import { Header } from "@/components/header";
import { ScatterChart as ScatterIcon } from "lucide-react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  Cell,
} from "recharts";

export default function TradesChartPage() {
  const router = useRouter();
  const { trades, loading, usingDemo } = useTrades();
  const { theme } = useTheme();
  const colors = getChartColors(theme);

  const chartData = useMemo(() => {
    return trades
      .filter((t) => t.close_timestamp && t.pnl !== null)
      .map((t) => ({
        date: new Date(t.close_timestamp!).getTime(),
        pnl: t.pnl ?? calculateTradePnl(t) ?? 0,
        symbol: t.symbol,
        id: t.id,
        size: Math.min(Math.abs(t.pnl ?? 0) + 20, 400),
      }));
  }, [trades]);

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
          <ScatterIcon size={24} className="text-accent" />
          Trades Chart
        </h2>
        <p className="text-sm text-muted mt-0.5">
          {usingDemo ? "Sample data" : `${chartData.length} closed trades`}
        </p>
      </div>
      {usingDemo && <DemoBanner feature="trades chart" />}

      <div
        className="bg-surface rounded-2xl border border-border p-4"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        {chartData.length === 0 ? (
          <div className="text-center py-16 text-muted">
            <p className="text-lg font-semibold text-foreground mb-2">No closed trades</p>
            <p className="text-sm">Close some trades to see them plotted here.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={500}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
              <XAxis
                type="number"
                dataKey="date"
                domain={["auto", "auto"]}
                tickFormatter={(ts) =>
                  new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                }
                tick={{ fill: colors.tick, fontSize: 11 }}
                stroke={colors.grid}
                name="Date"
              />
              <YAxis
                type="number"
                dataKey="pnl"
                tick={{ fill: colors.tick, fontSize: 11 }}
                stroke={colors.grid}
                tickFormatter={(v) => `$${v}`}
                name="P&L"
              />
              <ZAxis type="number" dataKey="size" range={[30, 300]} />
              <ReferenceLine y={0} stroke={colors.tick} strokeDasharray="3 3" />
              <Tooltip
                contentStyle={tooltipStyle}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any, name: any) => {
                  const v = Number(value ?? 0);
                  if (name === "P&L") return [`$${v.toFixed(2)}`, "P&L"];
                  if (name === "Date")
                    return [
                      new Date(v).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      }),
                      "Date",
                    ];
                  return [v, String(name)];
                }}
                labelFormatter={() => ""}
              />
              <Scatter
                data={chartData}
                cursor="pointer"
                onClick={(data) => {
                  if (data?.id) router.push(`/dashboard/trades/${data.id}`);
                }}
              >
                {chartData.map((entry) => (
                  <Cell
                    key={entry.id}
                    fill={entry.pnl >= 0 ? colors.win : colors.loss}
                    fillOpacity={0.7}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Summary stats */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(() => {
            const pnls = chartData.map((d) => d.pnl);
            const wins = pnls.filter((p) => p > 0);
            const losses = pnls.filter((p) => p < 0);
            const total = pnls.reduce((s, p) => s + p, 0);
            return [
              { label: "Total P&L", value: `$${total.toFixed(2)}`, color: total >= 0 ? "text-win" : "text-loss" },
              { label: "Win Rate", value: `${((wins.length / pnls.length) * 100).toFixed(1)}%`, color: wins.length / pnls.length >= 0.5 ? "text-win" : "text-loss" },
              { label: "Best Trade", value: `$${Math.max(...pnls).toFixed(2)}`, color: "text-win" },
              { label: "Worst Trade", value: `$${Math.min(...pnls).toFixed(2)}`, color: "text-loss" },
            ];
          })().map((stat) => (
            <div
              key={stat.label}
              className="glass rounded-xl border border-border/50 p-4"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <p className="text-[10px] uppercase tracking-wider text-muted/60 font-semibold">
                {stat.label}
              </p>
              <p className={`text-lg font-bold tabular-nums ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

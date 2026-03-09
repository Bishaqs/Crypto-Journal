"use client";

import { useState, useMemo } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  ReferenceLine,
} from "recharts";
import type { MonthlyReturn } from "./seasonality-types";
import { formatReturn, fitSineCurve } from "./seasonality-utils";

interface MonthlyReturnsTabProps {
  data: MonthlyReturn[];
  symbol: string;
  colors: {
    win: string;
    loss: string;
    grid: string;
    tick: string;
    tooltipBg: string;
    tooltipBorder: string;
  };
}

function StatBlock({ label, value, color = "text-foreground" }: { label: string; value: string; color?: string }) {
  return (
    <div className="glass rounded-xl border border-border/50 p-4 hover:border-accent/20 transition-all duration-300" style={{ boxShadow: "var(--shadow-card)" }}>
      <p className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}

export default function MonthlyReturnsTab({ data, symbol, colors }: MonthlyReturnsTabProps) {
  const [showSine, setShowSine] = useState(true);

  const best = data.reduce((b, m) => (m.avgReturn > b.avgReturn ? m : b), data[0]);
  const worst = data.reduce((w, m) => (m.avgReturn < w.avgReturn ? m : w), data[0]);
  const avgWinRate = data.length > 0
    ? data.reduce((s, m) => s + m.winRate, 0) / data.length
    : 0;
  const medianAll = data.length > 0
    ? [...data].sort((a, b) => a.medianReturn - b.medianReturn)[Math.floor(data.length / 2)].medianReturn
    : 0;

  const sineFit = useMemo(
    () => fitSineCurve(data.map((d) => d.avgReturn)),
    [data],
  );

  const chartData = useMemo(
    () => data.map((d, i) => ({ ...d, sineFitted: sineFit.fittedValues[i] })),
    [data, sineFit],
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatBlock
          label="Best Month"
          value={best ? `${best.month} (${formatReturn(best.avgReturn)})` : "N/A"}
          color="text-win"
        />
        <StatBlock
          label="Worst Month"
          value={worst ? `${worst.month} (${formatReturn(worst.avgReturn)})` : "N/A"}
          color="text-loss"
        />
        <StatBlock
          label="Avg Win Rate"
          value={`${avgWinRate.toFixed(1)}%`}
          color={avgWinRate >= 50 ? "text-win" : "text-loss"}
        />
        <StatBlock
          label="Median Return"
          value={formatReturn(medianAll)}
          color={medianAll >= 0 ? "text-win" : "text-loss"}
        />
      </div>

      <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
            Monthly Average Returns — {symbol}
          </h3>
          <button
            onClick={() => setShowSine(!showSine)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
              showSine
                ? "bg-accent/10 text-accent border border-accent/30"
                : "bg-surface border border-border/50 text-muted hover:text-foreground hover:border-accent/20"
            }`}
          >
            <span className="w-3 h-0.5 border-t-2 border-dashed border-current" />
            Sine Fit (R² = {sineFit.r2.toFixed(2)})
          </button>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: colors.tick }}
              axisLine={{ stroke: colors.grid }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: colors.tick }}
              tickFormatter={(v) => `${v}%`}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload as MonthlyReturn & { sineFitted: number };
                return (
                  <div style={{
                    background: colors.tooltipBg,
                    backdropFilter: "blur(16px)",
                    border: colors.tooltipBorder,
                    borderRadius: "12px",
                    fontSize: "12px",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                    padding: "10px 14px",
                  }}>
                    <p className="font-semibold text-foreground mb-1">{label}</p>
                    <p className={d.avgReturn >= 0 ? "text-win" : "text-loss"}>
                      Avg: {formatReturn(d.avgReturn)}
                    </p>
                    {showSine && d.sineFitted != null && (
                      <p className="text-accent">Sine: {formatReturn(d.sineFitted)}</p>
                    )}
                    <p className="text-muted">Median: {formatReturn(d.medianReturn)}</p>
                    <p className="text-muted">Win Rate: {d.winRate.toFixed(1)}%</p>
                    <p className="text-muted/60 text-[10px] mt-1">{d.sampleSize} data points</p>
                  </div>
                );
              }}
            />
            <ReferenceLine y={0} stroke={colors.grid} strokeDasharray="3 3" />
            <Bar dataKey="avgReturn" radius={[6, 6, 0, 0]} maxBarSize={50}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`monthly-${index}`}
                  fill={entry.avgReturn >= 0 ? colors.win : colors.loss}
                  fillOpacity={0.85}
                />
              ))}
            </Bar>
            {showSine && (
              <Line
                type="monotone"
                dataKey="sineFitted"
                stroke="var(--accent, #8b5cf6)"
                strokeWidth={2}
                strokeDasharray="8 4"
                dot={false}
                name="Seasonal Cycle"
                isAnimationActive={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="glass rounded-2xl border border-border/50 p-5 overflow-x-auto" style={{ boxShadow: "var(--shadow-card)" }}>
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
          Detailed Monthly Breakdown
        </h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50">
              <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold">Month</th>
              <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold">Avg Return</th>
              <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold">Median</th>
              <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold">Win Rate</th>
              <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold">Best Year</th>
              <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold">Worst Year</th>
              <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold">Data Pts</th>
            </tr>
          </thead>
          <tbody>
            {data.map((m) => (
              <tr key={m.month} className="border-b border-border/30 hover:bg-surface-hover/50 transition-colors">
                <td className="px-4 py-3 text-xs font-semibold text-foreground">{m.month}</td>
                <td className={`px-4 py-3 text-xs font-bold tabular-nums ${m.avgReturn >= 0 ? "text-win" : "text-loss"}`}>
                  {formatReturn(m.avgReturn)}
                </td>
                <td className={`px-4 py-3 text-xs tabular-nums ${m.medianReturn >= 0 ? "text-win" : "text-loss"}`}>
                  {formatReturn(m.medianReturn)}
                </td>
                <td className={`px-4 py-3 text-xs tabular-nums ${m.winRate >= 50 ? "text-win" : "text-loss"}`}>
                  {m.winRate.toFixed(1)}%
                </td>
                <td className="px-4 py-3 text-xs tabular-nums text-win">
                  {formatReturn(m.maxReturn)}
                </td>
                <td className="px-4 py-3 text-xs tabular-nums text-loss">
                  {formatReturn(m.minReturn)}
                </td>
                <td className="px-4 py-3 text-xs text-muted tabular-nums">{m.sampleSize}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

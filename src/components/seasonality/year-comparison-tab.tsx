"use client";

import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import type { YearlyPriceNormalized } from "./seasonality-types";
import { formatReturn } from "./seasonality-utils";

interface YearComparisonTabProps {
  data: YearlyPriceNormalized[];
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

const YEAR_COLORS = [
  "#8B5CF6", "#22c55e", "#f59e0b", "#ef4444", "#0ea5e9",
  "#ec4899", "#14b8a6", "#f97316", "#a78bfa", "#6366f1",
];

function StatBlock({ label, value, color = "text-foreground" }: { label: string; value: string; color?: string }) {
  return (
    <div className="glass rounded-xl border border-border/50 p-4 hover:border-accent/20 transition-all duration-300" style={{ boxShadow: "var(--shadow-card)" }}>
      <p className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}

export default function YearComparisonTab({ data, symbol, colors }: YearComparisonTabProps) {
  const currentYear = new Date().getFullYear();
  const [visibleYears, setVisibleYears] = useState<Set<number>>(
    () => new Set(data.map((d) => d.year))
  );

  const toggleYear = (year: number) => {
    setVisibleYears((prev) => {
      const next = new Set(prev);
      if (next.has(year)) {
        if (next.size > 1) next.delete(year);
      } else {
        next.add(year);
      }
      return next;
    });
  };

  // Merge all years' data into a single array keyed by dayOfYear
  const chartData = useMemo(() => {
    const dayMap: Record<number, Record<string, number>> = {};
    for (const yearData of data) {
      if (!visibleYears.has(yearData.year)) continue;
      for (const point of yearData.data) {
        if (!dayMap[point.dayOfYear]) dayMap[point.dayOfYear] = { dayOfYear: point.dayOfYear };
        dayMap[point.dayOfYear][`y${yearData.year}`] = point.normalizedPrice;
      }
    }
    return Object.values(dayMap).sort((a, b) => a.dayOfYear - b.dayOfYear);
  }, [data, visibleYears]);

  const bestYTD = data.reduce((b, y) => (y.ytdReturn > b.ytdReturn ? y : b), data[0]);
  const worstYTD = data.reduce((w, y) => (y.ytdReturn < w.ytdReturn ? y : w), data[0]);
  const currentYearData = data.find((d) => d.year === currentYear);
  const avgAnnual = data.length > 0
    ? data.reduce((s, y) => s + y.ytdReturn, 0) / data.length
    : 0;

  if (data.length === 0) {
    return (
      <div className="glass rounded-2xl border border-border/50 p-12 flex flex-col items-center justify-center text-center" style={{ boxShadow: "var(--shadow-card)" }}>
        <p className="text-sm text-muted">No yearly comparison data available. Try a longer lookback period (2Y+).</p>
      </div>
    );
  }

  // Convert dayOfYear to month label
  const dayToMonth = (day: number): string => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let acc = 0;
    for (let i = 0; i < 12; i++) {
      acc += daysInMonth[i];
      if (day <= acc) return months[i];
    }
    return "Dec";
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatBlock
          label="Best YTD Year"
          value={bestYTD ? `${bestYTD.year} (${formatReturn(bestYTD.ytdReturn)})` : "N/A"}
          color="text-win"
        />
        <StatBlock
          label="Worst YTD Year"
          value={worstYTD ? `${worstYTD.year} (${formatReturn(worstYTD.ytdReturn)})` : "N/A"}
          color="text-loss"
        />
        <StatBlock
          label="Current Year YTD"
          value={currentYearData ? formatReturn(currentYearData.ytdReturn) : "N/A"}
          color={currentYearData && currentYearData.ytdReturn >= 0 ? "text-win" : "text-loss"}
        />
        <StatBlock
          label="Avg Annual Return"
          value={formatReturn(avgAnnual)}
          color={avgAnnual >= 0 ? "text-win" : "text-loss"}
        />
      </div>

      <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
          Year-over-Year Price Comparison — {symbol}
        </h3>
        <p className="text-[10px] text-muted/50 mb-3">
          Each year normalized to 100 at start. Shows relative price performance through the year.
        </p>

        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
            <XAxis
              dataKey="dayOfYear"
              tick={{ fontSize: 10, fill: colors.tick }}
              axisLine={{ stroke: colors.grid }}
              tickLine={false}
              tickFormatter={dayToMonth}
              interval={30}
            />
            <YAxis
              tick={{ fontSize: 10, fill: colors.tick }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}`}
              domain={["auto", "auto"]}
            />
            <Tooltip
              contentStyle={{
                background: colors.tooltipBg,
                backdropFilter: "blur(16px)",
                border: colors.tooltipBorder,
                borderRadius: "12px",
                fontSize: "11px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              }}
              labelFormatter={(day) => `Day ${day} (${dayToMonth(Number(day))})`}
              formatter={(value) => {
                const v = Number(value ?? 0);
                return [`${v.toFixed(1)}`, ""];
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: "11px" }}
            />
            {data
              .filter((y) => visibleYears.has(y.year))
              .map((yearData, i) => (
                <Line
                  key={yearData.year}
                  type="monotone"
                  dataKey={`y${yearData.year}`}
                  name={`${yearData.year}`}
                  stroke={YEAR_COLORS[i % YEAR_COLORS.length]}
                  strokeWidth={yearData.year === currentYear ? 3 : 1.5}
                  dot={false}
                  strokeOpacity={yearData.year === currentYear ? 1 : 0.7}
                />
              ))}
          </LineChart>
        </ResponsiveContainer>

        {/* Year toggle pills */}
        <div className="flex flex-wrap gap-2 mt-4 justify-center">
          {data.map((yearData, i) => {
            const isVisible = visibleYears.has(yearData.year);
            const color = YEAR_COLORS[i % YEAR_COLORS.length];
            return (
              <button
                key={yearData.year}
                onClick={() => toggleYear(yearData.year)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                  isVisible
                    ? "border-white/20"
                    : "border-border/30 opacity-40 line-through"
                }`}
                style={{
                  backgroundColor: isVisible ? `${color}15` : "transparent",
                  color: isVisible ? color : undefined,
                }}
              >
                {yearData.year} ({formatReturn(yearData.ytdReturn)})
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

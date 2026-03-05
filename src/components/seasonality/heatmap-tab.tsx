"use client";

import { useMemo } from "react";
import type { MonthlyByYear } from "./seasonality-types";
import { formatReturn, getHeatmapColor } from "./seasonality-utils";

interface HeatmapTabProps {
  data: MonthlyByYear[];
  symbol: string;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function StatBlock({ label, value, color = "text-foreground" }: { label: string; value: string; color?: string }) {
  return (
    <div className="glass rounded-xl border border-border/50 p-4 hover:border-accent/20 transition-all duration-300" style={{ boxShadow: "var(--shadow-card)" }}>
      <p className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}

export default function HeatmapTab({ data, symbol }: HeatmapTabProps) {
  const stats = useMemo(() => {
    let bestCell = { year: 0, month: "", returnPct: -Infinity };
    let worstCell = { year: 0, month: "", returnPct: Infinity };
    let globalMin = 0;
    let globalMax = 0;

    const yearTotals: { year: number; total: number }[] = [];

    for (const yearData of data) {
      let yearTotal = 0;
      for (const m of yearData.months) {
        if (m.sampleSize === 0) continue;
        yearTotal += m.returnPct;
        if (m.returnPct > bestCell.returnPct) {
          bestCell = { year: yearData.year, month: m.month, returnPct: m.returnPct };
        }
        if (m.returnPct < worstCell.returnPct) {
          worstCell = { year: yearData.year, month: m.month, returnPct: m.returnPct };
        }
        globalMin = Math.min(globalMin, m.returnPct);
        globalMax = Math.max(globalMax, m.returnPct);
      }
      yearTotals.push({ year: yearData.year, total: yearTotal });
    }

    const strongestYear = yearTotals.reduce((b, y) => (y.total > b.total ? y : b), yearTotals[0]);
    const weakestYear = yearTotals.reduce((w, y) => (y.total < w.total ? y : w), yearTotals[0]);

    return { bestCell, worstCell, strongestYear, weakestYear, globalMin, globalMax };
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="glass rounded-2xl border border-border/50 p-12 flex flex-col items-center justify-center text-center" style={{ boxShadow: "var(--shadow-card)" }}>
        <p className="text-sm text-muted">No heatmap data available. Try a longer lookback period (2Y+).</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatBlock
          label="Best Month/Year"
          value={stats.bestCell.year ? `${stats.bestCell.month} ${stats.bestCell.year} (${formatReturn(stats.bestCell.returnPct)})` : "N/A"}
          color="text-win"
        />
        <StatBlock
          label="Worst Month/Year"
          value={stats.worstCell.year ? `${stats.worstCell.month} ${stats.worstCell.year} (${formatReturn(stats.worstCell.returnPct)})` : "N/A"}
          color="text-loss"
        />
        <StatBlock
          label="Strongest Year"
          value={stats.strongestYear ? `${stats.strongestYear.year} (${formatReturn(stats.strongestYear.total)})` : "N/A"}
          color="text-win"
        />
        <StatBlock
          label="Weakest Year"
          value={stats.weakestYear ? `${stats.weakestYear.year} (${formatReturn(stats.weakestYear.total)})` : "N/A"}
          color="text-loss"
        />
      </div>

      <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
          Monthly Returns Heatmap — {symbol}
        </h3>

        <div className="overflow-x-auto">
          {/* Header row */}
          <div className="grid gap-1" style={{ gridTemplateColumns: `60px repeat(12, minmax(52px, 1fr))` }}>
            <div />
            {MONTHS.map((m) => (
              <div key={m} className="text-center text-[10px] text-muted/60 font-semibold uppercase tracking-wider py-1">
                {m}
              </div>
            ))}
          </div>

          {/* Data rows */}
          {data.map((yearData) => (
            <div
              key={yearData.year}
              className="grid gap-1 mt-1"
              style={{ gridTemplateColumns: `60px repeat(12, minmax(52px, 1fr))` }}
            >
              <div className="flex items-center justify-end pr-2">
                <span className="text-[11px] font-semibold text-muted/80 tabular-nums">{yearData.year}</span>
              </div>
              {yearData.months.map((m, i) => {
                const hasData = m.sampleSize > 0;
                const bg = hasData
                  ? getHeatmapColor(m.returnPct, stats.globalMin, stats.globalMax)
                  : "rgba(128, 128, 128, 0.05)";
                return (
                  <div
                    key={`${yearData.year}-${i}`}
                    className="relative rounded-lg flex items-center justify-center py-3 cursor-default transition-all hover:ring-1 hover:ring-accent/30 group"
                    style={{ backgroundColor: bg }}
                    title={hasData ? `${m.month} ${yearData.year}: ${formatReturn(m.returnPct)} (${m.sampleSize} days)` : `${m.month} ${yearData.year}: No data`}
                  >
                    <span className={`text-[11px] font-bold tabular-nums ${
                      !hasData ? "text-muted/20" :
                      m.returnPct >= 0 ? "text-white/90" : "text-white/90"
                    }`}>
                      {hasData ? `${m.returnPct >= 0 ? "+" : ""}${m.returnPct.toFixed(1)}%` : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Color legend */}
        <div className="flex items-center gap-2 mt-6 justify-center">
          <span className="text-[9px] text-muted/50">Bearish</span>
          <div className="flex h-3 rounded-full overflow-hidden" style={{ width: 200 }}>
            {Array.from({ length: 20 }, (_, i) => {
              const val = ((i / 19) * 2 - 1);
              const color = val >= 0
                ? `rgba(34, 197, 94, ${0.08 + val * 0.62})`
                : `rgba(239, 68, 68, ${0.08 + Math.abs(val) * 0.62})`;
              return <div key={i} className="flex-1" style={{ backgroundColor: color }} />;
            })}
          </div>
          <span className="text-[9px] text-muted/50">Bullish</span>
        </div>
      </div>
    </div>
  );
}

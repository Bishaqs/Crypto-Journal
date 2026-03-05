"use client";

import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  ReferenceLine,
} from "recharts";
import type { InstitutionalData } from "./fundamentals-types";
import { formatCurrencyLarge, formatSharesCompact, formatPctChange } from "./fundamentals-utils";

interface InstitutionalTabProps {
  data: InstitutionalData;
  symbol: string;
  colors: {
    win: string;
    loss: string;
    accent: string;
    grid: string;
    tick: string;
    tooltipBg: string;
    tooltipBorder: string;
  };
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div
      className="glass rounded-xl border border-border/50 p-4 hover:border-accent/20 transition-all duration-300"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <p className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1">{label}</p>
      <p className="text-lg font-bold text-foreground">{value}</p>
      {sub && <p className="text-[10px] text-muted/40 mt-0.5">{sub}</p>}
    </div>
  );
}

function HoldingsTable({
  title,
  rows,
  showChangeColumn,
}: {
  title: string;
  rows: {
    name: string;
    shares: number;
    value: number;
    pctOfPortfolio: number;
    changeText: string;
    changePositive: boolean;
  }[];
  showChangeColumn: boolean;
}) {
  if (rows.length === 0) return null;
  return (
    <div
      className="glass rounded-2xl border border-border/50 overflow-hidden"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="p-5 pb-3">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 bg-surface/30">
              <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold w-8">#</th>
              <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold">Name</th>
              <th className="px-4 py-3 text-right text-[10px] uppercase tracking-wider text-muted/60 font-semibold">Shares</th>
              <th className="px-4 py-3 text-right text-[10px] uppercase tracking-wider text-muted/60 font-semibold">Total Value</th>
              <th className="px-4 py-3 text-right text-[10px] uppercase tracking-wider text-muted/60 font-semibold">% of Portfolio</th>
              {showChangeColumn && (
                <th className="px-4 py-3 text-right text-[10px] uppercase tracking-wider text-muted/60 font-semibold">Change</th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr
                key={r.name}
                className={`border-b border-border/20 ${idx % 2 === 1 ? "bg-surface/10" : ""}`}
              >
                <td className="px-4 py-2.5 text-xs text-muted/40 font-bold">{idx + 1}</td>
                <td className="px-4 py-2.5 text-xs font-semibold text-foreground whitespace-nowrap">{r.name}</td>
                <td className="px-4 py-2.5 text-xs tabular-nums text-muted text-right">{formatSharesCompact(r.shares)}</td>
                <td className="px-4 py-2.5 text-xs tabular-nums text-foreground text-right font-semibold">{formatCurrencyLarge(r.value)}</td>
                <td className="px-4 py-2.5 text-xs tabular-nums text-muted text-right">{r.pctOfPortfolio.toFixed(2)}%</td>
                {showChangeColumn && (
                  <td className={`px-4 py-2.5 text-xs tabular-nums text-right font-semibold ${r.changePositive ? "text-win" : "text-loss"}`}>
                    {r.changeText}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function InstitutionalTab({ data, symbol, colors }: InstitutionalTabProps) {
  const latestQ = data.quarters[data.quarters.length - 1];
  const [selectedYear, setSelectedYear] = useState(latestQ?.year ?? 2025);
  const [selectedQuarter, setSelectedQuarter] = useState(latestQ?.quarter ?? 4);

  const years = useMemo(() => [...new Set(data.quarters.map((q) => q.year))], [data.quarters]);
  const quartersForYear = useMemo(
    () => data.quarters.filter((q) => q.year === selectedYear),
    [data.quarters, selectedYear],
  );

  const selectedData = useMemo(
    () => data.quarters.find((q) => q.year === selectedYear && q.quarter === selectedQuarter) ?? latestQ,
    [data.quarters, selectedYear, selectedQuarter, latestQ],
  );

  const holdersWithChange = useMemo(
    () =>
      (selectedData?.holders ?? []).map((h) => {
        const { text, isPositive } = formatPctChange(h.shares, h.prevShares);
        return { ...h, changeText: text, changePositive: isPositive };
      }),
    [selectedData],
  );

  const topHolders = holdersWithChange.slice(0, 20);
  const bottomHolders = useMemo(
    () => [...holdersWithChange].sort((a, b) => a.shares - b.shares).slice(0, 20),
    [holdersWithChange],
  );
  const positionIncreases = useMemo(
    () =>
      holdersWithChange
        .filter((h) => h.shares > h.prevShares)
        .sort((a, b) => {
          const aChg = (a.shares - a.prevShares) / (a.prevShares || 1);
          const bChg = (b.shares - b.prevShares) / (b.prevShares || 1);
          return bChg - aChg;
        })
        .slice(0, 20),
    [holdersWithChange],
  );
  const positionDecreases = useMemo(
    () =>
      holdersWithChange
        .filter((h) => h.shares < h.prevShares)
        .sort((a, b) => {
          const aChg = (a.shares - a.prevShares) / (a.prevShares || 1);
          const bChg = (b.shares - b.prevShares) / (b.prevShares || 1);
          return aChg - bChg;
        })
        .slice(0, 20),
    [holdersWithChange],
  );

  const trendsData = useMemo(
    () =>
      data.quarters.map((q, i) => {
        const prevTotal = i > 0 ? data.quarters[i - 1].totalShares : q.totalShares;
        return {
          label: `Q${q.quarter} ${q.year}`,
          netChange: q.totalShares - prevTotal,
        };
      }),
    [data.quarters],
  );

  const maxHolder = selectedData?.holders.reduce(
    (a, b) => (a.shares > b.shares ? a : b),
    selectedData.holders[0],
  );
  const maxValueHolder = selectedData?.holders.reduce(
    (a, b) => (a.value > b.value ? a : b),
    selectedData.holders[0],
  );

  if (!selectedData) return null;

  return (
    <div className="space-y-4">
      {/* Quarter Selector */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted/60 font-semibold uppercase tracking-wider">Filing Period:</span>
        <select
          value={selectedYear}
          onChange={(e) => {
            const y = Number(e.target.value);
            setSelectedYear(y);
            const qs = data.quarters.filter((q) => q.year === y);
            if (qs.length > 0 && !qs.some((q) => q.quarter === selectedQuarter)) {
              setSelectedQuarter(qs[qs.length - 1].quarter);
            }
          }}
          className="bg-surface border border-border rounded-xl px-3 py-2 text-xs text-foreground font-semibold focus:outline-none focus:border-accent/50 transition-all"
        >
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <select
          value={selectedQuarter}
          onChange={(e) => setSelectedQuarter(Number(e.target.value))}
          className="bg-surface border border-border rounded-xl px-3 py-2 text-xs text-foreground font-semibold focus:outline-none focus:border-accent/50 transition-all"
        >
          {quartersForYear.map((q) => (
            <option key={q.quarter} value={q.quarter}>Q{q.quarter}</option>
          ))}
        </select>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Max Position"
          value={maxHolder ? formatSharesCompact(maxHolder.shares) : "N/A"}
          sub={maxHolder?.name}
        />
        <StatCard
          label="Max Value"
          value={maxValueHolder ? formatCurrencyLarge(maxValueHolder.value) : "N/A"}
          sub={maxValueHolder?.name}
        />
        <StatCard
          label="Total Shares Held"
          value={formatSharesCompact(selectedData.totalShares)}
        />
        <StatCard
          label="Total Institutions"
          value={String(selectedData.totalHolders)}
        />
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <HoldingsTable title={`Top ${topHolders.length} Holdings`} rows={topHolders} showChangeColumn />
        <HoldingsTable title={`Bottom ${bottomHolders.length} Holdings`} rows={bottomHolders} showChangeColumn />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <HoldingsTable title={`Top ${positionIncreases.length} Position Increases`} rows={positionIncreases} showChangeColumn />
        <HoldingsTable title={`Top ${positionDecreases.length} Position Decreases`} rows={positionDecreases} showChangeColumn />
      </div>

      {/* Position Change Trends */}
      <div
        className="glass rounded-2xl border border-border/50 p-5"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
          {symbol} Position Change Trends
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={trendsData}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: colors.tick }}
              tickLine={false}
              axisLine={{ stroke: colors.grid }}
            />
            <YAxis
              width={80}
              tick={{ fontSize: 10, fill: colors.tick }}
              tickFormatter={(v) => formatSharesCompact(Number(v ?? 0))}
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
              formatter={(value) => [formatSharesCompact(Number(value ?? 0)), "Net Change"]}
            />
            <ReferenceLine y={0} stroke={colors.grid} />
            <Bar dataKey="netChange" radius={[4, 4, 0, 0]}>
              {trendsData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.netChange >= 0 ? colors.win : colors.loss}
                  fillOpacity={0.8}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

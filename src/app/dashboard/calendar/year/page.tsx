"use client";

import { useState, useMemo } from "react";
import { useTrades } from "@/hooks/use-trades";
import { calculateDailyPnl } from "@/lib/calculations";
import { useTheme } from "@/lib/theme-context";
import { getChartColors } from "@/lib/chart-colors";
import { DemoBanner } from "@/components/demo-banner";
import { ChevronLeft, ChevronRight, Grid3X3 } from "lucide-react";
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

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function CalendarYearPage() {
  const { trades, loading, usingDemo } = useTrades();
  const { theme } = useTheme();
  const colors = getChartColors(theme);
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());

  const allDailyPnl = useMemo(() => calculateDailyPnl(trades), [trades]);

  const yearPnl = useMemo(() => {
    return allDailyPnl.filter((d) => d.date.startsWith(String(selectedYear)));
  }, [allDailyPnl, selectedYear]);

  const pnlMap = useMemo(() => new Map(yearPnl.map((d) => [d.date, d])), [yearPnl]);

  const maxAbsPnl = useMemo(() => Math.max(...yearPnl.map((d) => Math.abs(d.pnl)), 1), [yearPnl]);

  const yearStats = useMemo(() => {
    const totalPnl = yearPnl.reduce((s, d) => s + d.pnl, 0);
    const totalTrades = yearPnl.reduce((s, d) => s + d.tradeCount, 0);
    const greenDays = yearPnl.filter((d) => d.pnl > 0).length;
    const redDays = yearPnl.filter((d) => d.pnl < 0).length;
    return { totalPnl, totalTrades, greenDays, redDays };
  }, [yearPnl]);

  const monthlyBreakdown = useMemo(() => {
    return MONTH_NAMES.map((name, i) => {
      const prefix = `${selectedYear}-${String(i + 1).padStart(2, "0")}`;
      const days = yearPnl.filter((d) => d.date.startsWith(prefix));
      const pnl = days.reduce((s, d) => s + d.pnl, 0);
      const tradeCt = days.reduce((s, d) => s + d.tradeCount, 0);
      return { name, pnl, trades: tradeCt, greenDays: days.filter((d) => d.pnl > 0).length, redDays: days.filter((d) => d.pnl < 0).length };
    });
  }, [yearPnl, selectedYear]);

  const tooltipStyle = {
    backgroundColor: colors.tooltipBg,
    border: colors.tooltipBorder,
    borderRadius: "12px",
    fontSize: "12px",
    color: "var(--color-foreground)",
  };

  function getCellColor(pnl: number) {
    const intensity = Math.min(Math.abs(pnl) / maxAbsPnl, 1);
    if (pnl > 0) {
      return intensity > 0.6 ? "bg-win/50" : intensity > 0.3 ? "bg-win/30" : "bg-win/15";
    }
    if (pnl < 0) {
      return intensity > 0.6 ? "bg-loss/50" : intensity > 0.3 ? "bg-loss/30" : "bg-loss/15";
    }
    return "bg-surface/50";
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-accent">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Grid3X3 size={24} className="text-accent" />
            Year View
          </h2>
          <p className="text-sm text-muted mt-0.5">{selectedYear}</p>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setSelectedYear(selectedYear - 1)} className="p-2 rounded-xl hover:bg-surface-hover text-muted hover:text-foreground transition-all">
            <ChevronLeft size={18} />
          </button>
          <button onClick={() => setSelectedYear(new Date().getFullYear())} className="px-3 py-1.5 rounded-xl text-xs font-medium text-muted hover:text-foreground hover:bg-surface-hover transition-all">
            This Year
          </button>
          <button onClick={() => setSelectedYear(selectedYear + 1)} className="p-2 rounded-xl hover:bg-surface-hover text-muted hover:text-foreground transition-all">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      {usingDemo && <DemoBanner feature="year view" />}

      {/* Year stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total P&L", value: `$${yearStats.totalPnl.toFixed(2)}`, color: yearStats.totalPnl >= 0 ? "text-win" : "text-loss" },
          { label: "Total Trades", value: `${yearStats.totalTrades}`, color: "text-foreground" },
          { label: "Green Days", value: `${yearStats.greenDays}`, color: "text-win" },
          { label: "Red Days", value: `${yearStats.redDays}`, color: "text-loss" },
        ].map((s) => (
          <div key={s.label} className="glass rounded-xl border border-border/50 p-4" style={{ boxShadow: "var(--shadow-card)" }}>
            <p className="text-[10px] uppercase tracking-wider text-muted/60 font-semibold">{s.label}</p>
            <p className={`text-lg font-bold tabular-nums ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Year heatmap */}
      <div className="bg-surface rounded-2xl border border-border p-5 overflow-x-auto" style={{ boxShadow: "var(--shadow-card)" }}>
        <h3 className="text-sm font-semibold text-foreground mb-4">Daily P&L Heatmap</h3>
        <div className="space-y-1.5 min-w-[700px]">
          {/* Day header */}
          <div className="flex items-center gap-0">
            <div className="w-10 shrink-0" />
            {Array.from({ length: 31 }, (_, i) => (
              <div key={i} className="w-[18px] text-center text-[8px] text-muted/40 font-medium">
                {i + 1}
              </div>
            ))}
          </div>
          {/* Month rows */}
          {MONTH_NAMES.map((monthName, monthIdx) => {
            const daysInMonth = new Date(selectedYear, monthIdx + 1, 0).getDate();
            return (
              <div key={monthName} className="flex items-center gap-0">
                <div className="w-10 shrink-0 text-[10px] text-muted font-medium">{monthName}</div>
                {Array.from({ length: 31 }, (_, dayIdx) => {
                  if (dayIdx >= daysInMonth) {
                    return <div key={dayIdx} className="w-[18px] h-[14px]" />;
                  }
                  const dateStr = `${selectedYear}-${String(monthIdx + 1).padStart(2, "0")}-${String(dayIdx + 1).padStart(2, "0")}`;
                  const data = pnlMap.get(dateStr);
                  return (
                    <div
                      key={dayIdx}
                      className={`w-[14px] h-[14px] mx-[2px] rounded-sm ${data ? getCellColor(data.pnl) : "bg-border/20"} transition-colors`}
                      title={data ? `${dateStr}: $${data.pnl.toFixed(0)} (${data.tradeCount}t)` : dateStr}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
        {/* Legend */}
        <div className="flex items-center gap-3 mt-4 text-[10px] text-muted">
          <span>Less</span>
          <div className="flex gap-0.5">
            <div className="w-3 h-3 rounded-sm bg-loss/50" />
            <div className="w-3 h-3 rounded-sm bg-loss/30" />
            <div className="w-3 h-3 rounded-sm bg-loss/15" />
            <div className="w-3 h-3 rounded-sm bg-border/20" />
            <div className="w-3 h-3 rounded-sm bg-win/15" />
            <div className="w-3 h-3 rounded-sm bg-win/30" />
            <div className="w-3 h-3 rounded-sm bg-win/50" />
          </div>
          <span>More</span>
        </div>
      </div>

      {/* Monthly breakdown chart */}
      <div className="bg-surface rounded-2xl border border-border p-4" style={{ boxShadow: "var(--shadow-card)" }}>
        <h3 className="text-sm font-semibold text-foreground mb-3">Monthly P&L</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={monthlyBreakdown} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
            <XAxis dataKey="name" tick={{ fill: colors.tick, fontSize: 11 }} stroke={colors.grid} />
            <YAxis tick={{ fill: colors.tick, fontSize: 11 }} stroke={colors.grid} tickFormatter={(v) => `$${v}`} />
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`$${Number(v ?? 0).toFixed(2)}`, "P&L"]} />
            <Bar dataKey="pnl" radius={[4, 4, 0, 0]} maxBarSize={40}>
              {monthlyBreakdown.map((entry, i) => (
                <Cell key={i} fill={entry.pnl >= 0 ? colors.win : colors.loss} fillOpacity={entry.pnl === 0 ? 0.2 : 0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly breakdown table */}
      <div className="bg-surface rounded-2xl border border-border overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {["Month", "P&L", "Trades", "Green", "Red"].map((h) => (
                <th key={h} className="text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold px-4 py-2.5">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {monthlyBreakdown.filter((m) => m.trades > 0).map((m) => (
              <tr key={m.name} className="border-b border-border/30 hover:bg-surface-hover transition-colors">
                <td className="px-4 py-2 font-medium text-foreground">{m.name}</td>
                <td className={`px-4 py-2 font-semibold tabular-nums ${m.pnl >= 0 ? "text-win" : "text-loss"}`}>${m.pnl.toFixed(2)}</td>
                <td className="px-4 py-2 text-muted tabular-nums">{m.trades}</td>
                <td className="px-4 py-2 text-win tabular-nums">{m.greenDays}</td>
                <td className="px-4 py-2 text-loss tabular-nums">{m.redDays}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

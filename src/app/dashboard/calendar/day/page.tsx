"use client";

import { useState, useMemo } from "react";
import { useTrades } from "@/hooks/use-trades";
import { calculateTradePnl } from "@/lib/calculations";
import { useTheme } from "@/lib/theme-context";
import { getChartColors } from "@/lib/chart-colors";
import { DemoBanner } from "@/components/demo-banner";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
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

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" });
}

function shiftDate(dateStr: string, days: number) {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export default function CalendarDayPage() {
  const { trades, loading, usingDemo } = useTrades();
  const { theme } = useTheme();
  const colors = getChartColors(theme);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);

  const dayTrades = useMemo(() => {
    return trades.filter((t) => {
      const closeDate = t.close_timestamp?.split("T")[0];
      const openDate = t.open_timestamp?.split("T")[0];
      return closeDate === selectedDate || openDate === selectedDate;
    });
  }, [trades, selectedDate]);

  const stats = useMemo(() => {
    const closed = dayTrades.filter((t) => t.close_timestamp);
    const pnls = closed.map((t) => t.pnl ?? calculateTradePnl(t) ?? 0);
    const wins = pnls.filter((p) => p > 0);
    return {
      totalPnl: pnls.reduce((s, p) => s + p, 0),
      tradeCount: dayTrades.length,
      winRate: closed.length > 0 ? (wins.length / closed.length) * 100 : 0,
      bestTrade: pnls.length > 0 ? Math.max(...pnls) : 0,
      worstTrade: pnls.length > 0 ? Math.min(...pnls) : 0,
    };
  }, [dayTrades]);

  const hourlyPnl = useMemo(() => {
    const map = new Map<number, { pnl: number; count: number }>();
    for (const t of dayTrades.filter((t) => t.close_timestamp)) {
      const hour = new Date(t.close_timestamp!).getHours();
      const existing = map.get(hour) ?? { pnl: 0, count: 0 };
      const p = t.pnl ?? calculateTradePnl(t) ?? 0;
      map.set(hour, { pnl: existing.pnl + p, count: existing.count + 1 });
    }
    return Array.from(map.entries())
      .map(([hour, d]) => ({ hour: `${hour}:00`, pnl: d.pnl, count: d.count }))
      .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));
  }, [dayTrades]);

  const emotions = useMemo(() => {
    const map = new Map<string, { count: number; pnl: number }>();
    for (const t of dayTrades) {
      if (!t.emotion) continue;
      const existing = map.get(t.emotion) ?? { count: 0, pnl: 0 };
      existing.count++;
      existing.pnl += t.pnl ?? calculateTradePnl(t) ?? 0;
      map.set(t.emotion, existing);
    }
    return Array.from(map.entries()).map(([emotion, d]) => ({ emotion, ...d }));
  }, [dayTrades]);

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Clock size={24} className="text-accent" />
            Day View
          </h2>
          <p className="text-sm text-muted mt-0.5">{formatDate(selectedDate)}</p>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setSelectedDate(shiftDate(selectedDate, -1))} className="p-2 rounded-xl hover:bg-surface-hover text-muted hover:text-foreground transition-all">
            <ChevronLeft size={18} />
          </button>
          <button onClick={() => setSelectedDate(new Date().toISOString().split("T")[0])} className="px-3 py-1.5 rounded-xl text-xs font-medium text-muted hover:text-foreground hover:bg-surface-hover transition-all">
            Today
          </button>
          <button onClick={() => setSelectedDate(shiftDate(selectedDate, 1))} className="p-2 rounded-xl hover:bg-surface-hover text-muted hover:text-foreground transition-all">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      {usingDemo && <DemoBanner feature="day view" />}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total P&L", value: `$${stats.totalPnl.toFixed(2)}`, color: stats.totalPnl >= 0 ? "text-win" : "text-loss" },
          { label: "Trades", value: `${stats.tradeCount}`, color: "text-foreground" },
          { label: "Win Rate", value: `${stats.winRate.toFixed(1)}%`, color: stats.winRate >= 50 ? "text-win" : stats.tradeCount > 0 ? "text-loss" : "text-muted" },
          { label: "Best / Worst", value: `$${stats.bestTrade.toFixed(0)} / $${stats.worstTrade.toFixed(0)}`, color: "text-foreground" },
        ].map((s) => (
          <div key={s.label} className="glass rounded-xl border border-border/50 p-4" style={{ boxShadow: "var(--shadow-card)" }}>
            <p className="text-[10px] uppercase tracking-wider text-muted/60 font-semibold">{s.label}</p>
            <p className={`text-lg font-bold tabular-nums ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly P&L chart */}
        <div className="lg:col-span-2 bg-surface rounded-2xl border border-border p-4" style={{ boxShadow: "var(--shadow-card)" }}>
          <h3 className="text-sm font-semibold text-foreground mb-3">P&L by Hour</h3>
          {hourlyPnl.length === 0 ? (
            <div className="text-center py-12 text-muted text-sm">No closed trades this day</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={hourlyPnl} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                <XAxis dataKey="hour" tick={{ fill: colors.tick, fontSize: 11 }} stroke={colors.grid} />
                <YAxis tick={{ fill: colors.tick, fontSize: 11 }} stroke={colors.grid} tickFormatter={(v) => `$${v}`} />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`$${Number(v ?? 0).toFixed(2)}`, "P&L"]} />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]} maxBarSize={40}>
                  {hourlyPnl.map((entry, i) => (
                    <Cell key={i} fill={entry.pnl >= 0 ? colors.win : colors.loss} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Emotion breakdown */}
        <div className="bg-surface rounded-2xl border border-border p-4" style={{ boxShadow: "var(--shadow-card)" }}>
          <h3 className="text-sm font-semibold text-foreground mb-3">Emotions</h3>
          {emotions.length === 0 ? (
            <div className="text-center py-12 text-muted text-sm">No emotion data</div>
          ) : (
            <div className="space-y-2">
              {emotions.map((e) => (
                <div key={e.emotion} className="flex items-center justify-between">
                  <span className="text-xs px-2 py-1 rounded-full bg-accent/10 text-accent font-medium">{e.emotion}</span>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-muted">{e.count} trades</span>
                    <span className={`font-semibold tabular-nums ${e.pnl >= 0 ? "text-win" : "text-loss"}`}>${e.pnl.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Trade list */}
      {dayTrades.length > 0 && (
        <div className="bg-surface rounded-2xl border border-border p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <h3 className="text-sm font-semibold text-foreground mb-3">Trades ({dayTrades.length})</h3>
          <div className="space-y-3">
            {dayTrades.map((t) => {
              const pnl = t.pnl ?? calculateTradePnl(t);
              const isOpen = t.close_timestamp === null;
              return (
                <div key={t.id} className="rounded-xl border border-border/50 p-3 hover:border-accent/20 transition-all">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{t.symbol}</span>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${t.position === "long" ? "bg-win/10 text-win" : "bg-loss/10 text-loss"}`}>
                        {t.position.toUpperCase()}
                      </span>
                    </div>
                    {isOpen ? (
                      <span className="text-[10px] text-accent font-medium">OPEN</span>
                    ) : pnl !== null ? (
                      <span className={`text-sm font-bold ${pnl >= 0 ? "text-win" : "text-loss"}`}>
                        {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-muted">
                    <span>Entry: ${t.entry_price}</span>
                    {t.exit_price && <span>Exit: ${t.exit_price}</span>}
                    <span>Qty: {t.quantity}</span>
                  </div>
                  {(t.emotion || t.process_score !== null) && (
                    <div className="flex items-center gap-2 mt-2">
                      {t.emotion && <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">{t.emotion}</span>}
                      {t.process_score !== null && <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-hover text-muted font-medium">Process: {t.process_score}/10</span>}
                    </div>
                  )}
                  {t.notes && <p className="text-[11px] text-muted mt-2 leading-relaxed line-clamp-2">{t.notes}</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {dayTrades.length === 0 && (
        <div className="text-center py-16">
          <Clock size={48} className="text-accent/20 mx-auto mb-4" />
          <p className="text-lg font-semibold text-foreground mb-2">No trades on this day</p>
          <p className="text-sm text-muted">Try navigating to a different date.</p>
        </div>
      )}
    </div>
  );
}

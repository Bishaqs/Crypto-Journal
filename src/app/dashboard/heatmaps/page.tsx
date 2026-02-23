"use client";

import { useMemo, useState } from "react";
import {
  BarChart3,
  AlertTriangle,
  Clock,
  Grid3X3,
  CalendarDays,
  Zap,
  Sparkles,
  Minus,
  Plus,
} from "lucide-react";
import { Header } from "@/components/header";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { useSubscription } from "@/lib/use-subscription";
import { UpgradePrompt } from "@/components/upgrade-prompt";
import { usePageTour } from "@/lib/use-page-tour";

// ─── Types ───────────────────────────────────────────────────────────────────

interface DemoTrade {
  day: number; // 0=Mon, 6=Sun
  hour: number; // 0-23
  pnl: number;
  symbol: string;
  date: string; // YYYY-MM-DD
}

// ─── Demo Data Generation ────────────────────────────────────────────────────

const SYMBOLS = ["BTC", "ETH", "SOL", "DOGE", "ADA", "AVAX", "LINK", "DOT", "MATIC", "XRP"];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

function generateDemoTrades(): DemoTrade[] {
  const rng = seededRandom(42);
  const trades: DemoTrade[] = [];
  const months = [
    { year: 2024, months: [3, 4, 5, 6, 7, 8, 9, 10, 11] },
    { year: 2025, months: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] },
    { year: 2026, months: [0, 1] },
  ];

  for (const { year, months: ms } of months) {
    for (const month of ms) {
      const tradeCount = Math.floor(rng() * 6) + 2;
      for (let i = 0; i < tradeCount; i++) {
        const day = Math.floor(rng() * 28) + 1;
        const date = new Date(year, month, day);
        const dayOfWeek = (date.getDay() + 6) % 7; // Mon=0
        const hour = Math.floor(rng() * 16) + 6; // 6am-10pm
        const symbol = SYMBOLS[Math.floor(rng() * SYMBOLS.length)];
        // Bias: morning trades tend more profitable, late trades less so
        const hourBias = hour < 12 ? 40 : hour < 16 ? 10 : -30;
        const pnl = (rng() - 0.42) * 400 + hourBias;
        trades.push({
          day: dayOfWeek,
          hour,
          pnl: Math.round(pnl * 100) / 100,
          symbol,
          date: `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
        });
      }
    }
  }
  return trades;
}

const DEMO_TRADES = generateDemoTrades();

// ─── Constants ───────────────────────────────────────────────────────────────

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const YEARS = [2024, 2025, 2026];

const TABS = [
  { id: "time-day", label: "Time \u00D7 Day", icon: Clock },
  { id: "symbols", label: "Symbol Grid", icon: Grid3X3 },
  { id: "monthly", label: "Monthly", icon: CalendarDays },
  { id: "overtrading", label: "Overtrading", icon: AlertTriangle },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ─── Color Scale ─────────────────────────────────────────────────────────────

function getPnlColor(value: number, maxAbsPnl: number): string {
  if (maxAbsPnl === 0) return "var(--surface)";
  const normalized = Math.max(-1, Math.min(1, value / maxAbsPnl));
  if (normalized > 0.6) return "rgba(34, 197, 94, 0.7)";
  if (normalized > 0.3) return "rgba(34, 197, 94, 0.45)";
  if (normalized > 0.1) return "rgba(34, 197, 94, 0.2)";
  if (normalized > -0.1) return "var(--surface)";
  if (normalized > -0.3) return "rgba(239, 68, 68, 0.2)";
  if (normalized > -0.6) return "rgba(239, 68, 68, 0.45)";
  return "rgba(239, 68, 68, 0.7)";
}

function getPnlTextColor(value: number): string {
  if (value > 10) return "var(--win)";
  if (value < -10) return "var(--loss)";
  return "var(--muted)";
}

// ─── Overtrading Demo Data ───────────────────────────────────────────────────

const OVERTRADING_DATA = [
  { tradeNum: 1, avgPnl: 120 },
  { tradeNum: 2, avgPnl: 85 },
  { tradeNum: 3, avgPnl: 60 },
  { tradeNum: 4, avgPnl: 15 },
  { tradeNum: 5, avgPnl: -30 },
  { tradeNum: 6, avgPnl: -80 },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function HeatMapsPage() {
  usePageTour("heatmaps-page");
  const { hasAccess, loading: subLoading } = useSubscription();
  const [tab, setTab] = useState<TabId>("time-day");
  const [hoveredCell, setHoveredCell] = useState<{ day: number; hour: number } | null>(null);
  const [dailyLimit, setDailyLimit] = useState(4);
  const todayTradeCount = 3; // Demo: today's trades

  // ── Time × Day heat map data ──────────────────────────────────────────────

  const timeDayData = useMemo(() => {
    const grid: Record<string, { totalPnl: number; count: number }> = {};
    for (const t of DEMO_TRADES) {
      const key = `${t.day}-${t.hour}`;
      if (!grid[key]) grid[key] = { totalPnl: 0, count: 0 };
      grid[key].totalPnl += t.pnl;
      grid[key].count += 1;
    }
    const cells: { day: number; hour: number; avgPnl: number; count: number }[] = [];
    let maxAbsPnl = 0;
    for (let d = 0; d < 7; d++) {
      for (let h = 0; h < 24; h++) {
        const key = `${d}-${h}`;
        const cell = grid[key];
        const avgPnl = cell ? cell.totalPnl / cell.count : 0;
        const count = cell ? cell.count : 0;
        cells.push({ day: d, hour: h, avgPnl: Math.round(avgPnl * 100) / 100, count });
        if (Math.abs(avgPnl) > maxAbsPnl) maxAbsPnl = Math.abs(avgPnl);
      }
    }
    return { cells, maxAbsPnl };
  }, []);

  // ── Symbol performance data ───────────────────────────────────────────────

  const symbolData = useMemo(() => {
    const map: Record<string, { totalPnl: number; wins: number; count: number }> = {};
    for (const t of DEMO_TRADES) {
      if (!map[t.symbol]) map[t.symbol] = { totalPnl: 0, wins: 0, count: 0 };
      map[t.symbol].totalPnl += t.pnl;
      map[t.symbol].wins += t.pnl > 0 ? 1 : 0;
      map[t.symbol].count += 1;
    }
    return SYMBOLS.map((s) => ({
      symbol: s,
      totalPnl: Math.round((map[s]?.totalPnl ?? 0) * 100) / 100,
      wins: map[s]?.wins ?? 0,
      count: map[s]?.count ?? 0,
      winRate: map[s] && map[s].count > 0 ? Math.round((map[s].wins / map[s].count) * 100) : 0,
    })).sort((a, b) => b.count - a.count);
  }, []);

  const maxSymbolCount = useMemo(() => Math.max(...symbolData.map((s) => s.count), 1), [symbolData]);

  // ── Monthly seasonality data ──────────────────────────────────────────────

  const monthlyData = useMemo(() => {
    const map: Record<string, number> = {};
    let maxAbsPnl = 0;
    for (const t of DEMO_TRADES) {
      const key = t.date.substring(0, 7); // YYYY-MM
      map[key] = (map[key] ?? 0) + t.pnl;
    }
    for (const v of Object.values(map)) {
      if (Math.abs(v) > maxAbsPnl) maxAbsPnl = Math.abs(v);
    }
    return { map, maxAbsPnl };
  }, []);

  // ── Overtrading max bar value ─────────────────────────────────────────────

  const maxOvertradingPnl = useMemo(
    () => Math.max(...OVERTRADING_DATA.map((d) => Math.abs(d.avgPnl))),
    []
  );

  if (subLoading) return null;
  if (!hasAccess("heatmaps")) return <UpgradePrompt feature="heatmaps" requiredTier="max" />;

  return (
    <div className="space-y-6 mx-auto max-w-[1600px]">
      <Header />

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <BarChart3 size={24} className="text-accent" />
          Heat Maps
        </h2>
        <p className="text-sm text-muted mt-0.5 flex items-center gap-1.5">
          <Sparkles size={12} className="text-accent" />
          Overtrading Detector <InfoTooltip text="Shows how your edge degrades with each additional trade per session. Most traders peak at 3-4 trades." size={12} /> &mdash; Sample data
        </p>
      </div>

      {/* Tab selector */}
      <div
        className="flex gap-1 glass rounded-xl border border-border/50 p-1"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id
                ? "bg-accent/10 text-accent shadow-sm"
                : "text-muted hover:text-foreground hover:bg-surface-hover"
            }`}
          >
            <t.icon size={14} />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* Tab 1: Time × Day Heat Map                                        */}
      {/* ════════════════════════════════════════════════════════════════════ */}

      {tab === "time-day" && (
        <div className="space-y-6">
          <div
            className="glass rounded-2xl border border-border/50 p-6"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <h3 className="text-sm font-semibold text-foreground mb-1">
              Performance by Time of Day & Day of Week
            </h3>
            <p className="text-[11px] text-muted mb-5">
              Average P&L per trade — hover for details
            </p>

            {/* Heat map grid */}
            <div className="overflow-x-auto">
              <div className="min-w-[700px]">
                {/* Hour labels */}
                <div className="flex">
                  <div className="w-12 shrink-0" />
                  {HOURS.map((h) => (
                    <div
                      key={h}
                      className="flex-1 text-center text-[9px] text-muted/50 font-medium pb-1"
                    >
                      {h}
                    </div>
                  ))}
                </div>

                {/* Rows: one per day */}
                {DAYS.map((dayLabel, dayIdx) => (
                  <div key={dayLabel} className="flex items-center">
                    <div className="w-12 shrink-0 text-[11px] text-muted font-medium pr-2 text-right">
                      {dayLabel}
                    </div>
                    {HOURS.map((hour) => {
                      const cell = timeDayData.cells.find(
                        (c) => c.day === dayIdx && c.hour === hour
                      )!;
                      const isHovered =
                        hoveredCell?.day === dayIdx && hoveredCell?.hour === hour;

                      return (
                        <div
                          key={hour}
                          className="flex-1 aspect-square relative"
                          onMouseEnter={() =>
                            setHoveredCell({ day: dayIdx, hour })
                          }
                          onMouseLeave={() => setHoveredCell(null)}
                        >
                          <div
                            className="absolute inset-[1px] rounded-[3px] transition-all duration-150"
                            style={{
                              background:
                                cell.count > 0
                                  ? getPnlColor(cell.avgPnl, timeDayData.maxAbsPnl)
                                  : "var(--surface)",
                              border: isHovered
                                ? "1.5px solid var(--accent)"
                                : "1px solid transparent",
                              transform: isHovered ? "scale(1.15)" : "scale(1)",
                              zIndex: isHovered ? 10 : 1,
                            }}
                          />

                          {/* Tooltip */}
                          {isHovered && cell.count > 0 && (
                            <div
                              className="absolute z-50 glass rounded-xl border border-border/50 p-3 pointer-events-none"
                              style={{
                                boxShadow: "var(--shadow-card)",
                                bottom: "calc(100% + 8px)",
                                left: "50%",
                                transform: "translateX(-50%)",
                                minWidth: "150px",
                              }}
                            >
                              <p className="text-[11px] font-semibold text-foreground">
                                {dayLabel}, {hour}:00
                              </p>
                              <div className="mt-1.5 space-y-0.5">
                                <p className="text-[10px] text-muted">
                                  Avg P&L:{" "}
                                  <span
                                    className="font-bold"
                                    style={{
                                      color: getPnlTextColor(cell.avgPnl),
                                    }}
                                  >
                                    ${cell.avgPnl.toFixed(2)}
                                  </span>
                                </p>
                                <p className="text-[10px] text-muted">
                                  Trades:{" "}
                                  <span className="font-semibold text-foreground">
                                    {cell.count}
                                  </span>
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-2 mt-5 pt-4 border-t border-border/30">
              <span className="text-[10px] text-muted font-medium">Loss</span>
              <div className="flex gap-0.5">
                {[
                  "rgba(239, 68, 68, 0.7)",
                  "rgba(239, 68, 68, 0.45)",
                  "rgba(239, 68, 68, 0.2)",
                  "var(--surface)",
                  "rgba(34, 197, 94, 0.2)",
                  "rgba(34, 197, 94, 0.45)",
                  "rgba(34, 197, 94, 0.7)",
                ].map((color, i) => (
                  <div
                    key={i}
                    className="w-6 h-3 rounded-[2px]"
                    style={{ background: color }}
                  />
                ))}
              </div>
              <span className="text-[10px] text-muted font-medium">Profit</span>
            </div>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(() => {
              const activeCells = timeDayData.cells.filter((c) => c.count > 0);
              const bestCell = activeCells.reduce(
                (best, c) => (c.avgPnl > best.avgPnl ? c : best),
                activeCells[0] || { day: 0, hour: 0, avgPnl: 0, count: 0 }
              );
              const worstCell = activeCells.reduce(
                (worst, c) => (c.avgPnl < worst.avgPnl ? c : worst),
                activeCells[0] || { day: 0, hour: 0, avgPnl: 0, count: 0 }
              );
              const busiestCell = activeCells.reduce(
                (busiest, c) => (c.count > busiest.count ? c : busiest),
                activeCells[0] || { day: 0, hour: 0, avgPnl: 0, count: 0 }
              );
              return [
                {
                  label: "Best Time Slot",
                  value: `${DAYS[bestCell.day]} ${bestCell.hour}:00`,
                  sub: `+$${bestCell.avgPnl.toFixed(2)} avg`,
                  color: "text-win",
                },
                {
                  label: "Worst Time Slot",
                  value: `${DAYS[worstCell.day]} ${worstCell.hour}:00`,
                  sub: `$${worstCell.avgPnl.toFixed(2)} avg`,
                  color: "text-loss",
                },
                {
                  label: "Busiest Slot",
                  value: `${DAYS[busiestCell.day]} ${busiestCell.hour}:00`,
                  sub: `${busiestCell.count} trades`,
                  color: "text-accent",
                },
                {
                  label: "Total Trades",
                  value: `${DEMO_TRADES.length}`,
                  sub: "across all time slots",
                  color: "text-foreground",
                },
              ].map((card) => (
                <div
                  key={card.label}
                  className="glass rounded-xl border border-border/50 p-4"
                  style={{ boxShadow: "var(--shadow-card)" }}
                >
                  <p className="text-[10px] uppercase tracking-wider text-muted/60 font-semibold">
                    {card.label}
                  </p>
                  <p className={`text-lg font-bold ${card.color} mt-1`}>
                    {card.value}
                  </p>
                  <p className="text-[10px] text-muted mt-0.5">{card.sub}</p>
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* Tab 2: Symbol Performance Grid                                     */}
      {/* ════════════════════════════════════════════════════════════════════ */}

      {tab === "symbols" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {symbolData.map((s) => {
              const sizeScale = 0.7 + (s.count / maxSymbolCount) * 0.3;
              const isProfitable = s.totalPnl >= 0;

              return (
                <div
                  key={s.symbol}
                  className="glass rounded-2xl border-2 p-5 transition-all hover:scale-[1.02]"
                  style={{
                    borderColor: isProfitable
                      ? "rgba(34, 197, 94, 0.4)"
                      : "rgba(239, 68, 68, 0.4)",
                    boxShadow: isProfitable
                      ? "0 0 20px rgba(34, 197, 94, 0.08)"
                      : "0 0 20px rgba(239, 68, 68, 0.08)",
                    transform: `scale(${sizeScale})`,
                    transformOrigin: "center",
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-foreground">
                      {s.symbol}
                    </h3>
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        background: isProfitable
                          ? "rgba(34, 197, 94, 0.15)"
                          : "rgba(239, 68, 68, 0.15)",
                        color: isProfitable
                          ? "var(--win)"
                          : "var(--loss)",
                      }}
                    >
                      {s.winRate}% WR
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold">
                        Trades
                      </span>
                      <span className="text-xs font-semibold text-foreground">
                        {s.count}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold">
                        Total P&L
                      </span>
                      <span
                        className={`text-xs font-bold ${
                          isProfitable ? "text-win" : "text-loss"
                        }`}
                      >
                        {isProfitable ? "+" : ""}${s.totalPnl.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold">
                        Win Rate
                      </span>
                      <span
                        className={`text-xs font-semibold ${
                          s.winRate >= 50 ? "text-win" : "text-loss"
                        }`}
                      >
                        {s.winRate}%
                      </span>
                    </div>
                  </div>

                  {/* Mini trade frequency bar */}
                  <div className="mt-3 h-1.5 rounded-full bg-background overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(s.count / maxSymbolCount) * 100}%`,
                        background: isProfitable
                          ? "var(--win)"
                          : "var(--loss)",
                        opacity: 0.6,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* Tab 3: Monthly Seasonality                                         */}
      {/* ════════════════════════════════════════════════════════════════════ */}

      {tab === "monthly" && (
        <div className="space-y-6">
          <div
            className="glass rounded-2xl border border-border/50 p-6"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <h3 className="text-sm font-semibold text-foreground mb-1">
              Monthly Seasonality
            </h3>
            <p className="text-[11px] text-muted mb-5">
              Total P&L by month across years
            </p>

            <div className="overflow-x-auto">
              <div className="min-w-[600px]">
                {/* Month headers */}
                <div className="flex">
                  <div className="w-16 shrink-0" />
                  {MONTH_LABELS.map((m) => (
                    <div
                      key={m}
                      className="flex-1 text-center text-[10px] text-muted/50 font-medium pb-2"
                    >
                      {m}
                    </div>
                  ))}
                </div>

                {/* Year rows */}
                {YEARS.map((year) => (
                  <div key={year} className="flex items-center mb-1">
                    <div className="w-16 shrink-0 text-[11px] text-muted font-medium pr-2 text-right">
                      {year}
                    </div>
                    {MONTH_LABELS.map((_, monthIdx) => {
                      const key = `${year}-${String(monthIdx + 1).padStart(2, "0")}`;
                      const pnl = monthlyData.map[key];
                      const now = new Date();
                      const isFuture =
                        year > now.getFullYear() ||
                        (year === now.getFullYear() && monthIdx > now.getMonth());

                      if (isFuture || pnl === undefined) {
                        return (
                          <div key={monthIdx} className="flex-1 px-0.5">
                            <div
                              className="h-10 rounded-md flex items-center justify-center"
                              style={{
                                background: isFuture
                                  ? "transparent"
                                  : "var(--surface)",
                                border: isFuture
                                  ? "1px dashed var(--border)"
                                  : "1px solid transparent",
                              }}
                            >
                              {isFuture && (
                                <span className="text-[8px] text-muted/30">
                                  --
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      }

                      const roundedPnl = Math.round(pnl);
                      return (
                        <div key={monthIdx} className="flex-1 px-0.5">
                          <div
                            className="h-10 rounded-md flex items-center justify-center transition-all hover:scale-105"
                            style={{
                              background: getPnlColor(
                                pnl,
                                monthlyData.maxAbsPnl
                              ),
                            }}
                            title={`${MONTH_LABELS[monthIdx]} ${year}: $${roundedPnl}`}
                          >
                            <span
                              className="text-[9px] font-bold"
                              style={{
                                color: getPnlTextColor(pnl),
                              }}
                            >
                              {roundedPnl > 0 ? "+" : ""}
                              {roundedPnl}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-2 mt-5 pt-4 border-t border-border/30">
              <span className="text-[10px] text-muted font-medium">Loss</span>
              <div className="flex gap-0.5">
                {[
                  "rgba(239, 68, 68, 0.7)",
                  "rgba(239, 68, 68, 0.45)",
                  "rgba(239, 68, 68, 0.2)",
                  "var(--surface)",
                  "rgba(34, 197, 94, 0.2)",
                  "rgba(34, 197, 94, 0.45)",
                  "rgba(34, 197, 94, 0.7)",
                ].map((color, i) => (
                  <div
                    key={i}
                    className="w-6 h-3 rounded-[2px]"
                    style={{ background: color }}
                  />
                ))}
              </div>
              <span className="text-[10px] text-muted font-medium">Profit</span>
            </div>
          </div>

          {/* Yearly totals */}
          <div className="grid grid-cols-3 gap-3">
            {YEARS.map((year) => {
              const yearTotal = Object.entries(monthlyData.map)
                .filter(([k]) => k.startsWith(`${year}-`))
                .reduce((sum, [, v]) => sum + v, 0);
              const rounded = Math.round(yearTotal * 100) / 100;
              return (
                <div
                  key={year}
                  className="glass rounded-xl border border-border/50 p-4"
                  style={{ boxShadow: "var(--shadow-card)" }}
                >
                  <p className="text-[10px] uppercase tracking-wider text-muted/60 font-semibold">
                    {year} Total
                  </p>
                  <p
                    className={`text-lg font-bold mt-1 ${
                      rounded >= 0 ? "text-win" : "text-loss"
                    }`}
                  >
                    {rounded >= 0 ? "+" : ""}${rounded.toFixed(2)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* Tab 4: Overtrading Detector                                        */}
      {/* ════════════════════════════════════════════════════════════════════ */}

      {tab === "overtrading" && (
        <div className="space-y-6">
          {/* Avg P&L vs Trade # bar chart */}
          <div
            className="glass rounded-2xl border border-border/50 p-6"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <h3 className="text-sm font-semibold text-foreground mb-1">
              Average P&L vs. Trade # in Session
            </h3>
            <p className="text-[11px] text-muted mb-6">
              Shows how your edge degrades with each additional trade
            </p>

            {/* Pure CSS bar chart */}
            <div className="flex items-end gap-3 h-52 px-4">
              {OVERTRADING_DATA.map((d) => {
                const isPositive = d.avgPnl >= 0;
                const barHeight =
                  (Math.abs(d.avgPnl) / maxOvertradingPnl) * 100;

                return (
                  <div
                    key={d.tradeNum}
                    className="flex-1 flex flex-col items-center"
                    style={{ height: "100%" }}
                  >
                    {/* Value label */}
                    <div
                      className={`text-xs font-bold mb-1 ${
                        isPositive ? "text-win" : "text-loss"
                      }`}
                      style={{
                        marginTop: isPositive
                          ? `${100 - barHeight - 5}%`
                          : "auto",
                      }}
                    >
                      {isPositive ? "+" : ""}${d.avgPnl}
                    </div>

                    {/* Bar */}
                    <div className="w-full flex-1 flex items-end relative">
                      {isPositive ? (
                        <div
                          className="w-full rounded-t-lg transition-all"
                          style={{
                            height: `${barHeight}%`,
                            background: `linear-gradient(to top, rgba(34, 197, 94, 0.3), rgba(34, 197, 94, 0.6))`,
                            border: "1px solid rgba(34, 197, 94, 0.3)",
                            borderBottom: "none",
                          }}
                        />
                      ) : (
                        <div className="w-full flex flex-col" style={{ height: "100%" }}>
                          <div className="flex-1" />
                          <div
                            className="w-full rounded-b-lg transition-all"
                            style={{
                              height: `${barHeight}%`,
                              background: `linear-gradient(to bottom, rgba(239, 68, 68, 0.3), rgba(239, 68, 68, 0.6))`,
                              border: "1px solid rgba(239, 68, 68, 0.3)",
                              borderTop: "none",
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {/* X-axis label */}
                    <div className="text-[10px] text-muted font-medium mt-2">
                      Trade {d.tradeNum}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Zero line */}
            <div className="mx-4 border-t border-muted/20 -mt-[104px] mb-[104px]" />
          </div>

          {/* Alert box */}
          <div
            className="rounded-2xl border-2 p-5"
            style={{
              borderColor: "rgba(251, 191, 36, 0.4)",
              background: "rgba(251, 191, 36, 0.05)",
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="p-2 rounded-xl shrink-0"
                style={{ background: "rgba(251, 191, 36, 0.15)" }}
              >
                <AlertTriangle size={20} style={{ color: "#fbbf24" }} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground mb-1">
                  Overtrading Alert
                </h4>
                <p className="text-[13px] text-muted leading-relaxed">
                  Your optimal trade count is{" "}
                  <span className="font-bold text-foreground">
                    3&ndash;4 per session
                  </span>
                  . Beyond that, your average P&L drops to{" "}
                  <span className="font-bold text-loss">-$55</span>. Consider
                  setting a daily trade limit to protect your edge.
                </p>
              </div>
            </div>
          </div>

          {/* Daily trade limit configurator & today's count */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Configurator */}
            <div
              className="glass rounded-2xl border border-border/50 p-6"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-4">
                Daily Trade Limit
              </h3>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setDailyLimit(Math.max(1, dailyLimit - 1))}
                  className="p-2 rounded-xl bg-background border border-border text-muted hover:text-foreground hover:border-accent/30 transition-all"
                >
                  <Minus size={16} />
                </button>
                <div className="text-center">
                  <span className="text-4xl font-bold text-accent">
                    {dailyLimit}
                  </span>
                  <p className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mt-1">
                    trades / day
                  </p>
                </div>
                <button
                  onClick={() => setDailyLimit(Math.min(20, dailyLimit + 1))}
                  className="p-2 rounded-xl bg-background border border-border text-muted hover:text-foreground hover:border-accent/30 transition-all"
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* Custom input */}
              <div className="mt-4">
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={dailyLimit}
                  onChange={(e) => {
                    const v = Math.max(1, Math.min(20, Number(e.target.value)));
                    setDailyLimit(v);
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm font-medium text-center focus:outline-none focus:border-accent/50 transition-all"
                />
              </div>
            </div>

            {/* Today's count */}
            <div
              className="glass rounded-2xl border border-border/50 p-6"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-4">
                Today&apos;s Progress
              </h3>

              <div className="flex items-center justify-center gap-6">
                <div className="text-center">
                  <span
                    className={`text-4xl font-bold ${
                      todayTradeCount >= dailyLimit ? "text-loss" : "text-win"
                    }`}
                  >
                    {todayTradeCount}
                  </span>
                  <p className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mt-1">
                    trades today
                  </p>
                </div>
                <div className="text-2xl text-muted/30 font-light">/</div>
                <div className="text-center">
                  <span className="text-4xl font-bold text-foreground/40">
                    {dailyLimit}
                  </span>
                  <p className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mt-1">
                    daily limit
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-5">
                <div className="h-3 rounded-full bg-background overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (todayTradeCount / dailyLimit) * 100)}%`,
                      background:
                        todayTradeCount >= dailyLimit
                          ? "linear-gradient(90deg, rgba(239, 68, 68, 0.6), rgba(239, 68, 68, 0.9))"
                          : todayTradeCount >= dailyLimit * 0.75
                            ? "linear-gradient(90deg, rgba(251, 191, 36, 0.6), rgba(251, 191, 36, 0.9))"
                            : "linear-gradient(90deg, rgba(34, 197, 94, 0.5), rgba(34, 197, 94, 0.8))",
                    }}
                  />
                </div>
                <p className="text-[10px] text-muted mt-2 text-center">
                  {todayTradeCount >= dailyLimit ? (
                    <span className="text-loss font-semibold flex items-center justify-center gap-1">
                      <AlertTriangle size={10} />
                      Limit reached — consider stopping for today
                    </span>
                  ) : (
                    <span>
                      {dailyLimit - todayTradeCount} trade
                      {dailyLimit - todayTradeCount !== 1 ? "s" : ""} remaining
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Edge degradation summary */}
          <div
            className="glass rounded-2xl border border-border/50 p-6"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-4">
              Edge Degradation Summary
            </h3>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {OVERTRADING_DATA.map((d) => (
                <div
                  key={d.tradeNum}
                  className="rounded-xl p-3 text-center transition-all"
                  style={{
                    background:
                      d.avgPnl >= 0
                        ? `rgba(34, 197, 94, ${0.05 + (d.avgPnl / maxOvertradingPnl) * 0.15})`
                        : `rgba(239, 68, 68, ${0.05 + (Math.abs(d.avgPnl) / maxOvertradingPnl) * 0.15})`,
                    border: `1px solid ${d.avgPnl >= 0 ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)"}`,
                  }}
                >
                  <p className="text-[10px] text-muted font-medium mb-1">
                    Trade {d.tradeNum}
                  </p>
                  <p
                    className={`text-sm font-bold ${
                      d.avgPnl >= 0 ? "text-win" : "text-loss"
                    }`}
                  >
                    {d.avgPnl >= 0 ? "+" : ""}${d.avgPnl}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

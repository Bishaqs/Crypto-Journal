"use client";

import { useMemo, useState } from "react";
import {
  Target,
  Star,
  TrendingUp,
  BarChart3,
  AlertTriangle,
  Crosshair,
  Shield,
  Layers,
  LogOut,
  ClipboardList,
  ChevronUp,
  ChevronDown,
  Lightbulb,
  Activity,
} from "lucide-react";
import { InfoTooltip } from "@/components/ui/info-tooltip";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Dimension = "entry" | "stop" | "sizing" | "exit" | "plan";

interface DemoTrade {
  id: number;
  date: string;
  symbol: string;
  pnl: number;
  entry: number;
  stop: number;
  sizing: number;
  exit: number;
  plan: number;
}

type SortKey = Dimension | "date" | "symbol" | "pnl" | "avg";
type SortDir = "asc" | "desc";

// ---------------------------------------------------------------------------
// Demo data
// ---------------------------------------------------------------------------

const DEMO_TRADES: DemoTrade[] = [
  { id: 1, date: "2025-02-17", symbol: "BTC", pnl: 420, entry: 5, stop: 4, sizing: 4, exit: 3, plan: 5 },
  { id: 2, date: "2025-02-16", symbol: "ETH", pnl: -180, entry: 3, stop: 4, sizing: 3, exit: 2, plan: 4 },
  { id: 3, date: "2025-02-15", symbol: "SOL", pnl: 310, entry: 4, stop: 5, sizing: 4, exit: 4, plan: 5 },
  { id: 4, date: "2025-02-14", symbol: "BTC", pnl: -95, entry: 2, stop: 3, sizing: 3, exit: 2, plan: 3 },
  { id: 5, date: "2025-02-13", symbol: "DOGE", pnl: 150, entry: 4, stop: 4, sizing: 3, exit: 3, plan: 4 },
  { id: 6, date: "2025-02-12", symbol: "ETH", pnl: 280, entry: 5, stop: 5, sizing: 4, exit: 4, plan: 4 },
  { id: 7, date: "2025-02-11", symbol: "BTC", pnl: -220, entry: 3, stop: 3, sizing: 2, exit: 1, plan: 3 },
  { id: 8, date: "2025-02-10", symbol: "AVAX", pnl: 95, entry: 4, stop: 4, sizing: 4, exit: 3, plan: 4 },
  { id: 9, date: "2025-02-09", symbol: "SOL", pnl: -60, entry: 3, stop: 5, sizing: 4, exit: 3, plan: 4 },
  { id: 10, date: "2025-02-08", symbol: "BTC", pnl: 550, entry: 5, stop: 5, sizing: 5, exit: 5, plan: 5 },
  { id: 11, date: "2025-02-07", symbol: "ETH", pnl: -140, entry: 3, stop: 4, sizing: 3, exit: 2, plan: 3 },
  { id: 12, date: "2025-02-06", symbol: "LINK", pnl: 200, entry: 4, stop: 4, sizing: 4, exit: 4, plan: 5 },
  { id: 13, date: "2025-02-05", symbol: "BTC", pnl: -310, entry: 2, stop: 2, sizing: 2, exit: 1, plan: 2 },
  { id: 14, date: "2025-02-04", symbol: "SOL", pnl: 175, entry: 4, stop: 5, sizing: 3, exit: 3, plan: 4 },
  { id: 15, date: "2025-02-03", symbol: "ETH", pnl: 340, entry: 5, stop: 4, sizing: 5, exit: 4, plan: 5 },
  { id: 16, date: "2025-02-02", symbol: "DOGE", pnl: -45, entry: 3, stop: 4, sizing: 3, exit: 3, plan: 3 },
  { id: 17, date: "2025-02-01", symbol: "BTC", pnl: 480, entry: 4, stop: 5, sizing: 4, exit: 4, plan: 4 },
  { id: 18, date: "2025-01-31", symbol: "AVAX", pnl: -170, entry: 3, stop: 3, sizing: 3, exit: 2, plan: 3 },
  { id: 19, date: "2025-01-30", symbol: "SOL", pnl: 260, entry: 4, stop: 4, sizing: 4, exit: 3, plan: 4 },
  { id: 20, date: "2025-01-29", symbol: "ETH", pnl: 130, entry: 4, stop: 5, sizing: 3, exit: 4, plan: 4 },
];

const WEEKLY_SCORES = [
  { week: "W1", score: 3.2 },
  { week: "W2", score: 3.0 },
  { week: "W3", score: 3.5 },
  { week: "W4", score: 3.4 },
  { week: "W5", score: 3.8 },
  { week: "W6", score: 4.0 },
  { week: "W7", score: 4.2 },
  { week: "W8", score: 4.5 },
];

const DIMENSION_META: Record<Dimension, { label: string; icon: React.ElementType; question: string }> = {
  entry: { label: "Entry Timing", icon: Crosshair, question: "Did I enter at my planned price?" },
  stop: { label: "Stop Placement", icon: Shield, question: "Was my stop-loss at the right level?" },
  sizing: { label: "Position Sizing", icon: Layers, question: "Did I size according to my rules?" },
  exit: { label: "Exit Execution", icon: LogOut, question: "Did I exit at my target/stop?" },
  plan: { label: "Plan Adherence", icon: ClipboardList, question: "Did I follow my trading plan?" },
};

const DIMENSIONS: Dimension[] = ["entry", "stop", "sizing", "exit", "plan"];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function avg(nums: number[]): number {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
}

function tradeAvg(t: DemoTrade): number {
  return +((t.entry + t.stop + t.sizing + t.exit + t.plan) / 5).toFixed(1);
}

function scoreColor(score: number): string {
  if (score >= 4.5) return "bg-emerald-400 text-emerald-950";
  if (score >= 3.5) return "bg-green-500/80 text-green-950";
  if (score >= 2.5) return "bg-yellow-400 text-yellow-950";
  if (score >= 1.5) return "bg-orange-400 text-orange-950";
  return "bg-red-500 text-white";
}

function scoreBorderColor(score: number): string {
  if (score >= 4.5) return "border-emerald-400/40";
  if (score >= 3.5) return "border-green-500/30";
  if (score >= 2.5) return "border-yellow-400/30";
  if (score >= 1.5) return "border-orange-400/30";
  return "border-red-500/30";
}

// Convert a 0-5 score on each of the 5 pentagon axes to SVG polygon points.
// Pentagon with top vertex at 12-o'clock. Radius = score/5 * maxR.
function radarPoint(index: number, score: number, maxR: number, cx: number, cy: number) {
  const angle = (Math.PI * 2 * index) / 5 - Math.PI / 2;
  const r = (score / 5) * maxR;
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

function radarPolygon(scores: number[], maxR: number, cx: number, cy: number): string {
  return scores
    .map((s, i) => {
      const { x, y } = radarPoint(i, s, maxR, cx, cy);
      return `${x},${y}`;
    })
    .join(" ");
}

function radarLabelPos(index: number, maxR: number, cx: number, cy: number, padding: number = 18) {
  const angle = (Math.PI * 2 * index) / 5 - Math.PI / 2;
  const r = maxR + padding;
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ExecutionScoringPage() {
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // --- Computed scores ---
  const dimAverages = useMemo(() => {
    const result: Record<Dimension, number> = { entry: 0, stop: 0, sizing: 0, exit: 0, plan: 0 };
    for (const d of DIMENSIONS) {
      result[d] = +avg(DEMO_TRADES.map((t) => t[d])).toFixed(1);
    }
    return result;
  }, []);

  const overallAvg = useMemo(() => +avg(DEMO_TRADES.map(tradeAvg)).toFixed(1), []);

  const weakest = useMemo(() => {
    let min: Dimension = "entry";
    for (const d of DIMENSIONS) {
      if (dimAverages[d] < dimAverages[min]) min = d;
    }
    return min;
  }, [dimAverages]);

  // Well-executed = all dims >= 4
  const wellExecuted = useMemo(
    () => DEMO_TRADES.filter((t) => t.entry >= 4 && t.stop >= 4 && t.sizing >= 4 && t.exit >= 4 && t.plan >= 4),
    []
  );
  const poorlyExecuted = useMemo(
    () => DEMO_TRADES.filter((t) => tradeAvg(t) < 3),
    []
  );

  const strategyWinRate = useMemo(() => {
    const wins = DEMO_TRADES.filter((t) => t.pnl > 0).length;
    return +((wins / DEMO_TRADES.length) * 100).toFixed(0);
  }, []);

  const wellExecutedWinRate = useMemo(() => {
    if (wellExecuted.length === 0) return 0;
    const wins = wellExecuted.filter((t) => t.pnl > 0).length;
    return +((wins / wellExecuted.length) * 100).toFixed(0);
  }, [wellExecuted]);

  const executionGap = wellExecutedWinRate - strategyWinRate;

  const avgPnlWellExecuted = useMemo(
    () => (wellExecuted.length ? +avg(wellExecuted.map((t) => t.pnl)).toFixed(0) : 0),
    [wellExecuted]
  );
  const avgPnlPoorlyExecuted = useMemo(
    () => (poorlyExecuted.length ? +avg(poorlyExecuted.map((t) => t.pnl)).toFixed(0) : 0),
    [poorlyExecuted]
  );
  const pnlDiff = avgPnlWellExecuted - avgPnlPoorlyExecuted;

  // --- Sorted trades ---
  const sortedTrades = useMemo(() => {
    const copy = [...DEMO_TRADES];
    copy.sort((a, b) => {
      let aVal: number | string;
      let bVal: number | string;
      if (sortKey === "avg") {
        aVal = tradeAvg(a);
        bVal = tradeAvg(b);
      } else if (sortKey === "date" || sortKey === "symbol") {
        aVal = a[sortKey];
        bVal = b[sortKey];
      } else {
        aVal = a[sortKey];
        bVal = b[sortKey];
      }
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return copy;
  }, [sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (col !== sortKey) return <ChevronDown size={12} className="text-muted/40 ml-0.5" />;
    return sortDir === "asc" ? (
      <ChevronUp size={12} className="text-accent ml-0.5" />
    ) : (
      <ChevronDown size={12} className="text-accent ml-0.5" />
    );
  }

  // --- Radar chart constants ---
  const radarSize = 260;
  const radarCx = radarSize / 2;
  const radarCy = radarSize / 2;
  const radarMaxR = 100;

  const radarScores = DIMENSIONS.map((d) => dimAverages[d]);

  // Build concentric pentagon rings (1-5)
  const pentagons = [1, 2, 3, 4, 5].map((level) =>
    radarPolygon(
      Array(5).fill(level),
      radarMaxR,
      radarCx,
      radarCy
    )
  );

  // Max bar height for weekly chart
  const maxBarH = 140;

  return (
    <div className="space-y-6 mx-auto max-w-[1600px]">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <Target size={24} className="text-accent" />
          Execution Scoring <InfoTooltip text="Rate 5 dimensions per trade: entry timing, stop placement, position sizing, exit execution, plan adherence." />
        </h2>
        <p className="text-sm text-muted mt-0.5">
          Separate strategy from execution — measure how well you follow your own rules
        </p>
      </div>

      {/* ================================================================== */}
      {/* 1. The 5 Dimensions                                                 */}
      {/* ================================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {DIMENSIONS.map((d) => {
          const meta = DIMENSION_META[d];
          const Icon = meta.icon;
          return (
            <div
              key={d}
              className="glass rounded-2xl border border-border/50 p-4 group hover:border-accent/20 transition-all duration-300"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-accent/8">
                  <Icon size={16} className="text-accent" />
                </div>
                <span className="text-xs font-semibold text-foreground">{meta.label}</span>
              </div>
              <p className="text-[11px] text-muted leading-relaxed">{meta.question}</p>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-xl font-bold text-foreground">{dimAverages[d]}</span>
                <span className="text-[10px] text-muted">/5 avg</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ================================================================== */}
      {/* 2. Radar Chart + Weekly Trend side by side                          */}
      {/* ================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* --- Spider / Radar Chart --- */}
        <div
          className="glass rounded-2xl border border-border/50 p-6"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-1 flex items-center gap-2">
            <Star size={14} className="text-accent" />
            Execution Profile
          </h3>
          <p className="text-[11px] text-muted mb-4">Average scores across all trades</p>

          <div className="flex items-center justify-center">
            <svg
              width={radarSize}
              height={radarSize}
              viewBox={`0 0 ${radarSize} ${radarSize}`}
              className="overflow-visible"
            >
              {/* Concentric pentagons */}
              {pentagons.map((pts, i) => (
                <polygon
                  key={i}
                  points={pts}
                  fill="none"
                  stroke="var(--border)"
                  strokeWidth={i === 4 ? 1.5 : 0.5}
                  opacity={0.5}
                />
              ))}

              {/* Axis lines from center to each vertex */}
              {DIMENSIONS.map((_, i) => {
                const { x, y } = radarPoint(i, 5, radarMaxR, radarCx, radarCy);
                return (
                  <line
                    key={i}
                    x1={radarCx}
                    y1={radarCy}
                    x2={x}
                    y2={y}
                    stroke="var(--border)"
                    strokeWidth={0.5}
                    opacity={0.5}
                  />
                );
              })}

              {/* Filled radar area */}
              <polygon
                points={radarPolygon(radarScores, radarMaxR, radarCx, radarCy)}
                fill="var(--accent)"
                fillOpacity={0.15}
                stroke="var(--accent)"
                strokeWidth={2}
                strokeLinejoin="round"
              />

              {/* Score dots on each vertex */}
              {radarScores.map((score, i) => {
                const { x, y } = radarPoint(i, score, radarMaxR, radarCx, radarCy);
                return <circle key={i} cx={x} cy={y} r={4} fill="var(--accent)" />;
              })}

              {/* Labels */}
              {DIMENSIONS.map((d, i) => {
                const pos = radarLabelPos(i, radarMaxR, radarCx, radarCy, 28);
                const meta = DIMENSION_META[d];
                // Adjust text anchor based on position
                let anchor: "start" | "middle" | "end" = "middle";
                if (pos.x < radarCx - 10) anchor = "end";
                else if (pos.x > radarCx + 10) anchor = "start";
                return (
                  <text
                    key={d}
                    x={pos.x}
                    y={pos.y}
                    textAnchor={anchor}
                    dominantBaseline="central"
                    className="text-[10px] fill-muted font-medium"
                  >
                    {meta.label} ({dimAverages[d]})
                  </text>
                );
              })}
            </svg>
          </div>

          <div className="text-center mt-3">
            <span className="text-[10px] text-muted uppercase tracking-widest">Overall Average</span>
            <p className="text-2xl font-bold text-accent">{overallAvg}/5</p>
          </div>
        </div>

        {/* --- Weekly Execution Score Trend --- */}
        <div
          className="glass rounded-2xl border border-border/50 p-6"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-1 flex items-center gap-2">
            <TrendingUp size={14} className="text-accent" />
            Weekly Score Trend
          </h3>
          <p className="text-[11px] text-muted mb-4">Average execution score per week</p>

          <div className="flex items-end justify-between gap-2 h-[180px] px-2">
            {WEEKLY_SCORES.map((w, i) => {
              const barH = (w.score / 5) * maxBarH;
              const pct = (w.score / 5) * 100;
              // Color gradient: lower = more orange, higher = more green
              const hue = 20 + (pct / 100) * 100; // 20 (orange) -> 120 (green)
              return (
                <div key={i} className="flex flex-col items-center flex-1 gap-1">
                  <span className="text-[10px] text-muted font-medium">{w.score}</span>
                  <div
                    className="w-full rounded-t-lg transition-all duration-500 relative group"
                    style={{
                      height: `${barH}px`,
                      background: `linear-gradient(to top, hsla(${hue}, 70%, 45%, 0.8), hsla(${hue}, 80%, 55%, 0.6))`,
                      boxShadow: `0 0 12px hsla(${hue}, 70%, 50%, 0.2)`,
                    }}
                  >
                    {/* Hover tooltip */}
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-surface border border-border rounded-lg px-2 py-1 text-[10px] text-foreground whitespace-nowrap pointer-events-none">
                      {w.score}/5
                    </div>
                  </div>
                  <span className="text-[10px] text-muted">{w.week}</span>
                </div>
              );
            })}
          </div>

          {/* Trend indicator */}
          <div className="flex items-center justify-center gap-2 mt-4 text-xs">
            <TrendingUp size={14} className="text-win" />
            <span className="text-win font-medium">
              +{((WEEKLY_SCORES[WEEKLY_SCORES.length - 1].score - WEEKLY_SCORES[0].score) * 20).toFixed(0)}% improvement over 8 weeks
            </span>
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* 3. System Edge vs Execution Gap                                     */}
      {/* ================================================================== */}
      <div
        className="glass rounded-2xl border border-border/50 p-6"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
          <Activity size={14} className="text-accent" />
          System Edge vs Execution Gap
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Strategy Win Rate */}
          <div className="rounded-xl border border-border/50 bg-background/50 p-5">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 size={14} className="text-muted" />
              <span className="text-[10px] text-muted font-semibold uppercase tracking-widest">
                Strategy Win Rate
              </span>
            </div>
            <p className="text-3xl font-bold text-foreground">{strategyWinRate}%</p>
            <p className="text-[11px] text-muted mt-1">All {DEMO_TRADES.length} trades</p>

            {/* Visual bar */}
            <div className="mt-3 h-2 rounded-full bg-border/30 overflow-hidden">
              <div
                className="h-full rounded-full bg-muted/60 transition-all duration-700"
                style={{ width: `${strategyWinRate}%` }}
              />
            </div>
          </div>

          {/* Well-Executed Win Rate */}
          <div className="rounded-xl border border-accent/20 bg-accent/5 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Star size={14} className="text-accent" />
              <span className="text-[10px] text-accent font-semibold uppercase tracking-widest">
                Well-Executed Win Rate
              </span>
            </div>
            <p className="text-3xl font-bold text-accent">{wellExecutedWinRate}%</p>
            <p className="text-[11px] text-muted mt-1">
              {wellExecuted.length} trades scored 4+ on all dimensions
            </p>

            {/* Visual bar */}
            <div className="mt-3 h-2 rounded-full bg-border/30 overflow-hidden">
              <div
                className="h-full rounded-full bg-accent/70 transition-all duration-700"
                style={{ width: `${wellExecutedWinRate}%` }}
              />
            </div>
          </div>

          {/* Gap */}
          <div className="rounded-xl border border-border/50 bg-background/50 p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={14} className="text-yellow-400" />
                <span className="text-[10px] text-yellow-400 font-semibold uppercase tracking-widest">
                  Execution Gap
                </span>
              </div>
              <p className="text-3xl font-bold text-yellow-400">{executionGap}%</p>
            </div>
            <p className="text-[11px] text-muted mt-2 leading-relaxed">
              You&apos;re leaving money on the table. Well-executed trades win{" "}
              <span className="text-accent font-semibold">{executionGap}%</span> more often.
            </p>

            {/* Comparison bar */}
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 h-2 rounded-full bg-border/30 overflow-hidden">
                <div
                  className="h-full rounded-full bg-muted/60"
                  style={{ width: `${strategyWinRate}%` }}
                />
              </div>
              <span className="text-[9px] text-muted">vs</span>
              <div className="flex-1 h-2 rounded-full bg-border/30 overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent/70"
                  style={{ width: `${wellExecutedWinRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* 4. Trade Execution Table                                            */}
      {/* ================================================================== */}
      <div
        className="glass rounded-2xl border border-border/50 p-6"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
          <BarChart3 size={14} className="text-accent" />
          Trade Execution Breakdown
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                {([
                  { key: "date" as SortKey, label: "Date" },
                  { key: "symbol" as SortKey, label: "Symbol" },
                  { key: "pnl" as SortKey, label: "P&L" },
                  { key: "entry" as SortKey, label: "Entry" },
                  { key: "stop" as SortKey, label: "Stop" },
                  { key: "sizing" as SortKey, label: "Size" },
                  { key: "exit" as SortKey, label: "Exit" },
                  { key: "plan" as SortKey, label: "Plan" },
                  { key: "avg" as SortKey, label: "Avg" },
                ] as const).map(({ key, label }) => (
                  <th
                    key={key}
                    onClick={() => handleSort(key)}
                    className="text-left py-2.5 px-2 text-[10px] text-muted font-semibold uppercase tracking-widest cursor-pointer select-none hover:text-foreground transition-colors"
                  >
                    <span className="flex items-center">
                      {label}
                      <SortIcon col={key} />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedTrades.map((trade) => {
                const a = tradeAvg(trade);
                return (
                  <tr
                    key={trade.id}
                    className="border-b border-border/20 hover:bg-surface-hover/30 transition-colors"
                  >
                    <td className="py-2.5 px-2 text-muted text-xs font-mono">{trade.date}</td>
                    <td className="py-2.5 px-2 text-foreground font-semibold text-xs">{trade.symbol}</td>
                    <td
                      className={`py-2.5 px-2 font-bold text-xs ${
                        trade.pnl >= 0 ? "text-win" : "text-loss"
                      }`}
                    >
                      {trade.pnl >= 0 ? "+" : ""}${trade.pnl}
                    </td>
                    {DIMENSIONS.map((d) => (
                      <td key={d} className="py-2.5 px-2">
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-[11px] font-bold ${scoreColor(
                            trade[d]
                          )} ${scoreBorderColor(trade[d])} border`}
                        >
                          {trade[d]}
                        </span>
                      </td>
                    ))}
                    <td className="py-2.5 px-2">
                      <span
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-[11px] font-bold ${scoreColor(
                          a
                        )} ${scoreBorderColor(a)} border`}
                      >
                        {a}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================================================================== */}
      {/* 5. Insights                                                         */}
      {/* ================================================================== */}
      <div
        className="glass rounded-2xl border border-border/50 p-6"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
          <Lightbulb size={14} className="text-yellow-400" />
          Insights
        </h3>

        <div className="space-y-3">
          <div className="flex items-start gap-3 rounded-xl bg-background/50 border border-border/30 p-4">
            <div className="p-1.5 rounded-lg bg-red-500/10 mt-0.5">
              <AlertTriangle size={14} className="text-red-400" />
            </div>
            <div>
              <p className="text-sm text-foreground font-medium">
                Your weakest dimension:{" "}
                <span className="text-accent">{DIMENSION_META[weakest].label}</span>{" "}
                <span className="text-muted">(avg {dimAverages[weakest]}/5)</span>
              </p>
              <p className="text-[11px] text-muted mt-0.5">
                This is your biggest area for improvement. Focus on this before optimizing strategy.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl bg-background/50 border border-border/30 p-4">
            <div className="p-1.5 rounded-lg bg-accent/10 mt-0.5">
              <TrendingUp size={14} className="text-accent" />
            </div>
            <div>
              <p className="text-sm text-foreground font-medium">
                Trades with 4+ execution score average{" "}
                <span className="text-win font-bold">+${pnlDiff}</span> more than poorly executed trades
              </p>
              <p className="text-[11px] text-muted mt-0.5">
                Well-executed avg P&L: <span className="text-win">${avgPnlWellExecuted}</span> vs
                poorly executed: <span className="text-loss">${avgPnlPoorlyExecuted}</span>
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl bg-background/50 border border-border/30 p-4">
            <div className="p-1.5 rounded-lg bg-yellow-500/10 mt-0.5">
              <Lightbulb size={14} className="text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-foreground font-medium">
                Focus area: Exit strategy
              </p>
              <p className="text-[11px] text-muted mt-0.5">
                Consider setting take-profit orders before entering a trade. Pre-planned exits remove emotion
                from the equation and improve your Exit Execution score.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

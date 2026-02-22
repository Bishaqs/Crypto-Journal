"use client";

import { useMemo, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3,
  Zap,
  Activity,
  Info,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// ---------------------------------------------------------------------------
// DEMO DATA — 30 realistic crypto trades
// ---------------------------------------------------------------------------

interface DemoTrade {
  id: number;
  date: string;
  symbol: string;
  entry: number;
  exit: number;
  risk: number;
  pnl: number;
  rMultiple: number;
  mae: number;
  mfe: number;
}

const DEMO_TRADES: DemoTrade[] = [
  { id: 1, date: "2025-12-01", symbol: "BTC", entry: 97200, exit: 98800, risk: 400, pnl: 640, rMultiple: 1.6, mae: 120, mfe: 820 },
  { id: 2, date: "2025-12-02", symbol: "ETH", entry: 3650, exit: 3580, risk: 200, pnl: -200, rMultiple: -1.0, mae: 210, mfe: 60 },
  { id: 3, date: "2025-12-03", symbol: "SOL", entry: 195, exit: 210, risk: 150, pnl: 450, rMultiple: 3.0, mae: 80, mfe: 520 },
  { id: 4, date: "2025-12-04", symbol: "BTC", entry: 98500, exit: 97800, risk: 350, pnl: -350, rMultiple: -1.0, mae: 380, mfe: 90 },
  { id: 5, date: "2025-12-05", symbol: "AVAX", entry: 42, exit: 45.5, risk: 200, pnl: 700, rMultiple: 3.5, mae: 60, mfe: 780 },
  { id: 6, date: "2025-12-06", symbol: "ETH", entry: 3700, exit: 3780, risk: 300, pnl: 480, rMultiple: 1.6, mae: 100, mfe: 560 },
  { id: 7, date: "2025-12-07", symbol: "BTC", entry: 99000, exit: 98200, risk: 400, pnl: -400, rMultiple: -1.0, mae: 450, mfe: 150 },
  { id: 8, date: "2025-12-08", symbol: "LINK", entry: 18.5, exit: 20.2, risk: 170, pnl: 340, rMultiple: 2.0, mae: 50, mfe: 400 },
  { id: 9, date: "2025-12-09", symbol: "SOL", entry: 208, exit: 202, risk: 300, pnl: -300, rMultiple: -1.0, mae: 320, mfe: 80 },
  { id: 10, date: "2025-12-10", symbol: "BTC", entry: 97500, exit: 100100, risk: 500, pnl: 2600, rMultiple: 5.2, mae: 140, mfe: 2800 },
  { id: 11, date: "2025-12-11", symbol: "ETH", entry: 3680, exit: 3720, risk: 200, pnl: 240, rMultiple: 1.2, mae: 70, mfe: 310 },
  { id: 12, date: "2025-12-12", symbol: "DOGE", entry: 0.42, exit: 0.415, risk: 100, pnl: -100, rMultiple: -1.0, mae: 130, mfe: 40 },
  { id: 13, date: "2025-12-13", symbol: "BTC", entry: 100200, exit: 101800, risk: 400, pnl: 640, rMultiple: 1.6, mae: 90, mfe: 720 },
  { id: 14, date: "2025-12-14", symbol: "SOL", entry: 215, exit: 225, risk: 250, pnl: 500, rMultiple: 2.0, mae: 110, mfe: 620 },
  { id: 15, date: "2025-12-15", symbol: "AVAX", entry: 44, exit: 43, risk: 200, pnl: -200, rMultiple: -1.0, mae: 240, mfe: 70 },
  { id: 16, date: "2025-12-16", symbol: "ETH", entry: 3750, exit: 3850, risk: 300, pnl: 600, rMultiple: 2.0, mae: 85, mfe: 680 },
  { id: 17, date: "2025-12-17", symbol: "BTC", entry: 101500, exit: 100700, risk: 400, pnl: -400, rMultiple: -1.0, mae: 420, mfe: 120 },
  { id: 18, date: "2025-12-18", symbol: "LINK", entry: 21, exit: 23.5, risk: 250, pnl: 625, rMultiple: 2.5, mae: 95, mfe: 700 },
  { id: 19, date: "2025-12-19", symbol: "BTC", entry: 102000, exit: 103500, risk: 500, pnl: 750, rMultiple: 1.5, mae: 200, mfe: 900 },
  { id: 20, date: "2025-12-20", symbol: "SOL", entry: 220, exit: 218, risk: 200, pnl: -200, rMultiple: -1.0, mae: 260, mfe: 55 },
  { id: 21, date: "2025-12-21", symbol: "ETH", entry: 3820, exit: 3680, risk: 350, pnl: -350, rMultiple: -1.0, mae: 370, mfe: 100 },
  { id: 22, date: "2025-12-22", symbol: "BTC", entry: 103000, exit: 105200, risk: 400, pnl: 880, rMultiple: 2.2, mae: 150, mfe: 1000 },
  { id: 23, date: "2025-12-23", symbol: "AVAX", entry: 46, exit: 49, risk: 150, pnl: 450, rMultiple: 3.0, mae: 40, mfe: 510 },
  { id: 24, date: "2025-12-24", symbol: "DOGE", entry: 0.44, exit: 0.48, risk: 100, pnl: 400, rMultiple: 4.0, mae: 30, mfe: 480 },
  { id: 25, date: "2025-12-25", symbol: "BTC", entry: 104500, exit: 103800, risk: 350, pnl: -350, rMultiple: -1.0, mae: 400, mfe: 80 },
  { id: 26, date: "2025-12-26", symbol: "ETH", entry: 3900, exit: 4050, risk: 300, pnl: 450, rMultiple: 1.5, mae: 75, mfe: 520 },
  { id: 27, date: "2025-12-27", symbol: "SOL", entry: 230, exit: 242, risk: 200, pnl: 480, rMultiple: 2.4, mae: 65, mfe: 560 },
  { id: 28, date: "2025-12-28", symbol: "BTC", entry: 105000, exit: 104200, risk: 400, pnl: -400, rMultiple: -1.0, mae: 440, mfe: 110 },
  { id: 29, date: "2025-12-29", symbol: "LINK", entry: 24, exit: 27, risk: 300, pnl: 900, rMultiple: 3.0, mae: 55, mfe: 980 },
  { id: 30, date: "2025-12-30", symbol: "BTC", entry: 106000, exit: 107200, risk: 500, pnl: 600, rMultiple: 1.2, mae: 180, mfe: 750 },
];

// ---------------------------------------------------------------------------
// Helper: metric card
// ---------------------------------------------------------------------------

function MetricCard({
  label,
  value,
  sub,
  icon: Icon,
  color = "text-foreground",
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  color?: string;
}) {
  return (
    <div
      className="glass rounded-2xl border border-border/50 p-5 group hover:border-accent/20 transition-all duration-300"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-muted font-semibold uppercase tracking-widest">
          {label}
        </span>
        <div className="p-1.5 rounded-lg bg-accent/8">
          <Icon size={14} className="text-accent" />
        </div>
      </div>
      <p className={`text-2xl font-bold tracking-tight ${color}`}>{value}</p>
      {sub && <p className="text-[11px] text-muted mt-1">{sub}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function RiskAnalysisPage() {
  const [activeTab, setActiveTab] = useState<"r-multiples" | "mae-mfe">("r-multiples");
  const [rTableSortDir, setRTableSortDir] = useState<"asc" | "desc">("desc");
  const [maeTableSortDir, setMaeTableSortDir] = useState<"asc" | "desc">("desc");

  // ---- R-Multiples computed metrics ----
  const rMetrics = useMemo(() => {
    const winners = DEMO_TRADES.filter((t) => t.rMultiple > 0);
    const losers = DEMO_TRADES.filter((t) => t.rMultiple <= 0);
    const winRate = winners.length / DEMO_TRADES.length;
    const avgWinR = winners.length > 0 ? winners.reduce((s, t) => s + t.rMultiple, 0) / winners.length : 0;
    const avgLossR = losers.length > 0 ? losers.reduce((s, t) => s + t.rMultiple, 0) / losers.length : 0;
    const expectancy = winRate * avgWinR - (1 - winRate) * 1;
    const largestWin = Math.max(...DEMO_TRADES.map((t) => t.rMultiple));

    return { winRate, avgWinR, avgLossR, expectancy, largestWin };
  }, []);

  // ---- R-Distribution buckets ----
  const rDistribution = useMemo(() => {
    const buckets: { label: string; min: number; max: number; count: number }[] = [
      { label: "-3R", min: -Infinity, max: -2.5, count: 0 },
      { label: "-2R", min: -2.5, max: -1.5, count: 0 },
      { label: "-1R", min: -1.5, max: -0.5, count: 0 },
      { label: "0R", min: -0.5, max: 0.5, count: 0 },
      { label: "+1R", min: 0.5, max: 1.5, count: 0 },
      { label: "+2R", min: 1.5, max: 2.5, count: 0 },
      { label: "+3R", min: 2.5, max: 3.5, count: 0 },
      { label: "+4R", min: 3.5, max: 4.5, count: 0 },
      { label: "+5R+", min: 4.5, max: Infinity, count: 0 },
    ];
    for (const t of DEMO_TRADES) {
      const bucket = buckets.find((b) => t.rMultiple >= b.min && t.rMultiple < b.max);
      if (bucket) bucket.count++;
    }
    const maxCount = Math.max(...buckets.map((b) => b.count), 1);
    return { buckets, maxCount };
  }, []);

  // ---- Cumulative R ----
  const cumulativeR = useMemo(() => {
    let cum = 0;
    return DEMO_TRADES.map((t, i) => {
      cum += t.rMultiple;
      return { trade: i + 1, cumR: cum };
    });
  }, []);

  const cumRMax = useMemo(
    () => Math.max(...cumulativeR.map((c) => Math.abs(c.cumR)), 1),
    [cumulativeR]
  );

  // ---- Sorted R table ----
  const sortedRTrades = useMemo(
    () =>
      [...DEMO_TRADES].sort((a, b) =>
        rTableSortDir === "desc" ? b.rMultiple - a.rMultiple : a.rMultiple - b.rMultiple
      ),
    [rTableSortDir]
  );

  // ---- MAE/MFE computed ----
  const maeMfeMetrics = useMemo(() => {
    const avgCapture =
      DEMO_TRADES.filter((t) => t.pnl > 0).reduce((s, t) => s + (t.mfe > 0 ? t.pnl / t.mfe : 0), 0) /
      (DEMO_TRADES.filter((t) => t.pnl > 0).length || 1);
    return { avgCapture };
  }, []);

  // ---- Sorted MAE table ----
  const sortedMaeTrades = useMemo(
    () =>
      [...DEMO_TRADES].sort((a, b) =>
        maeTableSortDir === "desc" ? b.mae - a.mae : a.mae - b.mae
      ),
    [maeTableSortDir]
  );

  // ---- Scatter helpers ----
  const scatterGridSize = 20; // cells per axis

  function buildScatterPoints(
    data: DemoTrade[],
    xKey: "mae" | "mfe",
    yKey: "pnl"
  ) {
    const xVals = data.map((t) => t[xKey]);
    const yVals = data.map((t) => t[yKey]);
    const xMax = Math.max(...xVals, 1);
    const yMin = Math.min(...yVals);
    const yMax = Math.max(...yVals);
    const yRange = Math.max(yMax - yMin, 1);

    return data.map((t) => ({
      ...t,
      gridX: Math.min(Math.floor((t[xKey] / xMax) * (scatterGridSize - 1)), scatterGridSize - 1),
      gridY: Math.min(
        scatterGridSize - 1 - Math.floor(((t[yKey] - yMin) / yRange) * (scatterGridSize - 1)),
        scatterGridSize - 1
      ),
    }));
  }

  const maeScatterPoints = useMemo(() => buildScatterPoints(DEMO_TRADES, "mae", "pnl"), []);
  const mfeScatterPoints = useMemo(() => buildScatterPoints(DEMO_TRADES, "mfe", "pnl"), []);

  const maeXMax = Math.max(...DEMO_TRADES.map((t) => t.mae));
  const mfeXMax = Math.max(...DEMO_TRADES.map((t) => t.mfe));
  const pnlMin = Math.min(...DEMO_TRADES.map((t) => t.pnl));
  const pnlMax = Math.max(...DEMO_TRADES.map((t) => t.pnl));

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Risk Analysis
        </h1>
        <p className="text-sm text-muted mt-0.5">
          R-Multiples &amp; MAE/MFE
        </p>
      </div>

      {/* Tab selector */}
      <div className="flex gap-1 p-1 rounded-xl bg-background border border-border w-fit">
        {(
          [
            { key: "r-multiples", label: "R-Multiples" },
            { key: "mae-mfe", label: "MAE/MFE Analysis" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === tab.key
                ? "bg-accent/10 text-accent border border-accent/20"
                : "text-muted hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ================================================================= */}
      {/* R-MULTIPLES TAB                                                    */}
      {/* ================================================================= */}
      {activeTab === "r-multiples" && (
        <div className="space-y-6">
          {/* Key Metrics Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              label="Expectancy (R)"
              value={`${rMetrics.expectancy >= 0 ? "+" : ""}${rMetrics.expectancy.toFixed(2)}R`}
              sub="(Win% x Avg Win R) - (Loss% x 1)"
              icon={Zap}
              color={rMetrics.expectancy >= 0 ? "text-win" : "text-loss"}
            />
            <MetricCard
              label="Average Winner (R)"
              value={`${rMetrics.avgWinR.toFixed(1)}R`}
              sub={`${DEMO_TRADES.filter((t) => t.rMultiple > 0).length} winning trades`}
              icon={TrendingUp}
              color="text-win"
            />
            <MetricCard
              label="Average Loser (R)"
              value={`${rMetrics.avgLossR.toFixed(1)}R`}
              sub={`${DEMO_TRADES.filter((t) => t.rMultiple <= 0).length} losing trades`}
              icon={TrendingDown}
              color="text-loss"
            />
            <MetricCard
              label="Largest Winner (R)"
              value={`${rMetrics.largestWin.toFixed(1)}R`}
              sub="single best trade"
              icon={Target}
              color="text-win"
            />
          </div>

          {/* R-Distribution Histogram */}
          <div
            className="glass rounded-2xl border border-border/50 p-6"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="flex items-center gap-2 mb-5">
              <BarChart3 size={16} className="text-accent" />
              <h3 className="text-sm font-semibold text-foreground">
                R-Distribution
              </h3>
              <span className="text-xs text-muted ml-auto">
                {DEMO_TRADES.length} trades
              </span>
            </div>
            <div className="space-y-2">
              {rDistribution.buckets.map((bucket) => {
                const isNegative = bucket.label.startsWith("-");
                const widthPct =
                  rDistribution.maxCount > 0
                    ? (bucket.count / rDistribution.maxCount) * 100
                    : 0;
                return (
                  <div key={bucket.label} className="flex items-center gap-3">
                    <span className="text-xs font-mono text-muted w-10 text-right shrink-0">
                      {bucket.label}
                    </span>
                    <div className="flex-1 h-7 rounded-lg bg-background relative overflow-hidden">
                      <div
                        className={`h-full rounded-lg transition-all duration-500 ${
                          isNegative ? "bg-loss/70" : "bg-win/70"
                        }`}
                        style={{ width: `${Math.max(widthPct, bucket.count > 0 ? 4 : 0)}%` }}
                      />
                      {bucket.count > 0 && (
                        <span
                          className="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] font-bold text-foreground"
                          style={{ textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}
                        >
                          {bucket.count}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cumulative R Chart */}
          <div
            className="glass rounded-2xl border border-border/50 p-6"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="flex items-center gap-2 mb-5">
              <Activity size={16} className="text-accent" />
              <h3 className="text-sm font-semibold text-foreground">
                Cumulative R-Multiple
              </h3>
              <span className="text-xs text-muted ml-auto">
                equity curve in R units
              </span>
            </div>

            {/* Chart area */}
            <div className="relative h-[220px] border-b border-l border-border/40">
              {/* Zero line */}
              <div
                className="absolute left-0 right-0 border-t border-dashed border-muted/30"
                style={{
                  top: `${(cumRMax / (cumRMax * 2)) * 100}%`,
                }}
              />
              {/* Label at zero */}
              <span
                className="absolute -left-1 text-[10px] text-muted -translate-x-full pr-1"
                style={{ top: `${(cumRMax / (cumRMax * 2)) * 100}%`, transform: "translateY(-50%)" }}
              >
                0R
              </span>

              {/* Stepped bars */}
              <div className="absolute inset-0 flex items-end">
                {cumulativeR.map((point, i) => {
                  const barWidthPct = 100 / cumulativeR.length;
                  const isPositive = point.cumR >= 0;
                  const heightPct = Math.abs(point.cumR) / (cumRMax * 2);
                  const topPct = isPositive
                    ? (cumRMax - point.cumR) / (cumRMax * 2)
                    : cumRMax / (cumRMax * 2);

                  return (
                    <div
                      key={i}
                      className="absolute"
                      style={{
                        left: `${(i / cumulativeR.length) * 100}%`,
                        width: `${barWidthPct}%`,
                        top: `${topPct * 100}%`,
                        height: `${heightPct * 100}%`,
                      }}
                    >
                      <div
                        className={`w-full h-full ${
                          isPositive ? "bg-win/50" : "bg-loss/50"
                        }`}
                        style={{ borderRadius: "1px" }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Connecting line overlay */}
              <svg
                className="absolute inset-0 w-full h-full"
                viewBox={`0 0 ${cumulativeR.length} ${cumRMax * 2}`}
                preserveAspectRatio="none"
              >
                <polyline
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="0.3"
                  strokeLinejoin="round"
                  points={cumulativeR
                    .map(
                      (p, i) =>
                        `${i + 0.5},${cumRMax - p.cumR}`
                    )
                    .join(" ")}
                />
              </svg>

              {/* X-axis labels */}
              <div className="absolute -bottom-5 left-0 right-0 flex justify-between px-0.5">
                {[1, 10, 20, 30].map((n) => (
                  <span key={n} className="text-[9px] text-muted">
                    #{n}
                  </span>
                ))}
              </div>
            </div>

            {/* Final cumulative value */}
            <div className="mt-6 flex items-center gap-2">
              <span className="text-xs text-muted">Final:</span>
              <span
                className={`text-sm font-bold ${
                  cumulativeR[cumulativeR.length - 1].cumR >= 0
                    ? "text-win"
                    : "text-loss"
                }`}
              >
                {cumulativeR[cumulativeR.length - 1].cumR >= 0 ? "+" : ""}
                {cumulativeR[cumulativeR.length - 1].cumR.toFixed(1)}R
              </span>
              <span className="text-xs text-muted">
                over {DEMO_TRADES.length} trades
              </span>
            </div>
          </div>

          {/* R-Multiple Table */}
          <div
            className="glass rounded-2xl border border-border/50 p-6"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="flex items-center gap-2 mb-4">
              <ArrowUpDown size={14} className="text-accent" />
              <h3 className="text-sm font-semibold text-foreground">
                R-Multiple Table
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] text-muted uppercase tracking-wider border-b border-border">
                    <th className="text-left py-2 px-3">Date</th>
                    <th className="text-left py-2 px-3">Symbol</th>
                    <th className="text-right py-2 px-3">Entry</th>
                    <th className="text-right py-2 px-3">Exit</th>
                    <th className="text-right py-2 px-3">Risk ($)</th>
                    <th className="text-right py-2 px-3">P&amp;L ($)</th>
                    <th className="text-right py-2 px-3">
                      <button
                        onClick={() =>
                          setRTableSortDir((d) => (d === "desc" ? "asc" : "desc"))
                        }
                        className="inline-flex items-center gap-1 hover:text-accent transition-colors"
                      >
                        R-Multiple
                        {rTableSortDir === "desc" ? (
                          <ChevronDown size={12} />
                        ) : (
                          <ChevronUp size={12} />
                        )}
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRTrades.map((t) => (
                    <tr
                      key={t.id}
                      className={`border-b border-border/30 transition-colors ${
                        t.rMultiple > 0
                          ? "hover:bg-win/5"
                          : "hover:bg-loss/5"
                      }`}
                    >
                      <td className="py-2.5 px-3 text-muted text-xs">
                        {t.date}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-foreground text-xs">
                        {t.symbol}
                      </td>
                      <td className="py-2.5 px-3 text-right text-xs text-foreground">
                        ${t.entry.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right text-xs text-foreground">
                        ${t.exit.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right text-xs text-muted">
                        ${t.risk}
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right text-xs font-semibold ${
                          t.pnl >= 0 ? "text-win" : "text-loss"
                        }`}
                      >
                        {t.pnl >= 0 ? "+" : ""}${t.pnl}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            t.rMultiple > 0
                              ? "bg-win/10 text-win"
                              : "bg-loss/10 text-loss"
                          }`}
                        >
                          {t.rMultiple > 0 ? "+" : ""}
                          {t.rMultiple.toFixed(1)}R
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MAE/MFE TAB                                                        */}
      {/* ================================================================= */}
      {activeTab === "mae-mfe" && (
        <div className="space-y-6">
          {/* Explanation Card */}
          <div
            className="glass rounded-2xl border border-border/50 p-6"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-accent/10 mt-0.5">
                <Info size={18} className="text-accent" />
              </div>
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-bold text-foreground">MAE</span>
                  <span className="text-sm text-muted">
                    {" "}= Maximum Adverse Excursion — the worst drawdown experienced during the life of a trade.
                  </span>
                </div>
                <div>
                  <span className="text-sm font-bold text-foreground">MFE</span>
                  <span className="text-sm text-muted">
                    {" "}= Maximum Favorable Excursion — the best unrealized profit reached before the trade was closed.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Scatter plots side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* MAE vs Outcome */}
            <div
              className="glass rounded-2xl border border-border/50 p-6"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <h3 className="text-sm font-semibold text-foreground mb-1">
                MAE vs Final P&amp;L
              </h3>
              <p className="text-xs text-muted mb-4">
                How far price moved against you vs trade outcome
              </p>

              {/* Scatter grid */}
              <div className="relative">
                {/* Y-axis labels */}
                <div className="absolute -left-1 top-0 bottom-0 flex flex-col justify-between -translate-x-full pr-1.5">
                  <span className="text-[9px] text-muted">+${pnlMax}</span>
                  <span className="text-[9px] text-muted">$0</span>
                  <span className="text-[9px] text-muted">{pnlMin < 0 ? `-$${Math.abs(pnlMin)}` : "$0"}</span>
                </div>

                <div
                  className="grid border border-border/20 rounded-lg overflow-hidden"
                  style={{
                    gridTemplateColumns: `repeat(${scatterGridSize}, 1fr)`,
                    gridTemplateRows: `repeat(${scatterGridSize}, 1fr)`,
                    aspectRatio: "1",
                  }}
                >
                  {Array.from({ length: scatterGridSize * scatterGridSize }).map((_, idx) => {
                    const gx = idx % scatterGridSize;
                    const gy = Math.floor(idx / scatterGridSize);
                    const point = maeScatterPoints.find(
                      (p) => p.gridX === gx && p.gridY === gy
                    );
                    return (
                      <div
                        key={idx}
                        className="relative border-r border-b border-border/5"
                        style={{ aspectRatio: "1" }}
                      >
                        {point && (
                          <div
                            className={`absolute inset-1 rounded-full ${
                              point.pnl >= 0 ? "bg-win" : "bg-loss"
                            }`}
                            style={{ opacity: 0.8 }}
                            title={`${point.symbol}: MAE=$${point.mae}, P&L=${point.pnl >= 0 ? "+" : ""}$${point.pnl}`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* X-axis labels */}
                <div className="flex justify-between mt-1.5">
                  <span className="text-[9px] text-muted">$0</span>
                  <span className="text-[9px] text-muted">MAE</span>
                  <span className="text-[9px] text-muted">${maeXMax}</span>
                </div>
              </div>

              {/* Insight */}
              <div className="mt-4 px-3 py-2.5 rounded-xl bg-accent/5 border border-accent/10">
                <p className="text-xs text-muted leading-relaxed">
                  <span className="text-accent font-semibold">Insight:</span>{" "}
                  Most winners had MAE &lt; $150. Trades with MAE &gt; $300 rarely recovered.
                </p>
              </div>
            </div>

            {/* MFE vs Outcome */}
            <div
              className="glass rounded-2xl border border-border/50 p-6"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <h3 className="text-sm font-semibold text-foreground mb-1">
                MFE vs Final P&amp;L
              </h3>
              <p className="text-xs text-muted mb-4">
                Max unrealized profit vs what you actually captured
              </p>

              {/* Scatter grid */}
              <div className="relative">
                {/* Y-axis labels */}
                <div className="absolute -left-1 top-0 bottom-0 flex flex-col justify-between -translate-x-full pr-1.5">
                  <span className="text-[9px] text-muted">+${pnlMax}</span>
                  <span className="text-[9px] text-muted">$0</span>
                  <span className="text-[9px] text-muted">{pnlMin < 0 ? `-$${Math.abs(pnlMin)}` : "$0"}</span>
                </div>

                <div
                  className="grid border border-border/20 rounded-lg overflow-hidden"
                  style={{
                    gridTemplateColumns: `repeat(${scatterGridSize}, 1fr)`,
                    gridTemplateRows: `repeat(${scatterGridSize}, 1fr)`,
                    aspectRatio: "1",
                  }}
                >
                  {Array.from({ length: scatterGridSize * scatterGridSize }).map((_, idx) => {
                    const gx = idx % scatterGridSize;
                    const gy = Math.floor(idx / scatterGridSize);
                    const point = mfeScatterPoints.find(
                      (p) => p.gridX === gx && p.gridY === gy
                    );
                    return (
                      <div
                        key={idx}
                        className="relative border-r border-b border-border/5"
                        style={{ aspectRatio: "1" }}
                      >
                        {point && (
                          <div
                            className={`absolute inset-1 rounded-full ${
                              point.pnl >= 0 ? "bg-win" : "bg-loss"
                            }`}
                            style={{ opacity: 0.8 }}
                            title={`${point.symbol}: MFE=$${point.mfe}, P&L=${point.pnl >= 0 ? "+" : ""}$${point.pnl}`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* X-axis labels */}
                <div className="flex justify-between mt-1.5">
                  <span className="text-[9px] text-muted">$0</span>
                  <span className="text-[9px] text-muted">MFE</span>
                  <span className="text-[9px] text-muted">${mfeXMax}</span>
                </div>
              </div>

              {/* Insight */}
              <div className="mt-4 px-3 py-2.5 rounded-xl bg-accent/5 border border-accent/10">
                <p className="text-xs text-muted leading-relaxed">
                  <span className="text-accent font-semibold">Insight:</span>{" "}
                  You captured {(maeMfeMetrics.avgCapture * 100).toFixed(0)}% of maximum favorable excursion on average. Room to optimize exits.
                </p>
              </div>
            </div>
          </div>

          {/* MAE/MFE Table */}
          <div
            className="glass rounded-2xl border border-border/50 p-6"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="flex items-center gap-2 mb-4">
              <ArrowUpDown size={14} className="text-accent" />
              <h3 className="text-sm font-semibold text-foreground">
                MAE / MFE Detail
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] text-muted uppercase tracking-wider border-b border-border">
                    <th className="text-left py-2 px-3">Date</th>
                    <th className="text-left py-2 px-3">Symbol</th>
                    <th className="text-right py-2 px-3">P&amp;L</th>
                    <th className="text-right py-2 px-3">
                      <button
                        onClick={() =>
                          setMaeTableSortDir((d) => (d === "desc" ? "asc" : "desc"))
                        }
                        className="inline-flex items-center gap-1 hover:text-accent transition-colors"
                      >
                        MAE
                        {maeTableSortDir === "desc" ? (
                          <ChevronDown size={12} />
                        ) : (
                          <ChevronUp size={12} />
                        )}
                      </button>
                    </th>
                    <th className="text-right py-2 px-3">MFE</th>
                    <th className="text-right py-2 px-3">MAE/Risk</th>
                    <th className="text-right py-2 px-3">Capture %</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedMaeTrades.map((t) => {
                    const maeRisk = t.risk > 0 ? t.mae / t.risk : 0;
                    const capture = t.mfe > 0 && t.pnl > 0 ? (t.pnl / t.mfe) * 100 : 0;
                    return (
                      <tr
                        key={t.id}
                        className={`border-b border-border/30 transition-colors ${
                          t.pnl >= 0 ? "hover:bg-win/5" : "hover:bg-loss/5"
                        }`}
                      >
                        <td className="py-2.5 px-3 text-muted text-xs">
                          {t.date}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-foreground text-xs">
                          {t.symbol}
                        </td>
                        <td
                          className={`py-2.5 px-3 text-right text-xs font-semibold ${
                            t.pnl >= 0 ? "text-win" : "text-loss"
                          }`}
                        >
                          {t.pnl >= 0 ? "+" : ""}${t.pnl}
                        </td>
                        <td className="py-2.5 px-3 text-right text-xs text-loss">
                          ${t.mae}
                        </td>
                        <td className="py-2.5 px-3 text-right text-xs text-win">
                          ${t.mfe}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span
                            className={`text-xs font-mono ${
                              maeRisk > 1 ? "text-loss" : "text-muted"
                            }`}
                          >
                            {maeRisk.toFixed(2)}x
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {t.pnl > 0 ? (
                            <span className="text-xs font-mono text-win">
                              {capture.toFixed(0)}%
                            </span>
                          ) : (
                            <span className="text-xs text-muted">--</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

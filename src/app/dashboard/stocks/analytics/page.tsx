"use client";

import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  Legend,
} from "recharts";
import {
  BarChart3,
  TrendingUp,
  PieChart as PieChartIcon,
  Layers,
  ArrowRight,
} from "lucide-react";
import { Header } from "@/components/header";

// ---------------------------------------------------------------------------
// Mock data — Sector Rotation (monthly P&L by sector over 6 months)
// ---------------------------------------------------------------------------

const SECTOR_ROTATION_DATA = [
  { month: "Sep", Technology: 1200, Healthcare: 340, Financials: -180, Energy: 90 },
  { month: "Oct", Technology: -450, Healthcare: 520, Financials: 610, Energy: -120 },
  { month: "Nov", Technology: 2100, Healthcare: -200, Financials: 380, Energy: 250 },
  { month: "Dec", Technology: 800, Healthcare: 670, Financials: -90, Energy: -310 },
  { month: "Jan", Technology: -300, Healthcare: 410, Financials: 900, Energy: 180 },
  { month: "Feb", Technology: 2900, Healthcare: 61, Financials: 217, Energy: -50 },
];

const SECTOR_COLORS: Record<string, string> = {
  Technology: "var(--color-accent)",
  Healthcare: "#06b6d4",
  Financials: "#f59e0b",
  Energy: "#a78bfa",
};

// ---------------------------------------------------------------------------
// Mock data — Session Performance (win rate + avg P&L by session)
// ---------------------------------------------------------------------------

const SESSION_PERFORMANCE = [
  { session: "Pre-Market", winRate: 55, avgPnl: 42.30 },
  { session: "Regular", winRate: 68, avgPnl: 185.60 },
  { session: "After-Hours", winRate: 60, avgPnl: 78.20 },
];

// ---------------------------------------------------------------------------
// Mock data — Win Rate by Sector (horizontal bar)
// ---------------------------------------------------------------------------

const WIN_RATE_BY_SECTOR = [
  { sector: "Technology", winRate: 72, trades: 18 },
  { sector: "Financials", winRate: 80, trades: 10 },
  { sector: "Healthcare", winRate: 67, trades: 6 },
  { sector: "Energy", winRate: 50, trades: 4 },
  { sector: "Consumer Disc.", winRate: 58, trades: 7 },
];

// ---------------------------------------------------------------------------
// Mock data — Options vs Equity stats
// ---------------------------------------------------------------------------

const OPTIONS_STATS = {
  totalPnl: 1940.25,
  trades: 14,
  winRate: 57,
  avgPnl: 138.59,
};

const EQUITY_STATS = {
  totalPnl: 2625.90,
  trades: 32,
  winRate: 72,
  avgPnl: 82.06,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function StockAnalyticsPage() {
  const [showCombined, setShowCombined] = useState(false);

  // Compute sector area keys from data
  const sectorKeys = useMemo(
    () => Object.keys(SECTOR_ROTATION_DATA[0]).filter((k) => k !== "month"),
    []
  );

  return (
    <div className="space-y-6 mx-auto max-w-[1600px]">
      <Header />

      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <BarChart3 size={24} className="text-accent" />
          Stock Analytics
        </h2>
        <p className="text-sm text-muted mt-0.5">
          Performance breakdown across sectors, sessions, and instruments
        </p>
      </div>

      {/* Sector Rotation Chart */}
      <div
        className="glass rounded-2xl border border-border/50 p-6"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={16} className="text-accent" />
          <h3 className="text-sm font-semibold text-foreground">
            Sector Rotation
          </h3>
          <span className="text-[10px] text-muted/50 ml-auto">
            Monthly P&L by sector (last 6 months)
          </span>
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={SECTOR_ROTATION_DATA}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border)"
              strokeOpacity={0.3}
            />
            <XAxis
              dataKey="month"
              tick={{ fill: "var(--color-muted)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "var(--color-muted)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${v}`}
            />
            <Tooltip
              contentStyle={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "0.75rem",
                color: "var(--color-foreground)",
                fontSize: "0.75rem",
              }}
              formatter={(value, name) => [
                `$${Number(value ?? 0).toFixed(2)}`,
                String(name),
              ]}
            />
            <Legend
              wrapperStyle={{ fontSize: "0.75rem", color: "var(--color-muted)" }}
            />
            {sectorKeys.map((key) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stackId="1"
                stroke={SECTOR_COLORS[key] ?? "var(--color-muted)"}
                fill={SECTOR_COLORS[key] ?? "var(--color-muted)"}
                fillOpacity={0.15}
                strokeWidth={2}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Session Performance + Win Rate by Sector */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Session Performance */}
        <div
          className="glass rounded-2xl border border-border/50 p-6"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Layers size={16} className="text-accent" />
            <h3 className="text-sm font-semibold text-foreground">
              Session Performance
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={SESSION_PERFORMANCE} barGap={8}>
              <XAxis
                dataKey="session"
                tick={{ fill: "var(--color-muted)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="left"
                tick={{ fill: "var(--color-muted)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}%`}
                domain={[0, 100]}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fill: "var(--color-muted)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${v}`}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "0.75rem",
                  color: "var(--color-foreground)",
                  fontSize: "0.75rem",
                }}
                formatter={(value, name) => [
                  name === "winRate" ? `${Number(value ?? 0)}%` : `$${Number(value ?? 0).toFixed(2)}`,
                  name === "winRate" ? "Win Rate" : "Avg P&L",
                ]}
              />
              <Legend
                wrapperStyle={{ fontSize: "0.75rem" }}
                formatter={(value) =>
                  value === "winRate" ? "Win Rate" : "Avg P&L"
                }
              />
              <Bar
                yAxisId="left"
                dataKey="winRate"
                fill="var(--color-accent)"
                radius={[6, 6, 0, 0]}
                fillOpacity={0.8}
              />
              <Bar
                yAxisId="right"
                dataKey="avgPnl"
                fill="var(--color-win)"
                radius={[6, 6, 0, 0]}
                fillOpacity={0.8}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Win Rate by Sector — Horizontal Bar */}
        <div
          className="glass rounded-2xl border border-border/50 p-6"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <PieChartIcon size={16} className="text-accent" />
            <h3 className="text-sm font-semibold text-foreground">
              Win Rate by Sector
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={WIN_RATE_BY_SECTOR}
              layout="vertical"
              margin={{ left: 10 }}
            >
              <XAxis
                type="number"
                tick={{ fill: "var(--color-muted)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
              />
              <YAxis
                type="category"
                dataKey="sector"
                tick={{ fill: "var(--color-muted)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={110}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "0.75rem",
                  color: "var(--color-foreground)",
                  fontSize: "0.75rem",
                }}
                formatter={(value, _name, item) => {
                  const trades = (item as { payload?: { trades?: number } })?.payload?.trades ?? 0;
                  return [
                    `${Number(value ?? 0)}% (${trades} trades)`,
                    "Win Rate",
                  ];
                }}
              />
              <Bar dataKey="winRate" radius={[0, 6, 6, 0]}>
                {WIN_RATE_BY_SECTOR.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={
                      entry.winRate >= 70
                        ? "var(--color-win)"
                        : entry.winRate >= 55
                        ? "var(--color-accent)"
                        : "var(--color-loss)"
                    }
                    fillOpacity={0.8}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Options vs Equity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Options Card */}
        <div
          className="glass rounded-2xl border border-border/50 p-6"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-400" />
              <h3 className="text-sm font-semibold text-foreground">Options</h3>
            </div>
            <span className="text-[10px] text-muted/50 uppercase tracking-wider font-semibold">
              {OPTIONS_STATS.trades} trades
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1">
                Total P&L
              </p>
              <p
                className={`text-lg font-bold tabular-nums ${
                  OPTIONS_STATS.totalPnl >= 0 ? "text-win" : "text-loss"
                }`}
              >
                +${OPTIONS_STATS.totalPnl.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1">
                Win Rate
              </p>
              <p
                className={`text-lg font-bold ${
                  OPTIONS_STATS.winRate >= 50 ? "text-win" : "text-loss"
                }`}
              >
                {OPTIONS_STATS.winRate}%
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1">
                Avg P&L
              </p>
              <p
                className={`text-lg font-bold tabular-nums ${
                  OPTIONS_STATS.avgPnl >= 0 ? "text-win" : "text-loss"
                }`}
              >
                +${OPTIONS_STATS.avgPnl.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Equity Card */}
        <div
          className="glass rounded-2xl border border-border/50 p-6"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-accent" />
              <h3 className="text-sm font-semibold text-foreground">Equities</h3>
            </div>
            <span className="text-[10px] text-muted/50 uppercase tracking-wider font-semibold">
              {EQUITY_STATS.trades} trades
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1">
                Total P&L
              </p>
              <p
                className={`text-lg font-bold tabular-nums ${
                  EQUITY_STATS.totalPnl >= 0 ? "text-win" : "text-loss"
                }`}
              >
                +${EQUITY_STATS.totalPnl.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1">
                Win Rate
              </p>
              <p
                className={`text-lg font-bold ${
                  EQUITY_STATS.winRate >= 50 ? "text-win" : "text-loss"
                }`}
              >
                {EQUITY_STATS.winRate}%
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1">
                Avg P&L
              </p>
              <p
                className={`text-lg font-bold tabular-nums ${
                  EQUITY_STATS.avgPnl >= 0 ? "text-win" : "text-loss"
                }`}
              >
                +${EQUITY_STATS.avgPnl.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Combined Portfolio Toggle */}
      <div
        className="glass rounded-2xl border border-border/50 p-6"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowRight size={16} className="text-accent" />
            <h3 className="text-sm font-semibold text-foreground">
              Combined Portfolio View
            </h3>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-xs text-muted">Show crypto + stocks</span>
            <div className="relative">
              <input
                type="checkbox"
                checked={showCombined}
                onChange={(e) => setShowCombined(e.target.checked)}
                className="sr-only"
              />
              <div
                className={`w-10 h-5 rounded-full transition-all duration-200 ${
                  showCombined ? "bg-accent" : "bg-border"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 mt-0.5 ${
                    showCombined ? "translate-x-5 ml-0.5" : "translate-x-0.5"
                  }`}
                />
              </div>
            </div>
          </label>
        </div>

        {showCombined ? (
          <div className="mt-6 flex flex-col items-center justify-center py-12 border border-dashed border-border/50 rounded-xl">
            <p className="text-muted text-sm font-medium">
              Combined view coming soon
            </p>
            <p className="text-muted/50 text-xs mt-1">
              This will show a unified equity curve across crypto and stock
              positions
            </p>
          </div>
        ) : (
          <p className="text-xs text-muted/50 mt-2">
            Toggle to see a unified equity curve combining all crypto and stock
            trades
          </p>
        )}
      </div>
    </div>
  );
}

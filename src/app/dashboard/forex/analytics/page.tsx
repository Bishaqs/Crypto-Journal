"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";
import {
  BarChart3,
  TrendingUp,
  Layers,
} from "lucide-react";
import { Header } from "@/components/header";
import { InfoTooltip } from "@/components/ui/info-tooltip";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const SESSION_PERFORMANCE = [
  { session: "London", winRate: 72, avgPnl: 285.40, trades: 18 },
  { session: "New York", winRate: 65, avgPnl: 142.80, trades: 14 },
  { session: "Tokyo", winRate: 50, avgPnl: -45.20, trades: 8 },
  { session: "Sydney", winRate: 60, avgPnl: 88.50, trades: 5 },
  { session: "Overlap", winRate: 78, avgPnl: 320.10, trades: 6 },
];

const PAIR_CATEGORY_STATS = [
  { category: "Major", pnl: 8240, trades: 28, winRate: 68 },
  { category: "Minor", pnl: 3150, trades: 12, winRate: 58 },
  { category: "Exotic", pnl: 1820, trades: 4, winRate: 50 },
];

const PIP_ANALYSIS = [
  { pair: "EUR/USD", avgPips: 32, trades: 12 },
  { pair: "GBP/USD", avgPips: 48, trades: 8 },
  { pair: "USD/JPY", avgPips: -15, trades: 6 },
  { pair: "EUR/GBP", avgPips: 22, trades: 5 },
  { pair: "GBP/JPY", avgPips: 55, trades: 4 },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ForexAnalyticsPage() {
  return (
    <div className="space-y-6 mx-auto max-w-[1600px]">
      <Header />

      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <BarChart3 size={24} className="text-accent" />
          Forex Analytics
          <InfoTooltip text="Visual analytics for forex trading — sessions, pair categories, and pip analysis" />
        </h2>
        <p className="text-sm text-muted mt-0.5">
          Performance breakdown across sessions, pair categories, and currency pairs
        </p>
      </div>

      {/* Session Performance */}
      <div
        className="glass rounded-2xl border border-border/50 p-6"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={16} className="text-accent" />
          <h3 className="text-sm font-semibold text-foreground">
            Session Performance
          </h3>
          <span className="text-[10px] text-muted ml-auto">
            Win rate and avg P&L by trading session
          </span>
        </div>
        <ResponsiveContainer width="100%" height={300}>
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
              formatter={(value) => (value === "winRate" ? "Win Rate" : "Avg P&L")}
            />
            <Bar yAxisId="left" dataKey="winRate" fill="var(--color-accent)" radius={[6, 6, 0, 0]} fillOpacity={0.8} />
            <Bar yAxisId="right" dataKey="avgPnl" fill="var(--color-win)" radius={[6, 6, 0, 0]} fillOpacity={0.8} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pair Category + Pip Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pair Category Stats */}
        <div
          className="glass rounded-2xl border border-border/50 p-6"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Layers size={16} className="text-accent" />
            <h3 className="text-sm font-semibold text-foreground">
              Pair Category Performance
            </h3>
          </div>
          <div className="space-y-4">
            {PAIR_CATEGORY_STATS.map((stat) => (
              <div key={stat.category} className="flex items-center justify-between py-3 px-4 rounded-xl bg-surface/50 border border-border/30">
                <div>
                  <span className="font-semibold text-foreground text-sm">{stat.category}</span>
                  <span className="text-[10px] text-muted ml-2">{stat.trades} trades</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-xs font-semibold ${stat.winRate >= 50 ? "text-win" : "text-loss"}`}>
                    {stat.winRate}% WR
                  </span>
                  <span className={`text-sm font-bold tabular-nums ${stat.pnl >= 0 ? "text-win" : "text-loss"}`}>
                    +${stat.pnl.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pip Analysis */}
        <div
          className="glass rounded-2xl border border-border/50 p-6"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={16} className="text-accent" />
            <h3 className="text-sm font-semibold text-foreground">
              Average Pips by Pair
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={PIP_ANALYSIS} layout="vertical" margin={{ left: 10 }}>
              <XAxis
                type="number"
                tick={{ fill: "var(--color-muted)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="pair"
                tick={{ fill: "var(--color-muted)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={80}
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
                  return [`${Number(value ?? 0)} pips (${trades} trades)`, "Avg Pips"];
                }}
              />
              <Bar dataKey="avgPips" radius={[0, 6, 6, 0]}>
                {PIP_ANALYSIS.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.avgPips >= 0 ? "var(--color-win)" : "var(--color-loss)"}
                    fillOpacity={0.8}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

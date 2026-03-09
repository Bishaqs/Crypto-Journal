"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
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

const CATEGORY_PERFORMANCE = [
  { category: "Metals", pnl: 11018, trades: 12, winRate: 75 },
  { category: "Energy", pnl: 20207, trades: 18, winRate: 67 },
  { category: "Grains", pnl: -1200, trades: 8, winRate: 38 },
  { category: "Softs", pnl: -2333, trades: 4, winRate: 25 },
  { category: "Livestock", pnl: 1830, trades: 3, winRate: 67 },
];

const CONTRACT_TYPE_STATS = [
  { type: "Spot", pnl: 2400, trades: 5, winRate: 60 },
  { type: "Futures", pnl: 26522, trades: 35, winRate: 63 },
  { type: "Options", pnl: 1600, trades: 5, winRate: 40 },
];

const EXCHANGE_PERFORMANCE = [
  { exchange: "COMEX", pnl: 11018, trades: 10 },
  { exchange: "NYMEX", pnl: 20207, trades: 14 },
  { exchange: "CBOT", pnl: -1581, trades: 8 },
  { exchange: "ICE", pnl: -2333, trades: 4 },
  { exchange: "CME", pnl: 1830, trades: 3 },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CommodityAnalyticsPage() {
  return (
    <div className="space-y-6 mx-auto max-w-[1600px]">
      <Header />

      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <BarChart3 size={24} className="text-accent" />
          Commodity Analytics
          <InfoTooltip text="Visual analytics for commodity trading — category rotation, contract types, and exchange performance" />
        </h2>
        <p className="text-sm text-muted mt-0.5">
          Performance breakdown across categories, contract types, and exchanges
        </p>
      </div>

      {/* Category Performance */}
      <div
        className="glass rounded-2xl border border-border/50 p-6"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={16} className="text-accent" />
          <h3 className="text-sm font-semibold text-foreground">
            Category Performance
          </h3>
          <span className="text-[10px] text-muted ml-auto">
            P&L breakdown by commodity category
          </span>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={CATEGORY_PERFORMANCE}>
            <XAxis
              dataKey="category"
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
              formatter={(value, _name, item) => {
                const winRate = (item as { payload?: { winRate?: number } })?.payload?.winRate ?? 0;
                return [`$${Number(value ?? 0).toFixed(2)} (${winRate}% WR)`, "P&L"];
              }}
            />
            <Bar dataKey="pnl" radius={[8, 8, 0, 0]}>
              {CATEGORY_PERFORMANCE.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.pnl >= 0 ? "var(--color-win)" : "var(--color-loss)"}
                  fillOpacity={0.8}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Contract Type + Exchange */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contract Type Stats */}
        <div
          className="glass rounded-2xl border border-border/50 p-6"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Layers size={16} className="text-accent" />
            <h3 className="text-sm font-semibold text-foreground">
              Contract Type Performance
            </h3>
          </div>
          <div className="space-y-4">
            {CONTRACT_TYPE_STATS.map((stat) => (
              <div key={stat.type} className="flex items-center justify-between py-3 px-4 rounded-xl bg-surface/50 border border-border/30">
                <div>
                  <span className="font-semibold text-foreground text-sm">{stat.type}</span>
                  <span className="text-[10px] text-muted ml-2">{stat.trades} trades</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-xs font-semibold ${stat.winRate >= 50 ? "text-win" : "text-loss"}`}>
                    {stat.winRate}% WR
                  </span>
                  <span className={`text-sm font-bold tabular-nums ${stat.pnl >= 0 ? "text-win" : "text-loss"}`}>
                    {stat.pnl >= 0 ? "+" : "-"}${Math.abs(stat.pnl).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Exchange Performance */}
        <div
          className="glass rounded-2xl border border-border/50 p-6"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={16} className="text-accent" />
            <h3 className="text-sm font-semibold text-foreground">
              Exchange Performance
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={EXCHANGE_PERFORMANCE} layout="vertical" margin={{ left: 10 }}>
              <XAxis
                type="number"
                tick={{ fill: "var(--color-muted)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${v}`}
              />
              <YAxis
                type="category"
                dataKey="exchange"
                tick={{ fill: "var(--color-muted)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={70}
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
                  return [`$${Number(value ?? 0).toFixed(2)} (${trades} trades)`, "P&L"];
                }}
              />
              <Bar dataKey="pnl" radius={[0, 6, 6, 0]}>
                {EXCHANGE_PERFORMANCE.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.pnl >= 0 ? "var(--color-win)" : "var(--color-loss)"}
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

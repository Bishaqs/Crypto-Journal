"use client";

import { DashboardStats } from "@/lib/types";
import {
  TrendingUp,
  DollarSign,
  Activity,
  TrendingDown,
} from "lucide-react";
import { InfoTooltip } from "@/components/ui/info-tooltip";

function StatCard({
  label,
  value,
  subLabel,
  icon: Icon,
  valueColor = "text-foreground",
  tooltip,
}: {
  label: string;
  value: string;
  subLabel?: string;
  icon: React.ElementType;
  valueColor?: string;
  tooltip?: string;
}) {
  return (
    <div className="relative glass rounded-2xl border border-border/50 p-5 overflow-hidden group hover:border-accent/30 hover:shadow-[0_0_20px_rgba(0,180,216,0.15)] hover:-translate-y-0.5 transition-all duration-300" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="absolute inset-0 bg-gradient-to-br from-accent-glow/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] text-muted font-medium uppercase tracking-widest flex items-center gap-1">{label}{tooltip && <InfoTooltip text={tooltip} size={12} />}</span>
          <div className="p-1.5 rounded-lg bg-accent/8">
            <Icon size={14} className="text-accent" />
          </div>
        </div>
        <p className={`text-2xl font-bold tracking-tight ${valueColor}`}>{value}</p>
        {subLabel && <p className="text-[11px] text-muted mt-1">{subLabel}</p>}
      </div>
    </div>
  );
}

// Merged Win Rate + Record card with a visual bar
function WinRateCard({ stats }: { stats: DashboardStats }) {
  const winPct = stats.totalTrades > 0 ? (stats.wins / stats.totalTrades) * 100 : 0;
  const lossPct = stats.totalTrades > 0 ? (stats.losses / stats.totalTrades) * 100 : 0;

  return (
    <div className="relative glass rounded-2xl border border-border/50 p-5 overflow-hidden group hover:border-accent/30 hover:shadow-[0_0_20px_rgba(0,180,216,0.15)] hover:-translate-y-0.5 transition-all duration-300 col-span-2" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="absolute inset-0 bg-gradient-to-br from-accent-glow/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] text-muted font-medium uppercase tracking-widest flex items-center gap-1">
            Win Rate <InfoTooltip text="Percentage of trades that were profitable" size={12} />
          </span>
          <span className="text-[11px] text-muted">
            {stats.totalTrades} trades
          </span>
        </div>

        {/* Main stats row */}
        <div className="flex items-end gap-4 mb-3">
          <span className={`text-3xl font-bold tracking-tight ${winPct >= 50 ? "text-win" : "text-loss"}`}>
            {winPct.toFixed(1)}%
          </span>
          <div className="flex items-center gap-3 pb-1">
            <span className="text-sm font-semibold text-win">{stats.wins}W</span>
            <span className="text-sm text-muted">/</span>
            <span className="text-sm font-semibold text-loss">{stats.losses}L</span>
            {stats.breakeven > 0 && (
              <>
                <span className="text-sm text-muted">/</span>
                <span className="text-sm font-semibold text-muted">{stats.breakeven}BE</span>
              </>
            )}
          </div>
        </div>

        {/* Visual bar chart */}
        <div className="flex h-3 rounded-full overflow-hidden bg-background gap-0.5">
          {stats.totalTrades > 0 ? (
            <>
              <div
                className="bg-win rounded-l-full transition-all duration-500"
                style={{ width: `${winPct}%` }}
              />
              {stats.breakeven > 0 && (
                <div
                  className="bg-muted/30"
                  style={{ width: `${(stats.breakeven / stats.totalTrades) * 100}%` }}
                />
              )}
              <div
                className="bg-loss rounded-r-full transition-all duration-500"
                style={{ width: `${lossPct}%` }}
              />
            </>
          ) : (
            <div className="bg-muted/20 w-full rounded-full" />
          )}
        </div>
      </div>
    </div>
  );
}

export function StatsCards({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <WinRateCard stats={stats} />
      <StatCard
        label="Avg Return"
        value={`${stats.avgTradePnl >= 0 ? "+" : ""}$${stats.avgTradePnl.toFixed(2)}`}
        subLabel="per position"
        icon={Activity}
        valueColor={stats.avgTradePnl >= 0 ? "text-win" : "text-loss"}
      />
      <StatCard
        label="Profit Factor"
        value={stats.profitFactor.toFixed(2)}
        subLabel={stats.profitFactor >= 1 ? "edge positive" : "negative edge"}
        icon={TrendingUp}
        valueColor={stats.profitFactor >= 1 ? "text-win" : "text-loss"}
        tooltip="Gross wins divided by gross losses — above 1.0 means net positive"
      />
      <StatCard
        label="Realized"
        value={`${stats.closedPnl >= 0 ? "+" : ""}$${stats.closedPnl.toFixed(2)}`}
        subLabel="closed positions"
        icon={DollarSign}
        valueColor={stats.closedPnl >= 0 ? "text-win" : "text-loss"}
      />
      <StatCard
        label="Exposure"
        value={`${stats.unrealizedPnl >= 0 ? "+" : ""}$${stats.unrealizedPnl.toFixed(2)}`}
        subLabel="open risk"
        icon={TrendingDown}
        valueColor={stats.unrealizedPnl >= 0 ? "text-win" : "text-loss"}
      />
    </div>
  );
}

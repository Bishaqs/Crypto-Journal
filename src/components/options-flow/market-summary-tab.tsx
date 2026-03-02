"use client";

import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { OptionsFlowRow, FlowSummary } from "./options-flow-types";
import { formatPremium } from "./options-flow-utils";

interface MarketSummaryTabProps {
  flows: OptionsFlowRow[];
  summary: FlowSummary;
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

function StatBlock({ label, value, color = "text-foreground" }: { label: string; value: string; color?: string }) {
  return (
    <div className="glass rounded-xl border border-border/50 p-4 hover:border-accent/20 transition-all duration-300" style={{ boxShadow: "var(--shadow-card)" }}>
      <p className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}

function SentimentBadge({ sentiment }: { sentiment: "bullish" | "bearish" | "neutral" }) {
  const cls =
    sentiment === "bullish"
      ? "bg-win/10 text-win border-win/20"
      : sentiment === "bearish"
      ? "bg-loss/10 text-loss border-loss/20"
      : "bg-surface text-muted border-border/50";
  return (
    <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${cls}`}>
      {sentiment}
    </span>
  );
}

export default function MarketSummaryTab({ flows, summary, colors }: MarketSummaryTabProps) {
  const avgPremium = summary.totalFlows > 0 ? summary.totalPremium / summary.totalFlows : 0;
  const bullishRatio = summary.totalFlows > 0
    ? ((summary.sentiment.bullish / summary.totalFlows) * 100).toFixed(0)
    : "0";

  // Sentiment pie data
  const sentimentData = [
    { name: "Bullish", value: summary.sentiment.bullish },
    { name: "Bearish", value: summary.sentiment.bearish },
    { name: "Neutral", value: summary.sentiment.neutral },
  ];
  const sentimentColors = [colors.win, colors.loss, "#6b7280"];

  // Premium by type
  const premiumByType = [
    { name: "Calls", premium: summary.callPremium },
    { name: "Puts", premium: summary.putPremium },
  ];

  // Premium by expiry
  const premiumByExpiry = useMemo(() => {
    const map = new Map<string, { calls: number; puts: number }>();
    for (const f of flows) {
      if (!map.has(f.expiry)) map.set(f.expiry, { calls: 0, puts: 0 });
      const entry = map.get(f.expiry)!;
      if (f.type === "C") entry.calls += f.premium;
      else entry.puts += f.premium;
    }
    return Array.from(map.entries())
      .map(([expiry, { calls, puts }]) => ({ expiry, calls, puts, total: calls + puts }))
      .sort((a, b) => a.expiry.localeCompare(b.expiry))
      .slice(0, 12);
  }, [flows]);

  // Top 10 largest premium flows
  const top10 = useMemo(() => {
    return [...flows].sort((a, b) => b.premium - a.premium).slice(0, 10);
  }, [flows]);

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatBlock label="Total Premium" value={formatPremium(summary.totalPremium)} color="text-accent" />
        <StatBlock label="Bullish Ratio" value={`${bullishRatio}%`} color="text-win" />
        <StatBlock
          label="Call/Put Volume"
          value={`${(summary.callVolume / 1000).toFixed(0)}K / ${(summary.putVolume / 1000).toFixed(0)}K`}
          color="text-foreground"
        />
        <StatBlock label="Avg Premium" value={formatPremium(avgPremium)} color="text-foreground" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sentiment donut */}
        <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
            Sentiment Breakdown
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={sentimentData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                innerRadius={50}
                paddingAngle={2}
              >
                {sentimentData.map((_, i) => (
                  <Cell key={i} fill={sentimentColors[i]} fillOpacity={0.85} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: colors.tooltipBg,
                  backdropFilter: "blur(16px)",
                  border: colors.tooltipBorder,
                  borderRadius: "12px",
                  fontSize: "12px",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                }}
                formatter={(value) => [`${Number(value ?? 0)} flows`, ""]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {sentimentData.map((s, i) => (
              <div key={s.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sentimentColors[i] }} />
                <span className="text-[10px] text-muted">{s.name}: {s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Premium by type */}
        <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
            Premium by Type
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={premiumByType}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: colors.tick }} tickLine={false} axisLine={{ stroke: colors.grid }} />
              <YAxis tick={{ fontSize: 10, fill: colors.tick }} tickFormatter={(v) => formatPremium(Number(v))} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: colors.tooltipBg,
                  backdropFilter: "blur(16px)",
                  border: colors.tooltipBorder,
                  borderRadius: "12px",
                  fontSize: "12px",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                }}
                formatter={(value) => [formatPremium(Number(value ?? 0)), "Premium"]}
              />
              <Bar dataKey="premium" radius={[6, 6, 0, 0]} maxBarSize={80}>
                <Cell fill={colors.win} fillOpacity={0.85} />
                <Cell fill={colors.loss} fillOpacity={0.85} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Premium by expiry */}
      <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
          Premium by Expiry Date
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={premiumByExpiry}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
            <XAxis
              dataKey="expiry"
              tick={{ fontSize: 9, fill: colors.tick }}
              tickLine={false}
              axisLine={{ stroke: colors.grid }}
              angle={-30}
              textAnchor="end"
              height={50}
            />
            <YAxis tick={{ fontSize: 10, fill: colors.tick }} tickFormatter={(v) => formatPremium(Number(v))} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: colors.tooltipBg,
                backdropFilter: "blur(16px)",
                border: colors.tooltipBorder,
                borderRadius: "12px",
                fontSize: "12px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              }}
              formatter={(value, name) => [formatPremium(Number(value ?? 0)), String(name) === "calls" ? "Calls" : "Puts"]}
            />
            <Bar dataKey="calls" stackId="a" fill={colors.win} fillOpacity={0.7} radius={[0, 0, 0, 0]} />
            <Bar dataKey="puts" stackId="a" fill={colors.loss} fillOpacity={0.7} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex justify-center gap-4 mt-2">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors.win }} />
            <span className="text-[10px] text-muted">Calls</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors.loss }} />
            <span className="text-[10px] text-muted">Puts</span>
          </div>
        </div>
      </div>

      {/* Top 10 largest flows */}
      <div className="glass rounded-2xl border border-border/50 p-5 overflow-x-auto" style={{ boxShadow: "var(--shadow-card)" }}>
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
          Top 10 Largest Premium Flows
        </h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50">
              <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold w-8">#</th>
              <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold">Symbol</th>
              <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold">Type</th>
              <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold">Strike</th>
              <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold">Expiry</th>
              <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold">Premium</th>
              <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold">Sentiment</th>
            </tr>
          </thead>
          <tbody>
            {top10.map((f, i) => (
              <tr key={`top-${i}`} className="border-b border-border/20 hover:bg-surface-hover/50 transition-colors">
                <td className="px-3 py-2.5 text-xs text-muted/40 font-bold">{i + 1}</td>
                <td className="px-3 py-2.5 text-xs font-bold text-accent">{f.symbol}</td>
                <td className="px-3 py-2.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    f.type === "C" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                  }`}>
                    {f.type === "C" ? "CALL" : "PUT"}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-xs font-semibold text-foreground tabular-nums">${f.strike.toLocaleString()}</td>
                <td className="px-3 py-2.5 text-xs text-muted tabular-nums">{f.expiry}</td>
                <td className="px-3 py-2.5 text-xs font-bold text-foreground tabular-nums">{formatPremium(f.premium)}</td>
                <td className="px-3 py-2.5"><SentimentBadge sentiment={f.sentiment} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

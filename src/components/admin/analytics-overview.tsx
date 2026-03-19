"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/lib/theme-context";
import { getChartColors } from "@/lib/chart-colors";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { TrendingUp, Activity, BarChart3, PieChart as PieIcon } from "lucide-react";

type OverviewData = {
  userGrowth: { date: string; count: number }[];
  dau: { date: string; count: number }[];
  dauToday: number;
  wau: number;
  engagement: Record<string, unknown>[];
  tierDistribution: { tier: string; count: number }[];
};

const ENGAGEMENT_SOURCES = [
  { key: "trade_logged", label: "Trades", color: "#8B5CF6" },
  { key: "journal_entry", label: "Journal", color: "#10b981" },
  { key: "checkin", label: "Check-ins", color: "#f59e0b" },
  { key: "behavioral_log", label: "Behavior", color: "#ef4444" },
  { key: "challenge_completed", label: "Challenges", color: "#06b6d4" },
  { key: "trade_with_notes", label: "Trades+Notes", color: "#a78bfa" },
];

const TIER_COLORS: Record<string, string> = {
  free: "#6b7280",
  pro: "#f59e0b",
  max: "#8B5CF6",
};

export function AnalyticsOverview() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();
  const colors = getChartColors(theme);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/admin/analytics/overview");
        if (!res.ok) throw new Error("Failed to fetch analytics");
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const tooltipStyle = {
    background: colors.tooltipBg,
    backdropFilter: "blur(16px)",
    border: colors.tooltipBorder,
    borderRadius: "12px",
    fontSize: "12px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-surface rounded-2xl border border-border p-5 h-64 animate-pulse" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="h-4 w-32 bg-border/50 rounded mb-4" />
            <div className="h-full bg-border/20 rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-surface rounded-2xl border border-loss/20 p-5 text-sm text-loss">
        Failed to load analytics: {error ?? "No data"}
      </div>
    );
  }

  // Build cumulative growth data
  let cumulative = 0;
  const cumulativeGrowth = data.userGrowth.map((d) => {
    cumulative += d.count;
    return { date: d.date, signups: d.count, total: cumulative };
  });

  const totalUsers = data.tierDistribution.reduce((s, t) => s + t.count, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Activity size={18} className="text-accent" />
        <h2 className="text-lg font-semibold text-foreground">Analytics</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* User Growth */}
        <div className="bg-surface rounded-2xl border border-border p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={14} className="text-accent" />
            <h3 className="text-sm font-medium text-muted uppercase tracking-wider">User Growth (90d)</h3>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cumulativeGrowth}>
                <defs>
                  <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors.accent} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={colors.accent} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: colors.tick, fontSize: 10 }}
                  tickFormatter={(d) => new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fill: colors.tick, fontSize: 10 }} width={35} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelFormatter={(d) => new Date(d).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any, name: any) => [value ?? 0, name === "total" ? "Total Users" : "New Signups"]}
                />
                <Area type="monotone" dataKey="total" stroke={colors.accent} fill="url(#growthGradient)" strokeWidth={2} />
                <Area type="monotone" dataKey="signups" stroke={colors.win} fill="none" strokeWidth={1} strokeDasharray="4 4" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Active Users */}
        <div className="bg-surface rounded-2xl border border-border p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-accent" />
              <h3 className="text-sm font-medium text-muted uppercase tracking-wider">Daily Active Users (30d)</h3>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-muted">Today: <span className="text-foreground font-semibold">{data.dauToday}</span></span>
              <span className="text-muted">WAU: <span className="text-foreground font-semibold">{data.wau}</span></span>
            </div>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.dau}>
                <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: colors.tick, fontSize: 10 }}
                  tickFormatter={(d) => new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fill: colors.tick, fontSize: 10 }} width={25} allowDecimals={false} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelFormatter={(d) => new Date(d).toLocaleDateString(undefined, { weekday: "short", month: "long", day: "numeric" })}
                  formatter={(value: number | undefined) => [value ?? 0, "Active Users"]}
                />
                <Line type="monotone" dataKey="count" stroke={colors.accent} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Engagement Breakdown */}
        <div className="bg-surface rounded-2xl border border-border p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={14} className="text-accent" />
            <h3 className="text-sm font-medium text-muted uppercase tracking-wider">Engagement (30d)</h3>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.engagement}>
                <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: colors.tick, fontSize: 10 }}
                  tickFormatter={(d) => new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fill: colors.tick, fontSize: 10 }} width={25} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                {ENGAGEMENT_SOURCES.map((s) => (
                  <Bar key={s.key} dataKey={s.key} stackId="engagement" fill={s.color} name={s.label} radius={0} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 mt-3">
            {ENGAGEMENT_SOURCES.map((s) => (
              <div key={s.key} className="flex items-center gap-1.5 text-[10px] text-muted">
                <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                {s.label}
              </div>
            ))}
          </div>
        </div>

        {/* Tier Distribution */}
        <div className="bg-surface rounded-2xl border border-border p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center gap-2 mb-4">
            <PieIcon size={14} className="text-accent" />
            <h3 className="text-sm font-medium text-muted uppercase tracking-wider">Tier Distribution</h3>
          </div>
          <div className="flex items-center gap-6">
            <div className="h-48 w-48 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.tierDistribution}
                    dataKey="count"
                    nameKey="tier"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    {data.tierDistribution.map((entry) => (
                      <Cell key={entry.tier} fill={TIER_COLORS[entry.tier] ?? "#6b7280"} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {data.tierDistribution.map((t) => (
                <div key={t.tier} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ background: TIER_COLORS[t.tier] ?? "#6b7280" }} />
                  <div>
                    <span className="text-sm font-medium text-foreground capitalize">{t.tier}</span>
                    <span className="text-xs text-muted ml-2">
                      {t.count} ({totalUsers > 0 ? Math.round((t.count / totalUsers) * 100) : 0}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

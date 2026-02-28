"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trade } from "@/lib/types";
import { DEMO_TRADES } from "@/lib/demo-data";
import { DemoBanner } from "@/components/demo-banner";
import { useDateRange } from "@/lib/date-range-context";
import { useTheme } from "@/lib/theme-context";
import { getChartColors } from "@/lib/chart-colors";
import { calculateTradePnl } from "@/lib/calculations";
import { StatBlock } from "@/components/ui/stat-block";
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, LineChart, Line,
} from "recharts";
import { Crosshair, TrendingUp, Hash, Gauge, Trophy, BarChart3 } from "lucide-react";

interface SetupStats {
  setup: string;
  count: number;
  wins: number;
  winRate: number;
  totalPnl: number;
  avgPnl: number;
}

const COLORS = ["#8B5CF6", "#0ea5e9", "#22c55e", "#f97316", "#ef4444", "#ec4899", "#f59e0b", "#6366f1", "#14b8a6", "#a78bfa"];

export default function TechnicalAnalysisPage() {
  const supabase = createClient();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingDemo, setUsingDemo] = useState(false);
  const { filterTrades } = useDateRange();
  const { theme } = useTheme();
  const colors = getChartColors(theme);

  const fetchTrades = useCallback(async () => {
    const { data } = await supabase.from("trades").select("*").order("open_timestamp", { ascending: false });
    const dbTrades = (data as Trade[]) ?? [];
    if (dbTrades.length === 0) { setTrades(DEMO_TRADES); setUsingDemo(true); } else { setTrades(dbTrades); }
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchTrades(); }, [fetchTrades]);

  const filtered = useMemo(() => filterTrades(trades), [trades, filterTrades]);
  const closedTrades = useMemo(() => filtered.filter(t => t.exit_price !== null), [filtered]);

  const setupStats = useMemo((): SetupStats[] => {
    const map = new Map<string, { count: number; wins: number; pnl: number }>();
    for (const t of closedTrades) {
      const setup = t.setup_type || "Untagged";
      const pnl = t.pnl ?? calculateTradePnl(t) ?? 0;
      const existing = map.get(setup) ?? { count: 0, wins: 0, pnl: 0 };
      map.set(setup, {
        count: existing.count + 1,
        wins: existing.wins + (pnl > 0 ? 1 : 0),
        pnl: existing.pnl + pnl,
      });
    }
    return Array.from(map.entries())
      .map(([setup, d]) => ({
        setup,
        count: d.count,
        wins: d.wins,
        winRate: d.count > 0 ? (d.wins / d.count) * 100 : 0,
        totalPnl: d.pnl,
        avgPnl: d.count > 0 ? d.pnl / d.count : 0,
      }))
      .sort((a, b) => b.totalPnl - a.totalPnl);
  }, [closedTrades]);

  const taggedSetups = useMemo(() => setupStats.filter(s => s.setup !== "Untagged"), [setupStats]);
  const totalTagged = useMemo(() => taggedSetups.reduce((s, d) => s + d.count, 0), [taggedSetups]);
  const bestSetup = useMemo(() => taggedSetups.length > 0 ? taggedSetups[0] : null, [taggedSetups]);
  const highestWrSetup = useMemo(() => {
    const candidates = taggedSetups.filter(s => s.count >= 3);
    return candidates.length > 0 ? candidates.reduce((a, b) => a.winRate > b.winRate ? a : b) : null;
  }, [taggedSetups]);

  // Rolling setup performance over time
  const setupTrend = useMemo(() => {
    const sorted = [...closedTrades]
      .filter(t => t.close_timestamp && t.setup_type)
      .sort((a, b) => a.close_timestamp!.localeCompare(b.close_timestamp!));
    const window = 5;
    if (sorted.length < window) return [];
    const points: { date: string; winRate: number; avgPnl: number }[] = [];
    for (let i = window - 1; i < sorted.length; i++) {
      const slice = sorted.slice(i - window + 1, i + 1);
      const wins = slice.filter(t => (t.pnl ?? 0) > 0).length;
      const avgPnl = slice.reduce((s, t) => s + (t.pnl ?? 0), 0) / window;
      points.push({
        date: sorted[i].close_timestamp!.split("T")[0],
        winRate: parseFloat(((wins / window) * 100).toFixed(1)),
        avgPnl: parseFloat(avgPnl.toFixed(2)),
      });
    }
    return points;
  }, [closedTrades]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>;

  const tooltipStyle = { background: colors.tooltipBg, backdropFilter: "blur(16px)", border: colors.tooltipBorder, borderRadius: "12px", fontSize: "12px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {usingDemo && <DemoBanner />}
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <Crosshair size={24} className="text-accent" />Technical Analysis
        </h1>
        <p className="text-sm text-muted mt-0.5">Performance breakdown by setup type and trading strategy</p>
      </div>

      {/* Stat blocks */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBlock label="Setups Tracked" value={String(taggedSetups.length)} icon={Hash} />
        <StatBlock label="Tagged Trades" value={String(totalTagged)} sub={`of ${closedTrades.length} total`} icon={BarChart3} />
        <StatBlock label="Most Profitable" value={bestSetup?.setup ?? "—"} sub={bestSetup ? `$${bestSetup.totalPnl.toFixed(0)}` : ""} icon={Trophy} color="text-win" />
        <StatBlock label="Highest Win Rate" value={highestWrSetup?.setup ?? "—"} sub={highestWrSetup ? `${highestWrSetup.winRate.toFixed(0)}% (${highestWrSetup.count} trades)` : ""} icon={Gauge} color="text-accent" />
      </div>

      {/* Charts row */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* PnL by setup */}
        {taggedSetups.length > 0 && (
          <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
            <h3 className="text-sm font-semibold text-foreground mb-4">PnL by Setup Type</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={taggedSetups} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                <XAxis type="number" tick={{ fill: colors.tick, fontSize: 10 }} tickFormatter={(v) => `$${v}`} />
                <YAxis type="category" dataKey="setup" tick={{ fill: colors.tick, fontSize: 10 }} width={100} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number | undefined) => [`$${(v ?? 0).toFixed(2)}`, "Total PnL"]} />
                <Bar dataKey="totalPnl" radius={[0, 4, 4, 0]}>
                  {taggedSetups.map((d, i) => <Cell key={i} fill={d.totalPnl >= 0 ? colors.win : colors.loss} fillOpacity={0.85} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Setup frequency pie */}
        {taggedSetups.length > 0 && (
          <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
            <h3 className="text-sm font-semibold text-foreground mb-4">Setup Frequency</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={taggedSetups} dataKey="count" nameKey="setup" cx="50%" cy="50%" outerRadius={100} innerRadius={50} paddingAngle={2}
                  label={(props: { name?: string; value?: number }) => props.name ?? ""}>
                  {taggedSetups.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number | undefined) => [v ?? 0, "Trades"]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Win rate by setup */}
      {taggedSetups.length > 0 && (
        <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <h3 className="text-sm font-semibold text-foreground mb-4">Win Rate by Setup Type</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={taggedSetups}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
              <XAxis dataKey="setup" tick={{ fill: colors.tick, fontSize: 10 }} />
              <YAxis tick={{ fill: colors.tick, fontSize: 10 }} domain={[0, 100]} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number | undefined) => [`${(v ?? 0).toFixed(1)}%`, "Win Rate"]} />
              <Bar dataKey="winRate" radius={[4, 4, 0, 0]}>
                {taggedSetups.map((d, i) => <Cell key={i} fill={d.winRate >= 50 ? colors.win : colors.loss} fillOpacity={0.85} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Setup trend over time */}
      {setupTrend.length > 0 && (
        <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <h3 className="text-sm font-semibold text-foreground mb-4">Setup Performance Trend (rolling 5-trade)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={setupTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
              <XAxis dataKey="date" tick={{ fill: colors.tick, fontSize: 10 }} tickFormatter={(v: string) => v.slice(5)} />
              <YAxis tick={{ fill: colors.tick, fontSize: 10 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="avgPnl" stroke={colors.accent} strokeWidth={2} dot={false} name="Avg PnL ($)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Setup details table */}
      {setupStats.length > 0 && (
        <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <h3 className="text-sm font-semibold text-foreground mb-4">Setup Details</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-muted text-left">
                  <th className="py-2 px-3 font-medium">Setup</th>
                  <th className="py-2 px-3 font-medium text-right">Trades</th>
                  <th className="py-2 px-3 font-medium text-right">Win Rate</th>
                  <th className="py-2 px-3 font-medium text-right">Avg PnL</th>
                  <th className="py-2 px-3 font-medium text-right">Total PnL</th>
                </tr>
              </thead>
              <tbody>
                {setupStats.map(s => (
                  <tr key={s.setup} className="border-b border-border/30 hover:bg-surface-hover transition-colors">
                    <td className="py-2.5 px-3 font-medium text-foreground">{s.setup}</td>
                    <td className="py-2.5 px-3 text-right text-muted">{s.count}</td>
                    <td className={`py-2.5 px-3 text-right font-medium ${s.winRate >= 50 ? "text-win" : "text-loss"}`}>{s.winRate.toFixed(1)}%</td>
                    <td className={`py-2.5 px-3 text-right ${s.avgPnl >= 0 ? "text-win" : "text-loss"}`}>${s.avgPnl.toFixed(2)}</td>
                    <td className={`py-2.5 px-3 text-right font-semibold ${s.totalPnl >= 0 ? "text-win" : "text-loss"}`}>${s.totalPnl.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {taggedSetups.length === 0 && (
        <div className="glass rounded-2xl border border-border/50 p-8 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
          <Crosshair size={32} className="text-muted/40 mx-auto mb-3" />
          <p className="text-sm text-muted">No setup types recorded yet.</p>
          <p className="text-xs text-muted/60 mt-1">Add a setup type when logging trades to see technical analysis here.</p>
        </div>
      )}
    </div>
  );
}

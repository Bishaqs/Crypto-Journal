"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trade } from "@/lib/types";
import { DEMO_TRADES } from "@/lib/demo-data";
import { DemoBanner } from "@/components/demo-banner";
import { useDateRange } from "@/lib/date-range-context";
import { useTheme } from "@/lib/theme-context";
import { getChartColors } from "@/lib/chart-colors";
import { calculateStats, calculateAdvancedStats } from "@/lib/calculations";
import { StatBlock } from "@/components/ui/stat-block";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";
import { LineChart as LineChartIcon, Target, TrendingUp, TrendingDown, Hash } from "lucide-react";

export default function TradeExpectancyPage() {
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
  const stats = useMemo(() => calculateStats(closedTrades), [closedTrades]);
  const advanced = useMemo(() => calculateAdvancedStats(closedTrades), [closedTrades]);

  const rollingExpectancy = useMemo(() => {
    const sorted = [...closedTrades].filter(t => t.close_timestamp).sort((a, b) => a.close_timestamp!.localeCompare(b.close_timestamp!));
    const window = Math.min(10, Math.max(3, Math.floor(sorted.length / 3)));
    if (sorted.length < window) return [];
    const points: { date: string; expectancy: number }[] = [];
    for (let i = window - 1; i < sorted.length; i++) {
      const slice = sorted.slice(i - window + 1, i + 1);
      const pnls = slice.map(t => t.pnl ?? 0);
      const wins = pnls.filter(p => p > 0);
      const losses = pnls.filter(p => p < 0);
      const avgW = wins.length > 0 ? wins.reduce((s, p) => s + p, 0) / wins.length : 0;
      const avgL = losses.length > 0 ? Math.abs(losses.reduce((s, p) => s + p, 0) / losses.length) : 1;
      const wr = wins.length / pnls.length;
      const exp = (wr * avgW - (1 - wr) * avgL) / avgL;
      points.push({ date: sorted[i].close_timestamp!.split("T")[0], expectancy: parseFloat(exp.toFixed(3)) });
    }
    return points;
  }, [closedTrades]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>;

  const tooltipStyle = { background: colors.tooltipBg, backdropFilter: "blur(16px)", border: colors.tooltipBorder, borderRadius: "12px", fontSize: "12px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {usingDemo && <DemoBanner feature="expectancy" />}
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <LineChartIcon size={24} className="text-accent" />
          Trade Expectancy
        </h1>
        <p className="text-sm text-muted mt-0.5">Expected value per trade based on your win rate and average win/loss</p>
      </div>

      {/* Main metric */}
      <div className="glass rounded-2xl border border-border/50 p-6" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div>
            <p className="text-[10px] text-muted font-semibold uppercase tracking-widest mb-1">Expectancy (R-Multiple)</p>
            <p className={`text-4xl font-bold tracking-tight ${advanced.expectancy >= 0 ? "text-win" : "text-loss"}`}>
              {advanced.expectancy >= 0 ? "+" : ""}{advanced.expectancy.toFixed(2)}R
            </p>
          </div>
          <div className="h-10 w-px bg-border/50 hidden sm:block" />
          <div>
            <p className="text-[10px] text-muted font-semibold uppercase tracking-widest mb-1">Per Trade (Dollar)</p>
            <p className={`text-4xl font-bold tracking-tight ${stats.avgTradePnl >= 0 ? "text-win" : "text-loss"}`}>
              {stats.avgTradePnl >= 0 ? "+" : ""}${Math.abs(stats.avgTradePnl).toFixed(2)}
            </p>
          </div>
        </div>
        <div className="mt-4 px-4 py-2.5 rounded-xl bg-accent/5 border border-accent/10">
          <p className="text-[11px] text-muted font-mono">
            Expectancy = (Win% × Avg Win − Loss% × Avg Loss) / Avg Loss
          </p>
        </div>
      </div>

      {/* Rolling chart */}
      {rollingExpectancy.length > 0 && (
        <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <h3 className="text-sm font-semibold text-foreground mb-4">Rolling Expectancy</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={rollingExpectancy}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
              <XAxis dataKey="date" tick={{ fill: colors.tick, fontSize: 10 }} tickFormatter={(v: string) => v.slice(5)} />
              <YAxis tick={{ fill: colors.tick, fontSize: 10 }} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number | undefined) => [`${(v ?? 0).toFixed(2)}R`, "Expectancy"]} />
              <ReferenceLine y={0} stroke={colors.loss} strokeDasharray="3 3" strokeOpacity={0.5} />
              <Line type="monotone" dataKey="expectancy" stroke={colors.accent} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBlock label="Win Rate" value={`${stats.winRate.toFixed(1)}%`} icon={Target} color={stats.winRate >= 50 ? "text-win" : "text-loss"} />
        <StatBlock label="Avg Winner" value={`+$${advanced.avgWinner.toFixed(0)}`} icon={TrendingUp} color="text-win" />
        <StatBlock label="Avg Loser" value={`-$${Math.abs(advanced.avgLoser).toFixed(0)}`} icon={TrendingDown} color="text-loss" />
        <StatBlock label="Total Trades" value={String(stats.totalTrades)} icon={Hash} />
      </div>
    </div>
  );
}

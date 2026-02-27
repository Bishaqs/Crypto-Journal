"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trade } from "@/lib/types";
import { DEMO_TRADES } from "@/lib/demo-data";
import { DemoBanner } from "@/components/demo-banner";
import { useDateRange } from "@/lib/date-range-context";
import { useTheme } from "@/lib/theme-context";
import { getChartColors } from "@/lib/chart-colors";
import { calculateStats } from "@/lib/calculations";
import { StatBlock } from "@/components/ui/stat-block";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";
import { Scale, TrendingUp, TrendingDown, Target, Hash } from "lucide-react";

export default function ProfitFactorPage() {
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

  const { grossWins, grossLosses, rollingPF } = useMemo(() => {
    const pnls = closedTrades.map(t => t.pnl ?? 0);
    const gw = pnls.filter(p => p > 0).reduce((s, p) => s + p, 0);
    const gl = Math.abs(pnls.filter(p => p < 0).reduce((s, p) => s + p, 0));
    const sorted = [...closedTrades].filter(t => t.close_timestamp).sort((a, b) => a.close_timestamp!.localeCompare(b.close_timestamp!));
    const window = Math.min(20, Math.max(5, Math.floor(sorted.length / 3)));
    const points: { date: string; pf: number }[] = [];
    for (let i = window - 1; i < sorted.length; i++) {
      const slice = sorted.slice(i - window + 1, i + 1);
      const w = slice.filter(t => (t.pnl ?? 0) > 0).reduce((s, t) => s + (t.pnl ?? 0), 0);
      const l = Math.abs(slice.filter(t => (t.pnl ?? 0) < 0).reduce((s, t) => s + (t.pnl ?? 0), 0));
      points.push({ date: sorted[i].close_timestamp!.split("T")[0], pf: parseFloat((l > 0 ? Math.min(w / l, 10) : w > 0 ? 5 : 0).toFixed(2)) });
    }
    return { grossWins: gw, grossLosses: gl, rollingPF: points };
  }, [closedTrades]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>;

  const pf = stats.profitFactor;
  const badge = pf < 1 ? "Unprofitable" : pf < 1.5 ? "Marginal" : pf < 2 ? "Acceptable" : pf < 3 ? "Strong" : "Excellent";
  const badgeColor = pf < 1 ? "text-loss bg-loss/10" : pf < 1.5 ? "text-muted bg-muted/10" : "text-win bg-win/10";
  const tooltipStyle = { background: colors.tooltipBg, backdropFilter: "blur(16px)", border: colors.tooltipBorder, borderRadius: "12px", fontSize: "12px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" };
  const total = grossWins + grossLosses || 1;

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {usingDemo && <DemoBanner />}
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2"><Scale size={24} className="text-accent" />Profit Factor</h1>
        <p className="text-sm text-muted mt-0.5">Gross profit divided by gross loss — how many dollars you make per dollar lost</p>
      </div>

      {/* Main metric */}
      <div className="glass rounded-2xl border border-border/50 p-6" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="flex items-center gap-4">
          <div>
            <p className="text-[10px] text-muted font-semibold uppercase tracking-widest mb-1">Profit Factor</p>
            <p className={`text-4xl font-bold tracking-tight ${pf >= 1 ? "text-win" : "text-loss"}`}>{pf.toFixed(2)}</p>
          </div>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${badgeColor}`}>{badge}</span>
        </div>
        {/* Gross wins/losses bar */}
        <div className="mt-4">
          <div className="flex justify-between text-[11px] text-muted mb-1">
            <span>Gross Profit: +${grossWins.toFixed(0)}</span>
            <span>Gross Loss: -${grossLosses.toFixed(0)}</span>
          </div>
          <div className="h-3 rounded-full overflow-hidden flex bg-surface-hover">
            <div className="bg-win/70 h-full rounded-l-full" style={{ width: `${(grossWins / total) * 100}%` }} />
            <div className="bg-loss/70 h-full rounded-r-full" style={{ width: `${(grossLosses / total) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Rolling chart */}
      {rollingPF.length > 0 && (
        <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <h3 className="text-sm font-semibold text-foreground mb-4">Rolling Profit Factor</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={rollingPF}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
              <XAxis dataKey="date" tick={{ fill: colors.tick, fontSize: 10 }} tickFormatter={(v: string) => v.slice(5)} />
              <YAxis tick={{ fill: colors.tick, fontSize: 10 }} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number | undefined) => [(v ?? 0).toFixed(2), "Profit Factor"]} />
              <ReferenceLine y={1} stroke={colors.loss} strokeDasharray="3 3" strokeOpacity={0.5} label={{ value: "Breakeven", fill: colors.tick, fontSize: 10 }} />
              <Line type="monotone" dataKey="pf" stroke={colors.accent} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBlock label="Gross Profit" value={`+$${grossWins.toFixed(0)}`} icon={TrendingUp} color="text-win" />
        <StatBlock label="Gross Loss" value={`-$${grossLosses.toFixed(0)}`} icon={TrendingDown} color="text-loss" />
        <StatBlock label="Win Rate" value={`${stats.winRate.toFixed(1)}%`} icon={Target} color={stats.winRate >= 50 ? "text-win" : "text-loss"} />
        <StatBlock label="Total Trades" value={String(stats.totalTrades)} icon={Hash} />
      </div>
    </div>
  );
}

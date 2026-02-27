"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trade } from "@/lib/types";
import { DEMO_TRADES } from "@/lib/demo-data";
import { DemoBanner } from "@/components/demo-banner";
import { useDateRange } from "@/lib/date-range-context";
import { useTheme } from "@/lib/theme-context";
import { getChartColors } from "@/lib/chart-colors";
import { StatBlock } from "@/components/ui/stat-block";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, ReferenceLine } from "recharts";
import { BarChart2, DollarSign, TrendingUp, TrendingDown, Layers } from "lucide-react";

export default function PositionSizingPage() {
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

  const sizing = useMemo(() => {
    const withSize = closedTrades.map(t => ({
      symbol: t.symbol,
      size: (t.quantity ?? 0) * (t.entry_price ?? 0),
      pnl: t.pnl ?? 0,
      index: 0,
    })).filter(t => t.size > 0);
    if (withSize.length === 0) return null;

    withSize.forEach((t, i) => { t.index = i + 1; });
    const sizes = withSize.map(t => t.size).sort((a, b) => a - b);
    const avg = sizes.reduce((s, v) => s + v, 0) / sizes.length;
    const median = sizes[Math.floor(sizes.length / 2)];
    const largest = Math.max(...sizes);
    const smallest = Math.min(...sizes);

    // Quartile analysis
    const q1 = sizes[Math.floor(sizes.length * 0.25)];
    const q3 = sizes[Math.floor(sizes.length * 0.75)];
    const quartiles = [
      { label: "Q1 (Small)", min: 0, max: q1 },
      { label: "Q2", min: q1, max: median },
      { label: "Q3", min: median, max: q3 },
      { label: "Q4 (Large)", min: q3, max: Infinity },
    ];
    const quartileData = quartiles.map(q => {
      const bucket = withSize.filter(t => t.size >= q.min && t.size < q.max);
      const totalPnl = bucket.reduce((s, t) => s + t.pnl, 0);
      const count = bucket.length;
      const winRate = count > 0 ? (bucket.filter(t => t.pnl > 0).length / count) * 100 : 0;
      return { label: q.label, pnl: parseFloat(totalPnl.toFixed(2)), count, winRate: parseFloat(winRate.toFixed(1)) };
    });

    const bestQuartile = quartileData.reduce((best, q) => q.pnl > best.pnl ? q : best, quartileData[0]);

    return { trades: withSize, avg, median, largest, smallest, quartileData, bestQuartile };
  }, [closedTrades]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>;

  const tooltipStyle = { background: colors.tooltipBg, backdropFilter: "blur(16px)", border: colors.tooltipBorder, borderRadius: "12px", fontSize: "12px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" };

  if (!sizing) return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      <div><h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2"><BarChart2 size={24} className="text-accent" />Position Sizing</h1></div>
      <div className="glass rounded-2xl border border-border/50 p-8 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
        <p className="text-muted">Need closed trades with quantity and entry price to analyze position sizing.</p>
      </div>
    </div>
  );

  const fmt = (v: number) => v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v.toFixed(0)}`;

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {usingDemo && <DemoBanner />}
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2"><BarChart2 size={24} className="text-accent" />Position Sizing</h1>
        <p className="text-sm text-muted mt-0.5">How your position size (quantity x entry price) relates to trade outcomes</p>
      </div>

      {/* Main metric */}
      <div className="glass rounded-2xl border border-border/50 p-6" style={{ boxShadow: "var(--shadow-card)" }}>
        <p className="text-[10px] text-muted font-semibold uppercase tracking-widest mb-1">Average Position Size</p>
        <p className="text-4xl font-bold tracking-tight text-foreground">{fmt(sizing.avg)}</p>
        <p className="text-xs text-muted mt-2">Across {sizing.trades.length} closed trades</p>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* P&L by trade (sorted by size) */}
        <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <h3 className="text-sm font-semibold text-foreground mb-4">P&L Per Trade</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={sizing.trades}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
              <XAxis dataKey="index" tick={{ fill: colors.tick, fontSize: 10 }} />
              <YAxis tick={{ fill: colors.tick, fontSize: 10 }} tickFormatter={(v: number) => `$${v}`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number | undefined) => [`$${(v ?? 0).toFixed(2)}`, "P&L"]} labelFormatter={(l: string | number) => `Trade #${l}`} />
              <ReferenceLine y={0} stroke={colors.tick} strokeOpacity={0.3} />
              <Bar dataKey="pnl" radius={[2, 2, 0, 0]}>
                {sizing.trades.map((d, i) => <Cell key={i} fill={d.pnl >= 0 ? colors.win : colors.loss} fillOpacity={0.85} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* P&L by size quartile */}
        <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <h3 className="text-sm font-semibold text-foreground mb-4">P&L by Size Quartile</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={sizing.quartileData}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
              <XAxis dataKey="label" tick={{ fill: colors.tick, fontSize: 10 }} />
              <YAxis tick={{ fill: colors.tick, fontSize: 10 }} tickFormatter={(v: number) => `$${v}`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number | undefined, name: string) => { const n = v ?? 0; return [name === "pnl" ? `$${n.toFixed(2)}` : `${n}%`, name === "pnl" ? "Total P&L" : "Win Rate"]; }} />
              <ReferenceLine y={0} stroke={colors.tick} strokeOpacity={0.3} />
              <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                {sizing.quartileData.map((d, i) => <Cell key={i} fill={d.pnl >= 0 ? colors.win : colors.loss} fillOpacity={0.85} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBlock label="Median Size" value={fmt(sizing.median)} icon={Layers} tooltip="Middle position size value" />
        <StatBlock label="Largest" value={fmt(sizing.largest)} icon={TrendingUp} color="text-accent" />
        <StatBlock label="Smallest" value={fmt(sizing.smallest)} icon={TrendingDown} color="text-muted" />
        <StatBlock label="Best Quartile" value={sizing.bestQuartile.label} icon={DollarSign} color="text-win" tooltip={`${sizing.bestQuartile.label} generated $${sizing.bestQuartile.pnl.toFixed(0)} total P&L`} />
      </div>
    </div>
  );
}

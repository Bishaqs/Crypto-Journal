"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trade } from "@/lib/types";
import { DEMO_TRADES } from "@/lib/demo-data";
import { DemoBanner } from "@/components/demo-banner";
import { useDateRange } from "@/lib/date-range-context";
import { useTheme } from "@/lib/theme-context";
import { getChartColors } from "@/lib/chart-colors";
import { calculateAdvancedStats } from "@/lib/calculations";
import { StatBlock } from "@/components/ui/stat-block";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, ReferenceLine } from "recharts";
import { BarChart as BarChartIcon, TrendingUp, TrendingDown, Activity, Target, Info } from "lucide-react";

export default function ReturnsDistributionPage() {
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
  const advanced = useMemo(() => calculateAdvancedStats(closedTrades), [closedTrades]);

  const distData = useMemo(() => {
    const pnls = closedTrades.map(t => t.pnl ?? 0);
    if (pnls.length === 0) return null;

    const mean = pnls.reduce((s, p) => s + p, 0) / pnls.length;
    const sorted = [...pnls].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const variance = pnls.reduce((s, p) => s + (p - mean) ** 2, 0) / pnls.length;
    const stdDev = Math.sqrt(variance);
    const n = pnls.length;
    const skew = n < 3 ? 0 : (n / ((n - 1) * (n - 2))) * pnls.reduce((s, p) => s + ((p - mean) / (stdDev || 1)) ** 3, 0);
    const pctProfitable = (pnls.filter(p => p > 0).length / n) * 100;
    const largestWin = Math.max(...pnls);
    const largestLoss = Math.min(...pnls);

    // Histogram with dynamic bucket count
    const bucketCount = Math.max(5, Math.ceil(Math.sqrt(n)));
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const range = max - min || 1;
    const bucketSize = range / bucketCount;
    const buckets: { range: string; rangeMin: number; count: number }[] = [];
    for (let i = 0; i < bucketCount; i++) {
      const lo = min + i * bucketSize;
      const hi = lo + bucketSize;
      const count = pnls.filter(p => p >= lo && (i === bucketCount - 1 ? p <= hi : p < hi)).length;
      buckets.push({ range: `$${lo.toFixed(0)}`, rangeMin: lo, count });
    }

    return { mean, median, stdDev, skew, pctProfitable, largestWin, largestLoss, buckets };
  }, [closedTrades]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>;

  const tooltipStyle = { background: colors.tooltipBg, backdropFilter: "blur(16px)", border: colors.tooltipBorder, borderRadius: "12px", fontSize: "12px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" };

  if (!distData) return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      <div><h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2"><BarChartIcon size={24} className="text-accent" />Returns Distribution</h1></div>
      <div className="glass rounded-2xl border border-border/50 p-8 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
        <p className="text-muted">Need closed trades to analyze return distribution.</p>
      </div>
    </div>
  );

  const skewLabel = distData.skew > 0.5 ? "Positively skewed" : distData.skew < -0.5 ? "Negatively skewed" : "Roughly symmetric";
  const skewColor = distData.skew > 0.5 ? "text-win bg-win/10 border-win/20" : distData.skew < -0.5 ? "text-loss bg-loss/10 border-loss/20" : "text-muted bg-muted/10 border-muted/20";
  const skewExplain = distData.skew > 0.5
    ? "Your returns are right-skewed — you have occasional large winners that pull up your average. This is the profile of a trend-following or momentum strategy."
    : distData.skew < -0.5
    ? "Your returns are left-skewed — occasional large losses drag down your average. Consider tightening stops or reducing position size on your biggest losers."
    : "Your returns are fairly balanced between wins and losses. No extreme outliers dominating your P&L.";

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {usingDemo && <DemoBanner />}
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2"><BarChartIcon size={24} className="text-accent" />Returns Distribution</h1>
        <p className="text-sm text-muted mt-0.5">Distribution of all your trade P&L values</p>
      </div>

      {/* Main metric */}
      <div className="glass rounded-2xl border border-border/50 p-6" style={{ boxShadow: "var(--shadow-card)" }}>
        <p className="text-[10px] text-muted font-semibold uppercase tracking-widest mb-1">Mean Return Per Trade</p>
        <p className={`text-4xl font-bold tracking-tight ${distData.mean >= 0 ? "text-win" : "text-loss"}`}>
          {distData.mean >= 0 ? "+" : ""}${distData.mean.toFixed(2)}
        </p>
      </div>

      {/* Histogram */}
      <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
        <h3 className="text-sm font-semibold text-foreground mb-4">P&L Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={distData.buckets}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
            <XAxis dataKey="range" tick={{ fill: colors.tick, fontSize: 10 }} />
            <YAxis tick={{ fill: colors.tick, fontSize: 10 }} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number | undefined) => [v ?? 0, "Trades"]} />
            <ReferenceLine x={distData.buckets.findIndex(b => b.rangeMin <= 0 && b.rangeMin + (distData.buckets[1]?.rangeMin - distData.buckets[0]?.rangeMin) > 0) >= 0 ? distData.buckets[distData.buckets.findIndex(b => b.rangeMin <= 0 && b.rangeMin + (distData.buckets[1]?.rangeMin - distData.buckets[0]?.rangeMin) > 0)]?.range : undefined} stroke={colors.tick} strokeDasharray="3 3" strokeOpacity={0.5} label={{ value: "$0", fill: colors.tick, fontSize: 10 }} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {distData.buckets.map((d, i) => <Cell key={i} fill={d.rangeMin >= 0 ? colors.win : colors.loss} fillOpacity={0.85} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Skew interpretation */}
      <div className={`rounded-2xl border p-4 ${skewColor}`}>
        <div className="flex items-start gap-3">
          <Info size={16} className="mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold">{skewLabel} (Skew: {distData.skew.toFixed(2)})</p>
            <p className="text-xs mt-1 opacity-80">{skewExplain}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBlock label="Std Deviation" value={`$${distData.stdDev.toFixed(0)}`} icon={Activity} tooltip="How spread out your returns are" />
        <StatBlock label="% Profitable" value={`${distData.pctProfitable.toFixed(1)}%`} icon={Target} color={distData.pctProfitable >= 50 ? "text-win" : "text-loss"} />
        <StatBlock label="Largest Win" value={`+$${distData.largestWin.toFixed(0)}`} icon={TrendingUp} color="text-win" />
        <StatBlock label="Largest Loss" value={`-$${Math.abs(distData.largestLoss).toFixed(0)}`} icon={TrendingDown} color="text-loss" />
      </div>
    </div>
  );
}

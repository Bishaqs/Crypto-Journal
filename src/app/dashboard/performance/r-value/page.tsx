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
import { Ruler, TrendingUp, TrendingDown, Activity, Info } from "lucide-react";

export default function RValuePage() {
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

  const rData = useMemo(() => {
    const avgLoss = advanced.avgLoser;
    if (avgLoss === 0 || closedTrades.length === 0) return null;
    const sorted = [...closedTrades].filter(t => t.close_timestamp).sort((a, b) => a.close_timestamp!.localeCompare(b.close_timestamp!));
    const rValues = sorted.map((t, i) => ({ index: i + 1, symbol: t.symbol, r: parseFloat(((t.pnl ?? 0) / avgLoss).toFixed(2)), pnl: t.pnl ?? 0 }));
    const rs = rValues.map(v => v.r).sort((a, b) => a - b);
    const avg = rs.reduce((s, r) => s + r, 0) / rs.length;
    const median = rs[Math.floor(rs.length / 2)];
    const best = Math.max(...rs);
    const worst = Math.min(...rs);
    // Histogram
    const bucketSize = 0.5;
    const bucketMap = new Map<number, number>();
    for (const r of rs) {
      const bucket = parseFloat((Math.round(r / bucketSize) * bucketSize).toFixed(1));
      bucketMap.set(bucket, (bucketMap.get(bucket) ?? 0) + 1);
    }
    const distribution = Array.from(bucketMap.entries()).map(([r, count]) => ({ r: `${r}R`, rNum: r, count })).sort((a, b) => a.rNum - b.rNum);
    return { trades: rValues, avg, median, best, worst, distribution };
  }, [closedTrades, advanced.avgLoser]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>;

  const tooltipStyle = { background: colors.tooltipBg, backdropFilter: "blur(16px)", border: colors.tooltipBorder, borderRadius: "12px", fontSize: "12px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" };

  if (!rData) return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      <div><h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2"><Ruler size={24} className="text-accent" />R-Value</h1></div>
      <div className="glass rounded-2xl border border-border/50 p-8 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
        <p className="text-muted">Need at least one losing trade to calculate R-multiples.</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {usingDemo && <DemoBanner />}
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2"><Ruler size={24} className="text-accent" />R-Value</h1>
        <p className="text-sm text-muted mt-0.5">Risk-reward ratio per trade, normalized by your average loss (1R)</p>
      </div>

      {/* Main metric */}
      <div className="glass rounded-2xl border border-border/50 p-6" style={{ boxShadow: "var(--shadow-card)" }}>
        <p className="text-[10px] text-muted font-semibold uppercase tracking-widest mb-1">Average R-Multiple</p>
        <p className={`text-4xl font-bold tracking-tight ${rData.avg >= 0 ? "text-win" : "text-loss"}`}>
          {rData.avg >= 0 ? "+" : ""}{rData.avg.toFixed(2)}R
        </p>
        <p className="text-xs text-muted mt-2 flex items-center gap-1"><Info size={12} />1R = ${Math.abs(advanced.avgLoser).toFixed(0)} (your average loss)</p>
      </div>

      {/* Charts grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Per-trade R */}
        <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <h3 className="text-sm font-semibold text-foreground mb-4">R-Multiple Per Trade</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={rData.trades}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
              <XAxis dataKey="index" tick={{ fill: colors.tick, fontSize: 10 }} />
              <YAxis tick={{ fill: colors.tick, fontSize: 10 }} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number | undefined) => [`${v ?? 0}R`, "R-Multiple"]} labelFormatter={(l) => `Trade #${l}`} />
              <ReferenceLine y={0} stroke={colors.tick} strokeOpacity={0.3} />
              <Bar dataKey="r" radius={[2, 2, 0, 0]}>
                {rData.trades.map((d, i) => <Cell key={i} fill={d.r >= 0 ? colors.win : colors.loss} fillOpacity={0.85} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Distribution */}
        <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <h3 className="text-sm font-semibold text-foreground mb-4">R-Multiple Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={rData.distribution}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
              <XAxis dataKey="r" tick={{ fill: colors.tick, fontSize: 10 }} />
              <YAxis tick={{ fill: colors.tick, fontSize: 10 }} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {rData.distribution.map((d, i) => <Cell key={i} fill={d.rNum >= 0 ? colors.win : colors.loss} fillOpacity={0.85} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBlock label="Best R" value={`+${rData.best.toFixed(2)}R`} icon={TrendingUp} color="text-win" />
        <StatBlock label="Worst R" value={`${rData.worst.toFixed(2)}R`} icon={TrendingDown} color="text-loss" />
        <StatBlock label="Median R" value={`${rData.median.toFixed(2)}R`} icon={Activity} color={rData.median >= 0 ? "text-win" : "text-loss"} />
        <StatBlock label="1R Value" value={`$${Math.abs(advanced.avgLoser).toFixed(0)}`} icon={Ruler} tooltip="Your average loss size, used as the baseline risk unit" />
      </div>
    </div>
  );
}

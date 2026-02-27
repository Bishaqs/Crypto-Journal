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
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { ArrowUpDown, Clock, TrendingUp, TrendingDown, Info } from "lucide-react";

export default function MfeMaePage() {
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

  const holdTimeData = useMemo(() => {
    const fmtHours = (h: number) => h < 1 ? `${Math.round(h * 60)}m` : h < 24 ? `${h.toFixed(1)}h` : `${(h / 24).toFixed(1)}d`;
    return [
      { label: "Winners", hours: advanced.avgHoldTimeWinners, formatted: fmtHours(advanced.avgHoldTimeWinners) },
      { label: "Losers", hours: advanced.avgHoldTimeLosers, formatted: fmtHours(advanced.avgHoldTimeLosers) },
    ];
  }, [advanced]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>;

  const tooltipStyle = { background: colors.tooltipBg, backdropFilter: "blur(16px)", border: colors.tooltipBorder, borderRadius: "12px", fontSize: "12px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" };

  // Mock MFE/MAE data for preview
  const mockScatter = [
    { mae: -120, mfe: 450 }, { mae: -80, mfe: 320 }, { mae: -200, mfe: 180 },
    { mae: -50, mfe: 600 }, { mae: -300, mfe: 100 }, { mae: -30, mfe: 250 },
    { mae: -150, mfe: 500 }, { mae: -90, mfe: 380 }, { mae: -250, mfe: 50 },
    { mae: -60, mfe: 420 }, { mae: -180, mfe: 280 }, { mae: -40, mfe: 150 },
  ];

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {usingDemo && <DemoBanner />}
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2"><ArrowUpDown size={24} className="text-accent" />MFE / MAE</h1>
        <p className="text-sm text-muted mt-0.5">Maximum Favorable & Adverse Excursion per trade</p>
      </div>

      {/* Explanation */}
      <div className="glass rounded-2xl border border-border/50 p-6 space-y-4" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-accent/10"><Info size={18} className="text-accent" /></div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">What is MFE / MAE?</h3>
            <div className="text-xs text-muted mt-2 space-y-2">
              <p><span className="font-semibold text-win">MFE (Maximum Favorable Excursion)</span> — The highest unrealized profit during a trade. Tells you how much you <em>could</em> have made if you exited at the peak.</p>
              <p><span className="font-semibold text-loss">MAE (Maximum Adverse Excursion)</span> — The deepest unrealized loss during a trade. Shows how far the trade moved against you before recovering or being closed.</p>
              <p className="text-muted/80">Use MFE to optimize take-profit levels. Use MAE to fine-tune stop-loss placement. Together they reveal whether you're leaving money on the table or holding losers too long.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mock scatter preview */}
      <div className="glass rounded-2xl border border-dashed border-accent/20 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-sm font-semibold text-foreground">Preview: MFE vs MAE Scatter</h3>
          <span className="text-[9px] font-semibold uppercase tracking-wider text-accent bg-accent/10 px-2 py-0.5 rounded-full">Example Data</span>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={mockScatter} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
            <XAxis dataKey="mae" tick={{ fill: colors.tick, fontSize: 10 }} label={{ value: "MAE ($)", position: "insideBottom", offset: -5, fill: colors.tick, fontSize: 10 }} />
            <YAxis dataKey="mfe" tick={{ fill: colors.tick, fontSize: 10 }} label={{ value: "MFE ($)", angle: -90, position: "insideLeft", fill: colors.tick, fontSize: 10 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="mfe" fill={colors.accent} fillOpacity={0.6} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <p className="text-[10px] text-muted/50 text-center mt-2">This is example data. Connect your exchange API to see your actual MFE/MAE.</p>
      </div>

      {/* Hold time comparison (actual data) */}
      <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
        <h3 className="text-sm font-semibold text-foreground mb-4">Average Hold Time: Winners vs Losers</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={holdTimeData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
            <XAxis type="number" tick={{ fill: colors.tick, fontSize: 10 }} />
            <YAxis dataKey="label" type="category" tick={{ fill: colors.tick, fontSize: 11 }} width={70} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number | undefined) => { const n = v ?? 0; return [n < 1 ? `${Math.round(n * 60)}m` : n < 24 ? `${n.toFixed(1)}h` : `${(n / 24).toFixed(1)}d`, "Avg Hold"]; }} />
            <Bar dataKey="hours" radius={[0, 4, 4, 0]}>
              {holdTimeData.map((d, i) => <Cell key={i} fill={i === 0 ? colors.win : colors.loss} fillOpacity={0.85} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <StatBlock label="Avg Hold (Winners)" value={holdTimeData[0].formatted} icon={Clock} color="text-win" tooltip="How long you hold winning trades on average" />
        <StatBlock label="Avg Hold (Losers)" value={holdTimeData[1].formatted} icon={Clock} color="text-loss" tooltip="How long you hold losing trades on average" />
      </div>
    </div>
  );
}

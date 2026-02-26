"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trade } from "@/lib/types";
import { DEMO_TRADES } from "@/lib/demo-data";
import { useDateRange } from "@/lib/date-range-context";
import { useTheme } from "@/lib/theme-context";
import { getChartColors } from "@/lib/chart-colors";
import {
  calculateDailyPnl,
  buildEquityCurve,
  calculateAdvancedStats,
} from "@/lib/calculations";
import { EquityCurve } from "@/components/dashboard/equity-curve";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import { Activity, TrendingUp, ArrowDown, Percent } from "lucide-react";

export default function RunningPnlPage() {
  const supabase = createClient();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingDemo, setUsingDemo] = useState(false);
  const { filterTrades } = useDateRange();
  const { theme } = useTheme();
  const colors = getChartColors(theme);

  const fetchTrades = useCallback(async () => {
    const { data } = await supabase
      .from("trades")
      .select("*")
      .order("open_timestamp", { ascending: false });
    const dbTrades = (data as Trade[]) ?? [];
    if (dbTrades.length === 0) {
      setTrades(DEMO_TRADES);
      setUsingDemo(true);
    } else {
      setTrades(dbTrades);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchTrades(); }, [fetchTrades]);

  const filtered = useMemo(() => filterTrades(trades), [trades, filterTrades]);
  const dailyPnl = useMemo(() => calculateDailyPnl(filtered), [filtered]);
  const equityCurve = useMemo(() => buildEquityCurve(dailyPnl), [dailyPnl]);
  const adv = useMemo(() => calculateAdvancedStats(filtered), [filtered]);

  const peakEquity = useMemo(
    () => equityCurve.reduce((max, d) => Math.max(max, d.equity), 0),
    [equityCurve],
  );
  const currentEquity = equityCurve.length > 0 ? equityCurve[equityCurve.length - 1].equity : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    { label: "Peak Equity", value: `$${peakEquity.toFixed(2)}`, icon: TrendingUp, color: "text-win" },
    { label: "Current Equity", value: `$${currentEquity.toFixed(2)}`, icon: TrendingUp, color: currentEquity >= 0 ? "text-win" : "text-loss" },
    { label: "Max Drawdown", value: `$${adv.maxDrawdown.toFixed(2)}`, icon: ArrowDown, color: "text-loss" },
    { label: "Max DD %", value: `${adv.maxDrawdownPct.toFixed(1)}%`, icon: Percent, color: "text-loss" },
  ];

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
          <Activity size={20} className="text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Running PnL Analysis</h1>
          <p className="text-sm text-muted">
            {usingDemo ? "Sample data" : `Cumulative P&L across ${filtered.length} trades`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((s) => (
          <div key={s.label} className="glass rounded-2xl border border-border/50 p-4" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center gap-1.5 mb-2">
              <s.icon size={13} className="text-accent" />
              <span className="text-[10px] uppercase tracking-wider text-muted font-semibold">{s.label}</span>
            </div>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <EquityCurve data={equityCurve} />

      {dailyPnl.length > 0 && (
        <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Daily P&L</h3>
            <div className="flex gap-3 text-xs text-muted">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-win" /> {dailyPnl.filter(d => d.pnl >= 0).length} green</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-loss" /> {dailyPnl.filter(d => d.pnl < 0).length} red</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dailyPnl} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: colors.tick }} tickFormatter={(v) => v.slice(5)} axisLine={{ stroke: colors.grid }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: colors.tick }} tickFormatter={(v) => `$${v}`} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: colors.tooltipBg, backdropFilter: "blur(16px)", border: colors.tooltipBorder, borderRadius: "12px", fontSize: "12px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}
                formatter={(value: any) => [`$${Number(value ?? 0).toFixed(2)}`, "P&L"]}
              />
              <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                {dailyPnl.map((entry, i) => (
                  <Cell key={i} fill={entry.pnl >= 0 ? colors.win : colors.loss} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trade } from "@/lib/types";
import { DEMO_TRADES } from "@/lib/demo-data";
import { useDateRange } from "@/lib/date-range-context";
import { groupTradesByDay } from "@/lib/trade-grouping";
import { GroupTable } from "@/components/dashboard/group-table";
import { useTheme } from "@/lib/theme-context";
import { getChartColors } from "@/lib/chart-colors";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Hash, CalendarDays, TrendingUp, BarChart3 } from "lucide-react";

export default function TradeCountPage() {
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
  const dayGroups = useMemo(() => groupTradesByDay(filtered), [filtered]);

  const tradingDays = dayGroups.length;
  const avgPerDay = tradingDays > 0 ? filtered.length / tradingDays : 0;
  const mostActive = useMemo(
    () => dayGroups.length > 0 ? [...dayGroups].sort((a, b) => b.tradeCount - a.tradeCount)[0] : null,
    [dayGroups],
  );

  const chartData = useMemo(
    () => [...dayGroups].sort((a, b) => a.key.localeCompare(b.key)).slice(-30).map((g) => ({
      date: g.key,
      count: g.tradeCount,
    })),
    [dayGroups],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
          <Hash size={20} className="text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Trade Count</h1>
          <p className="text-sm text-muted">
            {usingDemo ? "Sample data" : `Trading frequency across ${filtered.length} trades`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass rounded-2xl border border-border/50 p-4" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center gap-1.5 mb-2"><BarChart3 size={13} className="text-accent" /><span className="text-[10px] uppercase tracking-wider text-muted font-semibold">Total Trades</span></div>
          <p className="text-2xl font-bold text-foreground">{filtered.length}</p>
        </div>
        <div className="glass rounded-2xl border border-border/50 p-4" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center gap-1.5 mb-2"><TrendingUp size={13} className="text-accent" /><span className="text-[10px] uppercase tracking-wider text-muted font-semibold">Avg / Day</span></div>
          <p className="text-2xl font-bold text-foreground">{avgPerDay.toFixed(1)}</p>
        </div>
        {mostActive && (
          <div className="glass rounded-2xl border border-border/50 p-4" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center gap-1.5 mb-2"><CalendarDays size={13} className="text-accent" /><span className="text-[10px] uppercase tracking-wider text-muted font-semibold">Most Active</span></div>
            <p className="text-lg font-bold text-foreground">{mostActive.label}</p>
            <p className="text-sm text-muted">{mostActive.tradeCount} trades</p>
          </div>
        )}
        <div className="glass rounded-2xl border border-border/50 p-4" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center gap-1.5 mb-2"><CalendarDays size={13} className="text-accent" /><span className="text-[10px] uppercase tracking-wider text-muted font-semibold">Trading Days</span></div>
          <p className="text-2xl font-bold text-foreground">{tradingDays}</p>
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <h3 className="text-sm font-semibold text-foreground mb-4">Trades per Day (last 30 days)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: colors.tick }} tickFormatter={(v) => v.slice(5)} axisLine={{ stroke: colors.grid }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: colors.tick }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: colors.tooltipBg, backdropFilter: "blur(16px)", border: colors.tooltipBorder, borderRadius: "12px", fontSize: "12px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}
                formatter={(value: any) => [value ?? 0, "Trades"]}
              />
              <Bar dataKey="count" fill={colors.accent} fillOpacity={0.85} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <GroupTable groups={dayGroups} />
    </div>
  );
}

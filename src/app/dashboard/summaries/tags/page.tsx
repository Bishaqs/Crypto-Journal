"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trade } from "@/lib/types";
import { DEMO_TRADES } from "@/lib/demo-data";
import { useDateRange } from "@/lib/date-range-context";
import { groupTradesByTag } from "@/lib/trade-grouping";
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
  Cell,
} from "recharts";
import { Tag, Award, TrendingDown, Hash } from "lucide-react";

export default function TagGroupsStatisticsPage() {
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
  const tagGroups = useMemo(() => groupTradesByTag(filtered), [filtered]);

  const best = tagGroups[0];
  const worst = tagGroups.length > 1 ? tagGroups[tagGroups.length - 1] : null;
  const mostTraded = useMemo(
    () => [...tagGroups].sort((a, b) => b.tradeCount - a.tradeCount)[0] ?? null,
    [tagGroups],
  );

  const chartData = useMemo(
    () => tagGroups.slice(0, 12).map((g) => ({ name: g.label, pnl: g.totalPnl })),
    [tagGroups],
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
          <Tag size={20} className="text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tag Groups Statistics</h1>
          <p className="text-sm text-muted">
            {usingDemo ? "Sample data" : `${tagGroups.length} tags across ${filtered.length} trades`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {best && (
          <div className="glass rounded-2xl border border-border/50 p-4" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center gap-1.5 mb-2">
              <Award size={13} className="text-win" />
              <span className="text-[10px] uppercase tracking-wider text-muted font-semibold">Best Tag</span>
            </div>
            <p className="text-lg font-bold text-foreground">{best.label}</p>
            <p className="text-sm text-win">+${best.totalPnl.toFixed(2)}</p>
          </div>
        )}
        {worst && (
          <div className="glass rounded-2xl border border-border/50 p-4" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingDown size={13} className="text-loss" />
              <span className="text-[10px] uppercase tracking-wider text-muted font-semibold">Worst Tag</span>
            </div>
            <p className="text-lg font-bold text-foreground">{worst.label}</p>
            <p className="text-sm text-loss">${worst.totalPnl.toFixed(2)}</p>
          </div>
        )}
        {mostTraded && (
          <div className="glass rounded-2xl border border-border/50 p-4" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center gap-1.5 mb-2">
              <Hash size={13} className="text-accent" />
              <span className="text-[10px] uppercase tracking-wider text-muted font-semibold">Most Traded</span>
            </div>
            <p className="text-lg font-bold text-foreground">{mostTraded.label}</p>
            <p className="text-sm text-muted">{mostTraded.tradeCount} trades</p>
          </div>
        )}
      </div>

      {chartData.length > 0 && (
        <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <h3 className="text-sm font-semibold text-foreground mb-4">P&L by Tag</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 80, right: 20, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: colors.tick }} tickFormatter={(v) => `$${v}`} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: colors.tick }} axisLine={false} tickLine={false} width={75} />
              <Tooltip
                contentStyle={{ background: colors.tooltipBg, backdropFilter: "blur(16px)", border: colors.tooltipBorder, borderRadius: "12px", fontSize: "12px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}
                formatter={(value: any) => [`$${Number(value ?? 0).toFixed(2)}`, "P&L"]}
              />
              <Bar dataKey="pnl" radius={[0, 6, 6, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.pnl >= 0 ? colors.win : colors.loss} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <GroupTable groups={tagGroups} />
    </div>
  );
}

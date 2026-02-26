"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trade } from "@/lib/types";
import { DEMO_TRADES } from "@/lib/demo-data";
import { useDateRange } from "@/lib/date-range-context";
import { groupTradesByTag } from "@/lib/trade-grouping";
import { TreemapChart } from "@/components/dashboard/treemap-chart";
import { TreePine, Hash, Award, TrendingDown } from "lucide-react";

export default function TreemapTagsPage() {
  const supabase = createClient();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingDemo, setUsingDemo] = useState(false);
  const { filterTrades } = useDateRange();

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

  const best = tagGroups[0] ?? null;
  const worst = tagGroups.length > 1 ? tagGroups[tagGroups.length - 1] : null;

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
          <TreePine size={20} className="text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Treemap — Tags</h1>
          <p className="text-sm text-muted">
            {usingDemo ? "Sample data" : `${tagGroups.length} tags across ${filtered.length} trades`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="glass rounded-2xl border border-border/50 p-4" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center gap-1.5 mb-2"><Hash size={13} className="text-accent" /><span className="text-[10px] uppercase tracking-wider text-muted font-semibold">Total Tags</span></div>
          <p className="text-2xl font-bold text-foreground">{tagGroups.length}</p>
        </div>
        {best && (
          <div className="glass rounded-2xl border border-border/50 p-4" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center gap-1.5 mb-2"><Award size={13} className="text-win" /><span className="text-[10px] uppercase tracking-wider text-muted font-semibold">Best Tag</span></div>
            <p className="text-lg font-bold text-foreground">{best.label}</p>
            <p className="text-sm text-win">+${best.totalPnl.toFixed(2)}</p>
          </div>
        )}
        {worst && (
          <div className="glass rounded-2xl border border-border/50 p-4" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center gap-1.5 mb-2"><TrendingDown size={13} className="text-loss" /><span className="text-[10px] uppercase tracking-wider text-muted font-semibold">Worst Tag</span></div>
            <p className="text-lg font-bold text-foreground">{worst.label}</p>
            <p className="text-sm text-loss">${worst.totalPnl.toFixed(2)}</p>
          </div>
        )}
      </div>

      <TreemapChart groups={tagGroups} title="P&L by Tag" />
    </div>
  );
}

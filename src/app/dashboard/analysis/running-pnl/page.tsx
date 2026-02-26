"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trade } from "@/lib/types";
import { useDateRange } from "@/lib/date-range-context";
import { calculateDailyPnl, buildEquityCurve } from "@/lib/calculations";
import { Activity } from "lucide-react";

export default function RunningPnlPage() {
  const supabase = createClient();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const { filterTrades } = useDateRange();

  const fetchTrades = useCallback(async () => {
    const { data } = await supabase
      .from("trades")
      .select("*")
      .order("open_timestamp", { ascending: false });
    setTrades((data as Trade[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchTrades(); }, [fetchTrades]);

  const filtered = useMemo(() => filterTrades(trades), [trades, filterTrades]);
  const dailyPnl = useMemo(() => calculateDailyPnl(filtered), [filtered]);
  const equityCurve = useMemo(() => buildEquityCurve(dailyPnl), [dailyPnl]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
          <Activity size={20} className="text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Running PnL Analysis</h1>
          <p className="text-sm text-muted">Cumulative profit & loss over time</p>
        </div>
      </div>

      <div className="glass rounded-2xl border border-border/50 p-8 text-center">
        <p className="text-muted text-sm">
          {equityCurve.length} data points across {filtered.length} trades. Detailed content coming soon.
        </p>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trade } from "@/lib/types";
import { BarChart3 } from "lucide-react";

export default function OpenTradesSummaryPage() {
  const supabase = createClient();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrades = useCallback(async () => {
    const { data } = await supabase
      .from("trades")
      .select("*")
      .is("close_timestamp", null)
      .order("open_timestamp", { ascending: false });
    const dbTrades = (data as Trade[]) ?? [];
    setTrades(dbTrades);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  const openTrades = useMemo(() => trades, [trades]);

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
          <BarChart3 size={20} className="text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Open Trades Summary</h1>
          <p className="text-sm text-muted">Currently open positions and unrealized P&L</p>
        </div>
      </div>

      <div className="glass rounded-2xl border border-border/50 p-8 text-center">
        <p className="text-muted text-sm">
          {openTrades.length} open position{openTrades.length !== 1 ? "s" : ""}. Detailed content coming soon.
        </p>
      </div>
    </div>
  );
}

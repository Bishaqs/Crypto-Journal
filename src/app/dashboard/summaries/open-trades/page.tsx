"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trade } from "@/lib/types";
import { calculateTradePnl } from "@/lib/calculations";
import { BarChart3, TrendingUp, DollarSign, Clock } from "lucide-react";

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
    setTrades((data as Trade[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchTrades(); }, [fetchTrades]);

  const openTrades = useMemo(() => trades, [trades]);

  const totalUnrealized = useMemo(
    () => openTrades.reduce((sum, t) => sum + (t.pnl ?? calculateTradePnl(t) ?? 0), 0),
    [openTrades],
  );

  const largestPosition = useMemo(() => {
    if (openTrades.length === 0) return null;
    return openTrades.reduce((max, t) => {
      const size = t.quantity * t.entry_price;
      return size > (max.quantity * max.entry_price) ? t : max;
    }, openTrades[0]);
  }, [openTrades]);

  function formatDuration(openTimestamp: string): string {
    const ms = Date.now() - new Date(openTimestamp).getTime();
    const hours = Math.floor(ms / 3600000);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }

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
          <BarChart3 size={20} className="text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Open Trades Summary</h1>
          <p className="text-sm text-muted">
            {openTrades.length} open position{openTrades.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="glass rounded-2xl border border-border/50 p-4" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp size={13} className="text-accent" />
            <span className="text-[10px] uppercase tracking-wider text-muted font-semibold">Open Positions</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{openTrades.length}</p>
        </div>
        <div className="glass rounded-2xl border border-border/50 p-4" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center gap-1.5 mb-2">
            <DollarSign size={13} className={totalUnrealized >= 0 ? "text-win" : "text-loss"} />
            <span className="text-[10px] uppercase tracking-wider text-muted font-semibold">Unrealized P&L</span>
          </div>
          <p className={`text-2xl font-bold ${totalUnrealized >= 0 ? "text-win" : "text-loss"}`}>
            {totalUnrealized >= 0 ? "+" : ""}${totalUnrealized.toFixed(2)}
          </p>
        </div>
        {largestPosition && (
          <div className="glass rounded-2xl border border-border/50 p-4" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center gap-1.5 mb-2">
              <Clock size={13} className="text-accent" />
              <span className="text-[10px] uppercase tracking-wider text-muted font-semibold">Largest Position</span>
            </div>
            <p className="text-lg font-bold text-foreground">{largestPosition.symbol}</p>
            <p className="text-sm text-muted">${(largestPosition.quantity * largestPosition.entry_price).toFixed(2)}</p>
          </div>
        )}
      </div>

      {openTrades.length === 0 ? (
        <div className="glass rounded-2xl border border-border/50 p-12 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
          <BarChart3 size={48} className="text-accent/40 mx-auto mb-4" />
          <p className="text-lg font-semibold text-foreground mb-2">No open positions</p>
          <p className="text-sm text-muted">All trades are closed. Open a new position to see it here.</p>
        </div>
      ) : (
        <div className="glass rounded-2xl border border-border/50 overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-left">
                  <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-muted font-semibold">Symbol</th>
                  <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-muted font-semibold">Side</th>
                  <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-muted font-semibold text-right">Entry Price</th>
                  <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-muted font-semibold text-right">Quantity</th>
                  <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-muted font-semibold text-right">Size</th>
                  <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-muted font-semibold text-right">Unrealized P&L</th>
                  <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-muted font-semibold text-right">Duration</th>
                </tr>
              </thead>
              <tbody>
                {openTrades.map((t) => {
                  const pnl = t.pnl ?? calculateTradePnl(t) ?? 0;
                  return (
                    <tr key={t.id} className="border-b border-border/30 last:border-0 hover:bg-surface-hover/50 transition-colors">
                      <td className="px-4 py-2.5 font-semibold text-foreground">{t.symbol}</td>
                      <td className="px-4 py-2.5">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          t.position === "long" ? "bg-win/10 text-win" : "bg-loss/10 text-loss"
                        }`}>
                          {t.position}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-muted">${t.entry_price.toFixed(2)}</td>
                      <td className="px-4 py-2.5 text-right text-muted">{t.quantity}</td>
                      <td className="px-4 py-2.5 text-right text-muted">${(t.quantity * t.entry_price).toFixed(2)}</td>
                      <td className={`px-4 py-2.5 text-right font-semibold ${pnl >= 0 ? "text-win" : "text-loss"}`}>
                        {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-muted">{formatDuration(t.open_timestamp)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

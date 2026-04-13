"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trade, PhantomTrade } from "@/lib/types";
import { calculateTradePnl } from "@/lib/calculations";
import { BarChart3, TrendingUp, DollarSign, Clock, Ghost, ArrowUpRight, ArrowDownRight, Target } from "lucide-react";
import Link from "next/link";

export default function OpenTradesSummaryPage() {
  const supabase = createClient();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [phantoms, setPhantoms] = useState<PhantomTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"active" | "ghost">("active");

  const fetchTrades = useCallback(async () => {
    const { data } = await supabase
      .from("trades")
      .select("*")
      .is("close_timestamp", null)
      .order("open_timestamp", { ascending: false });
    return (data as Trade[]) ?? [];
  }, [supabase]);

  const fetchPhantoms = useCallback(async () => {
    const { data } = await supabase
      .from("phantom_trades")
      .select("*")
      .in("status", ["pending", "active"])
      .order("observed_at", { ascending: false });
    return (data as PhantomTrade[]) ?? [];
  }, [supabase]);

  useEffect(() => {
    Promise.all([fetchTrades(), fetchPhantoms()]).then(([t, p]) => {
      setTrades(t);
      setPhantoms(p);
      setLoading(false);
    });
  }, [fetchTrades, fetchPhantoms]);

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

  const towardTargetCount = useMemo(() => {
    return phantoms.filter((p) => {
      if (p.profit_target == null) return false;
      const bestPrice = p.position === "long" ? p.price_high_since : p.price_low_since;
      if (bestPrice == null) return false;
      const distToTarget = Math.abs(bestPrice - p.profit_target);
      const distToStop = p.stop_loss != null ? Math.abs(bestPrice - p.stop_loss) : Infinity;
      return distToTarget < distToStop;
    }).length;
  }, [phantoms]);

  function formatDuration(openTimestamp: string): string {
    const ms = Date.now() - new Date(openTimestamp).getTime();
    const hours = Math.floor(ms / 3600000);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }

  function daysElapsed(observedAt: string): number {
    return Math.ceil((Date.now() - new Date(observedAt).getTime()) / (1000 * 60 * 60 * 24));
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
          <h1 className="text-2xl font-bold text-foreground">Positions</h1>
          <p className="text-sm text-muted">
            {openTrades.length} open position{openTrades.length !== 1 ? "s" : ""}
            {phantoms.length > 0 && ` · ${phantoms.length} ghost trade${phantoms.length !== 1 ? "s" : ""}`}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-muted/30 p-1 max-w-xs">
        <button
          onClick={() => setTab("active")}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${tab === "active" ? "bg-surface text-foreground shadow-sm" : "text-muted hover:text-foreground"}`}
        >
          Active ({openTrades.length})
        </button>
        <button
          onClick={() => setTab("ghost")}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${tab === "ghost" ? "bg-surface text-foreground shadow-sm" : "text-muted hover:text-foreground"}`}
        >
          <Ghost size={14} />
          Ghost ({phantoms.length})
        </button>
      </div>

      {/* Active Tab */}
      {tab === "active" && (
        <>
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
        </>
      )}

      {/* Ghost Tab */}
      {tab === "ghost" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="glass rounded-2xl border border-border/50 p-4" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="flex items-center gap-1.5 mb-2">
                <Ghost size={13} className="text-muted" />
                <span className="text-[10px] uppercase tracking-wider text-muted font-semibold">Ghost Trades</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{phantoms.length}</p>
            </div>
            <div className="glass rounded-2xl border border-border/50 p-4" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="flex items-center gap-1.5 mb-2">
                <DollarSign size={13} className="text-accent" />
                <span className="text-[10px] uppercase tracking-wider text-muted font-semibold">Hypothetical Exposure</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                ${phantoms.reduce((sum, p) => sum + p.entry_price, 0).toFixed(2)}
              </p>
            </div>
            <div className="glass rounded-2xl border border-border/50 p-4" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="flex items-center gap-1.5 mb-2">
                <Target size={13} className="text-win" />
                <span className="text-[10px] uppercase tracking-wider text-muted font-semibold">Toward Target</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{towardTargetCount}</p>
            </div>
          </div>

          {phantoms.length === 0 ? (
            <div className="glass rounded-2xl border border-border/50 p-12 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
              <Ghost size={48} className="text-muted/30 mx-auto mb-4" />
              <p className="text-lg font-semibold text-foreground mb-2">No ghost trades</p>
              <p className="text-sm text-muted mb-4">Log a &quot;What If&quot; setup to track missed opportunities.</p>
              <Link
                href="/dashboard/trades/phantoms"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent/10 text-accent font-semibold text-sm hover:bg-accent/20 transition-colors"
              >
                <Ghost size={16} />
                Go to What If
              </Link>
            </div>
          ) : (
            <div className="glass rounded-2xl border border-border/50 border-dashed overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50 text-left">
                      <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-muted font-semibold">Symbol</th>
                      <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-muted font-semibold">Side</th>
                      <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-muted font-semibold text-right">Entry Price</th>
                      <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-muted font-semibold text-right">Stop Loss</th>
                      <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-muted font-semibold text-right">Profit Target</th>
                      <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-muted font-semibold">Thesis</th>
                      <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-muted font-semibold text-right">Days Active</th>
                      <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-muted font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {phantoms.map((p) => (
                      <tr
                        key={p.id}
                        className="border-b border-border/30 last:border-0 hover:bg-surface-hover/50 transition-colors border-l-2 border-l-muted/20 border-dashed cursor-pointer"
                        onClick={() => window.location.href = `/dashboard/trades/phantoms/${p.id}`}
                      >
                        <td className="px-4 py-2.5">
                          <span className="flex items-center gap-1.5">
                            <Ghost size={12} className="text-muted/50" />
                            <span className="font-semibold text-foreground/80">{p.symbol}</span>
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                            p.position === "long" ? "bg-win/10 text-win" : "bg-loss/10 text-loss"
                          }`}>
                            {p.position === "long" ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                            {p.position}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right text-muted/70">${p.entry_price.toFixed(2)}</td>
                        <td className="px-4 py-2.5 text-right text-loss/70">{p.stop_loss != null ? `$${p.stop_loss.toFixed(2)}` : "\u2014"}</td>
                        <td className="px-4 py-2.5 text-right text-win/70">{p.profit_target != null ? `$${p.profit_target.toFixed(2)}` : "\u2014"}</td>
                        <td className="px-4 py-2.5 text-muted/70 max-w-[200px] truncate">{p.thesis ?? "\u2014"}</td>
                        <td className="px-4 py-2.5 text-right text-muted/70">{daysElapsed(p.observed_at)}d</td>
                        <td className="px-4 py-2.5">
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${
                            p.status === "pending" ? "bg-amber-400/10 text-amber-400" : "bg-blue-400/10 text-blue-400"
                          }`}>
                            {p.status === "pending" ? "Pending" : "Active"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 border-t border-border/30">
                <Link
                  href="/dashboard/trades/phantoms"
                  className="text-xs text-accent hover:text-accent-hover font-medium transition-colors"
                >
                  View all ghost trades &rarr;
                </Link>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

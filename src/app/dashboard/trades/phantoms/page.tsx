"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { PhantomTrade } from "@/lib/types";
import { TradeForm } from "@/components/trade-form";
import { TradingViewMiniChart } from "@/components/tradingview-mini-chart";
import { Ghost, Plus, ArrowUpRight, ArrowDownRight, Clock, CheckCircle2, Target, ShieldAlert, XCircle, Radio } from "lucide-react";
import Link from "next/link";

export default function PhantomTradesPage() {
  const supabase = createClient();
  const [phantoms, setPhantoms] = useState<PhantomTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"active" | "resolved">("active");
  const [showForm, setShowForm] = useState(false);
  const [editPhantom, setEditPhantom] = useState<PhantomTrade | null>(null);

  const fetchPhantoms = useCallback(async () => {
    const { data, error } = await supabase
      .from("phantom_trades")
      .select("*")
      .order("observed_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch phantom trades:", error.message);
      return;
    }
    setPhantoms(data ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchPhantoms();
  }, [fetchPhantoms]);

  const active = phantoms.filter((p) => p.status === "active" || p.status === "pending");
  const resolved = phantoms.filter((p) => p.status === "resolved" || p.status === "cancelled");
  const displayed = tab === "active" ? active : resolved;

  function daysElapsed(observedAt: string): number {
    return Math.ceil((Date.now() - new Date(observedAt).getTime()) / (1000 * 60 * 60 * 24));
  }

  function getDirectionIndicator(p: PhantomTrade) {
    if (p.price_high_since == null && p.price_low_since == null) return null;
    const currentApprox = p.position === "long"
      ? (p.price_high_since ?? p.entry_price)
      : (p.price_low_since ?? p.entry_price);
    if (p.profit_target != null) {
      const distToTarget = Math.abs(currentApprox - p.profit_target);
      const distToStop = p.stop_loss != null ? Math.abs(currentApprox - p.stop_loss) : Infinity;
      if (distToTarget < distToStop) return "toward-target";
    }
    if (p.stop_loss != null) return "toward-stop";
    return null;
  }

  function toTvSymbol(symbol: string): string {
    const s = symbol.toUpperCase();
    if (s.includes(":")) return s;
    return `BINANCE:${s}USDT`;
  }

  function statusLabel(p: PhantomTrade) {
    if (p.status === "pending") return { text: "Pending", color: "text-amber-400 bg-amber-400/10", icon: Radio };
    if (p.status === "cancelled") return { text: "Cancelled", color: "text-muted-foreground bg-muted/50", icon: XCircle };
    switch (p.outcome) {
      case "target_hit": return { text: "Target Hit", color: "text-green-400 bg-green-400/10", icon: CheckCircle2 };
      case "stop_hit": return { text: "Stop Hit", color: "text-red-400 bg-red-400/10", icon: ShieldAlert };
      case "partial": return { text: "Partial", color: "text-yellow-400 bg-yellow-400/10", icon: null };
      case "neither": return { text: "Neither", color: "text-muted-foreground bg-muted/50", icon: null };
      default:
        return p.order_type === "limit" && p.status === "active"
          ? { text: "Filled", color: "text-green-400 bg-green-400/10", icon: CheckCircle2 }
          : { text: "Active", color: "text-blue-400 bg-blue-400/10", icon: null };
    }
  }

  async function cancelOrder(id: string) {
    const { error } = await supabase
      .from("phantom_trades")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("id", id);
    if (!error) fetchPhantoms();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Ghost size={24} className="text-muted-foreground" />
          <div>
            <h1 className="text-xl font-bold">What If</h1>
            <p className="text-sm text-muted-foreground">Track setups you passed on — would they have worked?</p>
          </div>
        </div>
        <button
          onClick={() => { setEditPhantom(null); setShowForm(true); }}
          className="flex items-center gap-2 rounded-lg bg-accent/20 border border-accent/30 text-accent px-4 py-2 text-sm font-semibold hover:bg-accent/30 transition-colors"
        >
          <Plus size={16} />
          Log Setup
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-muted/30 p-1">
        <button
          onClick={() => setTab("active")}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${tab === "active" ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        >
          Active ({active.length})
        </button>
        <button
          onClick={() => setTab("resolved")}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${tab === "resolved" ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        >
          Resolved ({resolved.length})
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-12">
          <Ghost size={48} className="mx-auto mb-4 text-muted-foreground/30" />
          <p className="text-muted-foreground">
            {tab === "active" ? "No active setups. Log one to start tracking missed opportunities." : "No resolved setups yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((p) => {
            const badge = statusLabel(p);
            const BadgeIcon = badge.icon;
            const direction = getDirectionIndicator(p);
            const days = daysElapsed(p.observed_at);
            const trendColor = p.position === "long"
              ? "rgba(74, 222, 128, 1)"   // green-400
              : "rgba(248, 113, 113, 1)";  // red-400

            return (
              <div
                key={p.id}
                className="rounded-xl bg-surface border border-border overflow-hidden hover:border-accent/30 transition-colors"
              >
                <Link
                  href={`/dashboard/trades/phantoms/${p.id}`}
                  className="block"
                >
                <div className="flex flex-col sm:flex-row">
                  {/* Info section */}
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`flex-shrink-0 rounded-lg p-2 ${p.position === "long" ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"}`}>
                          {p.position === "long" ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{p.symbol}</span>
                            <span className={`text-xs font-medium ${p.position === "long" ? "text-green-400" : "text-red-400"}`}>
                              {p.position.toUpperCase()}
                            </span>
                            {p.order_type === "limit" && (
                              <span className="text-[10px] font-semibold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">
                                LIMIT
                              </span>
                            )}
                            {direction === "toward-target" && (
                              <span className="flex items-center gap-1 text-xs text-green-400">
                                <Target size={12} /> Toward target
                              </span>
                            )}
                            {direction === "toward-stop" && (
                              <span className="flex items-center gap-1 text-xs text-red-400">
                                <ShieldAlert size={12} /> Toward stop
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                            <span>Entry: ${p.entry_price.toLocaleString()}</span>
                            {p.stop_loss && <span>SL: ${p.stop_loss.toLocaleString()}</span>}
                            {p.profit_target && <span>TP: ${p.profit_target.toLocaleString()}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-right">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock size={12} />
                          {days}d
                        </div>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${badge.color}`}>
                          {BadgeIcon && <BadgeIcon size={12} />}
                          {badge.text}
                        </span>
                      </div>
                    </div>

                    {p.thesis && (
                      <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{p.thesis}</p>
                    )}

                    {p.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {p.tags.slice(0, 4).map((tag) => (
                          <span key={tag} className="rounded-full bg-muted/50 px-2 py-0.5 text-[10px] text-muted-foreground">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* TradingView mini chart */}
                  <div className="w-full sm:w-56 h-32 sm:h-auto flex-shrink-0 pointer-events-none">
                    <TradingViewMiniChart
                      symbol={toTvSymbol(p.symbol)}
                      height={128}
                      dateRange="1M"
                      trendColor={trendColor}
                    />
                  </div>
                </div>
                </Link>
                {/* Cancel button for pending limit orders */}
                {p.status === "pending" && p.order_type === "limit" && (
                  <div className="px-4 pb-3">
                    <button
                      onClick={(e) => { e.preventDefault(); cancelOrder(p.id); }}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-red-400 transition-colors"
                    >
                      <XCircle size={12} />
                      Cancel Order
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <TradeForm
          onClose={() => { setShowForm(false); setEditPhantom(null); }}
          onSaved={() => { setShowForm(false); setEditPhantom(null); fetchPhantoms(); }}
          editPhantom={editPhantom}
          initialWhatIf
        />
      )}
    </div>
  );
}

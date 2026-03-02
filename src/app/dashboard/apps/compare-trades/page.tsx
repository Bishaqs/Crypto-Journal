"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trade } from "@/lib/types";
import { DEMO_TRADES } from "@/lib/demo-data";
import { calculateTradePnl } from "@/lib/calculations";
import { ArrowLeftRight, Search, X, TrendingUp, TrendingDown, Clock, Tag, Loader2 } from "lucide-react";
import { Header } from "@/components/header";
import { useSubscription } from "@/lib/use-subscription";
import { UpgradePrompt } from "@/components/upgrade-prompt";
import { usePageTour } from "@/lib/use-page-tour";
import { PageInfoButton } from "@/components/ui/page-info-button";

function formatDate(ts: string | null) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDuration(open: string | null, close: string | null) {
  if (!open || !close) return "Open";
  const ms = new Date(close).getTime() - new Date(open).getTime();
  const hours = Math.floor(ms / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  return `${hours}h ${mins}m`;
}

export default function CompareTradesPage() {
  usePageTour("compare-trades-page");
  const { hasAccess, loading: subLoading } = useSubscription();
  const supabase = createClient();

  const [allTrades, setAllTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Trade[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("trades").select("*").order("open_timestamp", { ascending: false });
      const trades = ((data as Trade[]) ?? []).length > 0 ? (data as Trade[]) : DEMO_TRADES;
      setAllTrades(trades.filter((t) => t.close_timestamp && t.exit_price !== null));
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = allTrades.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (t.symbol ?? "").toLowerCase().includes(q) || (t.notes ?? "").toLowerCase().includes(q);
  });

  function toggleSelect(trade: Trade) {
    setSelected((prev) => {
      if (prev.find((t) => t.id === trade.id)) return prev.filter((t) => t.id !== trade.id);
      if (prev.length >= 4) return prev;
      return [...prev, trade];
    });
  }

  if (subLoading) return null;
  if (!hasAccess("advanced-analytics")) return <UpgradePrompt feature="advanced-analytics" requiredTier="pro" />;

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 size={24} className="animate-spin text-accent" /></div>;
  }

  return (
    <div className="space-y-6 mx-auto max-w-[1600px]">
      <Header />

      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <ArrowLeftRight size={24} className="text-accent" />
          Compare Trades
          <PageInfoButton tourName="compare-trades-page" />
        </h2>
        <p className="text-sm text-muted mt-0.5">
          Side-by-side comparison of up to 4 trades
        </p>
      </div>

      {/* Trade selector */}
      <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/60" />
            <input
              type="text"
              placeholder="Search by symbol or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50 transition-all"
            />
          </div>
          <span className="text-xs text-muted">{selected.length}/4 selected</span>
        </div>

        {/* Selected chips */}
        {selected.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {selected.map((t) => (
              <button
                key={t.id}
                onClick={() => toggleSelect(t)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 text-accent text-xs font-medium hover:bg-accent/20 transition-all"
              >
                {t.symbol} <X size={12} />
              </button>
            ))}
          </div>
        )}

        {/* Trade list */}
        <div className="max-h-[200px] overflow-y-auto space-y-1">
          {filtered.slice(0, 50).map((t) => {
            const pnl = t.pnl ?? calculateTradePnl(t) ?? 0;
            const isSelected = selected.some((s) => s.id === t.id);
            return (
              <button
                key={t.id}
                onClick={() => toggleSelect(t)}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm transition-colors ${
                  isSelected ? "bg-accent/10 text-accent" : "text-muted hover:text-foreground hover:bg-surface-hover"
                }`}
              >
                <span className="font-medium">{t.symbol}</span>
                <span className="text-xs text-muted">{formatDate(t.open_timestamp)}</span>
                <span className={`text-xs font-bold ${pnl >= 0 ? "text-win" : "text-loss"}`}>
                  {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Comparison table */}
      {selected.length >= 2 && (
        <div className="glass rounded-2xl border border-border/50 p-5 overflow-x-auto" style={{ boxShadow: "var(--shadow-card)" }}>
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">Comparison</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/30">
                <th className="text-left text-[10px] text-muted/60 uppercase tracking-wider font-semibold py-2 pr-4">Attribute</th>
                {selected.map((t) => (
                  <th key={t.id} className="text-left text-[10px] text-muted/60 uppercase tracking-wider font-semibold py-2 px-2">
                    {t.symbol}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              <tr>
                <td className="py-2.5 pr-4 text-muted text-xs">Direction</td>
                {selected.map((t) => (
                  <td key={t.id} className="py-2.5 px-2 font-medium text-foreground">
                    {t.position === "long" ? "Long" : "Short"}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 pr-4 text-muted text-xs">Entry Price</td>
                {selected.map((t) => (
                  <td key={t.id} className="py-2.5 px-2 font-medium text-foreground">
                    ${t.entry_price?.toFixed(2) ?? "—"}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 pr-4 text-muted text-xs">Exit Price</td>
                {selected.map((t) => (
                  <td key={t.id} className="py-2.5 px-2 font-medium text-foreground">
                    ${t.exit_price?.toFixed(2) ?? "—"}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 pr-4 text-muted text-xs">P&L</td>
                {selected.map((t) => {
                  const pnl = t.pnl ?? calculateTradePnl(t) ?? 0;
                  return (
                    <td key={t.id} className={`py-2.5 px-2 font-bold ${pnl >= 0 ? "text-win" : "text-loss"}`}>
                      {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td className="py-2.5 pr-4 text-muted text-xs">Duration</td>
                {selected.map((t) => (
                  <td key={t.id} className="py-2.5 px-2 text-foreground">
                    {formatDuration(t.open_timestamp, t.close_timestamp)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 pr-4 text-muted text-xs">Opened</td>
                {selected.map((t) => (
                  <td key={t.id} className="py-2.5 px-2 text-foreground text-xs">
                    {formatDate(t.open_timestamp)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 pr-4 text-muted text-xs">Tags</td>
                {selected.map((t) => (
                  <td key={t.id} className="py-2.5 px-2">
                    <div className="flex flex-wrap gap-1">
                      {(t.tags ?? []).map((tag: string) => (
                        <span key={tag} className="px-1.5 py-0.5 rounded-md bg-accent/10 text-accent text-[10px]">
                          {tag}
                        </span>
                      ))}
                      {(!t.tags || t.tags.length === 0) && <span className="text-muted text-xs">—</span>}
                    </div>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 pr-4 text-muted text-xs">Notes</td>
                {selected.map((t) => (
                  <td key={t.id} className="py-2.5 px-2 text-foreground text-xs max-w-[200px] truncate">
                    {t.notes || "—"}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {selected.length < 2 && (
        <div className="glass rounded-2xl border border-border/50 p-12 flex flex-col items-center justify-center text-center" style={{ boxShadow: "var(--shadow-card)" }}>
          <ArrowLeftRight size={48} className="text-accent/30 mb-4" />
          <h3 className="text-lg font-bold text-foreground mb-2">Select at Least 2 Trades</h3>
          <p className="text-sm text-muted max-w-xs">
            Search for trades above and select 2-4 to compare them side by side.
          </p>
        </div>
      )}
    </div>
  );
}

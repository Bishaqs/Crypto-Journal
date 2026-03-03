"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Share2, Copy, Check, Link2, Eye, EyeOff, Loader2, ExternalLink, Search } from "lucide-react";
import { Header } from "@/components/header";
import { useTheme } from "@/lib/theme-context";
import { getChartColors } from "@/lib/chart-colors";
import { useSubscription } from "@/lib/use-subscription";
import { UpgradePrompt } from "@/components/upgrade-prompt";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { createClient } from "@/lib/supabase/client";
import { Trade } from "@/lib/types";
import { calculateTradePnl } from "@/lib/calculations";

function StatBlock({ label, value, color = "text-foreground" }: { label: string; value: string; color?: string }) {
  return (
    <div className="glass rounded-xl border border-border/50 p-4 hover:border-accent/20 transition-all duration-300" style={{ boxShadow: "var(--shadow-card)" }}>
      <p className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}

function generateShareUrl(tradeId: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/shared/trade/${tradeId}`;
  }
  return `/shared/trade/${tradeId}`;
}

export default function SharedTradesPage() {
  const { hasAccess, loading: subLoading } = useSubscription();
  const { theme } = useTheme();
  const colors = getChartColors(theme);
  const supabase = createClient();

  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [sharedIds, setSharedIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchTrades = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("trades")
        .select("*")
        .not("close_timestamp", "is", null)
        .order("close_timestamp", { ascending: false });
      setTrades((data as Trade[]) ?? []);

      // Load shared state from localStorage
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("stargate-shared-trades");
        if (stored) {
          try {
            setSharedIds(new Set(JSON.parse(stored)));
          } catch {
            // ignore parse errors
          }
        }
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  function toggleShare(tradeId: string) {
    setSharedIds((prev) => {
      const next = new Set(prev);
      if (next.has(tradeId)) {
        next.delete(tradeId);
      } else {
        next.add(tradeId);
      }
      // Persist to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("stargate-shared-trades", JSON.stringify([...next]));
      }
      return next;
    });
  }

  async function copyLink(tradeId: string) {
    const url = generateShareUrl(tradeId);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(tradeId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // fallback
      const textArea = document.createElement("textarea");
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopiedId(tradeId);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }

  const closedTrades = useMemo(() => {
    let result = trades.filter((t) => t.close_timestamp && t.exit_price !== null);
    if (search) {
      const q = search.toUpperCase();
      result = result.filter((t) => t.symbol.toUpperCase().includes(q));
    }
    return result;
  }, [trades, search]);

  const sharedTrades = useMemo(() => {
    return closedTrades.filter((t) => sharedIds.has(t.id));
  }, [closedTrades, sharedIds]);

  const unsharedTrades = useMemo(() => {
    return closedTrades.filter((t) => !sharedIds.has(t.id));
  }, [closedTrades, sharedIds]);

  const totalSharedPnl = sharedTrades.reduce((sum, t) => sum + (t.pnl ?? calculateTradePnl(t) ?? 0), 0);
  const sharedWinRate = sharedTrades.length > 0
    ? (sharedTrades.filter((t) => (t.pnl ?? calculateTradePnl(t) ?? 0) > 0).length / sharedTrades.length) * 100
    : 0;

  if (subLoading) return null;
  if (!hasAccess("advanced-analytics")) return <UpgradePrompt feature="advanced-analytics" requiredTier="pro" />;

  function TradeRow({ trade, isShared }: { trade: Trade; isShared: boolean }) {
    const pnl = trade.pnl ?? calculateTradePnl(trade) ?? 0;
    const isWin = pnl > 0;
    const closeDate = trade.close_timestamp ? new Date(trade.close_timestamp).toLocaleDateString() : "N/A";

    return (
      <div
        className={`p-4 rounded-xl border transition-all ${
          isShared
            ? "bg-accent/5 border-accent/20"
            : "bg-background/50 border-border/30 hover:border-border/50"
        }`}
      >
        <div className="flex items-center justify-between gap-4">
          {/* Trade Info */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">{trade.symbol}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase ${
                    trade.position === "long" ? "bg-win/10 text-win" : "bg-loss/10 text-loss"
                  }`}
                >
                  {trade.position}
                </span>
                {trade.tags.length > 0 && (
                  <span className="text-[10px] text-muted/40 truncate max-w-[100px]">
                    {trade.tags.slice(0, 2).join(", ")}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-[10px] text-muted">
                  ${trade.entry_price.toFixed(2)} → ${trade.exit_price?.toFixed(2) ?? "—"}
                </span>
                <span className="text-[10px] text-muted/40">{closeDate}</span>
              </div>
            </div>
          </div>

          {/* P&L */}
          <div className="text-right mr-4">
            <p className={`text-sm font-bold tabular-nums ${isWin ? "text-win" : "text-loss"}`}>
              {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
            </p>
            <p className="text-[10px] text-muted">qty: {trade.quantity}</p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleShare(trade.id)}
              className={`p-2 rounded-lg transition-all ${
                isShared
                  ? "bg-accent/10 text-accent hover:bg-accent/20"
                  : "bg-surface hover:bg-surface-hover text-muted hover:text-foreground"
              }`}
              title={isShared ? "Unshare trade" : "Share trade"}
            >
              {isShared ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>

            {isShared && (
              <button
                onClick={() => copyLink(trade.id)}
                className="p-2 rounded-lg bg-surface hover:bg-surface-hover text-muted hover:text-foreground transition-all"
                title="Copy share link"
              >
                {copiedId === trade.id ? (
                  <Check size={16} className="text-win" />
                ) : (
                  <Copy size={16} />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Share URL (shown when shared) */}
        {isShared && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-background/80 border border-border/20">
            <Link2 size={12} className="text-accent shrink-0" />
            <code className="text-[10px] text-muted truncate flex-1">
              {generateShareUrl(trade.id)}
            </code>
            <button
              onClick={() => copyLink(trade.id)}
              className="text-[10px] text-accent hover:text-accent-hover transition-colors shrink-0 font-medium"
            >
              {copiedId === trade.id ? "Copied!" : "Copy"}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 mx-auto max-w-[1600px]">
      <Header />

      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <Share2 size={24} className="text-accent" />
          Shared Trades
          <InfoTooltip text="Generate shareable links for your closed trades. Recipients can view your trade details without needing an account." size={14} />
        </h2>
        <p className="text-sm text-muted mt-0.5">
          Share your closed trades with a unique link
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 size={24} className="animate-spin text-accent" />
        </div>
      ) : closedTrades.length === 0 ? (
        <div
          className="glass rounded-2xl border border-border/50 p-12 flex flex-col items-center justify-center text-center"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <Share2 size={48} className="text-accent/30 mb-4" />
          <h3 className="text-lg font-bold text-foreground mb-2">No Closed Trades</h3>
          <p className="text-sm text-muted max-w-xs">
            Close some trades first, then come back here to share them with others.
          </p>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatBlock label="Shared Trades" value={String(sharedTrades.length)} color="text-accent" />
            <StatBlock label="Total Closed" value={String(closedTrades.length)} />
            <StatBlock
              label="Shared P&L"
              value={`${totalSharedPnl >= 0 ? "+" : ""}$${totalSharedPnl.toFixed(0)}`}
              color={totalSharedPnl >= 0 ? "text-win" : "text-loss"}
            />
            <StatBlock
              label="Shared Win Rate"
              value={sharedTrades.length > 0 ? `${sharedWinRate.toFixed(0)}%` : "N/A"}
              color={sharedWinRate >= 50 ? "text-win" : "text-loss"}
            />
          </div>

          {/* Search */}
          <div className="relative max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/40" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by symbol..."
              className="w-full bg-surface border border-border rounded-xl pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted/30 focus:outline-none focus:border-accent/50 transition-all"
            />
          </div>

          {/* Your Shared Trades Section */}
          {sharedTrades.length > 0 && (
            <div className="glass rounded-2xl border border-accent/20 p-5 space-y-3" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                  <ExternalLink size={14} className="text-accent" />
                  Your Shared Trades ({sharedTrades.length})
                </h3>
              </div>
              <div className="space-y-2">
                {sharedTrades.map((trade) => (
                  <TradeRow key={trade.id} trade={trade} isShared />
                ))}
              </div>
            </div>
          )}

          {/* All Closed Trades */}
          <div className="glass rounded-2xl border border-border/50 p-5 space-y-3" style={{ boxShadow: "var(--shadow-card)" }}>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              {sharedTrades.length > 0 ? "Other Closed Trades" : "All Closed Trades"} ({unsharedTrades.length})
            </h3>
            {unsharedTrades.length === 0 ? (
              <p className="text-xs text-muted py-4 text-center">
                {search ? "No trades match your search." : "All trades are already shared!"}
              </p>
            ) : (
              <div className="space-y-2">
                {unsharedTrades.slice(0, 50).map((trade) => (
                  <TradeRow key={trade.id} trade={trade} isShared={false} />
                ))}
                {unsharedTrades.length > 50 && (
                  <p className="text-[10px] text-muted/40 text-center pt-2">
                    Showing 50 of {unsharedTrades.length} trades
                  </p>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

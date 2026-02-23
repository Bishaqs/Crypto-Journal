"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trade } from "@/lib/types";
import { DEMO_TRADES } from "@/lib/demo-data";
import { calculateTradePnl } from "@/lib/calculations";
import {
  BookMarked,
  Plus,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Target,
  BarChart3,
  Sparkles,
  X,
} from "lucide-react";
import { Header } from "@/components/header";
import { useSubscription } from "@/lib/use-subscription";
import { UpgradePrompt } from "@/components/upgrade-prompt";

type PlaybookEntry = {
  id: string;
  name: string;
  description: string;
  entryRules: string[];
  exitRules: string[];
  stopLoss: string;
  tags: string[];
};

const DEMO_PLAYBOOK: PlaybookEntry[] = [
  {
    id: "pb-1",
    name: "4H Range Breakout",
    description: "Price consolidates in a clear range for 3+ days with declining volume. Enter on 4H candle close above/below range, ideally on the retest.",
    entryRules: [
      "3+ days of range-bound consolidation",
      "Declining volume during consolidation",
      "BTC not in a downtrend (4H & Daily)",
      "Wait for 4H candle CLOSE — no wicks",
      "Enter on retest of breakout level",
    ],
    exitRules: [
      "TP1 at 1:1 R:R (take 50% off)",
      "TP2 at range height projection (trail stop to entry)",
      "TP3: let runner ride with trailing stop",
    ],
    stopLoss: "Below opposite side of range with small buffer",
    tags: ["breakout", "4h", "range"],
  },
  {
    id: "pb-2",
    name: "200MA Bounce",
    description: "Price pulls back to the 200-period moving average on the 4H chart and shows a strong bounce with volume confirmation.",
    entryRules: [
      "Price in an overall uptrend (higher highs, higher lows)",
      "Pullback touches or wicks below 200MA on 4H",
      "Bullish candle pattern at MA (hammer, engulfing)",
      "Volume spike on the bounce candle",
      "RSI not overbought (below 70)",
    ],
    exitRules: [
      "TP1 at previous swing high",
      "TP2 at 2:1 R:R",
      "Trail stop below each new higher low",
    ],
    stopLoss: "Below the 200MA wick low with 1% buffer",
    tags: ["reversal", "ma-bounce", "trend-follow"],
  },
  {
    id: "pb-3",
    name: "Funding Rate Divergence",
    description: "When funding rates are extremely negative but price is holding support, the market is overly short. Enter long for a squeeze.",
    entryRules: [
      "Funding rate below -0.03% on major exchanges",
      "Price holding a key support level",
      "Open interest rising (shorts piling in)",
      "Volume declining on sell attempts",
      "BTC dominance stable or rising",
    ],
    exitRules: [
      "TP1 when funding normalizes (back to 0.01%)",
      "TP2 at next resistance level",
      "Close if funding goes more negative than -0.05%",
    ],
    stopLoss: "Below the support level being defended",
    tags: ["funding", "squeeze", "crypto-native"],
  },
];

type SetupStats = {
  tradeCount: number;
  winRate: number;
  totalPnl: number;
  avgPnl: number;
  avgProcess: number;
};

export default function PlaybookPage() {
  const { hasAccess, loading: subLoading } = useSubscription();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const supabase = createClient();

  const fetchTrades = useCallback(async () => {
    const { data } = await supabase
      .from("trades")
      .select("*")
      .order("open_timestamp", { ascending: false });
    const dbTrades = (data as Trade[]) ?? [];
    setTrades(dbTrades.length === 0 ? DEMO_TRADES : dbTrades);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  // Calculate stats per setup type from trades
  const setupStats = useMemo(() => {
    const map = new Map<string, { pnl: number; wins: number; count: number; processTotal: number; processCount: number }>();
    for (const t of trades.filter((t) => t.close_timestamp && t.setup_type)) {
      const p = t.pnl ?? calculateTradePnl(t) ?? 0;
      const e = map.get(t.setup_type!) ?? { pnl: 0, wins: 0, count: 0, processTotal: 0, processCount: 0 };
      map.set(t.setup_type!, {
        pnl: e.pnl + p,
        wins: e.wins + (p > 0 ? 1 : 0),
        count: e.count + 1,
        processTotal: e.processTotal + (t.process_score ?? 0),
        processCount: e.processCount + (t.process_score !== null ? 1 : 0),
      });
    }
    const result = new Map<string, SetupStats>();
    for (const [key, d] of map) {
      result.set(key, {
        tradeCount: d.count,
        winRate: d.count > 0 ? (d.wins / d.count) * 100 : 0,
        totalPnl: d.pnl,
        avgPnl: d.count > 0 ? d.pnl / d.count : 0,
        avgProcess: d.processCount > 0 ? d.processTotal / d.processCount : 0,
      });
    }
    return result;
  }, [trades]);

  // Match playbook entries to trade setup_types
  function getStatsForEntry(entry: PlaybookEntry): SetupStats | null {
    // Try matching by name or tags
    for (const [setupType, stats] of setupStats) {
      const lower = setupType.toLowerCase();
      if (
        entry.name.toLowerCase().includes(lower) ||
        lower.includes("breakout") && entry.tags.includes("breakout") ||
        lower.includes("reversal") && entry.tags.includes("reversal") ||
        lower.includes("trend") && entry.tags.includes("trend-follow")
      ) {
        return stats;
      }
    }
    return null;
  }

  if (!subLoading && !hasAccess("playbook")) return <UpgradePrompt feature="playbook" requiredTier="pro" />;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-accent">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 mx-auto max-w-[1600px]">
      <Header />
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <BookMarked size={24} className="text-accent" />
            Playbook
          </h2>
          <p className="text-sm text-muted mt-0.5">
            Document your setups, track their performance
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-background font-semibold text-sm hover:bg-accent-hover hover:shadow-[0_0_20px_rgba(0,180,216,0.3)] transition-all duration-300"
        >
          <Plus size={18} />
          New Setup
        </button>
      </div>

      {/* Playbook entries */}
      <div className="space-y-4">
        {DEMO_PLAYBOOK.map((entry) => {
          const stats = getStatsForEntry(entry);
          const isExpanded = expandedId === entry.id;
          return (
            <div
              key={entry.id}
              className="glass rounded-2xl border border-border/50 overflow-hidden"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <div
                className="p-5 cursor-pointer hover:bg-surface-hover/50 transition-all"
                onClick={() => setExpandedId(isExpanded ? null : entry.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-base font-bold text-foreground">{entry.name}</h3>
                      <div className="flex gap-1.5">
                        {entry.tags.map((tag) => (
                          <span key={tag} className="text-[10px] px-2 py-0.5 rounded-md bg-accent/8 text-accent font-medium">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-muted leading-relaxed">{entry.description}</p>
                  </div>
                  <div className="flex items-center gap-4 ml-4">
                    {stats && (
                      <div className="flex gap-4 text-xs">
                        <div className="text-center">
                          <p className="text-muted/60 uppercase tracking-wider text-[10px]">Trades</p>
                          <p className="font-bold text-foreground">{stats.tradeCount}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted/60 uppercase tracking-wider text-[10px]">Win Rate</p>
                          <p className={`font-bold ${stats.winRate >= 50 ? "text-win" : "text-loss"}`}>
                            {stats.winRate.toFixed(0)}%
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted/60 uppercase tracking-wider text-[10px]">P&L</p>
                          <p className={`font-bold ${stats.totalPnl >= 0 ? "text-win" : "text-loss"}`}>
                            ${stats.totalPnl.toFixed(0)}
                          </p>
                        </div>
                      </div>
                    )}
                    {isExpanded ? <ChevronUp size={16} className="text-muted" /> : <ChevronDown size={16} className="text-muted" />}
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="px-5 pb-5 pt-0 border-t border-border/50 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp size={14} className="text-win" />
                        <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Entry Rules</h4>
                      </div>
                      <div className="space-y-1.5">
                        {entry.entryRules.map((rule, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-muted">
                            <span className="text-accent mt-0.5 shrink-0">{i + 1}.</span>
                            <span>{rule}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Target size={14} className="text-accent" />
                        <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Exit Rules</h4>
                      </div>
                      <div className="space-y-1.5">
                        {entry.exitRules.map((rule, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-muted">
                            <span className="text-accent mt-0.5 shrink-0">{i + 1}.</span>
                            <span>{rule}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="bg-background rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <BarChart3 size={14} className="text-loss" />
                      <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Stop Loss</h4>
                    </div>
                    <p className="text-xs text-muted">{entry.stopLoss}</p>
                  </div>

                  {stats && (
                    <div className="bg-background rounded-xl p-4">
                      <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Sparkles size={14} className="text-accent" />
                        Performance from your trades
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {[
                          { label: "Trades", value: String(stats.tradeCount) },
                          { label: "Win Rate", value: `${stats.winRate.toFixed(0)}%`, color: stats.winRate >= 50 ? "text-win" : "text-loss" },
                          { label: "Total P&L", value: `$${stats.totalPnl.toFixed(0)}`, color: stats.totalPnl >= 0 ? "text-win" : "text-loss" },
                          { label: "Avg P&L", value: `$${stats.avgPnl.toFixed(0)}`, color: stats.avgPnl >= 0 ? "text-win" : "text-loss" },
                          { label: "Avg Process", value: stats.avgProcess > 0 ? `${stats.avgProcess.toFixed(1)}/10` : "—" },
                        ].map((s) => (
                          <div key={s.label}>
                            <p className="text-[10px] text-muted/60 uppercase tracking-wider">{s.label}</p>
                            <p className={`text-sm font-bold ${s.color ?? "text-foreground"}`}>{s.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Simple "coming soon" for custom entries */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-md p-8 text-center">
            <BookMarked size={40} className="text-accent/40 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-foreground mb-2">Custom Setups Coming Soon</h3>
            <p className="text-sm text-muted mb-6">
              Create and track your own setups with custom rules, screenshots, and performance analytics.
            </p>
            <button
              onClick={() => setShowForm(false)}
              className="px-6 py-2.5 rounded-xl bg-accent text-background font-semibold text-sm hover:bg-accent-hover transition-all"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

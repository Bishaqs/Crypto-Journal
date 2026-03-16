"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  ArrowLeftRight,
  BarChart3,
  Target,
  DollarSign,
  Plus,
} from "lucide-react";
import { Header } from "@/components/header";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { ForexTradeForm } from "@/components/forex-trade-form";
import type { ForexTrade } from "@/lib/types";
import { NewsWidget } from "@/components/news/news-widget";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_FOREX_TRADES: ForexTrade[] = [
  {
    id: "fx-1", user_id: "u1", pair: "EUR/USD", base_currency: "EUR", quote_currency: "USD",
    pair_category: "major", lot_type: "standard", lot_size: 1,
    position: "long", entry_price: 1.0850, exit_price: 1.0920,
    fees: 7, open_timestamp: "2026-02-20T08:00:00Z",
    close_timestamp: "2026-02-20T14:30:00Z",
    pip_value: 10, leverage: 50, spread: 1.2, swap_fee: 0,
    session: "london", broker: "OANDA",
    emotion: "Confident", confidence: 8, setup_type: "Trend Follow",
    process_score: 9, checklist: null, review: null,
    notes: "Clean trend continuation on EUR/USD during London session.", tags: ["trend", "major"],
    stop_loss: null, profit_target: null, pnl: 693, price_mae: null, price_mfe: null, mae_timestamp: null, mfe_timestamp: null, playbook_id: null, created_at: "2026-02-20T08:00:00Z",
  },
  {
    id: "fx-2", user_id: "u1", pair: "GBP/USD", base_currency: "GBP", quote_currency: "USD",
    pair_category: "major", lot_type: "standard", lot_size: 2,
    position: "short", entry_price: 1.2680, exit_price: 1.2620,
    fees: 14, open_timestamp: "2026-02-19T13:00:00Z",
    close_timestamp: "2026-02-19T16:45:00Z",
    pip_value: 10, leverage: 50, spread: 1.5, swap_fee: 0,
    session: "new_york", broker: "OANDA",
    emotion: "Calm", confidence: 7, setup_type: "Breakout",
    process_score: 8, checklist: null, review: null,
    notes: "GBP weakness on US data release.", tags: ["news", "major"],
    stop_loss: null, profit_target: null, pnl: 1186, price_mae: null, price_mfe: null, mae_timestamp: null, mfe_timestamp: null, playbook_id: null, created_at: "2026-02-19T13:00:00Z",
  },
  {
    id: "fx-3", user_id: "u1", pair: "USD/JPY", base_currency: "USD", quote_currency: "JPY",
    pair_category: "major", lot_type: "mini", lot_size: 5,
    position: "long", entry_price: 150.20, exit_price: 149.80,
    fees: 5, open_timestamp: "2026-02-18T01:00:00Z",
    close_timestamp: "2026-02-18T06:00:00Z",
    pip_value: 6.67, leverage: 30, spread: 0.8, swap_fee: 2,
    session: "tokyo", broker: "IC Markets",
    emotion: "Anxious", confidence: 5, setup_type: "Reversal",
    process_score: 4, checklist: null, review: null,
    notes: "Tried to catch falling knife on JPY. Bad idea.", tags: ["reversal"],
    stop_loss: null, profit_target: null, pnl: -207, price_mae: null, price_mfe: null, mae_timestamp: null, mfe_timestamp: null, playbook_id: null, created_at: "2026-02-18T01:00:00Z",
  },
  {
    id: "fx-4", user_id: "u1", pair: "EUR/GBP", base_currency: "EUR", quote_currency: "GBP",
    pair_category: "minor", lot_type: "standard", lot_size: 1,
    position: "long", entry_price: 0.8560, exit_price: 0.8610,
    fees: 8, open_timestamp: "2026-02-19T08:30:00Z",
    close_timestamp: "2026-02-19T12:00:00Z",
    pip_value: 12.50, leverage: 50, spread: 1.8, swap_fee: 0,
    session: "london", broker: "OANDA",
    emotion: "Calm", confidence: 7, setup_type: "Range",
    process_score: 7, checklist: null, review: null,
    notes: "EUR/GBP range trade. Clean entry at support.", tags: ["range", "minor"],
    stop_loss: null, profit_target: null, pnl: 492, price_mae: null, price_mfe: null, mae_timestamp: null, mfe_timestamp: null, playbook_id: null, created_at: "2026-02-19T08:30:00Z",
  },
  {
    id: "fx-5", user_id: "u1", pair: "GBP/JPY", base_currency: "GBP", quote_currency: "JPY",
    pair_category: "minor", lot_type: "mini", lot_size: 3,
    position: "short", entry_price: 190.50, exit_price: 189.80,
    fees: 6, open_timestamp: "2026-02-18T08:00:00Z",
    close_timestamp: "2026-02-18T15:00:00Z",
    pip_value: 6.67, leverage: 30, spread: 2.5, swap_fee: 1,
    session: "overlap", broker: "Pepperstone",
    emotion: "Excited", confidence: 6, setup_type: "Breakdown",
    process_score: 7, checklist: null, review: null,
    notes: "GBP/JPY short during overlap. Volatile but profitable.", tags: ["volatile", "minor"],
    stop_loss: null, profit_target: null, pnl: 1393, price_mae: null, price_mfe: null, mae_timestamp: null, mfe_timestamp: null, playbook_id: null, created_at: "2026-02-18T08:00:00Z",
  },
  {
    id: "fx-6", user_id: "u1", pair: "USD/TRY", base_currency: "USD", quote_currency: "TRY",
    pair_category: "exotic", lot_type: "micro", lot_size: 10,
    position: "long", entry_price: 31.20, exit_price: 31.85,
    fees: 15, open_timestamp: "2026-02-17T10:00:00Z",
    close_timestamp: "2026-02-18T10:00:00Z",
    pip_value: 0.03, leverage: 20, spread: 25, swap_fee: 8,
    session: "london", broker: "IC Markets",
    emotion: "Confident", confidence: 6, setup_type: "Carry Trade",
    process_score: 6, checklist: null, review: null,
    notes: "Carry trade on TRY weakness. High spread but favorable swap.", tags: ["exotic", "carry"],
    stop_loss: null, profit_target: null, pnl: 6477, price_mae: null, price_mfe: null, mae_timestamp: null, mfe_timestamp: null, playbook_id: null, created_at: "2026-02-17T10:00:00Z",
  },
  {
    id: "fx-7", user_id: "u1", pair: "EUR/USD", base_currency: "EUR", quote_currency: "USD",
    pair_category: "major", lot_type: "standard", lot_size: 1,
    position: "short", entry_price: 1.0910, exit_price: 1.0940,
    fees: 7, open_timestamp: "2026-02-17T14:00:00Z",
    close_timestamp: "2026-02-17T15:30:00Z",
    pip_value: 10, leverage: 50, spread: 1.2, swap_fee: 0,
    session: "new_york", broker: "OANDA",
    emotion: "FOMO", confidence: 4, setup_type: "Scalp",
    process_score: 3, checklist: null, review: null,
    notes: "Chased EUR reversal. Stopped out quickly.", tags: ["fomo", "scalp"],
    stop_loss: null, profit_target: null, pnl: -307, price_mae: null, price_mfe: null, mae_timestamp: null, mfe_timestamp: null, playbook_id: null, created_at: "2026-02-17T14:00:00Z",
  },
  {
    id: "fx-8", user_id: "u1", pair: "AUD/USD", base_currency: "AUD", quote_currency: "USD",
    pair_category: "major", lot_type: "standard", lot_size: 1,
    position: "long", entry_price: 0.6540, exit_price: null,
    fees: 7, open_timestamp: "2026-02-21T22:00:00Z",
    close_timestamp: null,
    pip_value: 10, leverage: 50, spread: 1.4, swap_fee: 0,
    session: "sydney", broker: "OANDA",
    emotion: "Calm", confidence: 7, setup_type: "Trend Follow",
    process_score: null, checklist: null, review: null,
    notes: "AUD/USD trend continuation. Watching for 0.6600 target.", tags: ["trend", "open"],
    stop_loss: null, profit_target: null, pnl: null, price_mae: null, price_mfe: null, mae_timestamp: null, mfe_timestamp: null, playbook_id: null, created_at: "2026-02-21T22:00:00Z",
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const CATEGORY_LABELS: Record<string, string> = {
  major: "Major", minor: "Minor", exotic: "Exotic",
};

const SESSION_LABELS: Record<string, string> = {
  london: "London", new_york: "New York", tokyo: "Tokyo", sydney: "Sydney", overlap: "Overlap",
};

const CATEGORY_COLORS = [
  "var(--color-accent)",
  "var(--color-win)",
  "#a78bfa",
];

const SESSION_COLORS = [
  "var(--color-accent)",
  "var(--color-win)",
  "#f59e0b",
  "#ec4899",
  "#a78bfa",
];

export default function ForexDashboardPage() {
  const supabase = createClient();
  const [trades, setTrades] = useState<ForexTrade[]>(MOCK_FOREX_TRADES);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [usingDemo, setUsingDemo] = useState(false);

  const fetchTrades = useCallback(async () => {
    const { data, error } = await supabase
      .from("forex_trades")
      .select("*")
      .order("open_timestamp", { ascending: false });

    if (error) {
      console.error("[Forex] fetchTrades error:", error.message);
      setLoading(false);
      return;
    }

    const dbTrades = (data as ForexTrade[]) ?? [];
    if (dbTrades.length === 0) {
      setTrades(MOCK_FOREX_TRADES);
      setUsingDemo(true);
    } else {
      setTrades(dbTrades);
      setUsingDemo(false);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  const closedTrades = useMemo(
    () => trades.filter((t) => t.exit_price !== null),
    [trades]
  );

  // Stats
  const totalPnl = useMemo(
    () => closedTrades.reduce((sum, t) => sum + (t.pnl ?? 0), 0),
    [closedTrades]
  );

  const winRate = useMemo(() => {
    if (closedTrades.length === 0) return 0;
    const wins = closedTrades.filter((t) => (t.pnl ?? 0) > 0).length;
    return (wins / closedTrades.length) * 100;
  }, [closedTrades]);

  const openPositions = useMemo(
    () => trades.filter((t) => t.exit_price === null).length,
    [trades]
  );

  const avgPips = useMemo(() => {
    if (closedTrades.length === 0) return 0;
    const totalPips = closedTrades.reduce((sum, t) => {
      if (!t.exit_price) return sum;
      const diff = t.position === "long"
        ? t.exit_price - t.entry_price
        : t.entry_price - t.exit_price;
      // Approximate pips: multiply by 10000 for most pairs, 100 for JPY
      const pipMultiplier = t.quote_currency === "JPY" || t.quote_currency === "TRY" ? 100 : 10000;
      return sum + diff * pipMultiplier;
    }, 0);
    return totalPips / closedTrades.length;
  }, [closedTrades]);

  const profitFactor = useMemo(() => {
    const grossWins = closedTrades.filter((t) => (t.pnl ?? 0) > 0).reduce((sum, t) => sum + (t.pnl ?? 0), 0);
    const grossLosses = Math.abs(closedTrades.filter((t) => (t.pnl ?? 0) < 0).reduce((sum, t) => sum + (t.pnl ?? 0), 0));
    if (grossLosses === 0) return grossWins > 0 ? Infinity : 0;
    return grossWins / grossLosses;
  }, [closedTrades]);

  const totalSwapCosts = useMemo(
    () => trades.reduce((sum, t) => sum + (t.swap_fee ?? 0), 0),
    [trades]
  );

  // Category P&L (Pie)
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    closedTrades.forEach((t) => {
      const c = t.pair_category ? CATEGORY_LABELS[t.pair_category] ?? t.pair_category : "Other";
      map[c] = (map[c] ?? 0) + (t.pnl ?? 0);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [closedTrades]);

  // Session Performance (Bar)
  const sessionData = useMemo(() => {
    const map: Record<string, number> = {};
    closedTrades.forEach((t) => {
      const s = t.session ? SESSION_LABELS[t.session] ?? t.session : "Unknown";
      map[s] = (map[s] ?? 0) + (t.pnl ?? 0);
    });
    return Object.entries(map).map(([session, pnl]) => ({ session, pnl }));
  }, [closedTrades]);

  // Recent trades
  const recentTrades = useMemo(
    () => [...trades].sort((a, b) => b.open_timestamp.localeCompare(a.open_timestamp)).slice(0, 5),
    [trades]
  );

  return (
    <div className="space-y-6 mx-auto max-w-[1600px]">
      <Header />

      {/* Asset Identity Badge */}
      <div className="flex items-center justify-center py-1">
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-400/10 border border-teal-400/20">
          <ArrowLeftRight size={18} className="text-teal-400" />
          <span className="text-xs font-bold uppercase tracking-widest text-teal-400">Forex</span>
        </div>
      </div>

      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <DollarSign size={24} className="text-accent" />
            Forex
            <InfoTooltip text="Forex trading dashboard — major, minor, and exotic currency pairs" articleId="an-forex-overview" />
          </h2>
          <p className="text-sm text-muted mt-0.5">
            {closedTrades.length} closed &middot; {openPositions} open
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-background font-semibold text-sm hover:bg-accent-hover transition-all duration-300 animate-[cosmic-pulse_3s_ease-in-out_infinite]"
        >
          <Plus size={18} />
          Log Trade
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="glass rounded-2xl border border-border/50 p-4" style={{ boxShadow: "var(--shadow-card)" }}>
          <p className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1">Total P&L</p>
          <p className={`text-xl font-bold tabular-nums ${totalPnl >= 0 ? "text-win" : "text-loss"}`}>
            {totalPnl >= 0 ? "+" : "-"}${Math.abs(totalPnl).toFixed(2)}
          </p>
        </div>
        <div className="glass rounded-2xl border border-border/50 p-4" style={{ boxShadow: "var(--shadow-card)" }}>
          <p className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1">Win Rate</p>
          <p className={`text-xl font-bold ${winRate >= 50 ? "text-win" : "text-loss"}`}>
            {winRate.toFixed(1)}%
          </p>
        </div>
        <div className="glass rounded-2xl border border-border/50 p-4" style={{ boxShadow: "var(--shadow-card)" }}>
          <p className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1">Open Positions</p>
          <p className="text-xl font-bold text-accent">{openPositions}</p>
        </div>
        <div className="glass rounded-2xl border border-border/50 p-4" style={{ boxShadow: "var(--shadow-card)" }}>
          <p className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1 flex items-center gap-1">
            Avg Pips <InfoTooltip text="Average pip gain/loss per closed trade" size={11} articleId="an-avg-pips" />
          </p>
          <p className={`text-xl font-bold tabular-nums ${avgPips >= 0 ? "text-win" : "text-loss"}`}>
            {avgPips >= 0 ? "+" : ""}{avgPips.toFixed(1)}
          </p>
        </div>
        <div className="glass rounded-2xl border border-border/50 p-4" style={{ boxShadow: "var(--shadow-card)" }}>
          <p className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1 flex items-center gap-1">
            Profit Factor <InfoTooltip text="Gross wins ÷ gross losses. Above 1.0 is profitable" size={11} articleId="an-profit-factor" />
          </p>
          <p className={`text-xl font-bold tabular-nums ${profitFactor >= 1 ? "text-win" : "text-loss"}`}>
            {profitFactor === Infinity ? "∞" : profitFactor.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Pie */}
        <div className="glass rounded-2xl border border-border/50 p-6" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Target size={16} className="text-accent" />
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              Pair Category <InfoTooltip text="P&L by pair category: major, minor, exotic" size={13} articleId="an-category-breakdown" />
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={categoryData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                innerRadius={50}
                strokeWidth={0}
                label={({ name, value }) => `${name}: $${Number(value).toFixed(0)}`}
              >
                {categoryData.map((_, i) => (
                  <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "0.75rem",
                  color: "var(--color-foreground)",
                  fontSize: "0.75rem",
                }}
                formatter={(value) => [`$${Number(value ?? 0).toFixed(2)}`, "P&L"]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Session Performance Bar */}
        <div className="glass rounded-2xl border border-border/50 p-6" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={16} className="text-accent" />
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              Session Performance <InfoTooltip text="P&L by trading session: London, New York, Tokyo, Sydney" size={13} articleId="an-session-performance" />
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={sessionData}>
              <XAxis
                dataKey="session"
                tick={{ fill: "var(--color-muted)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "var(--color-muted)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${v}`}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "0.75rem",
                  color: "var(--color-foreground)",
                  fontSize: "0.75rem",
                }}
                formatter={(value) => [`$${Number(value ?? 0).toFixed(2)}`, "P&L"]}
              />
              <Bar dataKey="pnl" radius={[8, 8, 0, 0]}>
                {sessionData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.pnl >= 0 ? "var(--color-win)" : "var(--color-loss)"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Swap Cost Summary */}
      {totalSwapCosts > 0 && (
        <div className="glass rounded-2xl border border-border/50 p-4 flex items-center justify-between" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center gap-2">
            <DollarSign size={16} className="text-amber-400" />
            <span className="text-sm font-semibold text-foreground">Total Swap Costs</span>
            <InfoTooltip text="Cumulative overnight swap/rollover fees across all trades" size={13} articleId="an-swap-costs" />
          </div>
          <span className="text-sm font-bold text-loss tabular-nums">
            -${totalSwapCosts.toFixed(2)}
          </span>
        </div>
      )}

      {/* Recent Trades */}
      <div className="glass rounded-2xl border border-border/50 p-6" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="flex items-center gap-2 mb-4">
          <ArrowLeftRight size={16} className="text-accent" />
          <h3 className="text-sm font-semibold text-foreground">Recent Trades</h3>
        </div>
        <div className="space-y-2">
          {recentTrades.map((trade) => {
            const pnl = trade.pnl ?? 0;
            const isOpen = trade.exit_price === null;
            return (
              <div
                key={trade.id}
                className="flex items-center justify-between py-3 px-4 rounded-xl bg-surface/50 border border-border/30 hover:border-border/60 transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-foreground text-sm">{trade.pair}</span>
                  {trade.pair_category && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-accent/10 text-accent">
                      {CATEGORY_LABELS[trade.pair_category]}
                    </span>
                  )}
                  {trade.session && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400">
                      {SESSION_LABELS[trade.session]}
                    </span>
                  )}
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${
                    trade.position === "long" ? "bg-win/10 text-win" : "bg-loss/10 text-loss"
                  }`}>
                    {trade.position.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted">
                    {new Date(trade.open_timestamp).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <span
                    className={`text-sm font-bold tabular-nums ${
                      isOpen ? "text-accent" : pnl >= 0 ? "text-win" : "text-loss"
                    }`}
                  >
                    {isOpen
                      ? "Open"
                      : `${pnl >= 0 ? "+" : "-"}$${Math.abs(pnl).toFixed(2)}`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* News Widget */}
      <NewsWidget asset="forex" />

      {/* Trade form modal */}
      {showForm && (
        <ForexTradeForm
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); fetchTrades(); }}
        />
      )}
    </div>
  );
}

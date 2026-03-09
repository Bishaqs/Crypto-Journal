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
  TrendingUp,
  AlertTriangle,
  BarChart3,
  Target,
  Gem,
  Plus,
} from "lucide-react";
import { Header } from "@/components/header";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { CommodityTradeForm } from "@/components/commodity-trade-form";
import type { CommodityTrade } from "@/lib/types";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_COMMODITY_TRADES: CommodityTrade[] = [
  {
    id: "ct-1", user_id: "u1", symbol: "GC", commodity_name: "Gold",
    commodity_category: "metals", contract_type: "futures", position: "long",
    entry_price: 2340.50, exit_price: 2368.20, quantity: 2,
    contract_size: 100, tick_size: 0.10, tick_value: 10,
    fees: 12, open_timestamp: "2026-02-20T09:00:00Z",
    close_timestamp: "2026-02-20T14:30:00Z", exchange: "COMEX",
    contract_month: "2026-04", expiration_date: "2026-04-28",
    margin_required: 11000, option_type: null, strike_price: null,
    premium_per_contract: null, underlying_contract: null,
    emotion: "Confident", confidence: 8, setup_type: "Trend Follow",
    process_score: 9, checklist: null, review: null,
    notes: "Gold breaking above resistance with strong volume.", tags: ["momentum", "metals"],
    pnl: 5528, created_at: "2026-02-20T09:00:00Z",
  },
  {
    id: "ct-2", user_id: "u1", symbol: "CL", commodity_name: "Crude Oil (WTI)",
    commodity_category: "energy", contract_type: "futures", position: "short",
    entry_price: 78.45, exit_price: 76.20, quantity: 3,
    contract_size: 1000, tick_size: 0.01, tick_value: 10,
    fees: 18, open_timestamp: "2026-02-19T08:30:00Z",
    close_timestamp: "2026-02-19T15:00:00Z", exchange: "NYMEX",
    contract_month: "2026-03", expiration_date: "2026-03-20",
    margin_required: 6500, option_type: null, strike_price: null,
    premium_per_contract: null, underlying_contract: null,
    emotion: "Calm", confidence: 7, setup_type: "Breakout",
    process_score: 8, checklist: null, review: null,
    notes: "Short crude on inventory build report.", tags: ["energy", "news"],
    pnl: 6732, created_at: "2026-02-19T08:30:00Z",
  },
  {
    id: "ct-3", user_id: "u1", symbol: "ZW", commodity_name: "Wheat",
    commodity_category: "grains", contract_type: "futures", position: "long",
    entry_price: 625.50, exit_price: 618.00, quantity: 1,
    contract_size: 5000, tick_size: 0.25, tick_value: 12.50,
    fees: 6, open_timestamp: "2026-02-18T10:00:00Z",
    close_timestamp: "2026-02-18T14:00:00Z", exchange: "CBOT",
    contract_month: "2026-05", expiration_date: "2026-05-14",
    margin_required: 1800, option_type: null, strike_price: null,
    premium_per_contract: null, underlying_contract: null,
    emotion: "Anxious", confidence: 5, setup_type: "Reversal",
    process_score: 4, checklist: null, review: null,
    notes: "Wheat reversal play, stopped out.", tags: ["grains"],
    pnl: -381, created_at: "2026-02-18T10:00:00Z",
  },
  {
    id: "ct-4", user_id: "u1", symbol: "NG", commodity_name: "Natural Gas",
    commodity_category: "energy", contract_type: "futures", position: "long",
    entry_price: 2.85, exit_price: 3.12, quantity: 5,
    contract_size: 10000, tick_size: 0.001, tick_value: 10,
    fees: 25, open_timestamp: "2026-02-17T09:30:00Z",
    close_timestamp: "2026-02-18T11:00:00Z", exchange: "NYMEX",
    contract_month: "2026-03", expiration_date: "2026-03-26",
    margin_required: 3200, option_type: null, strike_price: null,
    premium_per_contract: null, underlying_contract: null,
    emotion: "Excited", confidence: 7, setup_type: "News",
    process_score: 7, checklist: null, review: null,
    notes: "Cold weather forecast driving nat gas higher.", tags: ["energy", "weather"],
    pnl: 13475, created_at: "2026-02-17T09:30:00Z",
  },
  {
    id: "ct-5", user_id: "u1", symbol: "SI", commodity_name: "Silver",
    commodity_category: "metals", contract_type: "futures", position: "long",
    entry_price: 27.80, exit_price: 28.35, quantity: 2,
    contract_size: 5000, tick_size: 0.005, tick_value: 25,
    fees: 10, open_timestamp: "2026-02-20T10:15:00Z",
    close_timestamp: "2026-02-20T13:45:00Z", exchange: "COMEX",
    contract_month: "2026-05", expiration_date: "2026-05-27",
    margin_required: 8500, option_type: null, strike_price: null,
    premium_per_contract: null, underlying_contract: null,
    emotion: "Calm", confidence: 8, setup_type: "Trend Follow",
    process_score: 8, checklist: null, review: null,
    notes: "Silver following gold breakout.", tags: ["metals", "correlation"],
    pnl: 5490, created_at: "2026-02-20T10:15:00Z",
  },
  {
    id: "ct-6", user_id: "u1", symbol: "KC", commodity_name: "Coffee",
    commodity_category: "softs", contract_type: "futures", position: "long",
    entry_price: 185.40, exit_price: 179.20, quantity: 1,
    contract_size: 37500, tick_size: 0.05, tick_value: 18.75,
    fees: 8, open_timestamp: "2026-02-19T09:00:00Z",
    close_timestamp: "2026-02-19T14:30:00Z", exchange: "ICE",
    contract_month: "2026-05", expiration_date: "2026-05-19",
    margin_required: 5500, option_type: null, strike_price: null,
    premium_per_contract: null, underlying_contract: null,
    emotion: "FOMO", confidence: 4, setup_type: "Scalp",
    process_score: 3, checklist: null, review: null,
    notes: "Chased coffee rally, bad entry.", tags: ["softs"],
    pnl: -2333, created_at: "2026-02-19T09:00:00Z",
  },
  {
    id: "ct-7", user_id: "u1", symbol: "LE", commodity_name: "Live Cattle",
    commodity_category: "livestock", contract_type: "futures", position: "long",
    entry_price: 188.50, exit_price: 190.80, quantity: 2,
    contract_size: 40000, tick_size: 0.025, tick_value: 10,
    fees: 10, open_timestamp: "2026-02-18T09:30:00Z",
    close_timestamp: "2026-02-19T12:00:00Z", exchange: "CME",
    contract_month: "2026-04", expiration_date: "2026-04-30",
    margin_required: 2200, option_type: null, strike_price: null,
    premium_per_contract: null, underlying_contract: null,
    emotion: "Calm", confidence: 6, setup_type: "Range",
    process_score: 7, checklist: null, review: null,
    notes: "Cattle at support, good risk/reward.", tags: ["livestock"],
    pnl: 1830, created_at: "2026-02-18T09:30:00Z",
  },
  {
    id: "ct-8", user_id: "u1", symbol: "ZC", commodity_name: "Corn",
    commodity_category: "grains", contract_type: "futures", position: "short",
    entry_price: 458.00, exit_price: null, quantity: 2,
    contract_size: 5000, tick_size: 0.25, tick_value: 12.50,
    fees: 8, open_timestamp: "2026-02-21T10:00:00Z",
    close_timestamp: null, exchange: "CBOT",
    contract_month: "2026-05", expiration_date: "2026-05-14",
    margin_required: 1500, option_type: null, strike_price: null,
    premium_per_contract: null, underlying_contract: null,
    emotion: "Confident", confidence: 7, setup_type: "Breakdown",
    process_score: null, checklist: null, review: null,
    notes: "Short corn on weak demand data.", tags: ["grains", "swing"],
    pnl: null, created_at: "2026-02-21T10:00:00Z",
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const CATEGORY_LABELS: Record<string, string> = {
  metals: "Metals",
  energy: "Energy",
  grains: "Grains",
  softs: "Softs",
  livestock: "Livestock",
};

const CATEGORY_COLORS = [
  "var(--color-accent)",
  "var(--color-win)",
  "var(--color-loss)",
  "#a78bfa",
  "#f59e0b",
];

const EXCHANGE_COLORS = [
  "var(--color-accent)",
  "var(--color-win)",
  "#a78bfa",
  "#f59e0b",
  "#ec4899",
];

export default function CommoditiesDashboardPage() {
  const supabase = createClient();
  const [trades, setTrades] = useState<CommodityTrade[]>(MOCK_COMMODITY_TRADES);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [usingDemo, setUsingDemo] = useState(false);

  const fetchTrades = useCallback(async () => {
    const { data, error } = await supabase
      .from("commodity_trades")
      .select("*")
      .order("open_timestamp", { ascending: false });

    if (error) {
      console.error("[Commodities] fetchTrades error:", error.message);
      setLoading(false);
      return;
    }

    const dbTrades = (data as CommodityTrade[]) ?? [];
    if (dbTrades.length === 0) {
      setTrades(MOCK_COMMODITY_TRADES);
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

  // ── Stats ──
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

  const marginInUse = useMemo(
    () => trades.filter((t) => t.exit_price === null).reduce((sum, t) => sum + (t.margin_required ?? 0), 0),
    [trades]
  );

  const profitFactor = useMemo(() => {
    const grossWins = closedTrades.filter((t) => (t.pnl ?? 0) > 0).reduce((sum, t) => sum + (t.pnl ?? 0), 0);
    const grossLosses = Math.abs(closedTrades.filter((t) => (t.pnl ?? 0) < 0).reduce((sum, t) => sum + (t.pnl ?? 0), 0));
    if (grossLosses === 0) return grossWins > 0 ? Infinity : 0;
    return grossWins / grossLosses;
  }, [closedTrades]);

  // ── Expiring contracts (within 7 days) ──
  const expiringPositions = useMemo(() => {
    const now = new Date();
    const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return trades.filter((t) => {
      if (t.exit_price !== null || !t.expiration_date) return false;
      const expiry = new Date(t.expiration_date);
      return expiry <= sevenDays && expiry >= now;
    });
  }, [trades]);

  // ── Category P&L (Pie) ──
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    closedTrades.forEach((t) => {
      const c = t.commodity_category ? CATEGORY_LABELS[t.commodity_category] ?? t.commodity_category : "Other";
      map[c] = (map[c] ?? 0) + (t.pnl ?? 0);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [closedTrades]);

  // ── Exchange Performance (Bar) ──
  const exchangeData = useMemo(() => {
    const map: Record<string, number> = {};
    closedTrades.forEach((t) => {
      const ex = t.exchange ?? "Other";
      map[ex] = (map[ex] ?? 0) + (t.pnl ?? 0);
    });
    return Object.entries(map).map(([exchange, pnl]) => ({ exchange, pnl }));
  }, [closedTrades]);

  // ── Recent trades ──
  const recentTrades = useMemo(
    () => [...trades].sort((a, b) => b.open_timestamp.localeCompare(a.open_timestamp)).slice(0, 5),
    [trades]
  );

  return (
    <div className="space-y-6 mx-auto max-w-[1600px]">
      <Header />

      {/* Asset Identity Badge */}
      <div className="flex items-center justify-center py-1">
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
          <Gem size={18} className="text-amber-500" />
          <span className="text-xs font-bold uppercase tracking-widest text-amber-500">Commodities</span>
        </div>
      </div>

      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Gem size={24} className="text-accent" />
            Commodities
            <InfoTooltip text="Commodity trading dashboard — futures, metals, energy, grains, softs, and livestock" />
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

      {/* Expiry Warning Banner */}
      {expiringPositions.length > 0 && (
        <div className="rounded-2xl border p-4 flex items-center gap-3 bg-amber-500/10 border-amber-500/30">
          <AlertTriangle size={20} className="text-amber-400" />
          <div>
            <p className="text-sm font-semibold text-amber-400">
              {expiringPositions.length} position{expiringPositions.length > 1 ? "s" : ""} expiring within 7 days
            </p>
            <p className="text-xs text-muted mt-0.5">
              {expiringPositions.map((t) => `${t.symbol} (${t.contract_month})`).join(", ")}
              {" "}&mdash; consider rolling or closing.
            </p>
          </div>
        </div>
      )}

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
            Margin in Use <InfoTooltip text="Total margin required across all open positions" size={11} />
          </p>
          <p className="text-xl font-bold text-foreground tabular-nums">
            ${marginInUse.toLocaleString()}
          </p>
        </div>
        <div className="glass rounded-2xl border border-border/50 p-4" style={{ boxShadow: "var(--shadow-card)" }}>
          <p className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1 flex items-center gap-1">
            Profit Factor <InfoTooltip text="Gross wins ÷ gross losses. Above 1.0 is profitable" size={11} />
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
              Category Breakdown <InfoTooltip text="P&L by commodity category: metals, energy, grains, softs, livestock" size={13} />
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

        {/* Exchange Performance Bar */}
        <div className="glass rounded-2xl border border-border/50 p-6" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={16} className="text-accent" />
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              Exchange Performance <InfoTooltip text="P&L by exchange: COMEX, NYMEX, CBOT, ICE, CME" size={13} />
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={exchangeData}>
              <XAxis
                dataKey="exchange"
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
                {exchangeData.map((entry, i) => (
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

      {/* Recent Trades */}
      <div className="glass rounded-2xl border border-border/50 p-6" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={16} className="text-accent" />
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
                  <span className="font-semibold text-foreground text-sm">{trade.symbol}</span>
                  {trade.commodity_category && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-accent/10 text-accent">
                      {CATEGORY_LABELS[trade.commodity_category]}
                    </span>
                  )}
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400">
                    {trade.contract_type} × {trade.quantity}
                  </span>
                  {trade.exchange && (
                    <span className="text-[10px] text-muted hidden sm:inline">
                      {trade.exchange}
                    </span>
                  )}
                  {trade.contract_month && (
                    <span className="text-[10px] text-muted hidden sm:inline">
                      {trade.contract_month}
                    </span>
                  )}
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

      {/* Trade form modal */}
      {showForm && (
        <CommodityTradeForm
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); fetchTrades(); }}
        />
      )}
    </div>
  );
}

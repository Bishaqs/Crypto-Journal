"use client";

import { useState, useMemo } from "react";
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
  Clock,
  AlertTriangle,
  BarChart3,
  Target,
  Briefcase,
} from "lucide-react";
import { Header } from "@/components/header";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { usePageTour } from "@/lib/use-page-tour";
import { PageInfoButton } from "@/components/ui/page-info-button";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

interface StockTrade {
  id: string;
  user_id: string;
  symbol: string;
  company_name: string | null;
  asset_type: "stock" | "option";
  position: "long" | "short";
  entry_price: number;
  exit_price: number | null;
  quantity: number;
  fees: number;
  open_timestamp: string;
  close_timestamp: string | null;
  sector: string | null;
  industry: string | null;
  market_session: "pre_market" | "regular" | "after_hours" | null;
  option_type: "call" | "put" | null;
  strike_price: number | null;
  expiration_date: string | null;
  premium_per_contract: number | null;
  contracts: number | null;
  underlying_symbol: string | null;
  emotion: string | null;
  confidence: number | null;
  setup_type: string | null;
  process_score: number | null;
  checklist: Record<string, boolean> | null;
  review: Record<string, string> | null;
  notes: string | null;
  tags: string[];
  pnl: number | null;
  created_at: string;
}

const MOCK_STOCK_TRADES: StockTrade[] = [
  {
    id: "st-1", user_id: "u1", symbol: "AAPL", company_name: "Apple Inc.",
    asset_type: "stock", position: "long", entry_price: 178.50, exit_price: 185.20,
    quantity: 50, fees: 1.00, open_timestamp: "2026-02-20T10:30:00Z",
    close_timestamp: "2026-02-20T14:15:00Z", sector: "Technology", industry: "Consumer Electronics",
    market_session: "regular", option_type: null, strike_price: null,
    expiration_date: null, premium_per_contract: null, contracts: null,
    underlying_symbol: null, emotion: "Confident", confidence: 8,
    setup_type: "Breakout", process_score: 9, checklist: null, review: null,
    notes: "Clean breakout above 178 resistance.", tags: ["momentum"],
    pnl: 334.00, created_at: "2026-02-20T10:30:00Z",
  },
  {
    id: "st-2", user_id: "u1", symbol: "TSLA", company_name: "Tesla Inc.",
    asset_type: "option", position: "long", entry_price: 4.20, exit_price: 6.80,
    quantity: 10, fees: 6.50, open_timestamp: "2026-02-19T09:35:00Z",
    close_timestamp: "2026-02-19T11:00:00Z", sector: "Technology", industry: "Auto Manufacturers",
    market_session: "regular", option_type: "call", strike_price: 260,
    expiration_date: "2026-02-28", premium_per_contract: 4.20, contracts: 10,
    underlying_symbol: "TSLA", emotion: "Excited", confidence: 7,
    setup_type: "Earnings Play", process_score: 7, checklist: null, review: null,
    notes: "Weekly calls on TSLA pre-earnings momentum.", tags: ["options", "earnings"],
    pnl: 2593.50, created_at: "2026-02-19T09:35:00Z",
  },
  {
    id: "st-3", user_id: "u1", symbol: "NVDA", company_name: "NVIDIA Corp.",
    asset_type: "stock", position: "long", entry_price: 875.00, exit_price: 862.30,
    quantity: 10, fees: 1.00, open_timestamp: "2026-02-18T07:15:00Z",
    close_timestamp: "2026-02-18T09:31:00Z", sector: "Technology", industry: "Semiconductors",
    market_session: "pre_market", option_type: null, strike_price: null,
    expiration_date: null, premium_per_contract: null, contracts: null,
    underlying_symbol: null, emotion: "Anxious", confidence: 5,
    setup_type: "Gap Fill", process_score: 4, checklist: null, review: null,
    notes: "Pre-market gap down play, stopped out.", tags: ["gap"],
    pnl: -128.00, created_at: "2026-02-18T07:15:00Z",
  },
  {
    id: "st-4", user_id: "u1", symbol: "JPM", company_name: "JPMorgan Chase",
    asset_type: "stock", position: "long", entry_price: 198.40, exit_price: 203.10,
    quantity: 30, fees: 1.00, open_timestamp: "2026-02-18T10:00:00Z",
    close_timestamp: "2026-02-18T15:30:00Z", sector: "Financials", industry: "Banks",
    market_session: "regular", option_type: null, strike_price: null,
    expiration_date: null, premium_per_contract: null, contracts: null,
    underlying_symbol: null, emotion: "Calm", confidence: 8,
    setup_type: "Support Bounce", process_score: 8, checklist: null, review: null,
    notes: "Bounce off 50 DMA with strong volume.", tags: ["support"],
    pnl: 140.00, created_at: "2026-02-18T10:00:00Z",
  },
  {
    id: "st-5", user_id: "u1", symbol: "AMZN", company_name: "Amazon.com",
    asset_type: "stock", position: "short", entry_price: 188.50, exit_price: 185.20,
    quantity: 25, fees: 1.00, open_timestamp: "2026-02-17T16:05:00Z",
    close_timestamp: "2026-02-17T17:45:00Z", sector: "Technology", industry: "Internet Retail",
    market_session: "after_hours", option_type: null, strike_price: null,
    expiration_date: null, premium_per_contract: null, contracts: null,
    underlying_symbol: null, emotion: "Confident", confidence: 7,
    setup_type: "Breakdown", process_score: 8, checklist: null, review: null,
    notes: "After-hours short on weak guidance.", tags: ["short", "after-hours"],
    pnl: 81.50, created_at: "2026-02-17T16:05:00Z",
  },
  {
    id: "st-6", user_id: "u1", symbol: "MSFT", company_name: "Microsoft Corp.",
    asset_type: "option", position: "long", entry_price: 3.10, exit_price: 1.80,
    quantity: 5, fees: 3.25, open_timestamp: "2026-02-17T10:15:00Z",
    close_timestamp: "2026-02-17T14:30:00Z", sector: "Technology", industry: "Software",
    market_session: "regular", option_type: "put", strike_price: 410,
    expiration_date: "2026-02-21", premium_per_contract: 3.10, contracts: 5,
    underlying_symbol: "MSFT", emotion: "FOMO", confidence: 4,
    setup_type: "Speculative", process_score: 3, checklist: null, review: null,
    notes: "Chased put entry, bad timing.", tags: ["options"],
    pnl: -653.25, created_at: "2026-02-17T10:15:00Z",
  },
  {
    id: "st-7", user_id: "u1", symbol: "UNH", company_name: "UnitedHealth Group",
    asset_type: "stock", position: "long", entry_price: 512.00, exit_price: 519.80,
    quantity: 8, fees: 1.00, open_timestamp: "2026-02-19T10:45:00Z",
    close_timestamp: "2026-02-19T14:00:00Z", sector: "Healthcare", industry: "Health Plans",
    market_session: "regular", option_type: null, strike_price: null,
    expiration_date: null, premium_per_contract: null, contracts: null,
    underlying_symbol: null, emotion: "Calm", confidence: 8,
    setup_type: "Trend Continuation", process_score: 9, checklist: null, review: null,
    notes: "Healthcare rotation, clean uptrend.", tags: ["trend"],
    pnl: 61.40, created_at: "2026-02-19T10:45:00Z",
  },
  {
    id: "st-8", user_id: "u1", symbol: "GS", company_name: "Goldman Sachs",
    asset_type: "stock", position: "long", entry_price: 485.00, exit_price: 491.50,
    quantity: 12, fees: 1.00, open_timestamp: "2026-02-20T09:40:00Z",
    close_timestamp: "2026-02-20T13:20:00Z", sector: "Financials", industry: "Investment Banking",
    market_session: "regular", option_type: null, strike_price: null,
    expiration_date: null, premium_per_contract: null, contracts: null,
    underlying_symbol: null, emotion: "Confident", confidence: 7,
    setup_type: "Sector Momentum", process_score: 7, checklist: null, review: null,
    notes: "Financials leading, rode the wave.", tags: ["sector"],
    pnl: 77.00, created_at: "2026-02-20T09:40:00Z",
  },
  {
    id: "st-9", user_id: "u1", symbol: "AAPL", company_name: "Apple Inc.",
    asset_type: "stock", position: "long", entry_price: 182.00, exit_price: 183.50,
    quantity: 40, fees: 1.00, open_timestamp: "2026-02-21T07:00:00Z",
    close_timestamp: "2026-02-21T09:25:00Z", sector: "Technology", industry: "Consumer Electronics",
    market_session: "pre_market", option_type: null, strike_price: null,
    expiration_date: null, premium_per_contract: null, contracts: null,
    underlying_symbol: null, emotion: "Calm", confidence: 6,
    setup_type: "Gap Up", process_score: 6, checklist: null, review: null,
    notes: "Pre-market scalp on gap up.", tags: ["scalp", "pre-market"],
    pnl: 59.00, created_at: "2026-02-21T07:00:00Z",
  },
  {
    id: "st-10", user_id: "u1", symbol: "XLF", company_name: "Financial Select SPDR",
    asset_type: "stock", position: "long", entry_price: 42.10, exit_price: null,
    quantity: 100, fees: 0.50, open_timestamp: "2026-02-22T10:00:00Z",
    close_timestamp: null, sector: "Financials", industry: "ETF",
    market_session: "regular", option_type: null, strike_price: null,
    expiration_date: null, premium_per_contract: null, contracts: null,
    underlying_symbol: null, emotion: "Calm", confidence: 7,
    setup_type: "Swing", process_score: 7, checklist: null, review: null,
    notes: "Swing trade on financials rotation.", tags: ["swing"],
    pnl: null, created_at: "2026-02-22T10:00:00Z",
  },
];

// ---------------------------------------------------------------------------
// Session helpers
// ---------------------------------------------------------------------------

function getCurrentSession(): { label: string; color: string } {
  const now = new Date();
  const et = new Date(
    now.toLocaleString("en-US", { timeZone: "America/New_York" })
  );
  const h = et.getHours();
  const m = et.getMinutes();
  const totalMin = h * 60 + m;

  if (totalMin >= 240 && totalMin < 570) return { label: "Pre-Market", color: "text-amber-400" };
  if (totalMin >= 570 && totalMin < 960) return { label: "Regular Hours", color: "text-win" };
  if (totalMin >= 960 && totalMin < 1200) return { label: "After-Hours", color: "text-purple-400" };
  return { label: "Market Closed", color: "text-muted" };
}

const SESSION_LABELS: Record<string, string> = {
  pre_market: "Pre-Market",
  regular: "Regular",
  after_hours: "After-Hours",
};

const SECTOR_COLORS = [
  "var(--color-accent)",
  "var(--color-win)",
  "var(--color-loss)",
  "#a78bfa",
  "#f59e0b",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function StocksDashboardPage() {
  usePageTour("stocks-dashboard-page");
  const [trades] = useState<StockTrade[]>(MOCK_STOCK_TRADES);
  const session = getCurrentSession();

  // Closed trades only (have exit_price)
  const closedTrades = useMemo(
    () => trades.filter((t) => t.exit_price !== null),
    [trades]
  );

  // --------------- Stats ---------------
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

  // PDT counter: day trades in rolling 5-day window
  const dayTradeCount = useMemo(() => {
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    return closedTrades.filter((t) => {
      if (!t.open_timestamp || !t.close_timestamp) return false;
      const open = new Date(t.open_timestamp);
      const close = new Date(t.close_timestamp);
      return (
        open >= fiveDaysAgo &&
        open.toDateString() === close.toDateString()
      );
    }).length;
  }, [closedTrades]);

  // --------------- Sector P&L (Pie) ---------------
  const sectorData = useMemo(() => {
    const map: Record<string, number> = {};
    closedTrades.forEach((t) => {
      const s = t.sector ?? "Other";
      map[s] = (map[s] ?? 0) + (t.pnl ?? 0);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [closedTrades]);

  // --------------- Session Performance (Bar) ---------------
  const sessionData = useMemo(() => {
    const map: Record<string, number> = { pre_market: 0, regular: 0, after_hours: 0 };
    closedTrades.forEach((t) => {
      const s = t.market_session ?? "regular";
      map[s] = (map[s] ?? 0) + (t.pnl ?? 0);
    });
    return Object.entries(map).map(([key, pnl]) => ({
      session: SESSION_LABELS[key] ?? key,
      pnl,
    }));
  }, [closedTrades]);

  // --------------- Recent trades ---------------
  const recentTrades = useMemo(
    () => [...trades].sort((a, b) => b.open_timestamp.localeCompare(a.open_timestamp)).slice(0, 5),
    [trades]
  );

  return (
    <div className="space-y-6 mx-auto max-w-[1600px]">
      <Header />

      {/* Title & session indicator */}
      <div id="tour-stocks-header" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Briefcase size={24} className="text-accent" />
            Stocks
            <PageInfoButton tourName="stocks-dashboard-page" />
          </h2>
          <p className="text-sm text-muted mt-0.5 flex items-center gap-1.5">
            <Clock size={12} />
            <span className={session.color}>{session.label}</span>
            <span className="text-muted/40 mx-1">|</span>
            {closedTrades.length} closed &middot; {openPositions} open
          </p>
        </div>
      </div>

      {/* PDT Warning Banner */}
      {dayTradeCount >= 2 && (
        <div
          className={`rounded-2xl border p-4 flex items-center gap-3 ${
            dayTradeCount >= 4
              ? "bg-loss/10 border-loss/30"
              : dayTradeCount >= 3
              ? "bg-amber-500/10 border-amber-500/30"
              : "bg-amber-500/5 border-amber-500/20"
          }`}
        >
          <AlertTriangle
            size={20}
            className={dayTradeCount >= 4 ? "text-loss" : "text-amber-400"}
          />
          <div>
            <p
              className={`text-sm font-semibold ${
                dayTradeCount >= 4 ? "text-loss" : "text-amber-400"
              }`}
            >
              {dayTradeCount}/4 day trades used in rolling 5-day window
            </p>
            <p className="text-xs text-muted mt-0.5">
              {dayTradeCount >= 4
                ? "PDT limit reached! You will be flagged as a pattern day trader."
                : "Approaching PDT limit. Be cautious with intraday round-trips."}
            </p>
          </div>
        </div>
      )}

      {/* Stats Row */}
      <div id="tour-stocks-stats" className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div
          className="glass rounded-2xl border border-border/50 p-4"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <p className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1">
            Total P&L
          </p>
          <p
            className={`text-xl font-bold tabular-nums ${
              totalPnl >= 0 ? "text-win" : "text-loss"
            }`}
          >
            {totalPnl >= 0 ? "+" : "-"}${Math.abs(totalPnl).toFixed(2)}
          </p>
        </div>
        <div
          className="glass rounded-2xl border border-border/50 p-4"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <p className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1">
            Win Rate
          </p>
          <p
            className={`text-xl font-bold ${
              winRate >= 50 ? "text-win" : "text-loss"
            }`}
          >
            {winRate.toFixed(1)}%
          </p>
        </div>
        <div
          className="glass rounded-2xl border border-border/50 p-4"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <p className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1">
            Open Positions
          </p>
          <p className="text-xl font-bold text-accent">{openPositions}</p>
        </div>
        <div
          className="glass rounded-2xl border border-border/50 p-4"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <p className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1">
            Day Trades (5d)
          </p>
          <p
            className={`text-xl font-bold ${
              dayTradeCount >= 4
                ? "text-loss"
                : dayTradeCount >= 3
                ? "text-amber-400"
                : "text-foreground"
            }`}
          >
            {dayTradeCount}/4
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sector Breakdown Pie */}
        <div
          id="tour-stocks-sector"
          className="glass rounded-2xl border border-border/50 p-6"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Target size={16} className="text-accent" />
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              Sector Breakdown <InfoTooltip text="How your trades are distributed across market sectors" size={13} />
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={sectorData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                innerRadius={50}
                strokeWidth={0}
                label={({ name, value }) =>
                  `${name}: $${value.toFixed(0)}`
                }
              >
                {sectorData.map((_, i) => (
                  <Cell
                    key={i}
                    fill={SECTOR_COLORS[i % SECTOR_COLORS.length]}
                  />
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

        {/* Market Session Performance Bar */}
        <div
          className="glass rounded-2xl border border-border/50 p-6"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={16} className="text-accent" />
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              Market Session Performance <InfoTooltip text="Pre-market (4-9:30am), Regular (9:30am-4pm), After-hours (4-8pm ET)" size={13} />
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
                    fill={
                      entry.pnl >= 0
                        ? "var(--color-win)"
                        : "var(--color-loss)"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Trades */}
      <div
        className="glass rounded-2xl border border-border/50 p-6"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={16} className="text-accent" />
          <h3 className="text-sm font-semibold text-foreground">
            Recent Trades
          </h3>
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
                  <span className="font-semibold text-foreground text-sm">
                    {trade.symbol}
                  </span>
                  {trade.sector && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-accent/10 text-accent">
                      {trade.sector}
                    </span>
                  )}
                  {trade.market_session && (
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${
                        trade.market_session === "pre_market"
                          ? "bg-amber-500/10 text-amber-400"
                          : trade.market_session === "after_hours"
                          ? "bg-purple-500/10 text-purple-400"
                          : "bg-win/10 text-win"
                      }`}
                    >
                      {SESSION_LABELS[trade.market_session]}
                    </span>
                  )}
                  {trade.asset_type === "option" && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400">
                      {trade.option_type?.toUpperCase()} ${trade.strike_price}
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
                      isOpen
                        ? "text-accent"
                        : pnl >= 0
                        ? "text-win"
                        : "text-loss"
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

      {/* PDT info card (always visible) */}
      <div
        className="glass rounded-2xl border border-border/50 p-4"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle size={14} className="text-muted" />
          <span className="text-xs font-semibold text-muted uppercase tracking-wider">
            Pattern Day Trader Rule
          </span>
        </div>
        <p className="text-xs text-muted leading-relaxed">
          The PDT rule limits accounts under $25K to 3 day trades within a
          rolling 5 business-day window. A day trade is opening and closing the
          same position on the same day. You have used{" "}
          <span
            className={`font-bold ${
              dayTradeCount >= 4
                ? "text-loss"
                : dayTradeCount >= 3
                ? "text-amber-400"
                : "text-foreground"
            }`}
          >
            {dayTradeCount}/4
          </span>{" "}
          day trades in the current window.
        </p>
      </div>
    </div>
  );
}

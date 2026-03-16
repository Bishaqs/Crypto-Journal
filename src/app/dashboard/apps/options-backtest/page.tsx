"use client";

import { useState, useCallback, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { History, Play, Loader2 } from "lucide-react";
import SymbolSearch from "@/components/ui/symbol-search";
import { Header } from "@/components/header";
import { useTheme } from "@/lib/theme-context";
import { getChartColors } from "@/lib/chart-colors";
import { useSubscription } from "@/lib/use-subscription";
import { UpgradePrompt } from "@/components/upgrade-prompt";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { blackScholes, STRATEGY_PRESETS } from "@/lib/options-math";

const RISK_FREE_RATE = 0.05;
const DEFAULT_IV = 0.30;

interface BacktestTrade {
  entryDay: number;
  exitDay: number;
  entryPrice: number;
  exitPrice: number;
  pnl: number;
}

interface BacktestResult {
  equityCurve: { day: number; equity: number }[];
  trades: BacktestTrade[];
  totalReturn: number;
  winRate: number;
  avgPnlPerTrade: number;
  maxDrawdown: number;
}

function StatBlock({ label, value, color = "text-foreground" }: { label: string; value: string; color?: string }) {
  return (
    <div className="glass rounded-xl border border-border/50 p-4 hover:border-accent/20 transition-all duration-300" style={{ boxShadow: "var(--shadow-card)" }}>
      <p className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}

/** Generate random walk demo data if no API data available */
function generateDemoData(days: number, startPrice: number): number[] {
  const prices = [startPrice];
  for (let i = 1; i < days; i++) {
    const prev = prices[i - 1];
    const dailyReturn = (Math.random() - 0.48) * 0.03; // slight upward bias
    prices.push(prev * (1 + dailyReturn));
  }
  return prices;
}

/**
 * Run options backtest using Black-Scholes synthetic pricing.
 * Opens a new position every `frequency` days, holds for `holdDays`, then closes.
 */
function runOptionsBacktest(
  prices: number[],
  strategyIndex: number,
  frequency: number,
  holdDays: number,
  startingEquity: number
): BacktestResult {
  const preset = STRATEGY_PRESETS[strategyIndex];
  const trades: BacktestTrade[] = [];
  const equityCurve: { day: number; equity: number }[] = [{ day: 0, equity: startingEquity }];
  let equity = startingEquity;
  let peak = startingEquity;
  let maxDrawdown = 0;

  let nextEntry = 0;

  for (let day = 0; day < prices.length; day++) {
    // Check if we should open a new trade
    if (day === nextEntry && day + holdDays < prices.length) {
      const entrySpot = prices[day];
      const legs = preset.legs(entrySpot);

      // Calculate entry cost (total premium)
      let entryCost = 0;
      for (const leg of legs) {
        const bsPrice = blackScholes(leg.type, entrySpot, leg.strike, holdDays / 365, RISK_FREE_RATE, DEFAULT_IV);
        entryCost += bsPrice * leg.quantity * 100;
      }

      // Calculate exit value at expiry day
      const exitSpot = prices[day + holdDays];
      let exitValue = 0;
      for (const leg of legs) {
        // At expiry, value is just intrinsic
        const intrinsic = leg.type === "call"
          ? Math.max(exitSpot - leg.strike, 0)
          : Math.max(leg.strike - exitSpot, 0);
        exitValue += intrinsic * leg.quantity * 100;
      }

      const pnl = exitValue - entryCost;

      // Use a fixed allocation per trade (10% of equity)
      const allocation = equity * 0.1;
      const positionSize = entryCost !== 0 ? allocation / Math.abs(entryCost) : 1;
      const scaledPnl = pnl * Math.min(positionSize, 10); // cap leverage at 10x

      equity += scaledPnl;

      trades.push({
        entryDay: day,
        exitDay: day + holdDays,
        entryPrice: entrySpot,
        exitPrice: exitSpot,
        pnl: scaledPnl,
      });

      nextEntry = day + frequency;
    }

    equityCurve.push({ day, equity });
    if (equity > peak) peak = equity;
    const dd = (peak - equity) / peak;
    if (dd > maxDrawdown) maxDrawdown = dd;
  }

  const wins = trades.filter((t) => t.pnl > 0).length;
  const totalPnl = trades.reduce((s, t) => s + t.pnl, 0);

  return {
    equityCurve,
    trades,
    totalReturn: ((equity - startingEquity) / startingEquity) * 100,
    winRate: trades.length > 0 ? (wins / trades.length) * 100 : 0,
    avgPnlPerTrade: trades.length > 0 ? totalPnl / trades.length : 0,
    maxDrawdown: maxDrawdown * 100,
  };
}

export default function OptionsBacktestPage() {
  const { hasAccess, loading: subLoading } = useSubscription();
  const { theme } = useTheme();
  const colors = getChartColors(theme);

  const [symbol, setSymbol] = useState("SPY");
  const [strategyIndex, setStrategyIndex] = useState(0);
  const [days, setDays] = useState(365);
  const [frequency, setFrequency] = useState<"weekly" | "monthly">("monthly");
  const [startingEquity, setStartingEquity] = useState(10000);
  const [prices, setPrices] = useState<number[]>([]);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState<"api" | "demo">("demo");
  const [error, setError] = useState<string | null>(null);

  const fetchPrices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/market/historical?symbol=${encodeURIComponent(symbol)}&days=${days}`);
      if (!res.ok) throw new Error("API unavailable");
      const json = await res.json();
      const p = (json.prices ?? []) as number[];
      if (p.length > 30) {
        setPrices(p);
        setDataSource("api");
        setLoading(false);
        return;
      }
      throw new Error("Insufficient data");
    } catch {
      // Fallback to demo random walk
      const startPrice = symbol.toUpperCase() === "SPY" ? 450 : symbol.toUpperCase() === "QQQ" ? 380 : 100;
      const demo = generateDemoData(days, startPrice);
      setPrices(demo);
      setDataSource("demo");
      setError("Historical API unavailable. Using simulated random walk data.");
    } finally {
      setLoading(false);
    }
  }, [symbol, days]);

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  const frequencyDays = frequency === "weekly" ? 5 : 21;
  const holdDays = frequency === "weekly" ? 5 : 21;

  function handleRun() {
    if (prices.length < 30) return;
    const r = runOptionsBacktest(prices, strategyIndex, frequencyDays, holdDays, startingEquity);
    setResult(r);
  }

  if (subLoading) return null;
  if (!hasAccess("advanced-analytics")) return <UpgradePrompt feature="advanced-analytics" requiredTier="max" />;

  return (
    <div className="space-y-6 mx-auto max-w-[1600px]">
      <Header />

      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <History size={24} className="text-accent" />
          Options Backtester
          <InfoTooltip text="Backtest options strategies using Black-Scholes synthetic pricing. Compare covered calls, spreads, straddles, and iron condors." size={14} articleId="ap-options-backtest" />
        </h2>
        <p className="text-sm text-muted mt-0.5">
          Backtest options strategies using Black-Scholes synthetic pricing on historical data
        </p>
      </div>

      {/* Symbol Search */}
      <SymbolSearch
        mode="stock"
        value={symbol}
        onSelect={(sym) => { if (sym !== symbol) setSymbol(sym); }}
        popularKey="options-backtest"
        placeholder="Search any stock..."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="glass rounded-2xl border border-border/50 p-6 space-y-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Backtest Configuration</h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1 block">Underlying Symbol</label>
              <div className="w-full px-4 py-3 rounded-xl bg-accent/5 border border-accent/20 text-accent text-sm font-bold uppercase">
                {symbol}
              </div>
            </div>
            <div>
              <label className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1 block">Date Range</label>
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm font-medium focus:outline-none focus:border-accent/50 transition-all"
              >
                <option value={90}>3 Months</option>
                <option value={180}>6 Months</option>
                <option value={365}>1 Year</option>
                <option value={730}>2 Years</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1 block">Strategy</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {STRATEGY_PRESETS.map((preset, i) => (
                <button
                  key={preset.name}
                  onClick={() => setStrategyIndex(i)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    strategyIndex === i
                      ? "bg-accent text-background shadow-sm"
                      : "bg-surface border border-border text-muted hover:text-foreground hover:border-accent/30"
                  }`}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1 block">Frequency</label>
              <div className="flex gap-2">
                {(["weekly", "monthly"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFrequency(f)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all capitalize ${
                      frequency === f
                        ? "bg-accent text-background"
                        : "bg-surface border border-border text-muted hover:text-foreground hover:border-accent/30"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1 block">Starting Equity ($)</label>
              <input
                type="number"
                value={startingEquity}
                onChange={(e) => setStartingEquity(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm font-medium focus:outline-none focus:border-accent/50 transition-all"
              />
            </div>
          </div>

          {error && (
            <div className="px-3 py-2 rounded-lg bg-accent/5 border border-accent/10">
              <p className="text-xs text-muted">{error}</p>
            </div>
          )}

          <div className="px-3 py-2 rounded-lg bg-accent/5 border border-accent/10">
            <p className="text-xs text-muted">
              Data: <span className="text-accent font-bold">{prices.length}</span> days
              ({dataSource === "api" ? "Historical API" : "Simulated"})
              | Strategy: <span className="text-accent font-bold">{STRATEGY_PRESETS[strategyIndex].name}</span>
              | Opening every <span className="text-accent font-bold">{frequencyDays}</span> days
            </p>
          </div>

          <button
            onClick={handleRun}
            disabled={loading || prices.length < 30}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
              loading || prices.length < 30
                ? "bg-border text-muted cursor-not-allowed"
                : "bg-accent text-background hover:bg-accent-hover"
            }`}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
            {loading ? "Loading Data..." : "Run Backtest"}
          </button>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {result ? (
            <>
              {/* Equity Curve */}
              <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
                <h3 className="text-sm font-semibold text-foreground mb-4">Equity Curve</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={result.equityCurve}>
                    <defs>
                      <linearGradient id="obEquity" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={colors.accent} stopOpacity={0.2} />
                        <stop offset="100%" stopColor={colors.accent} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 10, fill: colors.tick }}
                      axisLine={{ stroke: colors.grid }}
                      tickLine={false}
                      label={{ value: "Day", position: "insideBottom", offset: -5, fontSize: 10, fill: colors.tick }}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: colors.tick }}
                      tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: colors.tooltipBg,
                        backdropFilter: "blur(16px)",
                        border: colors.tooltipBorder,
                        borderRadius: "12px",
                        fontSize: "12px",
                        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                      }}
                      formatter={(value) => [`$${Number(value ?? 0).toFixed(2)}`, "Equity"]}
                      labelFormatter={(v) => `Day ${v}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="equity"
                      stroke={colors.accent}
                      strokeWidth={2.5}
                      fill="url(#obEquity)"
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatBlock
                  label="Total Return"
                  value={`${result.totalReturn >= 0 ? "+" : ""}${result.totalReturn.toFixed(1)}%`}
                  color={result.totalReturn >= 0 ? "text-win" : "text-loss"}
                />
                <StatBlock
                  label="Win Rate"
                  value={`${result.winRate.toFixed(1)}%`}
                  color={result.winRate >= 50 ? "text-win" : "text-loss"}
                />
                <StatBlock
                  label="Avg P&L / Trade"
                  value={`$${result.avgPnlPerTrade.toFixed(0)}`}
                  color={result.avgPnlPerTrade >= 0 ? "text-win" : "text-loss"}
                />
                <StatBlock
                  label="Max Drawdown"
                  value={`-${result.maxDrawdown.toFixed(1)}%`}
                  color="text-loss"
                />
              </div>

              {/* Trades Table */}
              <div className="glass rounded-2xl border border-border/50 p-5 overflow-x-auto" style={{ boxShadow: "var(--shadow-card)" }}>
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
                  Trade Log ({result.trades.length} trades)
                </h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold">#</th>
                      <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold">Entry Day</th>
                      <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold">Exit Day</th>
                      <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold">Entry $</th>
                      <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold">Exit $</th>
                      <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold">P&L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.trades.slice(0, 20).map((t, idx) => (
                      <tr key={idx} className="border-b border-border/30 hover:bg-surface-hover/50 transition-colors">
                        <td className="px-3 py-2 text-xs text-muted">{idx + 1}</td>
                        <td className="px-3 py-2 text-xs text-foreground tabular-nums">{t.entryDay}</td>
                        <td className="px-3 py-2 text-xs text-foreground tabular-nums">{t.exitDay}</td>
                        <td className="px-3 py-2 text-xs text-muted tabular-nums">${t.entryPrice.toFixed(2)}</td>
                        <td className="px-3 py-2 text-xs text-muted tabular-nums">${t.exitPrice.toFixed(2)}</td>
                        <td className={`px-3 py-2 text-xs font-bold tabular-nums ${t.pnl >= 0 ? "text-win" : "text-loss"}`}>
                          {t.pnl >= 0 ? "+" : ""}${t.pnl.toFixed(0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {result.trades.length > 20 && (
                  <p className="text-[10px] text-muted/40 mt-3 text-center">
                    Showing 20 of {result.trades.length} trades
                  </p>
                )}
              </div>
            </>
          ) : (
            <div
              className="glass rounded-2xl border border-border/50 p-12 flex flex-col items-center justify-center text-center"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <History size={48} className="text-accent/30 mb-4" />
              <h3 className="text-lg font-bold text-foreground mb-2">Ready to Backtest</h3>
              <p className="text-sm text-muted max-w-xs">
                Select a strategy preset, choose entry frequency, and run the backtest to see how the strategy would have performed using Black-Scholes synthetic pricing.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

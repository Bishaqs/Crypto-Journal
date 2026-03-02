"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { FlaskConical, Play, Loader2 } from "lucide-react";
import { Header } from "@/components/header";
import { useTheme } from "@/lib/theme-context";
import { getChartColors } from "@/lib/chart-colors";
import { useSubscription } from "@/lib/use-subscription";
import { UpgradePrompt } from "@/components/upgrade-prompt";
import { usePageTour } from "@/lib/use-page-tour";
import { PageInfoButton } from "@/components/ui/page-info-button";
import { createClient } from "@/lib/supabase/client";
import { Trade } from "@/lib/types";
import { calculateTradePnl } from "@/lib/calculations";

// --- Inline indicator calculations ---

function calculateSMA(prices: number[], period: number): (number | null)[] {
  return prices.map((_, i) => {
    if (i < period - 1) return null;
    const slice = prices.slice(i - period + 1, i + 1);
    return slice.reduce((s, v) => s + v, 0) / period;
  });
}

function calculateEMA(prices: number[], period: number): (number | null)[] {
  const multiplier = 2 / (period + 1);
  const result: (number | null)[] = new Array(prices.length).fill(null);
  // Seed with SMA
  let sum = 0;
  for (let i = 0; i < period; i++) sum += prices[i];
  result[period - 1] = sum / period;
  for (let i = period; i < prices.length; i++) {
    result[i] = (prices[i] - (result[i - 1] as number)) * multiplier + (result[i - 1] as number);
  }
  return result;
}

function calculateRSI(prices: number[], period: number = 14): (number | null)[] {
  const result: (number | null)[] = new Array(prices.length).fill(null);
  if (prices.length < period + 1) return result;

  const changes = prices.map((p, i) => (i === 0 ? 0 : p - prices[i - 1]));
  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 1; i <= period; i++) {
    if (changes[i] > 0) avgGain += changes[i];
    else avgLoss += Math.abs(changes[i]);
  }
  avgGain /= period;
  avgLoss /= period;

  result[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

  for (let i = period + 1; i < prices.length; i++) {
    const change = changes[i];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    result[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }

  return result;
}

// --- Types ---

type Indicator = "RSI" | "SMA" | "EMA";
type Condition = ">" | "<" | "cross_above" | "cross_below";

interface Rule {
  indicator: Indicator;
  period: number;
  condition: Condition;
  value: number;
}

interface BacktestResult {
  equityCurve: { index: number; equity: number }[];
  totalReturn: number;
  winRate: number;
  maxDrawdown: number;
  numTrades: number;
  wins: number;
  losses: number;
}

function StatBlock({ label, value, color = "text-foreground" }: { label: string; value: string; color?: string }) {
  return (
    <div className="glass rounded-xl border border-border/50 p-4 hover:border-accent/20 transition-all duration-300" style={{ boxShadow: "var(--shadow-card)" }}>
      <p className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}

function getIndicatorValues(prices: number[], indicator: Indicator, period: number): (number | null)[] {
  switch (indicator) {
    case "RSI": return calculateRSI(prices, period);
    case "SMA": return calculateSMA(prices, period);
    case "EMA": return calculateEMA(prices, period);
  }
}

function checkCondition(
  indicatorValues: (number | null)[],
  prices: number[],
  condition: Condition,
  value: number,
  index: number,
  indicator: Indicator
): boolean {
  const curr = indicatorValues[index];
  const prev = index > 0 ? indicatorValues[index - 1] : null;
  if (curr === null) return false;

  // For RSI, compare indicator value to threshold. For SMA/EMA, compare price to indicator.
  const compareValue = indicator === "RSI" ? curr : prices[index];
  const compareTarget = indicator === "RSI" ? value : curr;

  const prevCompareValue = indicator === "RSI" ? prev : (index > 0 ? prices[index - 1] : null);
  const prevCompareTarget = indicator === "RSI" ? value : prev;

  switch (condition) {
    case ">": return compareValue > compareTarget;
    case "<": return compareValue < compareTarget;
    case "cross_above":
      if (prevCompareValue === null || prevCompareTarget === null) return false;
      return prevCompareValue <= prevCompareTarget && compareValue > compareTarget;
    case "cross_below":
      if (prevCompareValue === null || prevCompareTarget === null) return false;
      return prevCompareValue >= prevCompareTarget && compareValue < compareTarget;
  }
}

function runBacktest(prices: number[], buyRule: Rule, sellRule: Rule, startingEquity: number): BacktestResult {
  const buyIndicator = getIndicatorValues(prices, buyRule.indicator, buyRule.period);
  const sellIndicator = getIndicatorValues(prices, sellRule.indicator, sellRule.period);

  const equityCurve: { index: number; equity: number }[] = [];
  let equity = startingEquity;
  let inPosition = false;
  let entryPrice = 0;
  let wins = 0;
  let losses = 0;
  let peak = startingEquity;
  let maxDrawdown = 0;

  for (let i = 1; i < prices.length; i++) {
    if (!inPosition && checkCondition(buyIndicator, prices, buyRule.condition, buyRule.value, i, buyRule.indicator)) {
      inPosition = true;
      entryPrice = prices[i];
    } else if (inPosition && checkCondition(sellIndicator, prices, sellRule.condition, sellRule.value, i, sellRule.indicator)) {
      const returnPct = (prices[i] - entryPrice) / entryPrice;
      equity *= 1 + returnPct;
      if (returnPct > 0) wins++;
      else losses++;
      inPosition = false;
    }

    equityCurve.push({ index: i, equity });
    if (equity > peak) peak = equity;
    const dd = (peak - equity) / peak;
    if (dd > maxDrawdown) maxDrawdown = dd;
  }

  // Close any open position at end
  if (inPosition) {
    const returnPct = (prices[prices.length - 1] - entryPrice) / entryPrice;
    equity *= 1 + returnPct;
    if (returnPct > 0) wins++;
    else losses++;
    equityCurve[equityCurve.length - 1] = { index: prices.length - 1, equity };
  }

  const numTrades = wins + losses;
  return {
    equityCurve,
    totalReturn: ((equity - startingEquity) / startingEquity) * 100,
    winRate: numTrades > 0 ? (wins / numTrades) * 100 : 0,
    maxDrawdown: maxDrawdown * 100,
    numTrades,
    wins,
    losses,
  };
}

export default function BacktesterPage() {
  usePageTour("backtester-page");
  const { hasAccess, loading: subLoading } = useSubscription();
  const { theme } = useTheme();
  const colors = getChartColors(theme);
  const supabase = createClient();

  const [symbol, setSymbol] = useState("BTC");
  const [days, setDays] = useState(365);
  const [startingEquity, setStartingEquity] = useState(10000);
  const [buyRule, setBuyRule] = useState<Rule>({ indicator: "RSI", period: 14, condition: "<", value: 30 });
  const [sellRule, setSellRule] = useState<Rule>({ indicator: "RSI", period: 14, condition: ">", value: 70 });
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState<"api" | "trades">("api");
  const [prices, setPrices] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchPrices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/market/historical?symbol=${encodeURIComponent(symbol)}&days=${days}`);
      if (!res.ok) throw new Error("API unavailable");
      const json = await res.json();
      const p = (json.prices ?? []) as number[];
      if (p.length > 10) {
        setPrices(p);
        setDataSource("api");
        setLoading(false);
        return;
      }
      throw new Error("Insufficient data");
    } catch {
      // Fallback to user's trade data from Supabase
      try {
        const { data } = await supabase
          .from("trades")
          .select("*")
          .eq("symbol", symbol)
          .order("open_timestamp", { ascending: true });
        const trades = (data as Trade[]) ?? [];
        if (trades.length >= 5) {
          const tradePrices = trades.map((t) => t.entry_price);
          setPrices(tradePrices);
          setDataSource("trades");
        } else {
          // Generate random walk demo data
          const demoData: number[] = [100];
          for (let i = 1; i < days; i++) {
            const prev = demoData[i - 1];
            const change = (Math.random() - 0.48) * 2; // slight upward bias
            demoData.push(Math.max(prev + change, 1));
          }
          setPrices(demoData);
          setDataSource("trades");
          setError("No historical API or trade data available. Using random walk demo data.");
        }
      } catch {
        setError("Failed to load price data.");
      }
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, days]);

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  function handleRun() {
    if (prices.length < 20) return;
    const r = runBacktest(prices, buyRule, sellRule, startingEquity);
    setResult(r);
  }

  function RuleEditor({ label, rule, onChange }: { label: string; rule: Rule; onChange: (r: Rule) => void }) {
    return (
      <div className="p-4 rounded-xl bg-background/50 border border-border/30 space-y-3">
        <h4 className="text-xs font-bold text-muted uppercase tracking-wider">{label}</h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1 block">Indicator</label>
            <select
              value={rule.indicator}
              onChange={(e) => onChange({ ...rule, indicator: e.target.value as Indicator })}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-xs focus:outline-none focus:border-accent/50"
            >
              <option value="RSI">RSI</option>
              <option value="SMA">SMA</option>
              <option value="EMA">EMA</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1 block">Period</label>
            <input
              type="number"
              value={rule.period}
              onChange={(e) => onChange({ ...rule, period: Number(e.target.value) || 14 })}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-xs focus:outline-none focus:border-accent/50"
            />
          </div>
          <div>
            <label className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1 block">Condition</label>
            <select
              value={rule.condition}
              onChange={(e) => onChange({ ...rule, condition: e.target.value as Condition })}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-xs focus:outline-none focus:border-accent/50"
            >
              <option value=">">Greater Than (&gt;)</option>
              <option value="<">Less Than (&lt;)</option>
              <option value="cross_above">Cross Above</option>
              <option value="cross_below">Cross Below</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1 block">
              {rule.indicator === "RSI" ? "Threshold" : "Value"}
            </label>
            <input
              type="number"
              value={rule.value}
              onChange={(e) => onChange({ ...rule, value: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-xs focus:outline-none focus:border-accent/50"
            />
          </div>
        </div>
      </div>
    );
  }

  if (subLoading) return null;
  if (!hasAccess("advanced-analytics")) return <UpgradePrompt feature="advanced-analytics" requiredTier="max" />;

  return (
    <div className="space-y-6 mx-auto max-w-[1600px]">
      <Header />

      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <FlaskConical size={24} className="text-accent" />
          Strategy Backtester
          <PageInfoButton tourName="backtester-page" />
        </h2>
        <p className="text-sm text-muted mt-0.5">
          Test simple indicator-based strategies against historical data
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="glass rounded-2xl border border-border/50 p-6 space-y-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Strategy Builder</h3>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1 block">Symbol</label>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm font-medium focus:outline-none focus:border-accent/50 transition-all"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1 block">Days</label>
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm font-medium focus:outline-none focus:border-accent/50 transition-all"
              >
                <option value={90}>90 Days</option>
                <option value={180}>180 Days</option>
                <option value={365}>1 Year</option>
                <option value={730}>2 Years</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1 block">Equity ($)</label>
              <input
                type="number"
                value={startingEquity}
                onChange={(e) => setStartingEquity(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm font-medium focus:outline-none focus:border-accent/50 transition-all"
              />
            </div>
          </div>

          <RuleEditor label="Buy Rule" rule={buyRule} onChange={setBuyRule} />
          <RuleEditor label="Sell Rule" rule={sellRule} onChange={setSellRule} />

          {error && (
            <div className="px-3 py-2 rounded-lg bg-accent/5 border border-accent/10">
              <p className="text-xs text-muted">{error}</p>
            </div>
          )}

          <div className="px-3 py-2 rounded-lg bg-accent/5 border border-accent/10">
            <p className="text-xs text-muted">
              Data: <span className="text-accent font-bold">{prices.length}</span> price points
              ({dataSource === "api" ? "Historical API" : "Trade Data / Demo"})
            </p>
          </div>

          <button
            onClick={handleRun}
            disabled={loading || prices.length < 20}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
              loading || prices.length < 20
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
                      <linearGradient id="btEquity" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={colors.accent} stopOpacity={0.2} />
                        <stop offset="100%" stopColor={colors.accent} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                    <XAxis
                      dataKey="index"
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
                      fill="url(#btEquity)"
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Stats */}
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
                  label="Max Drawdown"
                  value={`-${result.maxDrawdown.toFixed(1)}%`}
                  color="text-loss"
                />
                <StatBlock label="Trades" value={`${result.numTrades} (${result.wins}W / ${result.losses}L)`} />
              </div>

              {/* Strategy Summary */}
              <div className="glass rounded-xl border border-border/50 p-4" style={{ boxShadow: "var(--shadow-card)" }}>
                <p className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-2">Strategy</p>
                <div className="flex flex-col gap-1 text-xs text-foreground">
                  <span>
                    <span className="text-win font-semibold">BUY</span> when {buyRule.indicator}({buyRule.period}) {buyRule.condition.replace("_", " ")} {buyRule.value}
                  </span>
                  <span>
                    <span className="text-loss font-semibold">SELL</span> when {sellRule.indicator}({sellRule.period}) {sellRule.condition.replace("_", " ")} {sellRule.value}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div
              className="glass rounded-2xl border border-border/50 p-12 flex flex-col items-center justify-center text-center"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <FlaskConical size={48} className="text-accent/30 mb-4" />
              <h3 className="text-lg font-bold text-foreground mb-2">Ready to Backtest</h3>
              <p className="text-sm text-muted max-w-xs">
                Define buy and sell rules using RSI, SMA, or EMA indicators, then run the backtest to see how the strategy performed historically.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

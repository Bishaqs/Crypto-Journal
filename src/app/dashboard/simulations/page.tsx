"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trade } from "@/lib/types";
import { DEMO_TRADES } from "@/lib/demo-data";
import { useDateRange } from "@/lib/date-range-context";
import { useTheme } from "@/lib/theme-context";
import { getChartColors } from "@/lib/chart-colors";
import { calculateTradePnl } from "@/lib/calculations";
import {
  runSimulation,
  MonteCarloConfig,
  MonteCarloResult,
} from "@/lib/monte-carlo";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  Dices,
  Play,
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  Activity,
  BarChart3,
  Info,
  ChevronDown,
  ChevronUp,
  Settings2,
  Zap,
  Percent,
} from "lucide-react";
import { Header } from "@/components/header";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { useSubscription } from "@/lib/use-subscription";
import { UpgradePrompt } from "@/components/upgrade-prompt";

function StatBlock({
  label,
  value,
  icon: Icon,
  color = "text-foreground",
  tooltip,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  color?: string;
  tooltip?: string;
}) {
  return (
    <div
      className="glass rounded-xl border border-border/50 p-4"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon size={14} className="text-muted/60" />
        <p className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold">
          {label}
        </p>
        {tooltip && <InfoTooltip text={tooltip} />}
      </div>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}

export default function SimulationsPage() {
  const { hasAccess, loading: subLoading } = useSubscription();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const { filterTrades } = useDateRange();
  const { theme, viewMode } = useTheme();
  const colors = getChartColors(theme);
  const supabase = createClient();

  // Basic config
  const [numSims, setNumSims] = useState(500);
  const [numTrades, setNumTrades] = useState(100);
  const [startingEquity, setStartingEquity] = useState(10000);
  const [result, setResult] = useState<MonteCarloResult | null>(null);
  const [running, setRunning] = useState(false);

  // Advanced config
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [ruinThreshold, setRuinThreshold] = useState(50);
  const [confidenceLevel, setConfidenceLevel] = useState<90 | 95 | 99>(95);
  const [useWinRateOverride, setUseWinRateOverride] = useState(false);
  const [winRateOverride, setWinRateOverride] = useState(55);
  const [avgWinOverride, setAvgWinOverride] = useState(150);
  const [avgLossOverride, setAvgLossOverride] = useState(100);
  const [useRiskPerTrade, setUseRiskPerTrade] = useState(false);
  const [riskPerTrade, setRiskPerTrade] = useState(2);
  const [useRRRatio, setUseRRRatio] = useState(false);
  const [rrRatio, setRRRatio] = useState(2);

  // Info panel
  const [showInfo, setShowInfo] = useState(false);

  // Auto-expand advanced settings when global viewMode is advanced
  useEffect(() => {
    if (viewMode === "advanced") setShowAdvanced(true);
  }, [viewMode]);

  const fetchTrades = useCallback(async () => {
    const { data } = await supabase
      .from("trades")
      .select("*")
      .order("open_timestamp", { ascending: false });
    const dbTrades = (data as Trade[]) ?? [];
    setTrades(dbTrades.length === 0 ? DEMO_TRADES : dbTrades);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  const filtered = filterTrades(trades);
  const closedTrades = filtered.filter(
    (t) => t.close_timestamp && t.exit_price !== null
  );
  const tradePnls = closedTrades.map(
    (t) => t.pnl ?? calculateTradePnl(t) ?? 0
  );

  function handleRun() {
    if (tradePnls.length < 3 && !useWinRateOverride) return;
    setRunning(true);
    setTimeout(() => {
      const config: MonteCarloConfig = {
        numSimulations: numSims,
        numTrades: numTrades,
        startingEquity,
        ruinThreshold: ruinThreshold / 100,
        confidenceLevel,
        riskPerTrade: useRiskPerTrade ? riskPerTrade : undefined,
        ...(useWinRateOverride
          ? {
              winRateOverride,
              avgWinOverride: useRRRatio ? avgLossOverride * rrRatio : avgWinOverride,
              avgLossOverride,
              rewardRiskRatio: useRRRatio ? rrRatio : undefined,
            }
          : {}),
      };
      const res = runSimulation(
        tradePnls.length > 0 ? tradePnls : [0],
        config
      );
      setResult(res);
      setRunning(false);
    }, 10);
  }

  const chartData = result
    ? Array.from({ length: numTrades + 1 }, (_, i) => ({
        trade: i,
        p5: result.percentiles.p5[i],
        p10: result.percentiles.p10[i],
        p25: result.percentiles.p25[i],
        p50: result.percentiles.p50[i],
        p75: result.percentiles.p75[i],
        p90: result.percentiles.p90[i],
        p95: result.percentiles.p95[i],
      }))
    : [];

  if (subLoading) return null;
  if (!hasAccess("monte-carlo")) return <UpgradePrompt feature="monte-carlo" requiredTier="max" />;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted text-sm">
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-6 mx-auto max-w-[1600px]">
      <Header />

      {/* Title + Info toggle */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Dices size={24} className="text-accent" />
            Monte Carlo Simulations
          </h2>
          <p className="text-sm text-muted mt-0.5">
            Bootstrap resampling of your trade history to project future equity curves
          </p>
        </div>
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 text-accent text-xs font-medium hover:bg-accent/20 transition-all mt-1"
        >
          <Info size={14} />
          {showInfo ? "Hide" : "How it works"}
        </button>
      </div>

      {/* Expandable info section */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          showInfo ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div
          className="glass rounded-2xl border border-accent/20 p-6 space-y-4"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Zap size={16} className="text-accent" />
            <h3 className="text-sm font-bold text-foreground">
              What is Monte Carlo Simulation?
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-muted leading-relaxed">
            <div className="space-y-2">
              <p className="text-foreground font-semibold text-[11px] uppercase tracking-wider">
                The Method
              </p>
              <p>
                Monte Carlo simulation randomly resamples your actual trade
                results thousands of times to create different possible futures.
                Each simulation picks trades at random from your history
                (with replacement) and chains them together to build an equity curve.
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-foreground font-semibold text-[11px] uppercase tracking-wider">
                Reading the Chart
              </p>
              <p>
                The <strong>fan chart</strong> shows the range of outcomes. The
                solid line is the <strong>median</strong> (50% of simulations
                ended above, 50% below). The shaded bands show increasingly
                unlikely outcomes — the wider the fan, the more uncertainty.
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-foreground font-semibold text-[11px] uppercase tracking-wider">
                How to Use It
              </p>
              <p>
                Focus on <strong>Probability of Profit</strong> (want &gt;60%)
                and <strong>Probability of Ruin</strong> (want &lt;5%). If your
                ruin probability is high, reduce position sizes. The{" "}
                <strong>Kelly Criterion</strong> shows the mathematically optimal
                risk percentage per trade.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls */}
        <div
          className="glass rounded-2xl border border-border/50 p-6 space-y-5"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
            Simulation Parameters
          </h3>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted/60 uppercase tracking-wider font-semibold mb-1.5 flex items-center">
                Number of Simulations
                <InfoTooltip text="More simulations = more accurate results. 500 is good for quick checks, 5,000+ for precision. Higher values take longer to compute." />
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="100"
                  max="10000"
                  step="100"
                  value={numSims}
                  onChange={(e) => setNumSims(Number(e.target.value))}
                  className="flex-1 accent-[var(--accent)]"
                />
                <span className="text-sm font-bold text-accent w-16 text-right">
                  {numSims.toLocaleString()}
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs text-muted/60 uppercase tracking-wider font-semibold mb-1.5 flex items-center">
                Future Trades to Project
                <InfoTooltip text="How many trades into the future to simulate. Match this to your typical monthly trading volume. E.g., if you make ~20 trades/month, set 60 for a 3-month projection." />
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="10"
                  max="500"
                  step="10"
                  value={numTrades}
                  onChange={(e) => setNumTrades(Number(e.target.value))}
                  className="flex-1 accent-[var(--accent)]"
                />
                <span className="text-sm font-bold text-accent w-12 text-right">
                  {numTrades}
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs text-muted/60 uppercase tracking-wider font-semibold mb-1.5 flex items-center">
                Starting Equity ($)
                <InfoTooltip text="Your current account balance. The simulation projects forward from this amount. Use your actual trading account size for realistic results." />
              </label>
              <input
                type="number"
                value={startingEquity}
                onChange={(e) => setStartingEquity(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm font-medium focus:outline-none focus:border-accent/50 transition-all"
              />
            </div>
          </div>

          {/* Advanced Settings Toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-xs text-muted hover:text-accent transition-colors w-full"
          >
            <Settings2 size={14} />
            <span className="font-semibold uppercase tracking-wider">
              Advanced Settings
            </span>
            {showAdvanced ? (
              <ChevronUp size={14} className="ml-auto" />
            ) : (
              <ChevronDown size={14} className="ml-auto" />
            )}
          </button>

          {/* Advanced Settings Panel */}
          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${
              showAdvanced ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className="space-y-4 pt-2 border-t border-border/30">
              {/* Ruin Threshold */}
              <div>
                <label className="text-xs text-muted/60 uppercase tracking-wider font-semibold mb-1.5 flex items-center">
                  Ruin Threshold
                  <InfoTooltip text="Account loss level that counts as 'ruin'. At 50%, ruin means losing half your starting equity. Lower values are stricter." />
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="10"
                    max="90"
                    step="5"
                    value={ruinThreshold}
                    onChange={(e) => setRuinThreshold(Number(e.target.value))}
                    className="flex-1 accent-[var(--accent)]"
                  />
                  <span className="text-sm font-bold text-accent w-12 text-right">
                    {ruinThreshold}%
                  </span>
                </div>
                <p className="text-[10px] text-muted/40 mt-1">
                  Ruin = equity drops to {ruinThreshold}% of starting ($
                  {((startingEquity * ruinThreshold) / 100).toLocaleString()})
                </p>
              </div>

              {/* Confidence Level */}
              <div>
                <label className="text-xs text-muted/60 uppercase tracking-wider font-semibold mb-1.5 flex items-center">
                  Confidence Level
                  <InfoTooltip text="Controls which percentile bands the worst/best case stats use. 95% means results cover 95% of simulated outcomes. Higher confidence = wider bands." />
                </label>
                <div className="flex gap-2">
                  {([90, 95, 99] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => setConfidenceLevel(level)}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                        confidenceLevel === level
                          ? "bg-accent text-background"
                          : "bg-surface border border-border text-muted hover:text-foreground hover:border-accent/30"
                      }`}
                    >
                      {level}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Risk Per Trade */}
              <div>
                <label className="flex items-center gap-2 mb-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useRiskPerTrade}
                    onChange={(e) => setUseRiskPerTrade(e.target.checked)}
                    className="accent-[var(--accent)] w-3.5 h-3.5"
                  />
                  <span className="text-xs text-muted/60 uppercase tracking-wider font-semibold flex items-center">
                    Risk Per Trade (Compounding)
                    <InfoTooltip text="Instead of flat dollar P&L, each trade risks this percentage of your current equity. This makes simulations compound — wins grow your position, losses shrink it. 2% is the standard recommendation." />
                  </span>
                </label>
                <div
                  className={`transition-all duration-200 overflow-hidden ${
                    useRiskPerTrade ? "max-h-[100px] opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="pl-5 border-l-2 border-accent/20">
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0.5"
                        max="10"
                        step="0.5"
                        value={riskPerTrade}
                        onChange={(e) => setRiskPerTrade(Number(e.target.value))}
                        className="flex-1 accent-[var(--accent)]"
                      />
                      <span className="text-sm font-bold text-accent w-12 text-right">
                        {riskPerTrade}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Win Rate Override / What-If Mode */}
              <div>
                <label className="flex items-center gap-2 mb-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useWinRateOverride}
                    onChange={(e) => setUseWinRateOverride(e.target.checked)}
                    className="accent-[var(--accent)] w-3.5 h-3.5"
                  />
                  <span className="text-xs text-muted/60 uppercase tracking-wider font-semibold flex items-center">
                    What-If Mode
                    <InfoTooltip text="Override your actual trade stats with hypothetical values. Useful for answering 'What if my win rate improved to 60%?' without needing real data." />
                  </span>
                </label>

                <div
                  className={`transition-all duration-200 overflow-hidden ${
                    useWinRateOverride ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="space-y-3 pl-5 border-l-2 border-accent/20">
                    <div>
                      <label className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1 flex items-center">
                        Win Rate
                        <InfoTooltip text="Percentage of trades that are winners." />
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="10"
                          max="90"
                          step="1"
                          value={winRateOverride}
                          onChange={(e) => setWinRateOverride(Number(e.target.value))}
                          className="flex-1 accent-[var(--accent)]"
                        />
                        <span className="text-sm font-bold text-accent w-12 text-right">
                          {winRateOverride}%
                        </span>
                      </div>
                    </div>

                    {/* R:R Ratio Toggle */}
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useRRRatio}
                        onChange={(e) => setUseRRRatio(e.target.checked)}
                        className="accent-[var(--accent)] w-3 h-3"
                      />
                      <span className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold flex items-center">
                        Use R:R Ratio
                        <InfoTooltip text="Set reward:risk ratio instead of separate avg win/loss. E.g., 2:1 means avg win = 2x avg loss." />
                      </span>
                    </label>

                    {useRRRatio ? (
                      <div className="space-y-3">
                        <div>
                          <label className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1 flex items-center">
                            Reward:Risk Ratio
                          </label>
                          <div className="flex items-center gap-3">
                            <input
                              type="range"
                              min="0.5"
                              max="5"
                              step="0.25"
                              value={rrRatio}
                              onChange={(e) => setRRRatio(Number(e.target.value))}
                              className="flex-1 accent-[var(--accent)]"
                            />
                            <span className="text-sm font-bold text-accent w-12 text-right">
                              {rrRatio}:1
                            </span>
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1 flex items-center">
                            Avg Loss ($)
                          </label>
                          <input
                            type="number"
                            value={avgLossOverride}
                            onChange={(e) => setAvgLossOverride(Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-xs font-medium focus:outline-none focus:border-accent/50 transition-all"
                          />
                          <p className="text-[10px] text-muted/40 mt-1">
                            Avg Win = ${(avgLossOverride * rrRatio).toFixed(0)} (Loss x {rrRatio})
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1 flex items-center">
                            Avg Win ($)
                          </label>
                          <input
                            type="number"
                            value={avgWinOverride}
                            onChange={(e) => setAvgWinOverride(Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-xs font-medium focus:outline-none focus:border-accent/50 transition-all"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1 flex items-center">
                            Avg Loss ($)
                          </label>
                          <input
                            type="number"
                            value={avgLossOverride}
                            onChange={(e) => setAvgLossOverride(Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-xs font-medium focus:outline-none focus:border-accent/50 transition-all"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trade info */}
          <div className="px-3 py-2 rounded-lg bg-accent/5 border border-accent/10">
            <p className="text-xs text-muted">
              {useWinRateOverride ? (
                <span className="flex items-center gap-1.5">
                  <Zap size={12} className="text-accent" />
                  What-if mode: {winRateOverride}% WR,{" "}
                  {useRRRatio
                    ? `${rrRatio}:1 R:R, $${avgLossOverride} avg loss`
                    : `$${avgWinOverride} avg win, $${avgLossOverride} avg loss`}
                  {useRiskPerTrade && `, ${riskPerTrade}% risk/trade`}
                </span>
              ) : (
                <>
                  Based on{" "}
                  <span className="text-accent font-bold">{tradePnls.length}</span>{" "}
                  closed trades
                  {useRiskPerTrade && (
                    <span className="text-muted/60"> | {riskPerTrade}% risk/trade</span>
                  )}
                </>
              )}
            </p>
          </div>

          <button
            onClick={handleRun}
            disabled={(tradePnls.length < 3 && !useWinRateOverride) || running}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
              tradePnls.length < 3 && !useWinRateOverride
                ? "bg-border text-muted cursor-not-allowed"
                : running
                ? "bg-accent/50 text-background"
                : "bg-accent text-background hover:bg-accent-hover hover:shadow-[0_0_20px_rgba(0,180,216,0.3)]"
            }`}
          >
            <Play size={16} />
            {running
              ? "Running..."
              : tradePnls.length < 3 && !useWinRateOverride
              ? "Need 3+ closed trades"
              : "Run Simulation"}
          </button>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {result ? (
            <>
              {/* Fan chart */}
              <div
                className="glass rounded-2xl border border-border/50 p-5"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-foreground flex items-center">
                    Equity Projection
                    <InfoTooltip text="Each line represents a percentile of all simulations. The darker inner band is where most outcomes land. A wider fan means more uncertainty." />
                  </h3>
                  <div className="flex items-center gap-3 text-[10px] text-muted">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.accent }} />
                      Median
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full opacity-30" style={{ backgroundColor: colors.accent }} />
                      5th-95th
                    </span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="mcOuter" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={colors.accent} stopOpacity={0.08} />
                        <stop offset="100%" stopColor={colors.accent} stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="mcMid" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={colors.accent} stopOpacity={0.15} />
                        <stop offset="100%" stopColor={colors.accent} stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="mcInner" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={colors.accent} stopOpacity={0.25} />
                        <stop offset="100%" stopColor={colors.accent} stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                    <XAxis
                      dataKey="trade"
                      tick={{ fontSize: 10, fill: colors.tick }}
                      axisLine={{ stroke: colors.grid }}
                      tickLine={false}
                      label={{ value: "Trade #", position: "insideBottom", offset: -5, fontSize: 10, fill: colors.tick }}
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
                      labelStyle={{ color: colors.tick }}
                      labelFormatter={(v) => `Trade #${v}`}
                      formatter={(value, name) => {
                        const labels: Record<string, string> = {
                          p95: "95th %ile", p90: "90th %ile", p75: "75th %ile",
                          p50: "Median", p25: "25th %ile", p10: "10th %ile", p5: "5th %ile",
                        };
                        return [`$${Number(value ?? 0).toFixed(2)}`, labels[String(name)] || String(name)];
                      }}
                    />
                    <Area type="monotone" dataKey="p95" stroke="none" fill="url(#mcOuter)" />
                    <Area type="monotone" dataKey="p5" stroke="none" fill="var(--background)" />
                    <Area type="monotone" dataKey="p90" stroke="none" fill="url(#mcMid)" />
                    <Area type="monotone" dataKey="p10" stroke="none" fill="var(--background)" />
                    <Area type="monotone" dataKey="p75" stroke="none" fill="url(#mcInner)" />
                    <Area type="monotone" dataKey="p25" stroke="none" fill="var(--background)" />
                    <Area type="monotone" dataKey="p50" stroke={colors.accent} strokeWidth={2.5} fill="none" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatBlock
                  label="Median Outcome"
                  value={`$${result.stats.medianFinalEquity.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                  icon={Target}
                  color={result.stats.medianFinalEquity > startingEquity ? "text-win" : "text-loss"}
                  tooltip="The middle result — 50% of simulations ended above this amount, 50% ended below."
                />
                <StatBlock
                  label={`Worst (${result.stats.confidenceLevel}% CI)`}
                  value={`$${result.stats.worstCase.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                  icon={TrendingDown}
                  color="text-loss"
                  tooltip={`Lower bound at ${result.stats.confidenceLevel}% confidence.`}
                />
                <StatBlock
                  label={`Best (${result.stats.confidenceLevel}% CI)`}
                  value={`$${result.stats.bestCase.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                  icon={TrendingUp}
                  color="text-win"
                  tooltip={`Upper bound at ${result.stats.confidenceLevel}% confidence.`}
                />
                <StatBlock
                  label="Prob. of Profit"
                  value={`${result.stats.probabilityOfProfit.toFixed(1)}%`}
                  icon={Activity}
                  color={result.stats.probabilityOfProfit > 50 ? "text-win" : "text-loss"}
                  tooltip="Percentage of simulations that ended with more money than you started. Above 60% is good, above 75% is excellent."
                />
                <StatBlock
                  label="Prob. of Ruin"
                  value={`${result.stats.probabilityOfRuin.toFixed(1)}%`}
                  icon={AlertTriangle}
                  color={result.stats.probabilityOfRuin > 10 ? "text-loss" : "text-win"}
                  tooltip={`Percentage of simulations where equity dropped to ${(result.stats.ruinThreshold * 100).toFixed(0)}% of starting. Below 5% is ideal.`}
                />
                <StatBlock
                  label="Median Max DD"
                  value={`${result.stats.medianMaxDrawdown.toFixed(1)}%`}
                  icon={BarChart3}
                  color="text-muted"
                  tooltip="Typical worst peak-to-trough decline. Prepare mentally for this drawdown — it will happen."
                />
                <StatBlock
                  label="Kelly Criterion"
                  value={`${result.stats.kellyPercent.toFixed(1)}%`}
                  icon={Percent}
                  color={result.stats.kellyPercent > 0 ? "text-accent" : "text-muted"}
                  tooltip="Mathematically optimal percentage of your bankroll to risk per trade. Based on your win rate and reward:risk ratio. Full Kelly is aggressive."
                />
                <StatBlock
                  label="Half Kelly"
                  value={`${result.stats.halfKellyPercent.toFixed(1)}%`}
                  icon={Percent}
                  color="text-accent"
                  tooltip="Half of Kelly — the conservative recommendation most pros use. Captures ~75% of optimal growth with much less variance."
                />
              </div>

              {/* Expected value + max consecutive losses */}
              <div
                className="glass rounded-xl border border-border/50 p-4"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold flex items-center">
                      Expected Value Per Trade
                      <InfoTooltip text="Average profit/loss per trade. Positive EV means your strategy has an edge over time." />
                    </p>
                    <p className={`text-xl font-bold ${result.stats.expectedValue >= 0 ? "text-win" : "text-loss"}`}>
                      {result.stats.expectedValue >= 0 ? "+" : ""}${result.stats.expectedValue.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold flex items-center">
                      Max Losing Streak
                      <InfoTooltip text="Median maximum consecutive losses across all simulations. Prepare mentally for this many losses in a row." />
                    </p>
                    <p className="text-xl font-bold text-loss">
                      {Math.round(result.stats.maxConsecutiveLosses)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold">
                      Over {numTrades} Trades
                    </p>
                    <p className={`text-xl font-bold ${result.stats.expectedValue * numTrades >= 0 ? "text-win" : "text-loss"}`}>
                      {result.stats.expectedValue * numTrades >= 0 ? "+" : ""}${(result.stats.expectedValue * numTrades).toFixed(0)}
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div
              className="glass rounded-2xl border border-border/50 p-12 flex flex-col items-center justify-center text-center"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <Dices size={48} className="text-accent/30 mb-4" />
              <h3 className="text-lg font-bold text-foreground mb-2">Ready to Simulate</h3>
              <p className="text-sm text-muted max-w-xs">
                Configure parameters and click &quot;Run Simulation&quot; to project your equity
                curve across thousands of possible futures.
              </p>
              <button
                onClick={() => setShowInfo(true)}
                className="mt-4 text-xs text-accent hover:text-accent-hover transition-colors underline"
              >
                Learn how Monte Carlo works
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

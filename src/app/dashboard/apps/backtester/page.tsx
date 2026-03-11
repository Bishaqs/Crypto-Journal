"use client";

import { useState, useEffect, useCallback } from "react";
import { FlaskConical, Play, Loader2, ChevronDown, ChevronUp, Info } from "lucide-react";
import { Header } from "@/components/header";
import { useTheme } from "@/lib/theme-context";
import { getChartColors } from "@/lib/chart-colors";
import { useSubscription } from "@/lib/use-subscription";
import { UpgradePrompt } from "@/components/upgrade-prompt";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { createClient } from "@/lib/supabase/client";
import { fetchAllTrades } from "@/lib/supabase/fetch-all-trades";
import type { Trade } from "@/lib/types";

import {
  type OHLCBar,
  type TradeDirection,
  type Timeframe,
  type BacktestResult,
  TIMEFRAME_OPTIONS,
  FORMULA_PRESETS,
} from "@/components/backtester/backtester-types";
import SymbolSearch from "@/components/ui/symbol-search";
import {
  runBacktest,
  generateDemoOHLC,
  parseFormula,
} from "@/components/backtester/backtester-engine";
import BacktestResults from "@/components/backtester/backtester-results";

export default function BacktesterPage() {
  const { hasAccess, loading: subLoading } = useSubscription();
  const { theme } = useTheme();
  const colors = getChartColors(theme);
  const supabase = createClient();

  // Parameters
  const [symbol, setSymbol] = useState("BTC");
  const [days, setDays] = useState(365);
  const [startingEquity, setStartingEquity] = useState(10000);
  const [commission, setCommission] = useState(0.001);
  const [direction, setDirection] = useState<TradeDirection>("long");
  const [timeframe, setTimeframe] = useState<Timeframe>("1d");
  const [entryOnNextBar, setEntryOnNextBar] = useState(true);

  // Formulas
  const [entryFormula, setEntryFormula] = useState(FORMULA_PRESETS[0].entry);
  const [exitFormula, setExitFormula] = useState(FORMULA_PRESETS[0].exit);

  // Data & state
  const [ohlcData, setOhlcData] = useState<OHLCBar[]>([]);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [dataSource, setDataSource] = useState<"api" | "trades" | "demo">("demo");

  // Fetch OHLC data — FIX: use json.ohlc, not json.prices
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/market/historical?symbol=${encodeURIComponent(symbol)}&days=${days}`,
      );
      if (!res.ok) throw new Error("API unavailable");
      const json = await res.json();
      const ohlc = (json.ohlc ?? []) as OHLCBar[];
      if (ohlc.length > 10) {
        setOhlcData(ohlc);
        setDataSource("api");
        setLoading(false);
        return;
      }
      throw new Error("Insufficient data");
    } catch {
      // Fallback: user's trade data
      try {
        const { data } = await fetchAllTrades(supabase);
        const trades = ((data as Trade[]) ?? []).filter((t) => t.symbol === symbol);
        if (trades.length >= 10) {
          const tradeOhlc: OHLCBar[] = trades.map((t) => ({
            date: new Date(t.open_timestamp).toISOString().split("T")[0],
            open: t.entry_price,
            high: t.entry_price * 1.005,
            low: t.entry_price * 0.995,
            close: t.entry_price,
            timestamp: new Date(t.open_timestamp).getTime(),
          }));
          setOhlcData(tradeOhlc);
          setDataSource("trades");
          setLoading(false);
          return;
        }
      } catch {
        // ignore
      }
      // Final fallback: demo data
      const demo = generateDemoOHLC(days, 100);
      setOhlcData(demo);
      setDataSource("demo");
      setError("No live API or trade data. Using simulated demo data.");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, days]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Live formula validation
  useEffect(() => {
    const ep = entryFormula.trim() ? parseFormula(entryFormula) : null;
    const xp = exitFormula.trim() ? parseFormula(exitFormula) : null;
    if (entryFormula.trim() && !ep) {
      setParseError("Invalid entry formula syntax");
    } else if (exitFormula.trim() && !xp) {
      setParseError("Invalid exit formula syntax");
    } else {
      setParseError(null);
    }
  }, [entryFormula, exitFormula]);

  function handleRun() {
    if (ohlcData.length < 30) return;
    const r = runBacktest(ohlcData, {
      symbol,
      days,
      startingEquity,
      commission,
      direction,
      entryOnNextBar,
      entryFormula,
      exitFormula,
    });
    if ("error" in r) {
      setError(r.error);
      setResult(null);
    } else {
      setResult(r);
      setError(null);
    }
  }

  function handleSymbolSelect(sym: string) {
    setSymbol(sym);
  }

  if (subLoading) return null;
  if (!hasAccess("advanced-analytics"))
    return <UpgradePrompt feature="advanced-analytics" requiredTier="max" />;

  return (
    <div className="space-y-5 mx-auto max-w-[1600px]">
      <Header />

      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <FlaskConical size={24} className="text-accent" />
          Strategy Backtester
          <InfoTooltip text="Test indicator-based entry/exit formulas against historical OHLC data. Evaluate win rate, drawdown, and equity curves before trading real money." size={14} />
        </h2>
        <p className="text-sm text-muted mt-0.5">
          Test indicator-based strategies against historical data with formula conditions
        </p>
      </div>

      {/* About / Reference (collapsible) */}
      <div
        className="glass rounded-2xl border border-border/50 overflow-hidden"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <button
          onClick={() => setAboutOpen(!aboutOpen)}
          className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-surface-hover/30 transition-colors"
        >
          <span className="flex items-center gap-2 text-xs font-semibold text-foreground uppercase tracking-wider">
            <Info size={14} className="text-accent" />
            About Backtester & Reference / Examples
          </span>
          {aboutOpen ? (
            <ChevronUp size={16} className="text-muted" />
          ) : (
            <ChevronDown size={16} className="text-muted" />
          )}
        </button>
        {aboutOpen && (
          <div className="px-5 pb-5 border-t border-border/30 space-y-4 mt-3">
            <p className="text-xs text-muted leading-relaxed">
              Enter conditions using formula syntax. Click a preset to auto-fill both fields.
            </p>

            <div>
              <h4 className="text-[11px] font-bold text-foreground uppercase tracking-wider mb-1.5">CROSSED</h4>
              <p className="text-xs text-muted mb-1">Two indicators crossing each other:</p>
              <div className="space-y-1">
                <code className="block text-[11px] font-mono text-accent/80 bg-surface/60 rounded-lg px-3 py-1.5">CROSSED(input_col=SMA(10), input_col2=EMA(25), direction=above)</code>
                <code className="block text-[11px] font-mono text-accent/80 bg-surface/60 rounded-lg px-3 py-1.5">CROSSED(input_col=PRICE, input_col2=SMA(20), direction=below)</code>
              </div>
            </div>

            <div>
              <h4 className="text-[11px] font-bold text-foreground uppercase tracking-wider mb-1.5">VALUE</h4>
              <p className="text-xs text-muted mb-1">Indicator crossing a fixed threshold:</p>
              <div className="space-y-1">
                <code className="block text-[11px] font-mono text-accent/80 bg-surface/60 rounded-lg px-3 py-1.5">VALUE(input_col=RSI(14), direction=above, value=70)</code>
                <code className="block text-[11px] font-mono text-accent/80 bg-surface/60 rounded-lg px-3 py-1.5">VALUE(input_col=RSI(14), direction=below, value=30)</code>
              </div>
            </div>

            <div>
              <h4 className="text-[11px] font-bold text-foreground uppercase tracking-wider mb-1.5">Supported Indicators</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                {[
                  ["SMA(period)", "Simple Moving Average"],
                  ["EMA(period)", "Exponential Moving Average"],
                  ["RSI(period)", "Relative Strength Index"],
                  ["MACD(fast,slow,signal)", "MACD Line"],
                  ["MACD_SIGNAL(fast,slow,signal)", "MACD Signal Line"],
                  ["PRICE", "Raw close price"],
                ].map(([fn, desc]) => (
                  <div key={fn} className="flex items-baseline gap-2 text-xs">
                    <code className="font-mono text-accent/80 whitespace-nowrap">{fn}</code>
                    <span className="text-muted">— {desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Symbol Search */}
      <SymbolSearch
        mode="crypto"
        value={symbol}
        onSelect={handleSymbolSelect}
        placeholder="Search any crypto..."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: Controls */}
        <div
          className="glass rounded-2xl border border-border/50 p-6 space-y-5"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
            Backtesting Parameters
          </h3>

          {/* Row 1: Symbol, Commission, Days, Equity */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1 block">
                Symbol
              </label>
              <div className="w-full px-3 py-2.5 rounded-xl bg-accent/5 border border-accent/20 text-accent text-xs font-bold uppercase">
                {symbol}
              </div>
            </div>
            <div>
              <label className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1 block">
                Comms (Trade %)
              </label>
              <input
                type="number"
                step="0.0001"
                value={commission}
                onChange={(e) => setCommission(Number(e.target.value) || 0)}
                className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-xs font-semibold focus:outline-none focus:border-accent/50 transition-all"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1 block">
                Date Range
              </label>
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-xs font-semibold focus:outline-none focus:border-accent/50 transition-all"
              >
                <option value={90}>90 Days</option>
                <option value={180}>180 Days</option>
                <option value={365}>1 Year</option>
                <option value={730}>2 Years</option>
                <option value={1825}>5 Years</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1 block">
                Starting Equity
              </label>
              <input
                type="number"
                value={startingEquity}
                onChange={(e) => setStartingEquity(Number(e.target.value) || 10000)}
                className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-xs font-semibold focus:outline-none focus:border-accent/50 transition-all"
              />
            </div>
          </div>

          {/* Row 2: Timeframe */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1 block">
                Timeframe
              </label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value as Timeframe)}
                className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-xs font-semibold focus:outline-none focus:border-accent/50 transition-all"
              >
                {TIMEFRAME_OPTIONS.map((tf) => (
                  <option key={tf.value} value={tf.value}>
                    {tf.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end pb-0.5">
              {dataSource === "api" && timeframe !== "1d" && (
                <p className="text-[10px] text-muted/40">
                  Note: CoinGecko provides daily data
                </p>
              )}
            </div>
          </div>

          {/* Entry Conditions */}
          <div>
            <label className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1 block">
              Entry Conditions
            </label>
            <textarea
              value={entryFormula}
              onChange={(e) => setEntryFormula(e.target.value)}
              rows={2}
              spellCheck={false}
              className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-xs font-mono focus:outline-none focus:border-accent/50 transition-all resize-none"
              placeholder="VALUE(input_col=RSI(14), direction=below, value=30)"
            />
          </div>

          {/* Exit Conditions */}
          <div>
            <label className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1 block">
              Exit Conditions
            </label>
            <textarea
              value={exitFormula}
              onChange={(e) => setExitFormula(e.target.value)}
              rows={2}
              spellCheck={false}
              className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-xs font-mono focus:outline-none focus:border-accent/50 transition-all resize-none"
              placeholder="VALUE(input_col=RSI(14), direction=above, value=70)"
            />
          </div>

          {/* Parse error */}
          {parseError && (
            <div className="px-3 py-2 rounded-lg bg-loss/5 border border-loss/20">
              <p className="text-xs text-loss">{parseError}</p>
            </div>
          )}

          {/* Presets */}
          <div>
            <label className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-2 block">
              Presets
            </label>
            <div className="flex flex-wrap gap-2">
              {FORMULA_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => {
                    setEntryFormula(preset.entry);
                    setExitFormula(preset.exit);
                  }}
                  title={preset.description}
                  className="px-3 py-1.5 rounded-lg text-[10px] font-semibold bg-surface border border-border/50 text-muted hover:text-foreground hover:border-accent/20 transition-all"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Options row */}
          <div className="flex flex-wrap items-center gap-5">
            <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={entryOnNextBar}
                onChange={(e) => setEntryOnNextBar(e.target.checked)}
                className="rounded border-border accent-accent"
              />
              Entry on next bar of signal?
            </label>
          </div>

          {/* Direction */}
          <div>
            <label className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-2 block">
              Direction
            </label>
            <div className="flex gap-2">
              {(["long", "short", "both"] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDirection(d)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                    direction === d
                      ? "bg-accent/10 text-accent border border-accent/30"
                      : "bg-surface border border-border/50 text-muted hover:text-foreground hover:border-accent/20"
                  }`}
                >
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Data info */}
          <div className="px-3 py-2 rounded-lg bg-accent/5 border border-accent/10">
            <p className="text-xs text-muted">
              Data:{" "}
              <span className="text-accent font-bold">{ohlcData.length}</span> bars (
              {dataSource === "api"
                ? "CoinGecko API"
                : dataSource === "trades"
                  ? "Trade Data"
                  : "Demo"}
              )
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="px-3 py-2 rounded-lg bg-loss/5 border border-loss/20">
              <p className="text-xs text-loss">{error}</p>
            </div>
          )}

          {/* Run button */}
          <button
            onClick={handleRun}
            disabled={loading || ohlcData.length < 30 || !!parseError}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
              loading || ohlcData.length < 30 || parseError
                ? "bg-border text-muted cursor-not-allowed"
                : "bg-accent text-background hover:bg-accent-hover"
            }`}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
            {loading ? "Loading Data..." : "Start Backtest"}
          </button>
        </div>

        {/* RIGHT: Results */}
        <div className="space-y-4">
          {result ? (
            <BacktestResults
              result={result}
              colors={colors}
              entryFormula={entryFormula}
              exitFormula={exitFormula}
              direction={direction}
            />
          ) : (
            <div
              className="glass rounded-2xl border border-border/50 p-12 flex flex-col items-center justify-center text-center"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <FlaskConical size={48} className="text-accent/30 mb-4" />
              <h3 className="text-lg font-bold text-foreground mb-2">Ready to Backtest</h3>
              <p className="text-sm text-muted max-w-xs">
                Define entry and exit conditions using formula syntax, select parameters, and run the
                backtest to see how the strategy performed historically.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

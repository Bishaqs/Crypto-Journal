"use client";

import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import {
  GitBranch,
  Play,
  Plus,
  Trash2,
  ChevronDown,
} from "lucide-react";
import { Header } from "@/components/header";
import { useTheme } from "@/lib/theme-context";
import { getChartColors } from "@/lib/chart-colors";
import { useSubscription } from "@/lib/use-subscription";
import { UpgradePrompt } from "@/components/upgrade-prompt";
import { usePageTour } from "@/lib/use-page-tour";
import { PageInfoButton } from "@/components/ui/page-info-button";
import {
  type OptionLeg,
  type OptionType,
  blackScholes,
  calculateGreeks,
  STRATEGY_PRESETS,
} from "@/lib/options-math";

const NUM_SIMS = 500;
const RISK_FREE_RATE = 0.05;

function StatBlock({ label, value, color = "text-foreground" }: { label: string; value: string; color?: string }) {
  return (
    <div className="glass rounded-xl border border-border/50 p-4" style={{ boxShadow: "var(--shadow-card)" }}>
      <p className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}

/** Geometric Brownian Motion price path */
function generatePricePath(spot: number, iv: number, days: number, r: number): number[] {
  const dt = 1 / 365;
  const path = [spot];
  for (let i = 1; i <= days; i++) {
    const prev = path[i - 1];
    const drift = (r - 0.5 * iv * iv) * dt;
    const diffusion = iv * Math.sqrt(dt) * gaussianRandom();
    path.push(prev * Math.exp(drift + diffusion));
  }
  return path;
}

function gaussianRandom(): number {
  // Box-Muller transform
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/** Calculate option strategy P&L at expiry for a given final price */
function calculatePnlAtExpiry(legs: OptionLeg[], finalPrice: number): number {
  return legs.reduce((total, leg) => {
    const intrinsic = leg.type === "call"
      ? Math.max(finalPrice - leg.strike, 0)
      : Math.max(leg.strike - finalPrice, 0);
    const pnl = (intrinsic - leg.premium) * leg.quantity * 100;
    return total + pnl;
  }, 0);
}

interface SimResult {
  fanChart: { day: number; p5: number; p25: number; p50: number; p75: number; p95: number }[];
  medianPnl: number;
  probProfit: number;
  maxLoss: number;
  maxGain: number;
  avgPnl: number;
}

function runOptionsSim(legs: OptionLeg[], spot: number, iv: number, days: number): SimResult {
  const allFinalPnls: number[] = [];
  // Store all path P&L values for percentile calculation at each day
  const allPathPnls: number[][] = Array.from({ length: days + 1 }, () => []);

  for (let sim = 0; sim < NUM_SIMS; sim++) {
    const pricePath = generatePricePath(spot, iv, days, RISK_FREE_RATE);

    for (let d = 0; d <= days; d++) {
      const currentPrice = pricePath[d];
      const remainingDays = days - d;
      const T = remainingDays / 365;

      // Calculate mark-to-market P&L using Black-Scholes for remaining time value
      let pnl = 0;
      for (const leg of legs) {
        if (remainingDays === 0) {
          // At expiry - intrinsic value only
          const intrinsic = leg.type === "call"
            ? Math.max(currentPrice - leg.strike, 0)
            : Math.max(leg.strike - currentPrice, 0);
          pnl += (intrinsic - leg.premium) * leg.quantity * 100;
        } else {
          const currentValue = blackScholes(leg.type, currentPrice, leg.strike, T, RISK_FREE_RATE, iv);
          pnl += (currentValue - leg.premium) * leg.quantity * 100;
        }
      }
      allPathPnls[d].push(pnl);
    }

    // Final P&L at expiry
    allFinalPnls.push(calculatePnlAtExpiry(legs, pricePath[days]));
  }

  // Build fan chart from percentiles
  const fanChart = allPathPnls.map((pnls, day) => {
    const sorted = [...pnls].sort((a, b) => a - b);
    const p = (pct: number) => sorted[Math.floor(pct / 100 * (sorted.length - 1))];
    return {
      day,
      p5: Math.round(p(5)),
      p25: Math.round(p(25)),
      p50: Math.round(p(50)),
      p75: Math.round(p(75)),
      p95: Math.round(p(95)),
    };
  });

  const sortedFinal = [...allFinalPnls].sort((a, b) => a - b);
  const profitable = allFinalPnls.filter((p) => p > 0).length;

  return {
    fanChart,
    medianPnl: sortedFinal[Math.floor(sortedFinal.length / 2)],
    probProfit: (profitable / allFinalPnls.length) * 100,
    maxLoss: sortedFinal[0],
    maxGain: sortedFinal[sortedFinal.length - 1],
    avgPnl: allFinalPnls.reduce((s, v) => s + v, 0) / allFinalPnls.length,
  };
}

const DEFAULT_LEG: OptionLeg = { type: "call", strike: 100, premium: 5, quantity: 1 };

export default function OptionsSimulatorPage() {
  usePageTour("options-simulator-page");
  const { hasAccess, loading: subLoading } = useSubscription();
  const { theme } = useTheme();
  const colors = getChartColors(theme);

  const [legs, setLegs] = useState<OptionLeg[]>([{ ...DEFAULT_LEG }]);
  const [spotPrice, setSpotPrice] = useState(100);
  const [iv, setIv] = useState(30); // percentage
  const [daysToExpiry, setDaysToExpiry] = useState(30);
  const [result, setResult] = useState<SimResult | null>(null);
  const [running, setRunning] = useState(false);
  const [showPresets, setShowPresets] = useState(false);

  function updateLeg(index: number, updates: Partial<OptionLeg>) {
    setLegs((prev) => prev.map((l, i) => (i === index ? { ...l, ...updates } : l)));
  }

  function addLeg() {
    if (legs.length >= 4) return;
    setLegs((prev) => [...prev, { ...DEFAULT_LEG, strike: spotPrice }]);
  }

  function removeLeg(index: number) {
    if (legs.length <= 1) return;
    setLegs((prev) => prev.filter((_, i) => i !== index));
  }

  function applyPreset(preset: (typeof STRATEGY_PRESETS)[number]) {
    setLegs(preset.legs(spotPrice));
    setShowPresets(false);
  }

  function handleRun() {
    setRunning(true);
    setTimeout(() => {
      const r = runOptionsSim(legs, spotPrice, iv / 100, daysToExpiry);
      setResult(r);
      setRunning(false);
    }, 50);
  }

  // Total greeks for current position
  const totalGreeks = useMemo(() => {
    return legs.reduce(
      (acc, leg) => {
        const g = calculateGreeks(leg.type, spotPrice, leg.strike, daysToExpiry / 365, RISK_FREE_RATE, iv / 100);
        return {
          delta: acc.delta + g.delta * leg.quantity,
          gamma: acc.gamma + g.gamma * leg.quantity,
          theta: acc.theta + g.theta * leg.quantity,
          vega: acc.vega + g.vega * leg.quantity,
        };
      },
      { delta: 0, gamma: 0, theta: 0, vega: 0 }
    );
  }, [legs, spotPrice, daysToExpiry, iv]);

  if (subLoading) return null;
  if (!hasAccess("advanced-analytics")) return <UpgradePrompt feature="advanced-analytics" requiredTier="max" />;

  return (
    <div className="space-y-6 mx-auto max-w-[1600px]">
      <Header />

      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <GitBranch size={24} className="text-accent" />
          Options Monte Carlo
          <PageInfoButton tourName="options-simulator-page" />
        </h2>
        <p className="text-sm text-muted mt-0.5">
          Simulate {NUM_SIMS} random price paths to project option strategy outcomes
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="glass rounded-2xl border border-border/50 p-6 space-y-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Strategy Setup</h3>
            <div className="relative">
              <button
                onClick={() => setShowPresets(!showPresets)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 text-accent text-xs font-medium hover:bg-accent/20 transition-all"
              >
                Presets <ChevronDown size={12} />
              </button>
              {showPresets && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowPresets(false)} />
                  <div className="absolute right-0 top-full mt-1 glass border border-border/50 rounded-xl z-50 py-1 min-w-[180px]" style={{ boxShadow: "var(--shadow-card)" }}>
                    {STRATEGY_PRESETS.map((p) => (
                      <button key={p.name} onClick={() => applyPreset(p)} className="w-full text-left px-4 py-2 text-sm text-muted hover:text-foreground hover:bg-surface-hover transition-colors">
                        {p.name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Market Parameters */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1 block">Spot ($)</label>
              <input
                type="number"
                value={spotPrice}
                onChange={(e) => setSpotPrice(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-xs focus:outline-none focus:border-accent/50"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1 block">IV (%)</label>
              <input
                type="number"
                value={iv}
                onChange={(e) => setIv(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-xs focus:outline-none focus:border-accent/50"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1 block">Days to Expiry</label>
              <input
                type="number"
                value={daysToExpiry}
                onChange={(e) => setDaysToExpiry(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-xs focus:outline-none focus:border-accent/50"
              />
            </div>
          </div>

          {/* Legs */}
          <div className="space-y-3">
            {legs.map((leg, i) => (
              <div key={i} className="p-4 rounded-xl bg-background/50 border border-border/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted uppercase">Leg {i + 1}</span>
                  {legs.length > 1 && (
                    <button onClick={() => removeLeg(i)} className="text-muted hover:text-loss transition-colors">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1 block">Type</label>
                    <select
                      value={leg.type}
                      onChange={(e) => updateLeg(i, { type: e.target.value as OptionType })}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-xs focus:outline-none focus:border-accent/50"
                    >
                      <option value="call">Call</option>
                      <option value="put">Put</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1 block">Direction</label>
                    <select
                      value={leg.quantity > 0 ? "long" : "short"}
                      onChange={(e) => updateLeg(i, { quantity: e.target.value === "long" ? Math.abs(leg.quantity) : -Math.abs(leg.quantity) })}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-xs focus:outline-none focus:border-accent/50"
                    >
                      <option value="long">Long</option>
                      <option value="short">Short</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1 block">Strike ($)</label>
                    <input
                      type="number"
                      value={leg.strike}
                      onChange={(e) => updateLeg(i, { strike: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-xs focus:outline-none focus:border-accent/50"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1 block">Premium ($)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={leg.premium}
                      onChange={(e) => updateLeg(i, { premium: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-xs focus:outline-none focus:border-accent/50"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {legs.length < 4 && (
            <button
              onClick={addLeg}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-border text-muted text-xs hover:text-accent hover:border-accent/30 transition-all"
            >
              <Plus size={14} /> Add Leg
            </button>
          )}

          {/* Greeks summary */}
          <div className="grid grid-cols-4 gap-2">
            <div className="text-center">
              <p className="text-[9px] text-muted/40 uppercase">Delta</p>
              <p className="text-xs font-bold text-foreground">{totalGreeks.delta.toFixed(3)}</p>
            </div>
            <div className="text-center">
              <p className="text-[9px] text-muted/40 uppercase">Gamma</p>
              <p className="text-xs font-bold text-foreground">{totalGreeks.gamma.toFixed(4)}</p>
            </div>
            <div className="text-center">
              <p className="text-[9px] text-muted/40 uppercase">Theta</p>
              <p className={`text-xs font-bold ${totalGreeks.theta < 0 ? "text-loss" : "text-win"}`}>${totalGreeks.theta.toFixed(2)}</p>
            </div>
            <div className="text-center">
              <p className="text-[9px] text-muted/40 uppercase">Vega</p>
              <p className="text-xs font-bold text-foreground">${totalGreeks.vega.toFixed(2)}</p>
            </div>
          </div>

          <button
            onClick={handleRun}
            disabled={running}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
              running
                ? "bg-accent/50 text-background"
                : "bg-accent text-background hover:bg-accent-hover"
            }`}
          >
            <Play size={16} />
            {running ? "Simulating..." : `Run ${NUM_SIMS} Simulations`}
          </button>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {result ? (
            <>
              {/* Fan Chart */}
              <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-foreground">P&L Distribution Over Time</h3>
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
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={result.fanChart}>
                    <defs>
                      <linearGradient id="osOuter" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={colors.accent} stopOpacity={0.08} />
                        <stop offset="100%" stopColor={colors.accent} stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="osInner" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={colors.accent} stopOpacity={0.2} />
                        <stop offset="100%" stopColor={colors.accent} stopOpacity={0.05} />
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
                      tickFormatter={(v) => `$${v}`}
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
                      formatter={(value, name) => {
                        const labels: Record<string, string> = {
                          p95: "95th %ile", p75: "75th %ile",
                          p50: "Median", p25: "25th %ile", p5: "5th %ile",
                        };
                        return [`$${Number(value ?? 0).toFixed(0)}`, labels[String(name)] || String(name)];
                      }}
                      labelFormatter={(v) => `Day ${v}`}
                    />
                    <ReferenceLine y={0} stroke={colors.grid} strokeDasharray="3 3" />
                    <Area type="monotone" dataKey="p95" stroke="none" fill="url(#osOuter)" />
                    <Area type="monotone" dataKey="p5" stroke="none" fill="var(--background)" />
                    <Area type="monotone" dataKey="p75" stroke="none" fill="url(#osInner)" />
                    <Area type="monotone" dataKey="p25" stroke="none" fill="var(--background)" />
                    <Area type="monotone" dataKey="p50" stroke={colors.accent} strokeWidth={2.5} fill="none" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatBlock
                  label="Median P&L"
                  value={`$${result.medianPnl.toFixed(0)}`}
                  color={result.medianPnl >= 0 ? "text-win" : "text-loss"}
                />
                <StatBlock
                  label="Prob. of Profit"
                  value={`${result.probProfit.toFixed(1)}%`}
                  color={result.probProfit > 50 ? "text-win" : "text-loss"}
                />
                <StatBlock
                  label="Max Loss"
                  value={`$${result.maxLoss.toFixed(0)}`}
                  color="text-loss"
                />
                <StatBlock
                  label="Max Gain"
                  value={`$${result.maxGain.toFixed(0)}`}
                  color="text-win"
                />
              </div>

              {/* Average P&L */}
              <div className="glass rounded-xl border border-border/50 p-4" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold">Expected P&L (Average)</p>
                    <p className={`text-xl font-bold ${result.avgPnl >= 0 ? "text-win" : "text-loss"}`}>
                      {result.avgPnl >= 0 ? "+" : ""}${result.avgPnl.toFixed(0)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold">Simulations</p>
                    <p className="text-xl font-bold text-accent">{NUM_SIMS}</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div
              className="glass rounded-2xl border border-border/50 p-12 flex flex-col items-center justify-center text-center"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <GitBranch size={48} className="text-accent/30 mb-4" />
              <h3 className="text-lg font-bold text-foreground mb-2">Ready to Simulate</h3>
              <p className="text-sm text-muted max-w-xs">
                Build an options strategy, set implied volatility, and run {NUM_SIMS} Monte Carlo price paths to see the distribution of P&L outcomes.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import {
  LineChart as LineChartIcon,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Target,
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
  generatePayoffCurve,
  findBreakEvens,
  calculatePayoff,
  calculateGreeks,
  STRATEGY_PRESETS,
} from "@/lib/options-math";

function StatBlock({ label, value, color = "text-foreground" }: { label: string; value: string; color?: string }) {
  return (
    <div className="glass rounded-xl border border-border/50 p-4 hover:border-accent/20 transition-all duration-300" style={{ boxShadow: "var(--shadow-card)" }}>
      <p className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}

const DEFAULT_LEG: OptionLeg = { type: "call", strike: 100, premium: 5, quantity: 1 };

export default function OptionsPayoffPage() {
  usePageTour("options-payoff-page");
  const { hasAccess, loading: subLoading } = useSubscription();
  const { theme } = useTheme();
  const colors = getChartColors(theme);

  const [legs, setLegs] = useState<OptionLeg[]>([{ ...DEFAULT_LEG }]);
  const [spotPrice, setSpotPrice] = useState(100);
  const [showPresets, setShowPresets] = useState(false);

  const curve = useMemo(() => generatePayoffCurve(legs, spotPrice), [legs, spotPrice]);
  const breakEvens = useMemo(() => findBreakEvens(legs, spotPrice), [legs, spotPrice]);

  const maxProfit = useMemo(() => {
    const pnls = curve.map((p) => p.pnl);
    const max = Math.max(...pnls);
    return max > 1e8 ? "Unlimited" : `$${max.toFixed(0)}`;
  }, [curve]);

  const maxLoss = useMemo(() => {
    const pnls = curve.map((p) => p.pnl);
    return `$${Math.min(...pnls).toFixed(0)}`;
  }, [curve]);

  const currentPnl = useMemo(() => calculatePayoff(legs, spotPrice), [legs, spotPrice]);

  const totalGreeks = useMemo(() => {
    return legs.reduce(
      (acc, leg) => {
        const g = calculateGreeks(leg.type, spotPrice, leg.strike, (leg.expDays ?? 30) / 365, 0.05, leg.iv ?? 0.3);
        return {
          delta: acc.delta + g.delta * leg.quantity,
          gamma: acc.gamma + g.gamma * leg.quantity,
          theta: acc.theta + g.theta * leg.quantity,
          vega: acc.vega + g.vega * leg.quantity,
        };
      },
      { delta: 0, gamma: 0, theta: 0, vega: 0 }
    );
  }, [legs, spotPrice]);

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

  if (subLoading) return null;
  if (!hasAccess("advanced-analytics")) return <UpgradePrompt feature="advanced-analytics" requiredTier="pro" />;

  return (
    <div className="space-y-6 mx-auto max-w-[1600px]">
      <Header />

      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <LineChartIcon size={24} className="text-accent" />
          Options Payoff Diagram
          <PageInfoButton tourName="options-payoff-page" />
        </h2>
        <p className="text-sm text-muted mt-0.5">
          Visualize profit/loss at expiration for any options strategy
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="glass rounded-2xl border border-border/50 p-6 space-y-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Strategy Builder</h3>
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

          {/* Spot Price */}
          <div>
            <label className="text-xs text-muted/60 uppercase tracking-wider font-semibold mb-1.5 block">
              Underlying Price ($)
            </label>
            <input
              type="number"
              value={spotPrice}
              onChange={(e) => setSpotPrice(Number(e.target.value))}
              className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm font-medium focus:outline-none focus:border-accent/50 transition-all"
            />
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
        </div>

        {/* Chart + Stats */}
        <div className="space-y-4">
          <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
            <h3 className="text-sm font-semibold text-foreground mb-4">Payoff at Expiration</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={curve}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                <XAxis
                  dataKey="price"
                  tick={{ fontSize: 10, fill: colors.tick }}
                  axisLine={{ stroke: colors.grid }}
                  tickLine={false}
                  label={{ value: "Underlying Price", position: "insideBottom", offset: -5, fontSize: 10, fill: colors.tick }}
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
                  formatter={(value) => [`$${Number(value).toFixed(2)}`, "P&L"]}
                  labelFormatter={(v) => `Price: $${v}`}
                />
                <ReferenceLine y={0} stroke={colors.grid} strokeDasharray="3 3" />
                <ReferenceLine x={spotPrice} stroke={colors.accent} strokeDasharray="5 5" strokeOpacity={0.5} />
                <Line type="monotone" dataKey="pnl" stroke={colors.accent} strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatBlock label="Max Profit" value={maxProfit} color="text-win" />
            <StatBlock label="Max Loss" value={maxLoss} color="text-loss" />
            <StatBlock
              label="Break-Even"
              value={breakEvens.length > 0 ? breakEvens.map((b) => `$${b}`).join(", ") : "N/A"}
            />
            <StatBlock
              label="Current P&L"
              value={`$${currentPnl.toFixed(0)}`}
              color={currentPnl >= 0 ? "text-win" : "text-loss"}
            />
          </div>

          <div className="grid grid-cols-4 gap-3">
            <StatBlock label="Delta" value={totalGreeks.delta.toFixed(3)} />
            <StatBlock label="Gamma" value={totalGreeks.gamma.toFixed(4)} />
            <StatBlock label="Theta" value={`$${totalGreeks.theta.toFixed(2)}`} color={totalGreeks.theta < 0 ? "text-loss" : "text-win"} />
            <StatBlock label="Vega" value={`$${totalGreeks.vega.toFixed(2)}`} />
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchAllTrades } from "@/lib/supabase/fetch-all-trades";
import { Trade } from "@/lib/types";
import { DEMO_TRADES } from "@/lib/demo-data";
import { calculateTradePnl } from "@/lib/calculations";
import { useDateRange } from "@/lib/date-range-context";
import {
  runSimulation,
  type MonteCarloConfig,
  type MonteCarloResult,
} from "@/lib/monte-carlo";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  Layers,
  Play,
  Plus,
  Trash2,
  Target,
  Activity,
  TrendingDown,
  Loader2,
} from "lucide-react";
import { Header } from "@/components/header";
import { useTheme } from "@/lib/theme-context";
import { getChartColors } from "@/lib/chart-colors";
import { useSubscription } from "@/lib/use-subscription";
import { UpgradePrompt } from "@/components/upgrade-prompt";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { FeatureInfoBox } from "@/components/ui/feature-info-box";
import { FEATURE_INFO } from "@/lib/feature-info-content";

interface SimSlot {
  id: number;
  label: string;
  riskPerTrade: number;
  numTrades: number;
  result: MonteCarloResult | null;
}

const SLOT_COLORS = ["var(--accent)", "#22c55e", "#f59e0b", "#ef4444"];

let nextId = 1;
function createSlot(overrides?: Partial<SimSlot>): SimSlot {
  return { id: nextId++, label: `Scenario ${nextId - 1}`, riskPerTrade: 2, numTrades: 100, result: null, ...overrides };
}

export default function MultiSimulatorPage() {
  const { hasAccess, loading: subLoading } = useSubscription();
  const { theme } = useTheme();
  const colors = getChartColors(theme);
  const { filterTrades } = useDateRange();
  const supabase = createClient();

  const [tradePnls, setTradePnls] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingEquity, setStartingEquity] = useState(10000);
  const [slots, setSlots] = useState<SimSlot[]>([createSlot({ riskPerTrade: 1 }), createSlot({ riskPerTrade: 2 })]);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await fetchAllTrades(supabase);
      const trades = ((data as Trade[]) ?? []).length > 0 ? (data as Trade[]) : DEMO_TRADES;
      const closed = filterTrades(trades).filter((t) => t.close_timestamp && t.exit_price !== null);
      const pnls = closed.map((t) => t.pnl ?? calculateTradePnl(t) ?? 0);
      setTradePnls(pnls);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function runAll() {
    if (tradePnls.length < 3) return;
    setRunning(true);
    setTimeout(() => {
      setSlots((prev) =>
        prev.map((slot) => {
          const config: MonteCarloConfig = {
            numSimulations: 500,
            numTrades: slot.numTrades,
            startingEquity,
            riskPerTrade: slot.riskPerTrade,
          };
          const result = runSimulation(tradePnls, config);
          return { ...slot, result };
        })
      );
      setRunning(false);
    }, 50);
  }

  function addSlot() {
    if (slots.length >= 4) return;
    setSlots((prev) => [...prev, createSlot({ riskPerTrade: (prev.length + 1) * 1.5 })]);
  }

  function removeSlot(id: number) {
    if (slots.length <= 2) return;
    setSlots((prev) => prev.filter((s) => s.id !== id));
  }

  function updateSlot(id: number, updates: Partial<SimSlot>) {
    setSlots((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates, result: null } : s)));
  }

  // Build chart data from all slot results
  const maxTrades = Math.max(...slots.map((s) => s.numTrades));
  const hasResults = slots.some((s) => s.result);
  const chartData = hasResults
    ? Array.from({ length: maxTrades + 1 }, (_, i) => {
        const point: Record<string, number> = { trade: i };
        slots.forEach((slot, si) => {
          if (slot.result && i <= slot.numTrades) {
            point[`s${si}`] = slot.result.percentiles.p50[i];
          }
        });
        return point;
      })
    : [];

  if (subLoading) return null;
  if (!hasAccess("monte-carlo")) return <UpgradePrompt feature="monte-carlo" requiredTier="max" />;

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 size={24} className="animate-spin text-accent" /></div>;
  }

  return (
    <div className="space-y-6 mx-auto max-w-[1600px]">
      <Header />

      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <Layers size={24} className="text-accent" />
          Multi Simulator
          <InfoTooltip text="Run multiple Monte Carlo simulations to compare different risk and position sizing scenarios side by side." size={14} />
        </h2>
        <p className="text-sm text-muted mt-0.5">
          Compare multiple Monte Carlo scenarios side by side
        </p>
      </div>

      <FeatureInfoBox variant="dashboard" {...FEATURE_INFO["multi-simulator"]} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="glass rounded-2xl border border-border/50 p-6 space-y-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Scenarios</h3>

          <div>
            <label className="text-xs text-muted/60 uppercase tracking-wider font-semibold mb-1.5 block">Starting Equity ($)</label>
            <input type="number" value={startingEquity} onChange={(e) => setStartingEquity(Number(e.target.value))} className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm font-medium focus:outline-none focus:border-accent/50 transition-all" />
          </div>

          <div className="space-y-3">
            {slots.map((slot, i) => (
              <div key={slot.id} className="p-4 rounded-xl bg-background/50 border border-border/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: SLOT_COLORS[i] }} />
                    <input
                      type="text"
                      value={slot.label}
                      onChange={(e) => updateSlot(slot.id, { label: e.target.value })}
                      className="text-xs font-bold text-foreground bg-transparent border-none outline-none w-32"
                    />
                  </div>
                  {slots.length > 2 && (
                    <button onClick={() => removeSlot(slot.id)} className="text-muted hover:text-loss transition-colors">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1 block">Risk/Trade (%)</label>
                    <div className="flex items-center gap-2">
                      <input type="range" min="0.5" max="10" step="0.5" value={slot.riskPerTrade} onChange={(e) => updateSlot(slot.id, { riskPerTrade: Number(e.target.value) })} className="flex-1 accent-[var(--accent)]" />
                      <span className="text-xs font-bold text-accent w-10 text-right">{slot.riskPerTrade}%</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1 block">Trades</label>
                    <div className="flex items-center gap-2">
                      <input type="range" min="20" max="500" step="10" value={slot.numTrades} onChange={(e) => updateSlot(slot.id, { numTrades: Number(e.target.value) })} className="flex-1 accent-[var(--accent)]" />
                      <span className="text-xs font-bold text-accent w-10 text-right">{slot.numTrades}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {slots.length < 4 && (
            <button onClick={addSlot} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-border text-muted text-xs hover:text-accent hover:border-accent/30 transition-all">
              <Plus size={14} /> Add Scenario
            </button>
          )}

          <div className="px-3 py-2 rounded-lg bg-accent/5 border border-accent/10">
            <p className="text-xs text-muted">
              Based on <span className="text-accent font-bold">{tradePnls.length}</span> closed trades
            </p>
          </div>

          <button
            onClick={runAll}
            disabled={tradePnls.length < 3 || running}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
              tradePnls.length < 3
                ? "bg-border text-muted cursor-not-allowed"
                : running ? "bg-accent/50 text-background" : "bg-accent text-background hover:bg-accent-hover"
            }`}
          >
            <Play size={16} />
            {running ? "Running..." : tradePnls.length < 3 ? "Need 3+ closed trades" : "Run All Scenarios"}
          </button>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {hasResults ? (
            <>
              <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
                <h3 className="text-sm font-semibold text-foreground mb-4">Median Equity Curves (Overlay)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                    <XAxis dataKey="trade" tick={{ fontSize: 10, fill: colors.tick }} axisLine={{ stroke: colors.grid }} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: colors.tick }} tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: colors.tooltipBg, backdropFilter: "blur(16px)", border: colors.tooltipBorder, borderRadius: "12px", fontSize: "12px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}
                      formatter={(value, name) => {
                        const idx = Number(String(name).replace("s", ""));
                        return [`$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, slots[idx]?.label ?? name];
                      }}
                      labelFormatter={(v) => `Trade #${v}`}
                    />
                    <Legend formatter={(value) => { const idx = Number(value.replace("s", "")); return slots[idx]?.label ?? value; }} />
                    {slots.map((_, i) => (
                      <Area key={i} type="monotone" dataKey={`s${i}`} stroke={SLOT_COLORS[i]} strokeWidth={2.5} fill="none" dot={false} />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Stats comparison table */}
              <div className="glass rounded-2xl border border-border/50 p-5 overflow-x-auto" style={{ boxShadow: "var(--shadow-card)" }}>
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">Scenario Comparison</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/30">
                      <th className="text-left text-[10px] text-muted/60 uppercase tracking-wider font-semibold py-2 pr-4">Metric</th>
                      {slots.map((s, i) => (
                        <th key={s.id} className="text-left text-[10px] uppercase tracking-wider font-semibold py-2 px-2" style={{ color: SLOT_COLORS[i] }}>
                          {s.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    <tr>
                      <td className="py-2.5 pr-4 text-muted text-xs">Risk/Trade</td>
                      {slots.map((s) => <td key={s.id} className="py-2.5 px-2 font-medium text-foreground">{s.riskPerTrade}%</td>)}
                    </tr>
                    <tr>
                      <td className="py-2.5 pr-4 text-muted text-xs">Median Final</td>
                      {slots.map((s) => (
                        <td key={s.id} className={`py-2.5 px-2 font-bold ${(s.result?.stats.medianFinalEquity ?? 0) > startingEquity ? "text-win" : "text-loss"}`}>
                          ${s.result?.stats.medianFinalEquity.toLocaleString(undefined, { maximumFractionDigits: 0 }) ?? "—"}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2.5 pr-4 text-muted text-xs">Prob. of Profit</td>
                      {slots.map((s) => (
                        <td key={s.id} className={`py-2.5 px-2 font-bold ${(s.result?.stats.probabilityOfProfit ?? 0) > 50 ? "text-win" : "text-loss"}`}>
                          {s.result?.stats.probabilityOfProfit.toFixed(1) ?? "—"}%
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2.5 pr-4 text-muted text-xs">Prob. of Ruin</td>
                      {slots.map((s) => (
                        <td key={s.id} className={`py-2.5 px-2 font-bold ${(s.result?.stats.probabilityOfRuin ?? 0) > 10 ? "text-loss" : "text-win"}`}>
                          {s.result?.stats.probabilityOfRuin.toFixed(1) ?? "—"}%
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2.5 pr-4 text-muted text-xs">Max Drawdown</td>
                      {slots.map((s) => <td key={s.id} className="py-2.5 px-2 text-muted">{s.result?.stats.medianMaxDrawdown.toFixed(1) ?? "—"}%</td>)}
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="glass rounded-2xl border border-border/50 p-12 flex flex-col items-center justify-center text-center" style={{ boxShadow: "var(--shadow-card)" }}>
              <Layers size={48} className="text-accent/30 mb-4" />
              <h3 className="text-lg font-bold text-foreground mb-2">Ready to Compare</h3>
              <p className="text-sm text-muted max-w-xs">
                Configure 2-4 scenarios with different risk parameters and run them all simultaneously to compare outcomes.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

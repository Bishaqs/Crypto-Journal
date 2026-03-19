"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchAllTrades } from "@/lib/supabase/fetch-all-trades";
import { Trade } from "@/lib/types";
import { calculateTradePnl } from "@/lib/calculations";
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
import { Target, TrendingUp, Hash, DollarSign, Calendar } from "lucide-react";
import { Header } from "@/components/header";
import { useTheme } from "@/lib/theme-context";
import { getChartColors } from "@/lib/chart-colors";
import { useSubscription } from "@/lib/use-subscription";
import { UpgradePrompt } from "@/components/upgrade-prompt";
import { InfoTooltip } from "@/components/ui/info-tooltip";

function StatBlock({ label, value, icon: Icon, color = "text-foreground" }: { label: string; value: string; icon: React.ElementType; color?: string }) {
  return (
    <div className="glass rounded-xl border border-border/50 p-4 hover:border-accent/20 transition-all duration-300" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="flex items-center gap-2 mb-1">
        <Icon size={14} className="text-muted/60" />
        <p className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold">{label}</p>
      </div>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}

export default function TargetSimulatorPage() {
  const { hasAccess, loading: subLoading } = useSubscription();
  const { theme } = useTheme();
  const colors = getChartColors(theme);
  const supabase = createClient();

  const [startingEquity, setStartingEquity] = useState(10000);
  const [targetEquity, setTargetEquity] = useState(25000);
  const [riskPerTrade, setRiskPerTrade] = useState(2);
  const [winRate, setWinRate] = useState(55);
  const [avgWin, setAvgWin] = useState(200);
  const [avgLoss, setAvgLoss] = useState(100);
  const [tradesPerDay, setTradesPerDay] = useState(3);

  // Pre-fill from actual trade stats
  useEffect(() => {
    (async () => {
      const { data } = await fetchAllTrades(supabase);
      const trades = (data as Trade[]) ?? [];
      const closed = trades.filter((t) => t.close_timestamp && t.exit_price !== null);
      if (closed.length < 5) return;

      const pnls = closed.map((t) => t.pnl ?? calculateTradePnl(t) ?? 0);
      const wins = pnls.filter((p) => p > 0);
      const losses = pnls.filter((p) => p < 0);
      if (wins.length > 0 && losses.length > 0) {
        setWinRate(Math.round((wins.length / pnls.length) * 100));
        setAvgWin(Math.round(wins.reduce((a, b) => a + b, 0) / wins.length));
        setAvgLoss(Math.round(Math.abs(losses.reduce((a, b) => a + b, 0) / losses.length)));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const projection = useMemo(() => {
    const wr = winRate / 100;
    const ev = wr * avgWin - (1 - wr) * avgLoss;
    if (ev <= 0) return null;

    const data: { trade: number; equity: number }[] = [{ trade: 0, equity: startingEquity }];
    let equity = startingEquity;
    let tradeNum = 0;

    while (equity < targetEquity && tradeNum < 5000) {
      tradeNum++;
      equity += ev;
      data.push({ trade: tradeNum, equity: Math.round(equity) });
    }

    const tradesToTarget = tradeNum;
    const daysToTarget = Math.ceil(tradesToTarget / tradesPerDay);

    return { data, tradesToTarget, daysToTarget, ev };
  }, [startingEquity, targetEquity, winRate, avgWin, avgLoss, tradesPerDay]);

  if (subLoading) return null;
  if (!hasAccess("advanced-analytics")) return <UpgradePrompt feature="advanced-analytics" requiredTier="pro" />;

  return (
    <div className="space-y-6 mx-auto max-w-[1600px]">
      <Header />

      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <Target size={24} className="text-accent" />
          Target Simulator
          <InfoTooltip text="Project how many trades you need to reach your equity target based on your actual win rate, average win, and risk per trade." size={14} articleId="ap-simulator" />
        </h2>
        <p className="text-sm text-muted mt-0.5">
          Project how many trades to reach your equity target based on your stats
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="glass rounded-2xl border border-border/50 p-6 space-y-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Parameters</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted/60 uppercase tracking-wider font-semibold mb-1.5 block">Starting Equity ($)</label>
              <input type="number" value={startingEquity} onChange={(e) => setStartingEquity(Number(e.target.value))} className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm font-medium focus:outline-none focus:border-accent/50 transition-all" />
            </div>
            <div>
              <label className="text-xs text-muted/60 uppercase tracking-wider font-semibold mb-1.5 block">Target Equity ($)</label>
              <input type="number" value={targetEquity} onChange={(e) => setTargetEquity(Number(e.target.value))} className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm font-medium focus:outline-none focus:border-accent/50 transition-all" />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted/60 uppercase tracking-wider font-semibold mb-1.5 block">Win Rate</label>
            <div className="flex items-center gap-3">
              <input type="range" min="20" max="90" step="1" value={winRate} onChange={(e) => setWinRate(Number(e.target.value))} className="flex-1 accent-[var(--accent)]" />
              <span className="text-sm font-bold text-accent w-12 text-right">{winRate}%</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted/60 uppercase tracking-wider font-semibold mb-1.5 block">Avg Win ($)</label>
              <input type="number" value={avgWin} onChange={(e) => setAvgWin(Number(e.target.value))} className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm font-medium focus:outline-none focus:border-accent/50 transition-all" />
            </div>
            <div>
              <label className="text-xs text-muted/60 uppercase tracking-wider font-semibold mb-1.5 block">Avg Loss ($)</label>
              <input type="number" value={avgLoss} onChange={(e) => setAvgLoss(Number(e.target.value))} className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm font-medium focus:outline-none focus:border-accent/50 transition-all" />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted/60 uppercase tracking-wider font-semibold mb-1.5 block">Trades per Day</label>
            <div className="flex items-center gap-3">
              <input type="range" min="1" max="20" step="1" value={tradesPerDay} onChange={(e) => setTradesPerDay(Number(e.target.value))} className="flex-1 accent-[var(--accent)]" />
              <span className="text-sm font-bold text-accent w-8 text-right">{tradesPerDay}</span>
            </div>
          </div>

          {/* EV info */}
          <div className="px-3 py-2 rounded-lg bg-accent/5 border border-accent/10">
            <p className="text-xs text-muted">
              Expected value per trade:{" "}
              <span className={`font-bold ${(winRate / 100 * avgWin - (1 - winRate / 100) * avgLoss) >= 0 ? "text-win" : "text-loss"}`}>
                ${(winRate / 100 * avgWin - (1 - winRate / 100) * avgLoss).toFixed(2)}
              </span>
            </p>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {projection ? (
            <>
              <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
                <h3 className="text-sm font-semibold text-foreground mb-4">Projected Equity Curve</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={projection.data}>
                    <defs>
                      <linearGradient id="targetGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={colors.accent} stopOpacity={0.2} />
                        <stop offset="100%" stopColor={colors.accent} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                    <XAxis dataKey="trade" tick={{ fontSize: 10, fill: colors.tick }} axisLine={{ stroke: colors.grid }} tickLine={false} label={{ value: "Trade #", position: "insideBottom", offset: -5, fontSize: 10, fill: colors.tick }} />
                    <YAxis tick={{ fontSize: 10, fill: colors.tick }} tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: colors.tooltipBg, backdropFilter: "blur(16px)", border: colors.tooltipBorder, borderRadius: "12px", fontSize: "12px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}
                      formatter={(value) => [`$${Number(value).toLocaleString()}`, "Equity"]}
                      labelFormatter={(v) => `Trade #${v}`}
                    />
                    <ReferenceLine y={targetEquity} stroke={colors.accent} strokeDasharray="5 5" strokeOpacity={0.5} label={{ value: "Target", fill: colors.accent, fontSize: 10 }} />
                    <Area type="monotone" dataKey="equity" stroke={colors.accent} strokeWidth={2.5} fill="url(#targetGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatBlock label="Trades to Target" value={projection.tradesToTarget.toLocaleString()} icon={Hash} color="text-accent" />
                <StatBlock label="Days to Target" value={`${projection.daysToTarget.toLocaleString()} days`} icon={Calendar} />
                <StatBlock label="EV per Trade" value={`$${projection.ev.toFixed(2)}`} icon={DollarSign} color="text-win" />
                <StatBlock label="Total Profit" value={`$${(targetEquity - startingEquity).toLocaleString()}`} icon={TrendingUp} color="text-win" />
              </div>
            </>
          ) : (
            <div className="glass rounded-2xl border border-border/50 p-12 flex flex-col items-center justify-center text-center" style={{ boxShadow: "var(--shadow-card)" }}>
              <Target size={48} className="text-accent/30 mb-4" />
              <h3 className="text-lg font-bold text-foreground mb-2">Negative Expected Value</h3>
              <p className="text-sm text-muted max-w-xs">
                Your current parameters produce a negative EV. Increase win rate or avg win, or decrease avg loss to project a path to your target.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

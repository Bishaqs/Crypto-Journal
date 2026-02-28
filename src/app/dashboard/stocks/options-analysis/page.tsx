"use client";

import { useState, useMemo } from "react";
import { useTheme } from "@/lib/theme-context";
import { getChartColors } from "@/lib/chart-colors";
import { StatBlock } from "@/components/ui/stat-block";
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import { BarChart3, TrendingUp, TrendingDown, Hash, DollarSign, Clock } from "lucide-react";

interface StockTrade {
  id: string;
  symbol: string;
  asset_type: "stock" | "option";
  position: "long" | "short";
  entry_price: number;
  exit_price: number | null;
  quantity: number;
  fees: number;
  open_timestamp: string;
  close_timestamp: string | null;
  option_type: "call" | "put" | null;
  strike_price: number | null;
  expiration_date: string | null;
  premium_per_contract: number | null;
  contracts: number | null;
  underlying_symbol: string | null;
  pnl: number | null;
}

const MOCK_OPTIONS: StockTrade[] = [
  {
    id: "opt-1", symbol: "TSLA 260C 02/28", asset_type: "option", position: "long",
    entry_price: 4.20, exit_price: 6.80, quantity: 10, fees: 6.50,
    open_timestamp: "2026-02-19T09:35:00Z", close_timestamp: "2026-02-19T11:00:00Z",
    option_type: "call", strike_price: 260, expiration_date: "2026-02-28",
    premium_per_contract: 4.20, contracts: 10, underlying_symbol: "TSLA", pnl: 2593.50,
  },
  {
    id: "opt-2", symbol: "MSFT 410P 02/21", asset_type: "option", position: "long",
    entry_price: 3.10, exit_price: 1.80, quantity: 5, fees: 3.25,
    open_timestamp: "2026-02-17T10:15:00Z", close_timestamp: "2026-02-17T14:30:00Z",
    option_type: "put", strike_price: 410, expiration_date: "2026-02-21",
    premium_per_contract: 3.10, contracts: 5, underlying_symbol: "MSFT", pnl: -653.25,
  },
  {
    id: "opt-3", symbol: "AAPL 195C 03/07", asset_type: "option", position: "long",
    entry_price: 2.50, exit_price: 4.10, quantity: 8, fees: 5.00,
    open_timestamp: "2026-02-20T10:00:00Z", close_timestamp: "2026-02-21T13:00:00Z",
    option_type: "call", strike_price: 195, expiration_date: "2026-03-07",
    premium_per_contract: 2.50, contracts: 8, underlying_symbol: "AAPL", pnl: 1275.00,
  },
  {
    id: "opt-4", symbol: "NVDA 900C 03/14", asset_type: "option", position: "long",
    entry_price: 15.00, exit_price: 12.00, quantity: 2, fees: 4.00,
    open_timestamp: "2026-02-18T11:00:00Z", close_timestamp: "2026-02-19T15:00:00Z",
    option_type: "call", strike_price: 900, expiration_date: "2026-03-14",
    premium_per_contract: 15.00, contracts: 2, underlying_symbol: "NVDA", pnl: -604.00,
  },
  {
    id: "opt-5", symbol: "SPY 520P 02/28", asset_type: "option", position: "long",
    entry_price: 1.80, exit_price: 3.50, quantity: 20, fees: 10.00,
    open_timestamp: "2026-02-21T09:31:00Z", close_timestamp: "2026-02-21T14:00:00Z",
    option_type: "put", strike_price: 520, expiration_date: "2026-02-28",
    premium_per_contract: 1.80, contracts: 20, underlying_symbol: "SPY", pnl: 3390.00,
  },
  {
    id: "opt-6", symbol: "AMD 180C 03/07", asset_type: "option", position: "long",
    entry_price: 3.00, exit_price: 2.20, quantity: 10, fees: 6.00,
    open_timestamp: "2026-02-20T10:30:00Z", close_timestamp: "2026-02-20T15:30:00Z",
    option_type: "call", strike_price: 180, expiration_date: "2026-03-07",
    premium_per_contract: 3.00, contracts: 10, underlying_symbol: "AMD", pnl: -806.00,
  },
];

const PIE_COLORS = ["#22c55e", "#ef4444"];

export default function OptionsAnalysisPage() {
  const [trades] = useState<StockTrade[]>(MOCK_OPTIONS);
  const { theme } = useTheme();
  const colors = getChartColors(theme);

  const closedTrades = useMemo(() => trades.filter(t => t.exit_price !== null), [trades]);

  const calls = useMemo(() => closedTrades.filter(t => t.option_type === "call"), [closedTrades]);
  const puts = useMemo(() => closedTrades.filter(t => t.option_type === "put"), [closedTrades]);

  function groupStats(list: StockTrade[]) {
    const pnls = list.map(t => t.pnl ?? 0);
    const wins = pnls.filter(p => p > 0).length;
    const totalPnl = pnls.reduce((s, p) => s + p, 0);
    return {
      count: list.length,
      wins,
      winRate: list.length > 0 ? (wins / list.length) * 100 : 0,
      totalPnl,
      avgPnl: list.length > 0 ? totalPnl / list.length : 0,
      avgPremium: list.length > 0 ? list.reduce((s, t) => s + (t.premium_per_contract ?? 0), 0) / list.length : 0,
    };
  }

  const callStats = useMemo(() => groupStats(calls), [calls]);
  const putStats = useMemo(() => groupStats(puts), [puts]);
  const allStats = useMemo(() => groupStats(closedTrades), [closedTrades]);

  const comparisonData = useMemo(() => [
    { type: "Calls", winRate: callStats.winRate, avgPnl: callStats.avgPnl, count: callStats.count, totalPnl: callStats.totalPnl },
    { type: "Puts", winRate: putStats.winRate, avgPnl: putStats.avgPnl, count: putStats.count, totalPnl: putStats.totalPnl },
  ], [callStats, putStats]);

  const pieData = useMemo(() => [
    { name: "Calls", value: calls.length },
    { name: "Puts", value: puts.length },
  ].filter(d => d.value > 0), [calls, puts]);

  // PnL by underlying symbol
  const byUnderlying = useMemo(() => {
    const map = new Map<string, { count: number; pnl: number; wins: number }>();
    for (const t of closedTrades) {
      const sym = t.underlying_symbol ?? t.symbol;
      const existing = map.get(sym) ?? { count: 0, pnl: 0, wins: 0 };
      const pnl = t.pnl ?? 0;
      map.set(sym, { count: existing.count + 1, pnl: existing.pnl + pnl, wins: existing.wins + (pnl > 0 ? 1 : 0) });
    }
    return Array.from(map.entries())
      .map(([symbol, d]) => ({ symbol, count: d.count, totalPnl: d.pnl, winRate: (d.wins / d.count) * 100 }))
      .sort((a, b) => b.totalPnl - a.totalPnl);
  }, [closedTrades]);

  // Days to expiration analysis
  const dteData = useMemo(() => {
    const buckets: { label: string; min: number; max: number }[] = [
      { label: "0-3 DTE", min: 0, max: 3 },
      { label: "4-7 DTE", min: 4, max: 7 },
      { label: "8-14 DTE", min: 8, max: 14 },
      { label: "15-30 DTE", min: 15, max: 30 },
      { label: "30+ DTE", min: 31, max: Infinity },
    ];

    return buckets.map(b => {
      const matching = closedTrades.filter(t => {
        if (!t.expiration_date || !t.close_timestamp) return false;
        const dte = Math.max(0, Math.floor((new Date(t.expiration_date).getTime() - new Date(t.close_timestamp).getTime()) / (1000 * 60 * 60 * 24)));
        return dte >= b.min && dte <= b.max;
      });
      const pnls = matching.map(t => t.pnl ?? 0);
      const wins = pnls.filter(p => p > 0).length;
      return {
        label: b.label,
        count: matching.length,
        avgPnl: matching.length > 0 ? pnls.reduce((s, p) => s + p, 0) / matching.length : 0,
        winRate: matching.length > 0 ? (wins / matching.length) * 100 : 0,
      };
    }).filter(d => d.count > 0);
  }, [closedTrades]);

  const tooltipStyle = { background: colors.tooltipBg, backdropFilter: "blur(16px)", border: colors.tooltipBorder, borderRadius: "12px", fontSize: "12px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-semibold bg-accent/15 text-accent px-2 py-0.5 rounded-full">DEMO DATA</span>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <BarChart3 size={24} className="text-accent" />Options Analysis
        </h1>
        <p className="text-sm text-muted mt-0.5">Performance breakdown for options trades: calls vs puts, DTE analysis, and underlying exposure</p>
      </div>

      {/* Stat blocks */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBlock label="Total Options" value={String(allStats.count)} icon={Hash} />
        <StatBlock label="Avg Premium" value={`$${allStats.avgPremium.toFixed(2)}`} icon={DollarSign} />
        <StatBlock label="Calls Win Rate" value={`${callStats.winRate.toFixed(0)}%`} sub={`${callStats.count} trades`} icon={TrendingUp} color={callStats.winRate >= 50 ? "text-win" : "text-loss"} />
        <StatBlock label="Puts Win Rate" value={`${putStats.winRate.toFixed(0)}%`} sub={`${putStats.count} trades`} icon={TrendingDown} color={putStats.winRate >= 50 ? "text-win" : "text-loss"} />
      </div>

      {/* Calls vs Puts comparison */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <h3 className="text-sm font-semibold text-foreground mb-4">Calls vs Puts — Total PnL</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
              <XAxis dataKey="type" tick={{ fill: colors.tick, fontSize: 11 }} />
              <YAxis tick={{ fill: colors.tick, fontSize: 10 }} tickFormatter={(v) => `$${v}`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number | undefined) => [`$${(v ?? 0).toFixed(2)}`, "Total PnL"]} />
              <Bar dataKey="totalPnl" radius={[4, 4, 0, 0]}>
                {comparisonData.map((d, i) => <Cell key={i} fill={d.totalPnl >= 0 ? colors.win : colors.loss} fillOpacity={0.85} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Calls/Puts distribution */}
        {pieData.length > 0 && (
          <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
            <h3 className="text-sm font-semibold text-foreground mb-4">Calls vs Puts Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={45}
                  label={(props: { name?: string; value?: number }) => `${props.name}: ${props.value}`}>
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* DTE analysis */}
      {dteData.length > 0 && (
        <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <h3 className="text-sm font-semibold text-foreground mb-4">Performance by Days to Expiration (at close)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dteData}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
              <XAxis dataKey="label" tick={{ fill: colors.tick, fontSize: 10 }} />
              <YAxis tick={{ fill: colors.tick, fontSize: 10 }} tickFormatter={(v) => `$${v}`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number | undefined, name: string | undefined) => {
                if (name === "avgPnl") return [`$${(v ?? 0).toFixed(2)}`, "Avg PnL"];
                return [v, name];
              }} />
              <Bar dataKey="avgPnl" radius={[4, 4, 0, 0]}>
                {dteData.map((d, i) => <Cell key={i} fill={d.avgPnl >= 0 ? colors.win : colors.loss} fillOpacity={0.85} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* By underlying */}
      {byUnderlying.length > 0 && (
        <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <h3 className="text-sm font-semibold text-foreground mb-4">PnL by Underlying</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-muted text-left">
                  <th className="py-2 px-3 font-medium">Symbol</th>
                  <th className="py-2 px-3 font-medium text-right">Trades</th>
                  <th className="py-2 px-3 font-medium text-right">Win Rate</th>
                  <th className="py-2 px-3 font-medium text-right">Total PnL</th>
                </tr>
              </thead>
              <tbody>
                {byUnderlying.map(d => (
                  <tr key={d.symbol} className="border-b border-border/30 hover:bg-surface-hover transition-colors">
                    <td className="py-2.5 px-3 font-medium text-foreground">{d.symbol}</td>
                    <td className="py-2.5 px-3 text-right text-muted">{d.count}</td>
                    <td className={`py-2.5 px-3 text-right font-medium ${d.winRate >= 50 ? "text-win" : "text-loss"}`}>{d.winRate.toFixed(0)}%</td>
                    <td className={`py-2.5 px-3 text-right font-semibold ${d.totalPnl >= 0 ? "text-win" : "text-loss"}`}>${d.totalPnl.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

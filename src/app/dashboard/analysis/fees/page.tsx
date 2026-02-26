"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trade } from "@/lib/types";
import { DEMO_TRADES } from "@/lib/demo-data";
import { useDateRange } from "@/lib/date-range-context";
import { calculateGasImpact } from "@/lib/calculations";
import { groupTradesBySymbol } from "@/lib/trade-grouping";
import { useTheme } from "@/lib/theme-context";
import { getChartColors } from "@/lib/chart-colors";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { DollarSign, Percent, TrendingUp, Fuel } from "lucide-react";

export default function FeesPage() {
  const supabase = createClient();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingDemo, setUsingDemo] = useState(false);
  const { filterTrades } = useDateRange();
  const { theme } = useTheme();
  const colors = getChartColors(theme);

  const fetchTrades = useCallback(async () => {
    const { data } = await supabase
      .from("trades")
      .select("*")
      .order("open_timestamp", { ascending: false });
    const dbTrades = (data as Trade[]) ?? [];
    if (dbTrades.length === 0) {
      setTrades(DEMO_TRADES);
      setUsingDemo(true);
    } else {
      setTrades(dbTrades);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchTrades(); }, [fetchTrades]);

  const filtered = useMemo(() => filterTrades(trades), [trades, filterTrades]);
  const gasImpact = useMemo(() => calculateGasImpact(filtered), [filtered]);

  const totalExchangeFees = useMemo(
    () => filtered.reduce((s, t) => s + t.fees, 0),
    [filtered],
  );

  const symbolFees = useMemo(() => {
    const groups = groupTradesBySymbol(filtered);
    return groups.map((g) => ({
      ...g,
      fees: g.trades.reduce((s, t) => s + t.fees, 0),
      gas: g.trades.reduce((s, t) => s + (t.gas_fee ?? 0), 0),
    })).sort((a, b) => (b.fees + b.gas) - (a.fees + a.gas));
  }, [filtered]);

  const chartData = useMemo(
    () => symbolFees.slice(0, 10).map((s) => ({
      name: s.label,
      fees: s.fees,
      gas: s.gas,
    })),
    [symbolFees],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
          <DollarSign size={20} className="text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Commissions / Fees</h1>
          <p className="text-sm text-muted">
            {usingDemo ? "Sample data" : `Fee analysis across ${filtered.length} trades`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass rounded-2xl border border-border/50 p-4" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center gap-1.5 mb-2"><DollarSign size={13} className="text-loss" /><span className="text-[10px] uppercase tracking-wider text-muted font-semibold">Exchange Fees</span></div>
          <p className="text-xl font-bold text-loss">${totalExchangeFees.toFixed(2)}</p>
        </div>
        <div className="glass rounded-2xl border border-border/50 p-4" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center gap-1.5 mb-2"><Fuel size={13} className="text-loss" /><span className="text-[10px] uppercase tracking-wider text-muted font-semibold">Gas Fees</span></div>
          <p className="text-xl font-bold text-loss">${gasImpact.totalGasFees.toFixed(2)}</p>
        </div>
        <div className="glass rounded-2xl border border-border/50 p-4" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center gap-1.5 mb-2"><Percent size={13} className="text-muted" /><span className="text-[10px] uppercase tracking-wider text-muted font-semibold">Fees % of P&L</span></div>
          <p className="text-xl font-bold text-foreground">{gasImpact.gasAsPercent.toFixed(1)}%</p>
        </div>
        <div className="glass rounded-2xl border border-border/50 p-4" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center gap-1.5 mb-2"><TrendingUp size={13} className={gasImpact.netPnlAfterGas >= 0 ? "text-win" : "text-loss"} /><span className="text-[10px] uppercase tracking-wider text-muted font-semibold">Net After Fees</span></div>
          <p className={`text-xl font-bold ${gasImpact.netPnlAfterGas >= 0 ? "text-win" : "text-loss"}`}>
            ${gasImpact.netPnlAfterGas.toFixed(2)}
          </p>
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <h3 className="text-sm font-semibold text-foreground mb-4">Fees by Symbol (Top 10)</h3>
          <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 36)}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 80, right: 20, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: colors.tick }} tickFormatter={(v) => `$${v}`} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: colors.tick }} axisLine={false} tickLine={false} width={75} />
              <Tooltip
                contentStyle={{ background: colors.tooltipBg, backdropFilter: "blur(16px)", border: colors.tooltipBorder, borderRadius: "12px", fontSize: "12px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any, name: any) => [`$${Number(value ?? 0).toFixed(2)}`, name === "fees" ? "Exchange" : "Gas"]}
              />
              <Bar dataKey="fees" stackId="a" fill={colors.loss} fillOpacity={0.85} />
              <Bar dataKey="gas" stackId="a" fill={colors.accent} fillOpacity={0.6} radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-3 justify-center text-xs text-muted">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: colors.loss, opacity: 0.85 }} /> Exchange Fees</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: colors.accent, opacity: 0.6 }} /> Gas Fees</span>
          </div>
        </div>
      )}

      {symbolFees.length > 0 && (
        <div className="glass rounded-2xl border border-border/50 overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="px-5 py-4 border-b border-border/50">
            <h3 className="text-sm font-semibold text-foreground">Fee Breakdown by Symbol</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-left">
                  <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-muted font-semibold">Symbol</th>
                  <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-muted font-semibold text-right">Trades</th>
                  <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-muted font-semibold text-right">Exchange Fees</th>
                  <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-muted font-semibold text-right">Gas Fees</th>
                  <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-muted font-semibold text-right">Total Fees</th>
                  <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-muted font-semibold text-right">P&L</th>
                </tr>
              </thead>
              <tbody>
                {symbolFees.map((s) => (
                  <tr key={s.key} className="border-b border-border/30 last:border-0 hover:bg-surface-hover/50 transition-colors">
                    <td className="px-4 py-2.5 font-medium text-foreground">{s.label}</td>
                    <td className="px-4 py-2.5 text-right text-muted">{s.tradeCount}</td>
                    <td className="px-4 py-2.5 text-right text-loss">${s.fees.toFixed(2)}</td>
                    <td className="px-4 py-2.5 text-right text-loss">${s.gas.toFixed(2)}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-loss">${(s.fees + s.gas).toFixed(2)}</td>
                    <td className={`px-4 py-2.5 text-right font-semibold ${s.totalPnl >= 0 ? "text-win" : "text-loss"}`}>
                      {s.totalPnl >= 0 ? "+" : ""}${s.totalPnl.toFixed(2)}
                    </td>
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

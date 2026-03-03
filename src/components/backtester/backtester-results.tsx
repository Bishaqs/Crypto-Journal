"use client";

import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { BacktestResult } from "./backtester-types";

interface BacktestResultsProps {
  result: BacktestResult;
  colors: {
    accent: string;
    grid: string;
    tick: string;
    tooltipBg: string;
    tooltipBorder: string;
    win: string;
    loss: string;
  };
  entryFormula: string;
  exitFormula: string;
  direction: string;
}

function StatBlock({
  label,
  value,
  color = "text-foreground",
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div
      className="glass rounded-xl border border-border/50 p-4 hover:border-accent/20 transition-all duration-300"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <p className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}

export default function BacktestResults({
  result,
  colors,
  entryFormula,
  exitFormula,
  direction,
}: BacktestResultsProps) {
  const [showAllTrades, setShowAllTrades] = useState(false);
  const visibleTrades = showAllTrades ? result.trades : result.trades.slice(0, 20);

  return (
    <div className="space-y-4">
      {/* Equity Curve */}
      <div
        className="glass rounded-2xl border border-border/50 p-5"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
          Equity Curve
        </h3>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={result.equityCurve}>
            <defs>
              <linearGradient id="btEquityGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors.accent} stopOpacity={0.2} />
                <stop offset="100%" stopColor={colors.accent} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: colors.tick }}
              axisLine={{ stroke: colors.grid }}
              tickLine={false}
              tickFormatter={(v) => {
                const d = String(v);
                return d.length >= 7 ? d.slice(5, 7) + "/" + d.slice(2, 4) : d;
              }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: colors.tick }}
              tickFormatter={(v) => `$${(Number(v ?? 0) / 1000).toFixed(1)}k`}
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
              labelFormatter={(v) => String(v)}
            />
            <Area
              type="monotone"
              dataKey="equity"
              stroke={colors.accent}
              strokeWidth={2.5}
              fill="url(#btEquityGrad)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Drawdown Chart */}
      <div
        className="glass rounded-2xl border border-border/50 p-5"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
          Drawdown
        </h3>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={result.drawdownCurve}>
            <defs>
              <linearGradient id="btDrawdownGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors.loss} stopOpacity={0.3} />
                <stop offset="100%" stopColor={colors.loss} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: colors.tick }}
              axisLine={{ stroke: colors.grid }}
              tickLine={false}
              tickFormatter={(v) => {
                const d = String(v);
                return d.length >= 7 ? d.slice(5, 7) + "/" + d.slice(2, 4) : d;
              }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: colors.tick }}
              tickFormatter={(v) => `${Number(v ?? 0).toFixed(1)}%`}
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
              formatter={(value) => [`${Number(value ?? 0).toFixed(2)}%`, "Drawdown"]}
              labelFormatter={(v) => String(v)}
            />
            <Area
              type="monotone"
              dataKey="drawdown"
              stroke={colors.loss}
              strokeWidth={1.5}
              fill="url(#btDrawdownGrad)"
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
          label="Max Drawdown"
          value={`-${result.maxDrawdown.toFixed(1)}%`}
          color="text-loss"
        />
        <StatBlock
          label="Trades"
          value={`${result.numTrades} (${result.wins}W / ${result.losses}L)`}
        />
        <StatBlock
          label="Sharpe Ratio"
          value={result.sharpeRatio.toFixed(2)}
          color={result.sharpeRatio >= 1 ? "text-win" : result.sharpeRatio >= 0 ? "text-foreground" : "text-loss"}
        />
        <StatBlock
          label="Profit Factor"
          value={result.profitFactor >= 999 ? "N/A" : result.profitFactor.toFixed(2)}
          color={result.profitFactor >= 1.5 ? "text-win" : result.profitFactor >= 1 ? "text-foreground" : "text-loss"}
        />
        <StatBlock
          label="Avg Win"
          value={`$${result.avgWin.toFixed(0)}`}
          color="text-win"
        />
        <StatBlock
          label="Avg Loss"
          value={`-$${result.avgLoss.toFixed(0)}`}
          color="text-loss"
        />
      </div>

      {/* Trade Log */}
      {result.trades.length > 0 && (
        <div
          className="glass rounded-2xl border border-border/50 p-5 overflow-x-auto"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
            Trade Log ({result.trades.length} trades)
          </h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold">
                  #
                </th>
                <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold">
                  Entry
                </th>
                <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold">
                  Exit
                </th>
                <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold">
                  Dir
                </th>
                <th className="px-3 py-2 text-right text-[10px] uppercase tracking-wider text-muted/60 font-semibold">
                  Entry $
                </th>
                <th className="px-3 py-2 text-right text-[10px] uppercase tracking-wider text-muted/60 font-semibold">
                  Exit $
                </th>
                <th className="px-3 py-2 text-right text-[10px] uppercase tracking-wider text-muted/60 font-semibold">
                  P&L
                </th>
                <th className="px-3 py-2 text-right text-[10px] uppercase tracking-wider text-muted/60 font-semibold">
                  P&L %
                </th>
                <th className="px-3 py-2 text-right text-[10px] uppercase tracking-wider text-muted/60 font-semibold">
                  Equity
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleTrades.map((t, idx) => (
                <tr
                  key={idx}
                  className="border-b border-border/30 hover:bg-surface-hover/50 transition-colors"
                >
                  <td className="px-3 py-2 text-xs text-muted">{idx + 1}</td>
                  <td className="px-3 py-2 text-xs text-foreground tabular-nums">{t.entryDate}</td>
                  <td className="px-3 py-2 text-xs text-foreground tabular-nums">{t.exitDate}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`text-[10px] font-bold uppercase ${
                        t.direction === "long" ? "text-win" : "text-loss"
                      }`}
                    >
                      {t.direction}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-muted tabular-nums text-right">
                    ${t.entryPrice.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted tabular-nums text-right">
                    ${t.exitPrice.toFixed(2)}
                  </td>
                  <td
                    className={`px-3 py-2 text-xs font-bold tabular-nums text-right ${
                      t.pnl >= 0 ? "text-win" : "text-loss"
                    }`}
                  >
                    {t.pnl >= 0 ? "+" : ""}${t.pnl.toFixed(0)}
                  </td>
                  <td
                    className={`px-3 py-2 text-xs tabular-nums text-right ${
                      t.pnlPct >= 0 ? "text-win" : "text-loss"
                    }`}
                  >
                    {t.pnlPct >= 0 ? "+" : ""}{t.pnlPct.toFixed(1)}%
                  </td>
                  <td className="px-3 py-2 text-xs text-foreground tabular-nums text-right font-semibold">
                    ${t.cumulativeEquity.toFixed(0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {result.trades.length > 20 && (
            <button
              onClick={() => setShowAllTrades(!showAllTrades)}
              className="mt-3 flex items-center gap-1 text-[10px] text-accent hover:text-accent-hover font-semibold uppercase tracking-wider mx-auto transition-colors"
            >
              {showAllTrades ? (
                <>
                  Show Less <ChevronUp size={12} />
                </>
              ) : (
                <>
                  Show All {result.trades.length} Trades <ChevronDown size={12} />
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Strategy Summary */}
      <div
        className="glass rounded-xl border border-border/50 p-4"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <p className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-2">
          Strategy
        </p>
        <div className="flex flex-col gap-1.5 text-xs">
          <span className="text-foreground">
            <span className="text-win font-semibold">ENTRY:</span>{" "}
            <code className="text-muted bg-background/50 px-1.5 py-0.5 rounded text-[11px]">
              {entryFormula}
            </code>
          </span>
          <span className="text-foreground">
            <span className="text-loss font-semibold">EXIT:</span>{" "}
            <code className="text-muted bg-background/50 px-1.5 py-0.5 rounded text-[11px]">
              {exitFormula}
            </code>
          </span>
          <span className="text-muted/60">
            Direction: <span className="text-foreground font-semibold capitalize">{direction}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import type { IncomeStatementData } from "./fundamentals-types";
import { INCOME_STATEMENT_ROWS } from "./fundamentals-types";
import { formatCurrencyLarge } from "./fundamentals-utils";

interface IncomeStatementTabProps {
  data: IncomeStatementData;
  symbol: string;
  colors: {
    win: string;
    loss: string;
    accent: string;
    grid: string;
    tick: string;
    tooltipBg: string;
    tooltipBorder: string;
  };
}

const tooltipStyle = (colors: IncomeStatementTabProps["colors"]) => ({
  background: colors.tooltipBg,
  backdropFilter: "blur(16px)",
  border: colors.tooltipBorder,
  borderRadius: "12px",
  fontSize: "12px",
  boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
});

export default function IncomeStatementTab({ data, symbol, colors }: IncomeStatementTabProps) {
  const { annual } = data;

  return (
    <div className="space-y-4">
      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Revenue & Profitability */}
        <div
          className="glass rounded-2xl border border-border/50 p-5"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
            Revenue & Profitability
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={annual}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: colors.tick }} tickLine={false} axisLine={{ stroke: colors.grid }} />
              <YAxis width={80} tick={{ fontSize: 10, fill: colors.tick }} tickFormatter={(v) => formatCurrencyLarge(Number(v ?? 0))} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle(colors)} formatter={(value) => [formatCurrencyLarge(Number(value ?? 0)), ""]} />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Line type="monotone" dataKey="totalRevenue" name="Revenue" stroke={colors.accent} strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="grossProfit" name="Gross Profit" stroke={colors.win} strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="netIncome" name="Net Income" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Operating Metrics */}
        <div
          className="glass rounded-2xl border border-border/50 p-5"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
            Operating Metrics
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={annual}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: colors.tick }} tickLine={false} axisLine={{ stroke: colors.grid }} />
              <YAxis width={80} tick={{ fontSize: 10, fill: colors.tick }} tickFormatter={(v) => formatCurrencyLarge(Number(v ?? 0))} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle(colors)} formatter={(value) => [formatCurrencyLarge(Number(value ?? 0)), ""]} />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Line type="monotone" dataKey="operatingIncome" name="Operating Income" stroke={colors.win} strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="ebit" name="EBIT" stroke={colors.accent} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Data Table */}
      <div
        className="glass rounded-2xl border border-border/50 overflow-hidden"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <div className="p-5 pb-3">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
            {symbol} Income Statement (Annual)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-surface/30">
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold whitespace-nowrap">
                  Metric
                </th>
                {annual.map((row) => (
                  <th
                    key={row.year}
                    className="px-4 py-3 text-right text-[10px] uppercase tracking-wider text-muted/60 font-semibold"
                  >
                    {row.year}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {INCOME_STATEMENT_ROWS.map((def, idx) => (
                <tr
                  key={def.key}
                  className={`border-b border-border/20 ${idx % 2 === 1 ? "bg-surface/10" : ""}`}
                >
                  <td className="px-4 py-2.5 text-xs font-semibold text-foreground whitespace-nowrap">
                    {def.label}
                  </td>
                  {annual.map((row) => {
                    const val = Number(row[def.key] ?? 0);
                    return (
                      <td
                        key={row.year}
                        className={`px-4 py-2.5 text-xs tabular-nums text-right ${val < 0 ? "text-loss" : "text-muted"}`}
                      >
                        {formatCurrencyLarge(val)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";
import { Coins, DollarSign, TrendingUp, Percent } from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import { getChartColors } from "@/lib/chart-colors";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type Frequency = "daily" | "weekly" | "biweekly" | "monthly";

const FREQUENCY_LABELS: Record<Frequency, string> = {
  daily: "Daily",
  weekly: "Weekly",
  biweekly: "Bi-weekly",
  monthly: "Monthly",
};

const FREQUENCY_DAYS: Record<Frequency, number> = {
  daily: 1,
  weekly: 7,
  biweekly: 14,
  monthly: 30,
};

function calculateDCA(
  investmentPerPeriod: number,
  periods: number,
  annualReturn: number,
  frequency: Frequency
) {
  const daysPerPeriod = FREQUENCY_DAYS[frequency];
  const periodsPerYear = 365 / daysPerPeriod;
  const periodReturn = Math.pow(1 + annualReturn / 100, 1 / periodsPerYear) - 1;

  const data = [];
  let totalInvested = 0;
  let dcaValue = 0;
  let lumpSumValue = 0;
  const totalLumpSum = investmentPerPeriod * periods;

  for (let i = 1; i <= periods; i++) {
    totalInvested += investmentPerPeriod;

    // DCA: each period's investment grows from its purchase date
    dcaValue = (dcaValue + investmentPerPeriod) * (1 + periodReturn);

    // Lump sum: entire amount invested at start, grows each period
    if (i === 1) lumpSumValue = totalLumpSum * (1 + periodReturn);
    else lumpSumValue = lumpSumValue * (1 + periodReturn);

    data.push({
      period: i,
      invested: totalInvested,
      dcaValue: Math.round(dcaValue * 100) / 100,
      lumpSumValue: Math.round(lumpSumValue * 100) / 100,
    });
  }

  return {
    data,
    totalInvested,
    finalDcaValue: data[data.length - 1]?.dcaValue ?? 0,
    finalLumpSumValue: data[data.length - 1]?.lumpSumValue ?? 0,
  };
}

export default function DCACalculatorPage() {
  const { theme } = useTheme();
  const colors = getChartColors(theme);

  const [investment, setInvestment] = useState(100);
  const [frequency, setFrequency] = useState<Frequency>("weekly");
  const [periods, setPeriods] = useState(52);
  const [annualReturn, setAnnualReturn] = useState(50);

  const result = useMemo(
    () => calculateDCA(investment, periods, annualReturn, frequency),
    [investment, periods, annualReturn, frequency]
  );

  const dcaProfit = result.finalDcaValue - result.totalInvested;
  const dcaRoi = result.totalInvested > 0 ? (dcaProfit / result.totalInvested) * 100 : 0;
  const lumpProfit = result.finalLumpSumValue - result.totalInvested;
  const lumpRoi = result.totalInvested > 0 ? (lumpProfit / result.totalInvested) * 100 : 0;

  const tooltipStyle = {
    backgroundColor: colors.tooltipBg,
    border: colors.tooltipBorder,
    borderRadius: "12px",
    fontSize: "12px",
    color: "var(--color-foreground)",
  };

  // Thin chart data for large datasets
  const chartData = useMemo(() => {
    if (result.data.length <= 60) return result.data;
    const step = Math.ceil(result.data.length / 60);
    return result.data.filter((_, i) => i % step === 0 || i === result.data.length - 1);
  }, [result.data]);

  return (
    <div className="space-y-6 mx-auto max-w-[1600px]">
      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <Coins size={24} className="text-accent" />
          DCA Calculator
        </h2>
        <p className="text-sm text-muted mt-0.5">
          Project your dollar-cost averaging returns over time
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input panel */}
        <div className="glass rounded-2xl border border-border/50 p-6 space-y-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Parameters</h3>

          <div>
            <label className="text-xs text-muted/60 uppercase tracking-wider font-semibold mb-1.5 block">
              Investment Per Period ($)
            </label>
            <input
              type="number"
              value={investment}
              onChange={(e) => setInvestment(Math.max(1, Number(e.target.value)))}
              className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm font-medium focus:outline-none focus:border-accent/50 transition-all"
            />
          </div>

          <div>
            <label className="text-xs text-muted/60 uppercase tracking-wider font-semibold mb-1.5 block">
              Frequency
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(FREQUENCY_LABELS) as Frequency[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFrequency(f)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    frequency === f
                      ? "bg-accent/10 text-accent border border-accent/30"
                      : "bg-background border border-border text-muted hover:text-foreground"
                  }`}
                >
                  {FREQUENCY_LABELS[f]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-muted/60 uppercase tracking-wider font-semibold mb-1.5 block">
              Number of Periods: <span className="text-accent">{periods}</span>
            </label>
            <input
              type="range"
              min="1"
              max="520"
              value={periods}
              onChange={(e) => setPeriods(Number(e.target.value))}
              className="w-full accent-[#00B4D8]"
            />
            <div className="flex justify-between text-[10px] text-muted/40 mt-1">
              <span>1</span>
              <span>~{Math.round((periods * FREQUENCY_DAYS[frequency]) / 365 * 10) / 10} years</span>
              <span>520</span>
            </div>
          </div>

          <div>
            <label className="text-xs text-muted/60 uppercase tracking-wider font-semibold mb-1.5 block">
              Expected Annual Return: <span className={annualReturn >= 0 ? "text-win" : "text-loss"}>{annualReturn}%</span>
            </label>
            <input
              type="range"
              min="-50"
              max="200"
              value={annualReturn}
              onChange={(e) => setAnnualReturn(Number(e.target.value))}
              className="w-full accent-[#00B4D8]"
            />
            <div className="flex justify-between text-[10px] text-muted/40 mt-1">
              <span>-50%</span>
              <span>0%</span>
              <span>200%</span>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-4">
          {/* Stats cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Total Invested", value: `$${result.totalInvested.toLocaleString()}`, icon: DollarSign, color: "text-foreground" },
              { label: "DCA Value", value: `$${result.finalDcaValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: TrendingUp, color: dcaProfit >= 0 ? "text-win" : "text-loss" },
              { label: "Profit / Loss", value: `${dcaProfit >= 0 ? "+" : ""}$${dcaProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: Coins, color: dcaProfit >= 0 ? "text-win" : "text-loss" },
              { label: "ROI", value: `${dcaRoi >= 0 ? "+" : ""}${dcaRoi.toFixed(1)}%`, icon: Percent, color: dcaRoi >= 0 ? "text-win" : "text-loss" },
            ].map((s) => (
              <div key={s.label} className="glass rounded-xl border border-border/50 p-4" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <s.icon size={14} className="text-muted/60" />
                  <p className="text-[10px] uppercase tracking-wider text-muted/60 font-semibold">{s.label}</p>
                </div>
                <p className={`text-lg font-bold tabular-nums ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Projection chart */}
          <div className="bg-surface rounded-2xl border border-border p-4" style={{ boxShadow: "var(--shadow-card)" }}>
            <h3 className="text-sm font-semibold text-foreground mb-3">Value Projection</h3>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                <XAxis dataKey="period" tick={{ fill: colors.tick, fontSize: 11 }} stroke={colors.grid} label={{ value: "Period", position: "insideBottom", offset: -5, fill: colors.tick, fontSize: 10 }} />
                <YAxis tick={{ fill: colors.tick, fontSize: 11 }} stroke={colors.grid} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Tooltip contentStyle={tooltipStyle} formatter={(v: any, name: any) => [`$${Number(v ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, name === "invested" ? "Invested" : name === "dcaValue" ? "DCA Value" : "Lump Sum"]} />
                <Area type="monotone" dataKey="invested" stroke={colors.tick} fill={colors.tick} fillOpacity={0.05} strokeDasharray="4 4" strokeWidth={1.5} />
                <Area type="monotone" dataKey="dcaValue" stroke={colors.accent} fill={colors.accent} fillOpacity={0.1} strokeWidth={2} />
                <Area type="monotone" dataKey="lumpSumValue" stroke={colors.win} fill={colors.win} fillOpacity={0.05} strokeWidth={1.5} strokeDasharray="6 3" />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-6 mt-2 text-[10px] text-muted">
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[var(--color-accent)] inline-block" /> DCA</span>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 inline-block" style={{ background: colors.win, opacity: 0.6 }} /> Lump Sum</span>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 inline-block border-t border-dashed border-muted" /> Invested</span>
            </div>
          </div>

          {/* DCA vs Lump Sum comparison */}
          <div className="bg-surface rounded-2xl border border-border p-5" style={{ boxShadow: "var(--shadow-card)" }}>
            <h3 className="text-sm font-semibold text-foreground mb-3">DCA vs Lump Sum</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div />
              <div className="text-[10px] uppercase tracking-wider text-accent font-semibold">DCA</div>
              <div className="text-[10px] uppercase tracking-wider text-muted/60 font-semibold">Lump Sum</div>

              <div className="text-xs text-muted text-left">Final Value</div>
              <div className="text-sm font-bold text-foreground tabular-nums">${result.finalDcaValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
              <div className="text-sm font-bold text-foreground tabular-nums">${result.finalLumpSumValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>

              <div className="text-xs text-muted text-left">Profit</div>
              <div className={`text-sm font-bold tabular-nums ${dcaProfit >= 0 ? "text-win" : "text-loss"}`}>${dcaProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
              <div className={`text-sm font-bold tabular-nums ${lumpProfit >= 0 ? "text-win" : "text-loss"}`}>${lumpProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>

              <div className="text-xs text-muted text-left">ROI</div>
              <div className={`text-sm font-bold tabular-nums ${dcaRoi >= 0 ? "text-win" : "text-loss"}`}>{dcaRoi.toFixed(1)}%</div>
              <div className={`text-sm font-bold tabular-nums ${lumpRoi >= 0 ? "text-win" : "text-loss"}`}>{lumpRoi.toFixed(1)}%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useMemo } from "react";
import { useTrades } from "@/hooks/use-trades";
import { calculateTradePnl } from "@/lib/calculations";
import { useTheme } from "@/lib/theme-context";
import { getChartColors } from "@/lib/chart-colors";
import { DemoBanner } from "@/components/demo-banner";
import { Header } from "@/components/header";
import { ClipboardList, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";

export default function PlanAnalyticsPage() {
  const { trades, loading, usingDemo } = useTrades();
  const { theme } = useTheme();
  const colors = getChartColors(theme);

  const analysis = useMemo(() => {
    const closed = trades.filter((t) => t.close_timestamp !== null);
    const onPlan = closed.filter((t) => t.checklist?.on_plan === true);
    const offPlan = closed.filter((t) => t.checklist?.on_plan !== true);

    function stats(arr: typeof closed) {
      const pnls = arr.map((t) => t.pnl ?? calculateTradePnl(t) ?? 0);
      const wins = pnls.filter((p) => p > 0);
      const total = pnls.reduce((s, p) => s + p, 0);
      return {
        count: arr.length,
        totalPnl: total,
        avgPnl: arr.length > 0 ? total / arr.length : 0,
        winRate: arr.length > 0 ? (wins.length / arr.length) * 100 : 0,
      };
    }

    const onPlanStats = stats(onPlan);
    const offPlanStats = stats(offPlan);

    // Checklist compliance breakdown
    const checklistKeys = new Map<string, { checked: number; total: number }>();
    for (const t of closed) {
      if (!t.checklist) continue;
      for (const [key, val] of Object.entries(t.checklist)) {
        const entry = checklistKeys.get(key) ?? { checked: 0, total: 0 };
        entry.total++;
        if (val) entry.checked++;
        checklistKeys.set(key, entry);
      }
    }

    const checklistBreakdown = Array.from(checklistKeys.entries())
      .map(([key, { checked, total }]) => ({
        name: key.replace(/_/g, " "),
        rate: total > 0 ? (checked / total) * 100 : 0,
        checked,
        total,
      }))
      .sort((a, b) => b.rate - a.rate);

    return { onPlanStats, offPlanStats, checklistBreakdown, totalClosed: closed.length };
  }, [trades]);

  const comparisonData = [
    { name: "On Plan", pnl: analysis.onPlanStats.totalPnl, winRate: analysis.onPlanStats.winRate },
    { name: "Off Plan", pnl: analysis.offPlanStats.totalPnl, winRate: analysis.offPlanStats.winRate },
  ];

  const tooltipStyle = {
    backgroundColor: colors.tooltipBg,
    border: colors.tooltipBorder,
    borderRadius: "12px",
    fontSize: "12px",
    color: "var(--color-foreground)",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-accent">Loading...</div>
      </div>
    );
  }

  const hasChecklistData = analysis.totalClosed > 0 && (analysis.onPlanStats.count > 0 || analysis.checklistBreakdown.length > 0);

  return (
    <div className="space-y-6">
      <Header />
      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <ClipboardList size={24} className="text-accent" />
          Plan Analytics
        </h2>
        <p className="text-sm text-muted mt-0.5">
          {usingDemo ? "Sample data" : "How well are you following your trading plan?"}
        </p>
      </div>
      {usingDemo && <DemoBanner feature="plan analytics" />}

      {!hasChecklistData ? (
        <div className="text-center py-16">
          <ClipboardList size={48} className="text-accent/20 mx-auto mb-4" />
          <p className="text-lg font-semibold text-foreground mb-2">No plan data yet</p>
          <p className="text-sm text-muted max-w-md mx-auto mb-6">
            Start using the checklist when logging trades to track plan compliance. Mark
            &ldquo;on_plan&rdquo; in your trade checklist.
          </p>
          <Link
            href="/dashboard/plans"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-background font-semibold text-sm hover:bg-accent-hover transition-all"
          >
            Go to Trade Plans <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <>
          {/* On-plan vs off-plan cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              className="glass rounded-xl border border-border/50 p-5"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 size={18} className="text-win" />
                <h3 className="font-semibold text-foreground">On Plan</h3>
                <span className="ml-auto text-xs text-muted">{analysis.onPlanStats.count} trades</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted/60">Win Rate</p>
                  <p className={`text-lg font-bold tabular-nums ${analysis.onPlanStats.winRate >= 50 ? "text-win" : "text-loss"}`}>
                    {analysis.onPlanStats.winRate.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted/60">Total P&L</p>
                  <p className={`text-lg font-bold tabular-nums ${analysis.onPlanStats.totalPnl >= 0 ? "text-win" : "text-loss"}`}>
                    ${analysis.onPlanStats.totalPnl.toFixed(0)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted/60">Avg P&L</p>
                  <p className={`text-lg font-bold tabular-nums ${analysis.onPlanStats.avgPnl >= 0 ? "text-win" : "text-loss"}`}>
                    ${analysis.onPlanStats.avgPnl.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
            <div
              className="glass rounded-xl border border-border/50 p-5"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <div className="flex items-center gap-2 mb-3">
                <XCircle size={18} className="text-loss" />
                <h3 className="font-semibold text-foreground">Off Plan</h3>
                <span className="ml-auto text-xs text-muted">{analysis.offPlanStats.count} trades</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted/60">Win Rate</p>
                  <p className={`text-lg font-bold tabular-nums ${analysis.offPlanStats.winRate >= 50 ? "text-win" : "text-loss"}`}>
                    {analysis.offPlanStats.winRate.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted/60">Total P&L</p>
                  <p className={`text-lg font-bold tabular-nums ${analysis.offPlanStats.totalPnl >= 0 ? "text-win" : "text-loss"}`}>
                    ${analysis.offPlanStats.totalPnl.toFixed(0)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted/60">Avg P&L</p>
                  <p className={`text-lg font-bold tabular-nums ${analysis.offPlanStats.avgPnl >= 0 ? "text-win" : "text-loss"}`}>
                    ${analysis.offPlanStats.avgPnl.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* P&L comparison chart */}
          <div
            className="bg-surface rounded-2xl border border-border p-4"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <h3 className="text-sm font-semibold text-foreground mb-3">P&L Comparison</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={comparisonData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                <XAxis dataKey="name" tick={{ fill: colors.tick, fontSize: 12 }} stroke={colors.grid} />
                <YAxis tick={{ fill: colors.tick, fontSize: 11 }} stroke={colors.grid} tickFormatter={(v) => `$${v}`} />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`$${Number(v ?? 0).toFixed(2)}`, "P&L"]} />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]} maxBarSize={60}>
                  {comparisonData.map((entry, i) => (
                    <Cell key={i} fill={entry.pnl >= 0 ? colors.win : colors.loss} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Checklist compliance */}
          {analysis.checklistBreakdown.length > 0 && (
            <div
              className="bg-surface rounded-2xl border border-border p-5"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <h3 className="text-sm font-semibold text-foreground mb-3">Checklist Compliance</h3>
              <div className="space-y-2">
                {analysis.checklistBreakdown.map((item) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <span className="text-xs text-muted capitalize w-32 shrink-0">{item.name}</span>
                    <div className="flex-1 h-2 bg-border/50 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${item.rate}%`,
                          backgroundColor: item.rate >= 70 ? colors.win : item.rate >= 40 ? colors.accent : colors.loss,
                        }}
                      />
                    </div>
                    <span className="text-xs text-muted tabular-nums w-16 text-right">
                      {item.rate.toFixed(0)}% ({item.checked}/{item.total})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

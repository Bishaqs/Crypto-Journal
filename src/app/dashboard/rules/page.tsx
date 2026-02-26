"use client";

import { useState, useEffect } from "react";
import {
  Shield,
  Plus,
  Trash2,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  XCircle,
  BarChart3,
} from "lucide-react";
import { PageInfoButton } from "@/components/ui/page-info-button";
import { usePageTour } from "@/lib/use-page-tour";

type Rule = {
  id: string;
  name: string;
  description: string;
  active: boolean;
};

type Violation = {
  ruleId: string;
  date: string;
  tradePnl: number;
  symbol: string;
};

const DEFAULT_RULES: Rule[] = [
  { id: "r1", name: "Max 2% risk per trade", description: "Never risk more than 2% of account on a single trade", active: true },
  { id: "r2", name: "No trading first 15 min", description: "Wait for the market to settle before entering", active: true },
  { id: "r3", name: "Max 5 trades per day", description: "Quality over quantity — stop after 5 trades", active: true },
  { id: "r4", name: "No trading after 2 consecutive losses", description: "Take a mandatory break after 2 losses in a row", active: true },
  { id: "r5", name: "Only trade watchlist symbols", description: "Don't chase random tickers — stick to your plan", active: true },
  { id: "r6", name: "Always set stop-loss before entry", description: "No trade without a predefined exit", active: true },
];

// Demo violations data
const DEMO_VIOLATIONS: Violation[] = [
  { ruleId: "r1", date: "2026-02-20", tradePnl: -680, symbol: "BTC" },
  { ruleId: "r3", date: "2026-02-19", tradePnl: -220, symbol: "ETH" },
  { ruleId: "r3", date: "2026-02-19", tradePnl: -150, symbol: "SOL" },
  { ruleId: "r4", date: "2026-02-18", tradePnl: -430, symbol: "BTC" },
  { ruleId: "r2", date: "2026-02-17", tradePnl: -180, symbol: "DOGE" },
  { ruleId: "r5", date: "2026-02-17", tradePnl: -320, symbol: "SHIB" },
  { ruleId: "r1", date: "2026-02-15", tradePnl: -890, symbol: "ETH" },
  { ruleId: "r4", date: "2026-02-14", tradePnl: -260, symbol: "SOL" },
  { ruleId: "r6", date: "2026-02-13", tradePnl: -540, symbol: "BTC" },
  { ruleId: "r2", date: "2026-02-12", tradePnl: -95, symbol: "ADA" },
  { ruleId: "r3", date: "2026-02-11", tradePnl: -310, symbol: "BTC" },
  { ruleId: "r5", date: "2026-02-10", tradePnl: -175, symbol: "XRP" },
];

export default function RulesPage() {
  usePageTour("rules-page");
  const [rules, setRules] = useState<Rule[]>(DEFAULT_RULES);
  const [violations] = useState<Violation[]>(DEMO_VIOLATIONS);
  const [newRuleName, setNewRuleName] = useState("");
  const [newRuleDesc, setNewRuleDesc] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [tab, setTab] = useState<"overview" | "rules" | "violations">("overview");

  useEffect(() => {
    const saved = localStorage.getItem("stargate-rules");
    if (saved) {
      try {
        setRules(JSON.parse(saved));
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("stargate-rules", JSON.stringify(rules));
  }, [rules]);

  function addRule() {
    if (!newRuleName.trim()) return;
    setRules([
      ...rules,
      {
        id: `r${Date.now()}`,
        name: newRuleName.trim(),
        description: newRuleDesc.trim(),
        active: true,
      },
    ]);
    setNewRuleName("");
    setNewRuleDesc("");
    setShowAddForm(false);
  }

  function removeRule(id: string) {
    setRules(rules.filter((r) => r.id !== id));
  }

  function toggleRule(id: string) {
    setRules(rules.map((r) => (r.id === id ? { ...r, active: !r.active } : r)));
  }

  // Calculate stats
  const totalCost = violations.reduce((a, v) => a + Math.abs(v.tradePnl), 0);
  const violationsByRule = rules.map((rule) => {
    const ruleViolations = violations.filter((v) => v.ruleId === rule.id);
    const cost = ruleViolations.reduce((a, v) => a + Math.abs(v.tradePnl), 0);
    return { rule, count: ruleViolations.length, cost };
  }).sort((a, b) => b.cost - a.cost);

  const complianceRate = Math.round(
    ((50 - violations.length) / 50) * 100 // Assume ~50 trades in period
  );

  const mostViolated = violationsByRule[0];
  const maxCostBar = Math.max(...violationsByRule.map((v) => v.cost), 1);

  // Monthly trend (demo)
  const monthlyTrend = [
    { month: "Oct", violations: 18, cost: 5200 },
    { month: "Nov", violations: 14, cost: 3800 },
    { month: "Dec", violations: 11, cost: 2900 },
    { month: "Jan", violations: 9, cost: 2100 },
    { month: "Feb", violations: violations.length, cost: totalCost },
  ];
  const maxMonthlyCost = Math.max(...monthlyTrend.map((m) => m.cost));

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div id="tour-rules-header">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Shield size={22} className="text-accent" />
          Rule Tracker
          <PageInfoButton tourName="rules-page" />
        </h1>
        <p className="text-sm text-muted mt-1">
          Define your rules. Track violations. See what breaking them costs you.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface rounded-xl p-1 w-fit border border-border/50">
        {(["overview", "rules", "violations"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
              tab === t
                ? "bg-accent/15 text-accent border border-accent/30"
                : "text-muted hover:text-foreground border border-transparent"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ═══════════ OVERVIEW ═══════════ */}
      {tab === "overview" && (
        <div id="tour-rules-list" className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-loss/20 bg-loss/5 p-5">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign size={14} className="text-loss" />
                <span className="text-xs text-muted">Cost of Violations</span>
              </div>
              <p className="text-2xl font-bold text-loss">
                -${totalCost.toLocaleString()}
              </p>
              <p className="text-[10px] text-muted mt-1">This month</p>
            </div>

            <div className="rounded-2xl border border-border glass p-5">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={14} className="text-orange-400" />
                <span className="text-xs text-muted">Violations</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {violations.length}
              </p>
              <p className="text-[10px] text-muted mt-1">
                Across {new Set(violations.map((v) => v.ruleId)).size} rules
              </p>
            </div>

            <div className="rounded-2xl border border-border glass p-5">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={14} className="text-win" />
                <span className="text-xs text-muted">Compliance Rate</span>
              </div>
              <p className="text-2xl font-bold text-win">{complianceRate}%</p>
              <p className="text-[10px] text-muted mt-1">
                Target: 90%+
              </p>
            </div>

            <div className="rounded-2xl border border-border glass p-5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={14} className="text-accent" />
                <span className="text-xs text-muted">If 100% Compliant</span>
              </div>
              <p className="text-2xl font-bold text-accent">
                +${totalCost.toLocaleString()}
              </p>
              <p className="text-[10px] text-muted mt-1">
                Saved this month
              </p>
            </div>
          </div>

          {/* Cost by rule */}
          <div className="rounded-2xl border border-border glass p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <BarChart3 size={14} className="text-accent" />
              Cost by Rule
            </h3>
            <div className="space-y-3">
              {violationsByRule.filter((v) => v.count > 0).map((v) => (
                <div key={v.rule.id} className="flex items-center gap-3">
                  <span className="text-xs text-muted w-40 shrink-0 truncate">
                    {v.rule.name}
                  </span>
                  <div className="flex-1 h-6 rounded-lg bg-surface-hover overflow-hidden relative">
                    <div
                      className="h-full rounded-lg bg-gradient-to-r from-loss/60 to-loss/30 transition-all"
                      style={{ width: `${(v.cost / maxCostBar) * 100}%` }}
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-medium text-foreground">
                      -${v.cost.toLocaleString()} ({v.count}x)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly trend */}
          <div className="rounded-2xl border border-border glass p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">
              Violation Cost Trend
            </h3>
            <div className="flex items-end gap-3 h-32">
              {monthlyTrend.map((m) => (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] text-muted">
                    ${(m.cost / 1000).toFixed(1)}k
                  </span>
                  <div className="w-full relative" style={{ height: "80px" }}>
                    <div
                      className="absolute bottom-0 w-full rounded-t-lg bg-loss/30 transition-all"
                      style={{
                        height: `${(m.cost / maxMonthlyCost) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-muted font-medium">
                    {m.month}
                  </span>
                </div>
              ))}
            </div>
            {monthlyTrend.length >= 2 && (
              <p className="text-xs text-win mt-3 flex items-center gap-1">
                <TrendingUp size={12} />
                Violations decreasing — you&apos;re improving
              </p>
            )}
          </div>

          {/* Most violated insight */}
          {mostViolated && mostViolated.count > 0 && (
            <div className="p-4 rounded-xl border border-loss/20 bg-loss/5">
              <p className="text-sm text-foreground">
                <span className="font-semibold text-loss">
                  #{1} violated rule:
                </span>{" "}
                &quot;{mostViolated.rule.name}&quot; — broken{" "}
                {mostViolated.count}x, costing you{" "}
                <span className="font-bold text-loss">
                  ${mostViolated.cost.toLocaleString()}
                </span>
              </p>
            </div>
          )}
        </div>
      )}

      {/* ═══════════ RULES TAB ═══════════ */}
      {tab === "rules" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted">
              {rules.filter((r) => r.active).length} active rules
            </p>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 text-accent text-xs font-medium hover:bg-accent/20 transition-colors"
            >
              <Plus size={13} /> Add Rule
            </button>
          </div>

          {showAddForm && (
            <div className="rounded-xl border border-accent/20 bg-accent/5 p-4 space-y-3">
              <input
                type="text"
                value={newRuleName}
                onChange={(e) => setNewRuleName(e.target.value)}
                placeholder="Rule name (e.g., No trading during news)"
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-foreground text-sm placeholder-muted focus:outline-none focus:border-accent"
              />
              <input
                type="text"
                value={newRuleDesc}
                onChange={(e) => setNewRuleDesc(e.target.value)}
                placeholder="Description (optional)"
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-foreground text-sm placeholder-muted focus:outline-none focus:border-accent"
              />
              <div className="flex gap-2">
                <button
                  onClick={addRule}
                  className="px-4 py-1.5 rounded-lg bg-accent text-background text-xs font-medium hover:bg-accent-hover transition-colors"
                >
                  Add Rule
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-1.5 rounded-lg bg-surface border border-border text-muted text-xs hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {rules.map((rule) => {
              const stats = violationsByRule.find((v) => v.rule.id === rule.id);
              return (
                <div
                  key={rule.id}
                  className={`rounded-xl border p-4 transition-all ${
                    rule.active
                      ? "border-border glass"
                      : "border-border/50 opacity-50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleRule(rule.id)}
                        className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                          rule.active
                            ? "bg-accent/15 border-accent/30 text-accent"
                            : "border-border text-transparent"
                        }`}
                      >
                        {rule.active && <CheckCircle2 size={12} />}
                      </button>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {rule.name}
                        </p>
                        {rule.description && (
                          <p className="text-xs text-muted mt-0.5">
                            {rule.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {stats && stats.count > 0 && (
                        <span className="text-[10px] text-loss font-medium">
                          {stats.count}x · -${stats.cost.toLocaleString()}
                        </span>
                      )}
                      <button
                        onClick={() => removeRule(rule.id)}
                        className="p-1 rounded hover:bg-loss/10 text-muted hover:text-loss transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════════ VIOLATIONS TAB ═══════════ */}
      {tab === "violations" && (
        <div className="rounded-2xl border border-border glass overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface/50">
                <th className="text-left px-4 py-3 text-xs text-muted font-medium">
                  Date
                </th>
                <th className="text-left px-4 py-3 text-xs text-muted font-medium">
                  Rule Violated
                </th>
                <th className="text-left px-4 py-3 text-xs text-muted font-medium">
                  Symbol
                </th>
                <th className="text-right px-4 py-3 text-xs text-muted font-medium">
                  Trade P&L
                </th>
              </tr>
            </thead>
            <tbody>
              {violations.map((v, i) => {
                const rule = rules.find((r) => r.id === v.ruleId);
                return (
                  <tr
                    key={i}
                    className="border-b border-border/50 hover:bg-surface/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-xs text-muted">
                      {v.date}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <XCircle size={12} className="text-loss shrink-0" />
                        <span className="text-xs text-foreground">
                          {rule?.name ?? v.ruleId}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-foreground font-medium">
                      {v.symbol}
                    </td>
                    <td className="px-4 py-3 text-xs text-loss font-medium text-right">
                      -${Math.abs(v.tradePnl).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

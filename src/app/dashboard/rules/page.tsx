"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
  Sparkles,
  Lightbulb,
  RefreshCw,
} from "lucide-react";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { createClient } from "@/lib/supabase/client";
import { fetchAllTrades } from "@/lib/supabase/fetch-all-trades";
import { useDateRange } from "@/lib/date-range-context";
import { useAccount } from "@/lib/account-context";
import { getLocalDateString } from "@/lib/date-utils";
import type { Trade, TradingRule, TradingRuleType, RuleViolation } from "@/lib/types";
import {
  evaluateAllRules,
  computeComplianceStats,
  suggestRulesForArchetype,
  RULE_TYPE_META,
  type SuggestedRule,
  type ComplianceStats,
} from "@/lib/rules-engine";
import type { MiniArchetype } from "@/lib/mini-quiz-archetypes";

export default function RulesPage() {
  const [rules, setRules] = useState<TradingRule[]>([]);
  const [violations, setViolations] = useState<RuleViolation[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "rules" | "violations">("overview");

  // Add rule form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRuleType, setNewRuleType] = useState<TradingRuleType>("max_trades_per_day");
  const [newRuleName, setNewRuleName] = useState("");
  const [newRuleParam, setNewRuleParam] = useState<string>("");
  const [saving, setSaving] = useState(false);

  // Scanning
  const [scanning, setScanning] = useState(false);

  const supabase = createClient();
  const { filterTrades } = useDateRange();
  const { filterByAccount } = useAccount();

  const archetype = useMemo<MiniArchetype | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("stargate-mini-archetype") as MiniArchetype | null;
  }, []);

  // ─── Data fetching ────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [rulesRes, violationsRes, tradesData] = await Promise.all([
        supabase
          .from("trading_rules")
          .select("*")
          .order("created_at", { ascending: true }),
        supabase
          .from("rule_violations")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(200),
        fetchAllTrades(supabase),
      ]);

      if (rulesRes.data) setRules(rulesRes.data as TradingRule[]);
      if (violationsRes.data) setViolations(violationsRes.data as RuleViolation[]);
      if (tradesData.data) setTrades(tradesData.data as Trade[]);
    } catch (err) {
      console.error("[RulesPage] Failed to fetch:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Filtered trades ──────────────────────────────────────
  const filteredTrades = useMemo(
    () => filterByAccount(filterTrades(trades)),
    [trades, filterTrades, filterByAccount],
  );

  // ─── Live evaluation (today) ──────────────────────────────
  const todayResults = useMemo(() => {
    if (rules.length === 0) return [];
    const today = getLocalDateString();
    return evaluateAllRules(rules, { trades: filteredTrades, todayDate: today });
  }, [rules, filteredTrades]);

  const todayViolations = todayResults.filter((r) => r.result.violated);

  // ─── Compliance stats ─────────────────────────────────────
  const stats: ComplianceStats = useMemo(() => {
    // Count unique trading days in filtered range
    const tradingDays = new Set(
      filteredTrades
        .filter((t) => t.close_timestamp)
        .map((t) => (t.close_timestamp ?? t.open_timestamp).split("T")[0]),
    ).size;

    return computeComplianceStats(rules, violations, tradingDays);
  }, [rules, violations, filteredTrades]);

  // ─── Suggestions ──────────────────────────────────────────
  const suggestions = useMemo(
    () => suggestRulesForArchetype(archetype, rules),
    [archetype, rules],
  );

  // ─── Actions ──────────────────────────────────────────────
  async function addRule(overrides?: Partial<SuggestedRule>) {
    const ruleType = overrides?.rule_type ?? newRuleType;
    const meta = RULE_TYPE_META[ruleType];
    const name = overrides?.name ?? (newRuleName.trim() || meta.label);
    const paramValue = overrides?.parameters?.threshold ?? (newRuleParam || meta.defaultValue);

    setSaving(true);
    const { error } = await supabase.from("trading_rules").insert({
      name,
      description: overrides?.description ?? null,
      rule_type: ruleType,
      parameters: { threshold: paramValue },
      active: true,
      suggested_by: overrides?.reason ? `archetype:${archetype}` : null,
    });

    if (error) {
      console.error("[RulesPage] Insert failed:", error.message);
    } else {
      setNewRuleName("");
      setNewRuleParam("");
      setShowAddForm(false);
      await fetchData();
    }
    setSaving(false);
  }

  async function toggleRule(id: string, active: boolean) {
    await supabase.from("trading_rules").update({ active: !active, updated_at: new Date().toISOString() }).eq("id", id);
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, active: !active } : r)));
  }

  async function deleteRule(id: string) {
    await supabase.from("trading_rules").delete().eq("id", id);
    setRules((prev) => prev.filter((r) => r.id !== id));
    setViolations((prev) => prev.filter((v) => v.rule_id !== id));
  }

  // ─── Scan: evaluate rules across historical trades and record violations ──
  async function scanForViolations() {
    if (rules.length === 0) return;
    setScanning(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Get unique trading days from trades
      const tradingDays = [
        ...new Set(
          filteredTrades
            .filter((t) => t.close_timestamp)
            .map((t) => (t.close_timestamp ?? t.open_timestamp).split("T")[0]),
        ),
      ].sort();

      // Only scan days after each rule's creation date
      const newViolations: Omit<RuleViolation, "id" | "user_id" | "created_at">[] = [];

      for (const day of tradingDays) {
        const results = evaluateAllRules(rules, { trades: filteredTrades, todayDate: day });
        for (const { rule, result } of results) {
          if (!result.violated) continue;
          // Skip if rule was created after this day
          if (rule.created_at.split("T")[0] > day) continue;
          // Skip if violation already exists for this rule+date
          const exists = violations.some(
            (v) => v.rule_id === rule.id && v.violation_date === day,
          );
          if (exists) continue;

          for (const tradeId of result.violatingTradeIds) {
            const trade = filteredTrades.find((t) => t.id === tradeId);
            newViolations.push({
              rule_id: rule.id,
              trade_id: tradeId,
              violation_date: day,
              pnl_impact: trade?.pnl ?? null,
              details: result.detail,
            });
          }
        }
      }

      if (newViolations.length > 0) {
        // Batch insert (max 100 at a time)
        for (let i = 0; i < newViolations.length; i += 100) {
          const batch = newViolations.slice(i, i + 100);
          await supabase.from("rule_violations").insert(batch);
        }
      }

      await fetchData();
    } catch (err) {
      console.error("[RulesPage] Scan failed:", err);
    } finally {
      setScanning(false);
    }
  }

  // ─── Helpers ──────────────────────────────────────────────
  const maxCostBar = Math.max(...stats.byRule.map((v) => Math.abs(v.pnlImpact)), 1);

  function getRuleName(ruleId: string): string {
    return rules.find((r) => r.id === ruleId)?.name ?? "Deleted rule";
  }

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-muted text-sm">Loading rules...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Shield size={22} className="text-accent" />
          Rule Tracker
          <InfoTooltip text="Define your trading rules and track violations to build discipline" articleId="tj-playbook" />
        </h1>
        <p className="text-sm text-muted mt-1">
          Define your rules. Track violations. See what breaking them costs you.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between">
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
              {t === "violations" && todayViolations.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-loss/20 text-loss text-[9px] font-bold">
                  {todayViolations.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {rules.length > 0 && (
          <button
            onClick={scanForViolations}
            disabled={scanning}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border text-xs text-muted hover:text-foreground transition-all disabled:opacity-50"
          >
            <RefreshCw size={12} className={scanning ? "animate-spin" : ""} />
            {scanning ? "Scanning..." : "Scan History"}
          </button>
        )}
      </div>

      {/* ═══════════ EMPTY STATE ═══════════ */}
      {rules.length === 0 && (
        <div className="space-y-6">
          <div className="glass rounded-2xl border border-border/50 p-12" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
                <Shield size={28} className="text-accent" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Create Your First Trading Rule</h3>
              <p className="text-sm text-muted mb-6 max-w-sm">
                Trading rules build discipline. Define the boundaries you won&apos;t cross, then track what breaking them costs you.
              </p>
              <button
                onClick={() => { setTab("rules"); setShowAddForm(true); }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-background font-semibold text-sm hover:bg-accent-hover hover:shadow-[0_0_20px_rgba(0,180,216,0.3)] transition-all duration-300"
              >
                <Plus size={18} />
                Create Your First Rule
              </button>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 w-full max-w-lg">
                <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-surface-hover/30">
                  <DollarSign size={16} className="text-loss" />
                  <span className="text-[11px] text-muted text-center">See cost of violations</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-surface-hover/30">
                  <TrendingUp size={16} className="text-win" />
                  <span className="text-[11px] text-muted text-center">Track compliance rate</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-surface-hover/30">
                  <BarChart3 size={16} className="text-accent" />
                  <span className="text-[11px] text-muted text-center">Spot your worst habits</span>
                </div>
              </div>
            </div>
          </div>

          {/* Archetype suggestions even on empty state */}
          {suggestions.length > 0 && (
            <SuggestionsSection suggestions={suggestions} onAdd={(s) => addRule(s)} saving={saving} archetype={archetype} />
          )}
        </div>
      )}

      {/* ═══════════ OVERVIEW ═══════════ */}
      {tab === "overview" && rules.length > 0 && (
        <div className="space-y-6">
          {/* Today's live status */}
          {todayViolations.length > 0 && (
            <div className="p-4 rounded-xl border border-loss/20 bg-loss/5 space-y-2">
              <p className="text-xs font-semibold text-loss flex items-center gap-1.5">
                <AlertTriangle size={13} />
                Today&apos;s Violations
              </p>
              {todayViolations.map(({ rule, result }) => (
                <p key={rule.id} className="text-xs text-foreground/80">
                  <span className="font-medium text-loss">{rule.name}:</span> {result.detail}
                  {result.pnlImpact !== 0 && (
                    <span className="text-loss ml-1">
                      (${result.pnlImpact.toFixed(0)})
                    </span>
                  )}
                </p>
              ))}
            </div>
          )}

          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-loss/20 bg-loss/5 p-5">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign size={14} className="text-loss" />
                <span className="text-xs text-muted">Cost of Violations</span>
              </div>
              <p className="text-2xl font-bold text-loss">
                ${stats.potentialSavings > 0 ? `-${stats.potentialSavings.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "0"}
              </p>
              <p className="text-[10px] text-muted mt-1">In selected range</p>
            </div>

            <div className="rounded-2xl border border-border glass p-5">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={14} className="text-orange-400" />
                <span className="text-xs text-muted">Violations</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{stats.totalViolations}</p>
              <p className="text-[10px] text-muted mt-1">
                Across {stats.byRule.filter((r) => r.violationCount > 0).length} rules
              </p>
            </div>

            <div className="rounded-2xl border border-border glass p-5">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={14} className="text-win" />
                <span className="text-xs text-muted">Compliance Rate</span>
              </div>
              <p className={`text-2xl font-bold ${stats.complianceRate >= 80 ? "text-win" : stats.complianceRate >= 60 ? "text-amber-400" : "text-loss"}`}>
                {stats.complianceRate}%
              </p>
              <p className="text-[10px] text-muted mt-1">Target: 90%+</p>
            </div>

            <div className="rounded-2xl border border-border glass p-5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={14} className="text-accent" />
                <span className="text-xs text-muted">If 100% Compliant</span>
              </div>
              <p className="text-2xl font-bold text-accent">
                +${stats.potentialSavings.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <p className="text-[10px] text-muted mt-1">Saved in range</p>
            </div>
          </div>

          {/* Cost by rule */}
          {stats.byRule.some((r) => r.violationCount > 0) && (
            <div className="rounded-2xl border border-border glass p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <BarChart3 size={14} className="text-accent" />
                Cost by Rule
              </h3>
              <div className="space-y-3">
                {stats.byRule
                  .filter((v) => v.violationCount > 0)
                  .map((v) => (
                    <div key={v.rule.id} className="flex items-center gap-3">
                      <span className="text-xs text-muted w-40 shrink-0 truncate">
                        {v.rule.name}
                      </span>
                      <div className="flex-1 h-6 rounded-lg bg-surface-hover overflow-hidden relative">
                        <div
                          className="h-full rounded-lg bg-gradient-to-r from-loss/60 to-loss/30 transition-all"
                          style={{ width: `${(Math.abs(v.pnlImpact) / maxCostBar) * 100}%` }}
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-medium text-foreground">
                          ${v.pnlImpact < 0 ? `-${Math.abs(v.pnlImpact).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : v.pnlImpact.toLocaleString(undefined, { maximumFractionDigits: 0 })} ({v.violationCount}x)
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <SuggestionsSection suggestions={suggestions} onAdd={(s) => addRule(s)} saving={saving} archetype={archetype} />
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
              {/* Rule type selector */}
              <div>
                <label className="text-[11px] text-muted mb-1 block">Rule type</label>
                <select
                  value={newRuleType}
                  onChange={(e) => {
                    const type = e.target.value as TradingRuleType;
                    setNewRuleType(type);
                    setNewRuleName(RULE_TYPE_META[type].label);
                    setNewRuleParam(String(RULE_TYPE_META[type].defaultValue));
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-foreground text-sm focus:outline-none focus:border-accent"
                >
                  {Object.entries(RULE_TYPE_META).map(([key, meta]) => (
                    <option key={key} value={key}>{meta.label}</option>
                  ))}
                </select>
              </div>

              {/* Name */}
              <input
                type="text"
                value={newRuleName}
                onChange={(e) => setNewRuleName(e.target.value)}
                placeholder="Rule name"
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-foreground text-sm placeholder-muted focus:outline-none focus:border-accent"
              />

              {/* Parameter */}
              {newRuleType !== "custom" && (
                <div>
                  <label className="text-[11px] text-muted mb-1 block">
                    {RULE_TYPE_META[newRuleType].paramLabel}
                  </label>
                  <input
                    type={RULE_TYPE_META[newRuleType].paramType === "time" ? "time" : "number"}
                    value={newRuleParam}
                    onChange={(e) => setNewRuleParam(e.target.value)}
                    placeholder={String(RULE_TYPE_META[newRuleType].defaultValue)}
                    className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-foreground text-sm focus:outline-none focus:border-accent"
                  />
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => addRule()}
                  disabled={saving}
                  className="px-4 py-1.5 rounded-lg bg-accent text-background text-xs font-medium hover:bg-accent-hover transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Add Rule"}
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

          {/* Suggestions inline */}
          {suggestions.length > 0 && !showAddForm && (
            <SuggestionsSection suggestions={suggestions} onAdd={(s) => addRule(s)} saving={saving} archetype={archetype} compact />
          )}

          {/* Rules list */}
          <div className="space-y-2">
            {rules.map((rule) => {
              const ruleStats = stats.byRule.find((v) => v.rule.id === rule.id);
              const todayResult = todayResults.find((r) => r.rule.id === rule.id);
              return (
                <div
                  key={rule.id}
                  className={`rounded-xl border p-4 transition-all ${
                    rule.active ? "border-border glass" : "border-border/50 opacity-50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleRule(rule.id, rule.active)}
                        className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                          rule.active
                            ? "bg-accent/15 border-accent/30 text-accent"
                            : "border-border text-transparent"
                        }`}
                      >
                        {rule.active && <CheckCircle2 size={12} />}
                      </button>
                      <div>
                        <p className="text-sm font-medium text-foreground">{rule.name}</p>
                        {rule.description && (
                          <p className="text-xs text-muted mt-0.5">{rule.description}</p>
                        )}
                        {/* Live status for today */}
                        {todayResult && rule.active && (
                          <p className={`text-[11px] mt-1 ${todayResult.result.violated ? "text-loss" : "text-muted/60"}`}>
                            {todayResult.result.violated ? (
                              <span className="flex items-center gap-1">
                                <XCircle size={10} /> {todayResult.result.detail}
                              </span>
                            ) : (
                              todayResult.result.detail
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {ruleStats && ruleStats.violationCount > 0 && (
                        <span className="text-[10px] text-loss font-medium">
                          {ruleStats.violationCount}x · ${Math.abs(ruleStats.pnlImpact).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </span>
                      )}
                      <button
                        onClick={() => deleteRule(rule.id)}
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
        <div className="space-y-4">
          {violations.length === 0 ? (
            <div className="glass rounded-2xl border border-border/50 p-12 text-center">
              <CheckCircle2 size={32} className="text-win mx-auto mb-3" />
              <p className="text-sm text-foreground font-medium">No violations recorded</p>
              <p className="text-xs text-muted mt-1">
                {rules.length > 0
                  ? 'Click "Scan History" to check your trades against your rules.'
                  : "Create some rules first, then scan your trade history."}
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-border glass overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface/50">
                      <th className="text-left px-4 py-3 text-xs text-muted font-medium">Date</th>
                      <th className="text-left px-4 py-3 text-xs text-muted font-medium">Rule Violated</th>
                      <th className="text-left px-4 py-3 text-xs text-muted font-medium">Details</th>
                      <th className="text-right px-4 py-3 text-xs text-muted font-medium">P&L Impact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {violations.slice(0, 50).map((v) => (
                      <tr
                        key={v.id}
                        className="border-b border-border/50 hover:bg-surface/30 transition-colors"
                      >
                        <td className="px-4 py-3 text-xs text-muted">{v.violation_date}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <XCircle size={12} className="text-loss shrink-0" />
                            <span className="text-xs text-foreground">{getRuleName(v.rule_id)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted max-w-[200px] truncate">
                          {v.details}
                        </td>
                        <td className="px-4 py-3 text-xs font-medium text-right">
                          {v.pnl_impact !== null ? (
                            <span className={v.pnl_impact < 0 ? "text-loss" : "text-win"}>
                              {v.pnl_impact < 0 ? "-" : "+"}${Math.abs(v.pnl_impact).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </span>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {violations.length > 50 && (
                <div className="px-4 py-2 border-t border-border/50 text-center">
                  <span className="text-[11px] text-muted">Showing 50 of {violations.length} violations</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Suggestions Component ──────────────────────────────────

function SuggestionsSection({
  suggestions,
  onAdd,
  saving,
  archetype,
  compact = false,
}: {
  suggestions: SuggestedRule[];
  onAdd: (s: SuggestedRule) => void;
  saving: boolean;
  archetype: MiniArchetype | null;
  compact?: boolean;
}) {
  if (suggestions.length === 0) return null;

  return (
    <div className={`rounded-xl border border-accent/20 bg-accent/5 ${compact ? "p-3" : "p-5"}`}>
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={14} className="text-accent" />
        <h3 className={`font-semibold text-foreground ${compact ? "text-xs" : "text-sm"}`}>
          Suggested for your archetype
        </h3>
      </div>
      <div className={`space-y-${compact ? "2" : "3"}`}>
        {suggestions.map((s, i) => (
          <div key={i} className="flex items-start justify-between gap-3 p-3 rounded-lg bg-background/50 border border-border/30">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground">{s.name}</p>
              <p className="text-[11px] text-muted mt-0.5 flex items-start gap-1">
                <Lightbulb size={10} className="text-accent shrink-0 mt-0.5" />
                {s.reason}
              </p>
            </div>
            <button
              onClick={() => onAdd(s)}
              disabled={saving}
              className="shrink-0 px-3 py-1.5 rounded-lg bg-accent/10 text-accent text-[11px] font-medium hover:bg-accent/20 transition-colors disabled:opacity-50"
            >
              <Plus size={12} className="inline mr-1" />
              Add
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

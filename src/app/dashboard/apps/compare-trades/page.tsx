"use client";

import { useState, useMemo } from "react";
import { Filter, Plus, Play, Loader2 } from "lucide-react";
import { Header } from "@/components/header";
import { useSubscription } from "@/lib/use-subscription";
import { UpgradePrompt } from "@/components/upgrade-prompt";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { useTheme } from "@/lib/theme-context";
import { getChartColors } from "@/lib/chart-colors";
import { useTrades } from "@/hooks/use-trades";
import { isUserTag } from "@/lib/tag-manager";

import {
  type FilterGroupConfig,
  type FilterGroupResult,
  createDefaultGroup,
  MAX_GROUPS,
} from "@/components/filter-groups/filter-group-types";
import { computeGroupResults } from "@/components/filter-groups/filter-group-engine";
import FilterGroupForm from "@/components/filter-groups/filter-group-form";
import FilterGroupResults from "@/components/filter-groups/filter-group-results";

export default function FilterGroupsPage() {
  const { hasAccess, loading: subLoading } = useSubscription();
  const { theme } = useTheme();
  const colors = getChartColors(theme);
  const { trades, loading: tradesLoading, usingDemo } = useTrades();

  const [groups, setGroups] = useState<FilterGroupConfig[]>([
    createDefaultGroup(0),
    createDefaultGroup(1),
  ]);
  const [results, setResults] = useState<FilterGroupResult[] | null>(null);

  // Derive closed trades and available filter options
  const closedTrades = useMemo(
    () => trades.filter((t) => t.close_timestamp && t.exit_price !== null),
    [trades],
  );

  const allSymbols = useMemo(
    () => [...new Set(closedTrades.map((t) => t.symbol))].sort(),
    [closedTrades],
  );

  const allTags = useMemo(
    () => [...new Set(closedTrades.flatMap((t) => t.tags ?? []).filter(isUserTag))].sort(),
    [closedTrades],
  );

  function updateGroup(index: number, config: FilterGroupConfig) {
    setGroups((prev) => prev.map((g, i) => (i === index ? config : g)));
  }

  function removeGroup(index: number) {
    setGroups((prev) => prev.filter((_, i) => i !== index));
  }

  function addGroup() {
    if (groups.length >= MAX_GROUPS) return;
    setGroups((prev) => [...prev, createDefaultGroup(prev.length)]);
  }

  function handleApply() {
    const r = computeGroupResults(closedTrades, groups);
    setResults(r);
  }

  if (subLoading) return null;
  if (!hasAccess("advanced-analytics"))
    return <UpgradePrompt feature="advanced-analytics" requiredTier="pro" />;

  if (tradesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-5 mx-auto max-w-[1600px]">
      <Header />

      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <Filter size={24} className="text-accent" />
          Filter Groups
          <InfoTooltip text="Create custom filter groups to segment your trades by symbol, tags, date range, or direction. Compare performance of different strategies." size={14} articleId="an-tag-analytics" />
        </h2>
        <p className="text-sm text-muted mt-0.5">
          Create filter groups to compare subsets of your trades side by side
        </p>
      </div>

      {/* Demo banner */}
      {usingDemo && (
        <div className="rounded-xl border border-accent/20 bg-accent/5 px-4 py-3 flex items-center gap-3">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/15 text-accent font-bold uppercase tracking-wider">
            Demo
          </span>
          <p className="text-xs text-muted">
            Showing demo trade data. Import your trades to see real results.
          </p>
        </div>
      )}

      {/* Data info */}
      <div className="px-3 py-2 rounded-lg bg-accent/5 border border-accent/10">
        <p className="text-xs text-muted">
          <span className="text-accent font-bold">{closedTrades.length}</span> closed trades
          across <span className="text-accent font-bold">{allSymbols.length}</span> symbols
        </p>
      </div>

      {/* Group Forms */}
      <div className="space-y-3">
        {groups.map((group, i) => (
          <FilterGroupForm
            key={group.id}
            config={group}
            onChange={(cfg) => updateGroup(i, cfg)}
            onRemove={() => removeGroup(i)}
            canRemove={groups.length > 2}
            allSymbols={allSymbols}
            allTags={allTags}
            index={i}
          />
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        {groups.length < MAX_GROUPS && (
          <button
            onClick={addGroup}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-surface border border-border/50 text-muted text-xs font-semibold hover:text-foreground hover:border-accent/20 transition-all"
          >
            <Plus size={14} />
            Add Group
          </button>
        )}
        <button
          onClick={handleApply}
          disabled={closedTrades.length === 0}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 ${
            closedTrades.length === 0
              ? "bg-border text-muted cursor-not-allowed"
              : "bg-accent text-background hover:bg-accent-hover"
          }`}
        >
          <Play size={14} />
          Apply Filters
        </button>
      </div>

      {/* Results */}
      {results ? (
        <FilterGroupResults results={results} colors={colors} />
      ) : (
        <div
          className="glass rounded-2xl border border-border/50 p-12 flex flex-col items-center justify-center text-center"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <Filter size={48} className="text-accent/30 mb-4" />
          <h3 className="text-lg font-bold text-foreground mb-2">Configure & Compare</h3>
          <p className="text-sm text-muted max-w-xs">
            Set up filter criteria for each group above, then click Apply Filters to compare their
            performance side by side.
          </p>
        </div>
      )}
    </div>
  );
}

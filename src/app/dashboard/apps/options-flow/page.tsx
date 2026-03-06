"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Activity, RefreshCw, Loader2, Filter, X } from "lucide-react";
import { Header } from "@/components/header";
import { useTheme } from "@/lib/theme-context";
import { getChartColors } from "@/lib/chart-colors";
import { useSubscription } from "@/lib/use-subscription";
import { UpgradePrompt } from "@/components/upgrade-prompt";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import FlowTableTab from "@/components/options-flow/flow-table-tab";
import MarketSummaryTab from "@/components/options-flow/market-summary-tab";
import SymbolSummaryTab from "@/components/options-flow/symbol-summary-tab";
import {
  type OptionsFlowRow,
  type OptionsFlowTab,
  type SentimentFilter,
  type TypeFilter,
  type PremiumFilter,
  type SortKey,
  type SortDir,
  TAB_OPTIONS,
} from "@/components/options-flow/options-flow-types";
import SymbolSearch from "@/components/ui/symbol-search";
import {
  mapApiEntry,
  computeFlowSummary,
  computeSymbolSummaries,
  filterByPremium,
  formatPremium,
} from "@/components/options-flow/options-flow-utils";

function StatBlock({ label, value, color = "text-foreground" }: { label: string; value: string; color?: string }) {
  return (
    <div className="glass rounded-xl border border-border/50 p-4 hover:border-accent/20 transition-all duration-300" style={{ boxShadow: "var(--shadow-card)" }}>
      <p className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}

export default function OptionsFlowPage() {
  const { hasAccess, loading: subLoading } = useSubscription();
  const { theme } = useTheme();
  const colors = getChartColors(theme);

  // Data state
  const [flows, setFlows] = useState<OptionsFlowRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMockData, setIsMockData] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Tab state
  const [activeTab, setActiveTab] = useState<OptionsFlowTab>("table");

  // Filter state
  const [sentimentFilter, setSentimentFilter] = useState<SentimentFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [premiumFilter, setPremiumFilter] = useState<PremiumFilter>("all");
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

  // Table state
  const [sortKey, setSortKey] = useState<SortKey>("premium");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [visibleCount, setVisibleCount] = useState(50);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchFlow = useCallback(async () => {
    try {
      const res = await fetch("/api/market/options-flow");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      const mapped = ((json.flows ?? []) as Record<string, unknown>[]).map(mapApiEntry);
      setFlows(mapped);
      setIsMockData(!!json.isMockData);
      setLastUpdated(new Date());
      setError(null);
    } catch {
      setError("Failed to load options flow data.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchFlow();
  }, [fetchFlow]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchFlow, 60_000);
    return () => clearInterval(interval);
  }, [fetchFlow, autoRefresh]);

  // Filtered + sorted flows
  const filteredFlows = useMemo(() => {
    let result = [...flows];
    if (selectedSymbol) result = result.filter((f) => f.symbol === selectedSymbol);
    if (sentimentFilter !== "all") result = result.filter((f) => f.sentiment === sentimentFilter);
    if (typeFilter !== "all") result = result.filter((f) => (typeFilter === "call" ? f.type === "C" : f.type === "P"));
    result = filterByPremium(result, premiumFilter);

    // Sort
    result.sort((a, b) => {
      const va = a[sortKey as keyof OptionsFlowRow];
      const vb = b[sortKey as keyof OptionsFlowRow];
      if (sortKey === "time") {
        return sortDir === "asc" ? a.rawTimestamp - b.rawTimestamp : b.rawTimestamp - a.rawTimestamp;
      }
      if (typeof va === "string" && typeof vb === "string") {
        return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      return sortDir === "asc" ? Number(va) - Number(vb) : Number(vb) - Number(va);
    });

    return result;
  }, [flows, sentimentFilter, typeFilter, premiumFilter, selectedSymbol, sortKey, sortDir]);

  const summary = useMemo(() => computeFlowSummary(filteredFlows), [filteredFlows]);
  const symbolSummaries = useMemo(() => computeSymbolSummaries(flows), [flows]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function handleSymbolClick(sym: string) {
    setSelectedSymbol(sym);
    setActiveTab("table");
    setVisibleCount(50);
  }

  if (subLoading) return null;
  if (!hasAccess("advanced-analytics")) return <UpgradePrompt feature="advanced-analytics" requiredTier="max" />;

  return (
    <div className="space-y-5 mx-auto max-w-[1600px]">
      <Header />

      {/* Title row */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Activity size={24} className="text-accent" />
            Options Flow
            <InfoTooltip text="Track unusual options activity and large block trades in real-time. Spot institutional sentiment before the move." size={14} />
          </h2>
          <p className="text-sm text-muted mt-0.5">
            Real-time unusual options activity and sentiment signals
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-[10px] text-muted/40">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={() => setAutoRefresh((v) => !v)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all border ${
              autoRefresh
                ? "border-win/20 bg-win/5 text-win"
                : "border-border/50 bg-surface text-muted"
            }`}
          >
            {autoRefresh ? "Auto" : "Paused"}
          </button>
          <button
            onClick={fetchFlow}
            className="p-2 rounded-xl hover:bg-surface-hover text-muted hover:text-foreground transition-all"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Demo banner */}
      {isMockData && (
        <div className="rounded-xl border border-accent/20 bg-accent/5 px-4 py-3 flex items-center gap-3">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/15 text-accent font-bold uppercase tracking-wider">Demo</span>
          <p className="text-xs text-muted">
            Showing simulated options flow data. Live data will be available when market APIs are connected.
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatBlock label="Total Premium" value={formatPremium(summary.totalPremium)} color="text-accent" />
        <StatBlock label="Bullish Flows" value={String(summary.sentiment.bullish)} color="text-win" />
        <StatBlock label="Bearish Flows" value={String(summary.sentiment.bearish)} color="text-loss" />
        <StatBlock
          label="Call/Put Ratio"
          value={summary.putCallRatio > 0 ? (1 / summary.putCallRatio).toFixed(2) : "0"}
        />
      </div>

      {/* Symbol Search + Filter */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <SymbolSearch
            mode="stock"
            value={selectedSymbol ?? "ALL"}
            onSelect={(sym) => {
              if (sym === selectedSymbol) {
                setSelectedSymbol(null);
              } else {
                setSelectedSymbol(sym);
                setActiveTab("table");
              }
            }}
            popularKey="options-flow"
            placeholder="Filter by symbol..."
          />
          {selectedSymbol && (
            <button
              onClick={() => setSelectedSymbol(null)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-loss/10 text-loss border border-loss/20 hover:bg-loss/15 transition-all"
            >
              Clear <X size={10} />
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={12} className="text-muted/40" />

          {/* Sentiment */}
          <div className="flex gap-0.5 rounded-lg border border-border/50 p-0.5">
            {(["all", "bullish", "bearish", "neutral"] as SentimentFilter[]).map((s) => (
              <button
                key={s}
                onClick={() => setSentimentFilter(s)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider transition-all ${
                  sentimentFilter === s
                    ? s === "bullish" ? "bg-win/10 text-win"
                    : s === "bearish" ? "bg-loss/10 text-loss"
                    : "bg-accent/10 text-accent"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Type */}
          <div className="flex gap-0.5 rounded-lg border border-border/50 p-0.5">
            {(["all", "call", "put"] as TypeFilter[]).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider transition-all ${
                  typeFilter === t ? "bg-accent/10 text-accent" : "text-muted hover:text-foreground"
                }`}
              >
                {t === "all" ? "All" : t === "call" ? "Calls" : "Puts"}
              </button>
            ))}
          </div>

          {/* Premium */}
          <div className="flex gap-0.5 rounded-lg border border-border/50 p-0.5">
            {([
              { key: "all" as const, label: "All" },
              { key: "large" as const, label: ">$1M" },
              { key: "medium" as const, label: "$100K+" },
              { key: "small" as const, label: "<$100K" },
            ]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setPremiumFilter(key)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-semibold tracking-wider transition-all ${
                  premiumFilter === key ? "bg-accent/10 text-accent" : "text-muted hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 rounded-xl border border-border/50 p-1 glass w-fit">
        {TAB_OPTIONS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === tab.value
                ? "bg-accent/10 text-accent shadow-sm"
                : "text-muted hover:text-foreground hover:bg-surface-hover"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-loss/20 bg-loss/5 p-3 text-sm text-loss">{error}</div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 size={24} className="animate-spin text-accent" />
        </div>
      ) : filteredFlows.length === 0 && activeTab === "table" ? (
        <div
          className="glass rounded-2xl border border-border/50 p-12 flex flex-col items-center justify-center text-center"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <Activity size={48} className="text-accent/30 mb-4" />
          <h3 className="text-lg font-bold text-foreground mb-2">No Options Flow Data</h3>
          <p className="text-sm text-muted max-w-xs">
            {sentimentFilter !== "all" || typeFilter !== "all" || premiumFilter !== "all" || selectedSymbol
              ? "No results match your current filters. Try broadening your search."
              : "Options flow data is not available at this time."}
          </p>
        </div>
      ) : (
        <>
          {activeTab === "table" && (
            <FlowTableTab
              flows={filteredFlows}
              onSymbolClick={handleSymbolClick}
              visibleCount={visibleCount}
              onLoadMore={() => setVisibleCount((v) => v + 50)}
              hasMore={visibleCount < filteredFlows.length}
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={handleSort}
            />
          )}
          {activeTab === "market-summary" && (
            <MarketSummaryTab flows={filteredFlows} summary={summary} colors={colors} />
          )}
          {activeTab === "symbol-summary" && (
            <SymbolSummaryTab
              summaries={symbolSummaries}
              onSymbolClick={handleSymbolClick}
              selectedSymbol={selectedSymbol}
            />
          )}
        </>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-muted/40">
        <span>
          {filteredFlows.length} entries
          {selectedSymbol ? ` (filtered: ${selectedSymbol})` : ""}
        </span>
        <span className="flex items-center gap-1">
          <span className={`w-2 h-2 rounded-full ${autoRefresh ? "bg-win animate-pulse" : "bg-muted/30"}`} />
          {autoRefresh ? "Auto-refreshes every 60s" : "Auto-refresh paused"}
        </span>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Activity, Search, RefreshCw, Loader2, Filter } from "lucide-react";
import { Header } from "@/components/header";
import { useTheme } from "@/lib/theme-context";
import { getChartColors } from "@/lib/chart-colors";
import { useSubscription } from "@/lib/use-subscription";
import { UpgradePrompt } from "@/components/upgrade-prompt";
import { usePageTour } from "@/lib/use-page-tour";
import { PageInfoButton } from "@/components/ui/page-info-button";

interface OptionsFlowRow {
  symbol: string;
  expiry: string;
  strike: number;
  type: "C" | "P";
  volume: number;
  openInterest: number;
  premium: number;
  sentiment: "bullish" | "bearish" | "neutral";
  time: string;
}

type SentimentFilter = "all" | "bullish" | "bearish";
type TypeFilter = "all" | "call" | "put";

function StatBlock({ label, value, color = "text-foreground" }: { label: string; value: string; color?: string }) {
  return (
    <div className="glass rounded-xl border border-border/50 p-4" style={{ boxShadow: "var(--shadow-card)" }}>
      <p className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}

function SentimentBadge({ sentiment }: { sentiment: string }) {
  const config: Record<string, { bg: string; text: string }> = {
    bullish: { bg: "bg-win/10", text: "text-win" },
    bearish: { bg: "bg-loss/10", text: "text-loss" },
    neutral: { bg: "bg-muted/10", text: "text-muted" },
  };
  const { bg, text } = config[sentiment] ?? config.neutral;
  return (
    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider ${bg} ${text}`}>
      {sentiment}
    </span>
  );
}

export default function OptionsFlowPage() {
  usePageTour("options-flow-page");
  const { hasAccess, loading: subLoading } = useSubscription();
  const { theme } = useTheme();
  const colors = getChartColors(theme);

  const [flows, setFlows] = useState<OptionsFlowRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sentimentFilter, setSentimentFilter] = useState<SentimentFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchFlow = useCallback(async () => {
    try {
      const res = await fetch("/api/market/options-flow");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setFlows(json.flow ?? []);
      setLastUpdated(new Date());
      setError(null);
    } catch {
      setError("Failed to load options flow data.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch and auto-refresh every 60 seconds
  useEffect(() => {
    fetchFlow();
    const interval = setInterval(fetchFlow, 60_000);
    return () => clearInterval(interval);
  }, [fetchFlow]);

  const filteredFlows = useMemo(() => {
    let result = [...flows];

    if (search) {
      const q = search.toUpperCase();
      result = result.filter((f) => f.symbol.includes(q));
    }

    if (sentimentFilter !== "all") {
      result = result.filter((f) => f.sentiment === sentimentFilter);
    }

    if (typeFilter !== "all") {
      result = result.filter((f) =>
        typeFilter === "call" ? f.type === "C" : f.type === "P"
      );
    }

    return result;
  }, [flows, search, sentimentFilter, typeFilter]);

  const totalPremium = flows.reduce((sum, f) => sum + f.premium, 0);
  const bullishCount = flows.filter((f) => f.sentiment === "bullish").length;
  const bearishCount = flows.filter((f) => f.sentiment === "bearish").length;
  const callPutRatio = flows.length > 0
    ? (flows.filter((f) => f.type === "C").length / Math.max(flows.filter((f) => f.type === "P").length, 1)).toFixed(2)
    : "0";

  if (subLoading) return null;
  if (!hasAccess("advanced-analytics")) return <UpgradePrompt feature="advanced-analytics" requiredTier="max" />;

  return (
    <div className="space-y-6 mx-auto max-w-[1600px]">
      <Header />

      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Activity size={24} className="text-accent" />
            Options Flow
            <PageInfoButton tourName="options-flow-page" />
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
            onClick={fetchFlow}
            className="p-2 rounded-xl hover:bg-surface-hover text-muted hover:text-foreground transition-all"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatBlock label="Total Premium" value={`$${(totalPremium / 1e6).toFixed(1)}M`} color="text-accent" />
        <StatBlock label="Bullish Flows" value={String(bullishCount)} color="text-win" />
        <StatBlock label="Bearish Flows" value={String(bearishCount)} color="text-loss" />
        <StatBlock label="Call/Put Ratio" value={callPutRatio} />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by symbol..."
            className="w-full bg-surface border border-border rounded-xl pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted/30 focus:outline-none focus:border-accent/50 transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={12} className="text-muted/40" />

          {/* Sentiment filter */}
          <div className="flex gap-1 rounded-lg border border-border/50 p-0.5">
            {(["all", "bullish", "bearish"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSentimentFilter(s)}
                className={`px-3 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider transition-all ${
                  sentimentFilter === s
                    ? s === "bullish"
                      ? "bg-win/10 text-win"
                      : s === "bearish"
                      ? "bg-loss/10 text-loss"
                      : "bg-accent/10 text-accent"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Type filter */}
          <div className="flex gap-1 rounded-lg border border-border/50 p-0.5">
            {(["all", "call", "put"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider transition-all ${
                  typeFilter === t
                    ? "bg-accent/10 text-accent"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {t === "all" ? "All" : t === "call" ? "Calls" : "Puts"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-loss/20 bg-loss/5 p-3 text-sm text-loss">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 size={24} className="animate-spin text-accent" />
        </div>
      ) : filteredFlows.length === 0 ? (
        <div
          className="glass rounded-2xl border border-border/50 p-12 flex flex-col items-center justify-center text-center"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <Activity size={48} className="text-accent/30 mb-4" />
          <h3 className="text-lg font-bold text-foreground mb-2">No Options Flow Data</h3>
          <p className="text-sm text-muted max-w-xs">
            {search || sentimentFilter !== "all" || typeFilter !== "all"
              ? "No results match your current filters. Try broadening your search."
              : "Options flow data is not available at this time. Data auto-refreshes every 60 seconds."}
          </p>
        </div>
      ) : (
        <div
          className="bg-surface rounded-2xl border border-border overflow-hidden"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  {["Time", "Symbol", "Expiry", "Strike", "Type", "Volume", "OI", "Premium", "Sentiment"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredFlows.map((flow, idx) => (
                  <tr
                    key={`${flow.symbol}-${flow.strike}-${flow.expiry}-${idx}`}
                    className="border-b border-border/30 hover:bg-surface-hover/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-[10px] text-muted tabular-nums">{flow.time}</td>
                    <td className="px-4 py-3 text-xs font-bold text-accent">{flow.symbol}</td>
                    <td className="px-4 py-3 text-xs text-muted tabular-nums">{flow.expiry}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-foreground tabular-nums">
                      ${flow.strike.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          flow.type === "C"
                            ? "bg-win/10 text-win"
                            : "bg-loss/10 text-loss"
                        }`}
                      >
                        {flow.type === "C" ? "CALL" : "PUT"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-foreground tabular-nums font-medium">
                      {flow.volume.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted tabular-nums">
                      {flow.openInterest.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-foreground tabular-nums">
                      ${flow.premium >= 1e6
                        ? `${(flow.premium / 1e6).toFixed(1)}M`
                        : flow.premium >= 1e3
                        ? `${(flow.premium / 1e3).toFixed(0)}K`
                        : flow.premium.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <SentimentBadge sentiment={flow.sentiment} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-muted/40">
        <span>Showing {filteredFlows.length} of {flows.length} entries</span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-win animate-pulse" />
          Auto-refreshes every 60s
        </span>
      </div>
    </div>
  );
}

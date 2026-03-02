"use client";

import { useState, useEffect, useCallback } from "react";
import { CalendarDays, Search, Loader2 } from "lucide-react";
import { Header } from "@/components/header";
import { useTheme } from "@/lib/theme-context";
import { getChartColors } from "@/lib/chart-colors";
import { useSubscription } from "@/lib/use-subscription";
import { UpgradePrompt } from "@/components/upgrade-prompt";
import { usePageTour } from "@/lib/use-page-tour";
import { PageInfoButton } from "@/components/ui/page-info-button";
import MonthlyReturnsTab from "@/components/seasonality/monthly-returns-tab";
import DayOfWeekTab from "@/components/seasonality/day-of-week-tab";
import HeatmapTab from "@/components/seasonality/heatmap-tab";
import YearComparisonTab from "@/components/seasonality/year-comparison-tab";
import {
  type SeasonalityData,
  type SeasonalityTab,
  type LookbackPeriod,
  LOOKBACK_DAYS,
  SYMBOL_GROUPS,
  TAB_OPTIONS,
} from "@/components/seasonality/seasonality-types";
import { mapApiResponse } from "@/components/seasonality/seasonality-utils";

export default function SeasonalityPage() {
  usePageTour("seasonality-page");
  const { hasAccess, loading: subLoading } = useSubscription();
  const { theme } = useTheme();
  const colors = getChartColors(theme);

  const [symbol, setSymbol] = useState("BTC");
  const [inputValue, setInputValue] = useState("BTC");
  const [lookback, setLookback] = useState<LookbackPeriod>("3Y");
  const [activeTab, setActiveTab] = useState<SeasonalityTab>("monthly");
  const [data, setData] = useState<SeasonalityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSeasonality = useCallback(async (sym: string, days: number) => {
    if (!sym.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/market/seasonality?symbol=${encodeURIComponent(sym)}&days=${days}`
      );
      if (!res.ok) throw new Error("Failed to fetch seasonality data");
      const json = await res.json();
      setData(mapApiResponse(json));
    } catch {
      setError("Could not load seasonality data. Try a different symbol.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSeasonality(symbol, LOOKBACK_DAYS[lookback]);
  }, [symbol, lookback, fetchSeasonality]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = inputValue.trim().toUpperCase();
    if (trimmed && trimmed !== symbol) {
      setSymbol(trimmed);
    }
  }

  function handleSymbolClick(sym: string) {
    setInputValue(sym);
    setSymbol(sym);
  }

  if (subLoading) return null;
  if (!hasAccess("advanced-analytics")) return <UpgradePrompt feature="advanced-analytics" requiredTier="pro" />;

  return (
    <div className="space-y-5 mx-auto max-w-[1600px]">
      <Header />

      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <CalendarDays size={24} className="text-accent" />
          Seasonality Analysis
          <PageInfoButton tourName="seasonality-page" />
        </h2>
        <p className="text-sm text-muted mt-0.5">
          Historical return patterns by month, weekday, and year
        </p>
      </div>

      {/* Symbol Groups */}
      <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
        {Object.entries(SYMBOL_GROUPS).map(([groupName, symbols], gi) => (
          <div key={groupName} className="flex items-center gap-1">
            <span className="text-[9px] text-muted/40 uppercase tracking-wider font-semibold whitespace-nowrap mr-0.5">
              {groupName}
            </span>
            {symbols.map((sym) => (
              <button
                key={sym}
                onClick={() => handleSymbolClick(sym)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                  symbol === sym
                    ? "bg-accent/15 text-accent border border-accent/30"
                    : "bg-surface border border-border/50 text-muted hover:text-foreground hover:border-accent/20"
                }`}
              >
                {sym}
              </button>
            ))}
            {gi < Object.keys(SYMBOL_GROUPS).length - 1 && (
              <div className="w-px h-4 bg-border/30 mx-1" />
            )}
          </div>
        ))}
      </div>

      {/* Controls row */}
      <div className="flex flex-wrap gap-3 items-center">
        <form onSubmit={handleSearch} className="flex gap-2 items-center">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/40" />
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value.toUpperCase())}
              placeholder="Symbol..."
              className="w-36 px-4 py-2.5 pl-9 rounded-xl bg-background border border-border text-foreground text-sm font-medium focus:outline-none focus:border-accent/50 transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-accent text-background font-semibold text-sm hover:bg-accent-hover transition-all"
          >
            Analyze
          </button>
        </form>

        {/* Lookback period */}
        <div className="flex gap-1 rounded-xl border border-border/50 p-1 glass ml-auto">
          {(["1Y", "2Y", "3Y", "5Y"] as LookbackPeriod[]).map((period) => (
            <button
              key={period}
              onClick={() => setLookback(period)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                lookback === period
                  ? "bg-accent/10 text-accent shadow-sm"
                  : "text-muted hover:text-foreground hover:bg-surface-hover"
              }`}
            >
              {period}
            </button>
          ))}
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
      {loading && (
        <div className="flex items-center justify-center h-64">
          <Loader2 size={24} className="animate-spin text-accent" />
        </div>
      )}

      {/* Empty state */}
      {!loading && !data && !error && (
        <div
          className="glass rounded-2xl border border-border/50 p-12 flex flex-col items-center justify-center text-center"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <CalendarDays size={48} className="text-accent/30 mb-4" />
          <h3 className="text-lg font-bold text-foreground mb-2">No Seasonality Data</h3>
          <p className="text-sm text-muted max-w-xs">
            Enter a symbol above to analyze historical return patterns.
          </p>
        </div>
      )}

      {/* Tab content */}
      {!loading && data && (
        <>
          {activeTab === "monthly" && (
            <MonthlyReturnsTab data={data.monthly} symbol={symbol} colors={colors} />
          )}
          {activeTab === "weekday" && (
            <DayOfWeekTab data={data.weekday} symbol={symbol} colors={colors} />
          )}
          {activeTab === "heatmap" && (
            <HeatmapTab data={data.monthlyByYear} symbol={symbol} />
          )}
          {activeTab === "comparison" && (
            <YearComparisonTab data={data.yearlyPriceNormalized} symbol={symbol} colors={colors} />
          )}
        </>
      )}
    </div>
  );
}

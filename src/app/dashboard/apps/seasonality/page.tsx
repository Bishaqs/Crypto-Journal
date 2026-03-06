"use client";

import { useState, useEffect, useCallback } from "react";
import { CalendarDays, Loader2 } from "lucide-react";
import { Header } from "@/components/header";
import { useTheme } from "@/lib/theme-context";
import { getChartColors } from "@/lib/chart-colors";
import { useSubscription } from "@/lib/use-subscription";
import { UpgradePrompt } from "@/components/upgrade-prompt";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import MonthlyReturnsTab from "@/components/seasonality/monthly-returns-tab";
import DayOfWeekTab from "@/components/seasonality/day-of-week-tab";
import HeatmapTab from "@/components/seasonality/heatmap-tab";
import YearComparisonTab from "@/components/seasonality/year-comparison-tab";
import {
  type SeasonalityData,
  type SeasonalityTab,
  type LookbackPeriod,
  LOOKBACK_DAYS,
  TAB_OPTIONS,
} from "@/components/seasonality/seasonality-types";
import { mapApiResponse, fetchSeasonalityDirect } from "@/components/seasonality/seasonality-utils";
import SymbolSearch from "@/components/ui/symbol-search";

export default function SeasonalityPage() {
  const { hasAccess, loading: subLoading } = useSubscription();
  const { theme } = useTheme();
  const colors = getChartColors(theme);

  const [symbol, setSymbol] = useState("BTC");
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
      // Try API route first (server-side, has CoinGecko API key)
      const res = await fetch(
        `/api/market/seasonality?symbol=${encodeURIComponent(sym)}&days=${days}`
      );
      if (!res.ok) throw new Error("API route failed");
      const json = await res.json();
      setData(mapApiResponse(json));
    } catch {
      // Fallback: direct CoinGecko fetch from browser
      try {
        const directData = await fetchSeasonalityDirect(sym, days);
        setData(directData);
      } catch (err) {
        console.error("[seasonality]", err);
        setError("Could not load seasonality data. Try a different symbol.");
        setData(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSeasonality(symbol, LOOKBACK_DAYS[lookback]);
  }, [symbol, lookback, fetchSeasonality]);

  function handleSymbolSelect(sym: string) {
    if (sym !== symbol) setSymbol(sym);
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
          <InfoTooltip text="Explore historical return patterns by month, day of week, and year. Identify seasonal trends to inform your timing decisions." size={14} />
        </h2>
        <p className="text-sm text-muted mt-0.5">
          Historical return patterns by month, weekday, and year
        </p>
      </div>

      {/* Symbol Search + Controls */}
      <div className="flex flex-wrap gap-3 items-start">
        <SymbolSearch
          mode="crypto"
          value={symbol}
          onSelect={handleSymbolSelect}
          placeholder="Search any crypto..."
        />

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

"use client";

import { useState, useEffect, useCallback } from "react";
import { Globe, RefreshCw, CalendarDays, DollarSign, BarChart3, ChevronDown } from "lucide-react";
import { TradingViewMiniChart, TradingViewTechnicalAnalysis } from "@/components/tradingview-mini-chart";
import { getRecentAndUpcoming, EVENT_META } from "@/lib/macro-calendar";
import type { MacroEvent, EventType } from "@/lib/macro-calendar";
import { PageInfoButton } from "@/components/ui/page-info-button";
import { usePageTour } from "@/lib/use-page-tour";

interface IndexData {
  price: number;
  change: number;
  changePct: number;
  spark: number[];
}

interface StockMarketData {
  indices: Record<string, IndexData>;
  forex: Record<string, number>;
  timestamp: number;
}

function PctBadge({ value }: { value: number }) {
  const isPos = value >= 0;
  return (
    <span className={`text-xs font-semibold tabular-nums ${isPos ? "text-win" : "text-loss"}`}>
      {isPos ? "+" : ""}{value.toFixed(2)}%
    </span>
  );
}

function IndexCard({ label, data, icon }: { label: string; data?: IndexData; icon: string }) {
  if (!data) return (
    <div className="glass rounded-xl border border-border/50 p-4" style={{ boxShadow: "var(--shadow-card)" }}>
      <p className="text-[10px] uppercase tracking-wider text-muted/60 font-semibold">{label}</p>
      <p className="text-lg font-bold text-muted">—</p>
    </div>
  );

  const isPos = data.changePct >= 0;
  return (
    <div className="glass rounded-xl border border-border/50 p-4" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] uppercase tracking-wider text-muted/60 font-semibold">{label}</p>
        <span className="text-xs">{icon}</span>
      </div>
      <p className="text-lg font-bold tabular-nums text-foreground">
        {data.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
      <div className="flex items-center gap-2 mt-0.5">
        <span className={`text-xs tabular-nums ${isPos ? "text-win" : "text-loss"}`}>
          {isPos ? "+" : ""}{data.change.toFixed(2)}
        </span>
        <PctBadge value={data.changePct} />
      </div>
    </div>
  );
}

const TYPE_COLORS: Record<EventType, string> = {
  FOMC: "bg-accent/15 text-accent border-accent/30",
  CPI: "bg-win/15 text-win border-win/30",
  NFP: "bg-loss/15 text-loss border-loss/30",
  PPI: "bg-foreground/10 text-foreground border-border",
  GDP: "bg-accent/10 text-accent border-accent/20",
  PCE: "bg-win/10 text-win border-win/20",
  UNEMP: "bg-loss/10 text-loss border-loss/20",
};

const FOREX_PAIRS: { symbol: string; label: string; base: string; invert: boolean }[] = [
  { symbol: "FX:EURUSD", label: "EUR/USD", base: "EUR", invert: true },
  { symbol: "FX:GBPUSD", label: "GBP/USD", base: "GBP", invert: true },
  { symbol: "FX:USDJPY", label: "USD/JPY", base: "JPY", invert: false },
  { symbol: "FX:USDCHF", label: "USD/CHF", base: "CHF", invert: false },
  { symbol: "FX:USDCAD", label: "USD/CAD", base: "CAD", invert: false },
  { symbol: "FX:AUDUSD", label: "AUD/USD", base: "AUD", invert: true },
];

export default function StockMarketOverviewPage() {
  usePageTour("stocks-market-page");
  const [data, setData] = useState<StockMarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  const calendarEvents = getRecentAndUpcoming(12);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/market/stocks");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setData(json);
      setError(null);
    } catch {
      setError("Failed to load market data. Retrying...");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 300_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-accent">Loading market data...</div>
      </div>
    );
  }

  const vix = data?.indices?.VIX;
  const vixColor = vix
    ? vix.price < 20 ? "text-win" : vix.price < 30 ? "text-foreground" : "text-loss"
    : "text-muted";

  return (
    <div className="space-y-6 mx-auto max-w-[1600px]">
      {/* Header */}
      <div id="tour-stock-market-header" className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Globe size={24} className="text-accent" />
            Stock Market Overview
            <PageInfoButton tourName="stocks-market-page" />
          </h2>
          <p className="text-sm text-muted mt-0.5">Indices, macro data & forex</p>
        </div>
        <div className="flex items-center gap-3">
          {data?.timestamp && (
            <span className="text-[10px] text-muted/50">
              Updated {new Date(data.timestamp).toLocaleTimeString()}
            </span>
          )}
          <button onClick={fetchData} className="p-2 rounded-xl hover:bg-surface-hover text-muted hover:text-foreground transition-all">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-loss/20 bg-loss/5 p-3 text-sm text-loss">{error}</div>
      )}

      {/* Section 1: Major Indices + VIX */}
      <div id="tour-stock-market-indices" className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <IndexCard label="S&P 500" data={data?.indices?.SP500} icon="📈" />
        <IndexCard label="NASDAQ" data={data?.indices?.NASDAQ} icon="💻" />
        <IndexCard label="DOW" data={data?.indices?.DOW} icon="🏭" />
        <div className="glass rounded-xl border border-border/50 p-4" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] uppercase tracking-wider text-muted/60 font-semibold">VIX</p>
            <span className="text-xs">⚡</span>
          </div>
          <p className={`text-lg font-bold tabular-nums ${vixColor}`}>
            {vix ? vix.price.toFixed(2) : "—"}
          </p>
          {vix && (
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-[10px] font-semibold ${vix.price < 20 ? "text-win" : vix.price < 30 ? "text-muted" : "text-loss"}`}>
                {vix.price < 20 ? "Low Vol" : vix.price < 30 ? "Moderate" : "High Vol"}
              </span>
              <PctBadge value={vix.changePct} />
            </div>
          )}
        </div>
      </div>

      {/* Section 2: DXY + Sentiment */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* DXY with TradingView Chart */}
        <div className="glass rounded-xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <DollarSign size={16} className="text-accent" />
            US Dollar Index (DXY)
          </h3>
          {data?.indices?.DXY && (
            <div className="flex items-center gap-4 mb-3">
              <p className="text-2xl font-bold tabular-nums text-foreground">
                {data.indices.DXY.price.toFixed(2)}
              </p>
              <PctBadge value={data.indices.DXY.changePct} />
            </div>
          )}
          <TradingViewMiniChart symbol="PEPPERSTONE:USDX" height={180} />
        </div>

        {/* S&P 500 Sentiment (TradingView Technical Analysis) */}
        <div className="glass rounded-xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <BarChart3 size={16} className="text-accent" />
            Market Sentiment (S&P 500)
          </h3>
          <TradingViewTechnicalAnalysis symbol="AMEX:SPY" height={350} />
        </div>
      </div>

      {/* Section 3: Forex Pairs with TradingView Charts */}
      <div className="bg-surface rounded-2xl border border-border p-5" style={{ boxShadow: "var(--shadow-card)" }}>
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <BarChart3 size={16} className="text-accent" />
          Major Forex Pairs
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FOREX_PAIRS.map(({ symbol, label, base, invert }) => {
            const rate = data?.forex?.[base];
            const display = rate ? (invert ? (1 / rate) : rate) : null;
            return (
              <div key={symbol} className="glass rounded-xl border border-border/50 p-3" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-foreground">{label}</span>
                  {display && (
                    <span className="text-sm font-bold tabular-nums text-foreground">
                      {display.toFixed(4)}
                    </span>
                  )}
                </div>
                <TradingViewMiniChart symbol={symbol} height={120} dateRange="1M" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 4: Economic Calendar */}
      <div id="tour-stock-market-calendar" className="bg-surface rounded-2xl border border-border p-5" style={{ boxShadow: "var(--shadow-card)" }}>
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <CalendarDays size={16} className="text-accent" />
          Economic Calendar
        </h3>
        <div className="space-y-1">
          {calendarEvents.map((event, i) => {
            const isNext = !event.isPast && (i === 0 || calendarEvents[i - 1]?.isPast);
            const eventKey = `${event.date}-${event.type}-${i}`;
            const isExpanded = expandedEvent === eventKey;
            return (
              <div key={eventKey}>
                <button
                  onClick={() => setExpandedEvent(isExpanded ? null : eventKey)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left ${
                    event.isPast
                      ? "opacity-40"
                      : isNext
                      ? "bg-accent/5 border border-accent/20"
                      : "hover:bg-surface-hover"
                  }`}
                >
                  <div className="w-20 shrink-0">
                    <p className="text-xs font-semibold text-foreground tabular-nums">
                      {new Date(event.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                    <p className="text-[10px] text-muted">
                      {new Date(event.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" })}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border shrink-0 ${TYPE_COLORS[event.type]}`}>
                    {event.type}
                  </span>
                  <p className="text-sm text-foreground flex-1">{event.name}</p>
                  {isNext && (
                    <span className="text-[10px] font-semibold text-accent px-2 py-0.5 rounded-full bg-accent/10 shrink-0">
                      NEXT
                    </span>
                  )}
                  <ChevronDown size={14} className={`text-muted shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                </button>
                {isExpanded && (() => {
                  const meta = EVENT_META[event.type];
                  return (
                    <div className="mx-3 mb-3 rounded-xl bg-background/60 border border-border/40 overflow-hidden">
                      <div className="p-5 space-y-5">
                        {/* Top: Data cards row */}
                        <div className="flex items-stretch gap-3 flex-wrap">
                          {event.previous && (
                            <div className="glass rounded-xl border border-border/30 px-5 py-3 min-w-[120px]">
                              <p className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1">Previous</p>
                              <p className="text-xl font-bold text-foreground tabular-nums">{event.previous}</p>
                            </div>
                          )}
                          {event.forecast && (
                            <div className="glass rounded-xl border border-accent/30 px-5 py-3 min-w-[120px]">
                              <p className="text-[10px] text-accent/60 uppercase tracking-wider font-semibold mb-1">Forecast</p>
                              <p className="text-xl font-bold text-accent tabular-nums">{event.forecast}</p>
                            </div>
                          )}
                          <div className="flex items-center">
                            <span className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border ${TYPE_COLORS[event.type]}`}>
                              {event.impact === "high" ? "HIGH IMPACT" : "MEDIUM IMPACT"}
                            </span>
                          </div>
                        </div>

                        {/* What & Why */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <p className="text-[10px] uppercase tracking-wider text-muted/60 font-semibold">What it measures</p>
                            <p className="text-sm text-foreground/80 leading-relaxed">{meta.whatItMeasures}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] uppercase tracking-wider text-muted/60 font-semibold">Why it matters</p>
                            <p className="text-sm text-foreground/80 leading-relaxed">{meta.whyItMatters}</p>
                          </div>
                        </div>

                        {/* Key Levels */}
                        <div className="space-y-2">
                          <p className="text-[10px] uppercase tracking-wider text-muted/60 font-semibold">Key Levels to Watch</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                            {meta.keyLevels.map((level, idx) => (
                              <p key={idx} className="text-xs text-muted leading-relaxed flex items-start gap-2">
                                <span className="text-accent mt-0.5 shrink-0">&#8250;</span>
                                {level}
                              </p>
                            ))}
                          </div>
                        </div>

                        {/* Related Chart */}
                        <div className="space-y-2">
                          <p className="text-[10px] uppercase tracking-wider text-muted/60 font-semibold">Related Market</p>
                          <p className="text-xs text-muted/80 leading-relaxed">{meta.chartExplanation}</p>
                          <div className="rounded-xl overflow-hidden border border-border/20">
                            <TradingViewMiniChart symbol={meta.relevantSymbol} height={160} dateRange="3M" />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>
      </div>

      {!data && !loading && !error && (
        <div className="text-center py-16">
          <Globe size={48} className="text-accent/20 mx-auto mb-4" />
          <p className="text-lg font-semibold text-foreground mb-2">No market data</p>
          <p className="text-sm text-muted">Unable to load data. Try refreshing.</p>
        </div>
      )}
    </div>
  );
}

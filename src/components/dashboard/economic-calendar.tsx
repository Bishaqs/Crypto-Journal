"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { CalendarDays, ChevronDown, ExternalLink } from "lucide-react";
import { TradingViewMiniChart } from "@/components/tradingview-mini-chart";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import {
  TITLE_TO_EVENT_TYPE,
  EVENT_META,
  getEventsAfterDate,
} from "@/lib/macro-calendar";
import type { EventType } from "@/lib/macro-calendar";

/* ── Types ── */

interface CalendarEvent {
  title: string;
  country: string;
  date: string; // YYYY-MM-DD
  time: string;
  impact: "high" | "medium" | "low" | "holiday";
  forecast: string | null;
  previous: string | null;
  url: string;
}

interface EnrichedEvent extends CalendarEvent {
  eventType: EventType | null;
  isStatic?: boolean;
}

interface EconomicCalendarProps {
  currencies?: string[];
  minImpact?: "high" | "medium" | "low";
  showEducationalDetails?: boolean;
  maxVisible?: number;
}

/* ── Constants ── */

const IMPACT_RANK: Record<string, number> = {
  high: 3,
  medium: 2,
  low: 1,
  holiday: 0,
};

const IMPACT_STYLES: Record<
  string,
  { dot: string; badge: string; label: string }
> = {
  high: {
    dot: "bg-loss",
    badge: "bg-loss/15 text-loss border-loss/30",
    label: "HIGH",
  },
  medium: {
    dot: "bg-amber-500",
    badge: "bg-amber-500/15 text-amber-500 border-amber-500/30",
    label: "MED",
  },
  low: {
    dot: "bg-foreground/30",
    badge: "bg-foreground/10 text-muted border-border",
    label: "LOW",
  },
  holiday: {
    dot: "bg-accent/30",
    badge: "bg-accent/10 text-accent border-accent/20",
    label: "HOLIDAY",
  },
};

const TYPE_COLORS: Record<EventType, string> = {
  FOMC: "bg-accent/15 text-accent border-accent/30",
  CPI: "bg-win/15 text-win border-win/30",
  NFP: "bg-loss/15 text-loss border-loss/30",
  PPI: "bg-foreground/10 text-foreground border-border",
  GDP: "bg-accent/10 text-accent border-accent/20",
  PCE: "bg-win/10 text-win border-win/20",
  UNEMP: "bg-loss/10 text-loss border-loss/20",
};

const COUNTRY_FLAGS: Record<string, string> = {
  USD: "\u{1F1FA}\u{1F1F8}",
  EUR: "\u{1F1EA}\u{1F1FA}",
  GBP: "\u{1F1EC}\u{1F1E7}",
  JPY: "\u{1F1EF}\u{1F1F5}",
  CAD: "\u{1F1E8}\u{1F1E6}",
  AUD: "\u{1F1E6}\u{1F1FA}",
  CHF: "\u{1F1E8}\u{1F1ED}",
  NZD: "\u{1F1F3}\u{1F1FF}",
  CNY: "\u{1F1E8}\u{1F1F3}",
};

/* ── Component ── */

export function EconomicCalendar({
  currencies,
  minImpact = "medium",
  showEducationalDetails = true,
  maxVisible = 15,
}: EconomicCalendarProps) {
  const [liveEvents, setLiveEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [impactFilter, setImpactFilter] = useState<"high" | "medium" | "low">(
    minImpact
  );
  const [showAll, setShowAll] = useState(false);

  const fetchCalendar = useCallback(async () => {
    try {
      const res = await fetch("/api/market/economic-calendar");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setLiveEvents(json.events ?? []);
      setError(null);
    } catch {
      setError("Calendar unavailable");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCalendar();
    const interval = setInterval(fetchCalendar, 300_000);
    return () => clearInterval(interval);
  }, [fetchCalendar]);

  // Filter and enrich live events
  const enrichedEvents = useMemo<EnrichedEvent[]>(() => {
    const filtered = liveEvents.filter((e) => {
      if (currencies && !currencies.includes(e.country)) return false;
      if (IMPACT_RANK[e.impact] < IMPACT_RANK[impactFilter]) return false;
      return true;
    });

    return filtered.map((e) => ({
      ...e,
      eventType:
        e.country === "USD" ? TITLE_TO_EVENT_TYPE[e.title] ?? null : null,
    }));
  }, [liveEvents, currencies, impactFilter]);

  // Static lookahead for events beyond this week
  const lookaheadEvents = useMemo<EnrichedEvent[]>(() => {
    if (!showEducationalDetails) return [];

    // Get the last date from live events, or today
    const lastLiveDate =
      liveEvents.length > 0
        ? liveEvents[liveEvents.length - 1].date
        : new Date().toISOString().split("T")[0];

    const staticEvents = getEventsAfterDate(lastLiveDate, 10);

    return staticEvents
      .filter((e) => IMPACT_RANK[e.impact] >= IMPACT_RANK[impactFilter])
      .map((e) => ({
        title: e.name,
        country: "USD",
        date: e.date,
        time: "",
        impact: e.impact as "high" | "medium",
        forecast: e.forecast ?? null,
        previous: e.previous ?? null,
        url: "",
        eventType: e.type,
        isStatic: true,
      }));
  }, [liveEvents, showEducationalDetails, impactFilter]);

  // Combine and group by date
  const allEvents = useMemo(() => {
    const combined = [...enrichedEvents, ...lookaheadEvents];
    const visible = showAll ? combined : combined.slice(0, maxVisible);

    const grouped: { date: string; events: EnrichedEvent[] }[] = [];
    for (const event of visible) {
      const last = grouped[grouped.length - 1];
      if (last && last.date === event.date) {
        last.events.push(event);
      } else {
        grouped.push({ date: event.date, events: [event] });
      }
    }
    return { grouped, total: combined.length };
  }, [enrichedEvents, lookaheadEvents, showAll, maxVisible]);

  const today = new Date().toISOString().split("T")[0];

  return (
    <div
      className="bg-surface rounded-2xl border border-border p-5"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <CalendarDays size={16} className="text-accent" />
          Economic Calendar
          <InfoTooltip text="Live economic events from Forex Factory — impact levels, forecasts, and previous values" articleId="mt-economic-calendar" />
        </h3>
        <div className="flex items-center gap-1.5">
          {(["high", "medium", "low"] as const).map((level) => {
            const style = IMPACT_STYLES[level];
            const isActive = impactFilter === level;
            return (
              <button
                key={level}
                onClick={() => setImpactFilter(level)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                  isActive
                    ? style.badge
                    : "border-transparent text-muted/40 hover:text-muted"
                }`}
              >
                {style.label}
                {level !== "high" ? "+" : ""}
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-pulse text-accent text-sm">
            Loading calendar...
          </div>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="text-center py-6">
          <CalendarDays
            size={32}
            className="text-muted/20 mx-auto mb-2"
          />
          <p className="text-xs text-muted">{error}</p>
        </div>
      )}

      {/* Events */}
      {!loading && !error && allEvents.grouped.length === 0 && (
        <div className="text-center py-6">
          <CalendarDays
            size={32}
            className="text-muted/20 mx-auto mb-2"
          />
          <p className="text-xs text-muted">No events match the current filter</p>
        </div>
      )}

      {!loading && !error && allEvents.grouped.length > 0 && (
        <div className="space-y-1">
          {allEvents.grouped.map((group) => {
            const isPast = group.date < today;
            const isToday = group.date === today;
            const dateObj = new Date(group.date + "T12:00:00");

            return (
              <div key={group.date}>
                {/* Date header */}
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 ${
                    isPast ? "opacity-40" : ""
                  }`}
                >
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted/60">
                    {dateObj.toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                  {isToday && (
                    <span className="text-[9px] font-bold text-accent px-1.5 py-0.5 rounded-full bg-accent/10">
                      TODAY
                    </span>
                  )}
                </div>

                {/* Events for this date */}
                {group.events.map((event, i) => {
                  const eventKey = `${event.date}-${event.title}-${i}`;
                  const isExpanded = expandedEvent === eventKey;
                  const impactStyle = IMPACT_STYLES[event.impact] ?? IMPACT_STYLES.low;
                  const meta =
                    event.eventType && showEducationalDetails
                      ? EVENT_META[event.eventType]
                      : null;

                  return (
                    <div key={eventKey}>
                      <button
                        onClick={() =>
                          setExpandedEvent(isExpanded ? null : eventKey)
                        }
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-all text-left ${
                          isPast
                            ? "opacity-40"
                            : isToday
                            ? "hover:bg-accent/5"
                            : "hover:bg-surface-hover"
                        }`}
                      >
                        {/* Impact dot */}
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${impactStyle.dot}`}
                        />

                        {/* Time */}
                        {event.time && event.time !== "All Day" && event.time !== "Tentative" && (
                          <span className="text-[10px] text-muted/60 tabular-nums w-14 shrink-0">
                            {event.time}
                          </span>
                        )}

                        {/* Country flag + currency */}
                        <span className="text-xs shrink-0">
                          {COUNTRY_FLAGS[event.country] ?? ""}{" "}
                          <span className="text-[10px] font-semibold text-muted/60">
                            {event.country}
                          </span>
                        </span>

                        {/* Event type badge (for matched US events) */}
                        {event.eventType && (
                          <span
                            className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold border shrink-0 ${
                              TYPE_COLORS[event.eventType]
                            }`}
                          >
                            {event.eventType}
                          </span>
                        )}

                        {/* Title */}
                        <span className="text-xs text-foreground flex-1 truncate">
                          {event.title}
                        </span>

                        {/* Forecast / Previous */}
                        {event.forecast && (
                          <span className="text-[10px] text-accent tabular-nums shrink-0">
                            F: {event.forecast}
                          </span>
                        )}
                        {event.previous && (
                          <span className="text-[10px] text-muted/60 tabular-nums shrink-0">
                            P: {event.previous}
                          </span>
                        )}

                        {/* Static indicator */}
                        {event.isStatic && (
                          <span className="text-[9px] text-muted/40 shrink-0">
                            scheduled
                          </span>
                        )}

                        {/* Expand arrow */}
                        {meta && (
                          <ChevronDown
                            size={14}
                            className={`text-muted shrink-0 transition-transform ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                          />
                        )}

                        {/* External link for live events */}
                        {!meta && event.url && (
                          <ExternalLink
                            size={12}
                            className="text-muted/30 shrink-0"
                          />
                        )}
                      </button>

                      {/* Expanded educational panel */}
                      {isExpanded && meta && (
                        <div className="mx-3 mb-3 rounded-xl bg-background/60 border border-border/40 overflow-hidden">
                          <div className="p-5 space-y-5">
                            {/* Data cards row */}
                            <div className="flex items-stretch gap-3 flex-wrap">
                              {event.previous && (
                                <div className="glass rounded-xl border border-border/30 px-5 py-3 min-w-[120px]">
                                  <p className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1">
                                    Previous
                                  </p>
                                  <p className="text-xl font-bold text-foreground tabular-nums">
                                    {event.previous}
                                  </p>
                                </div>
                              )}
                              {event.forecast && (
                                <div className="glass rounded-xl border border-accent/30 px-5 py-3 min-w-[120px]">
                                  <p className="text-[10px] text-accent/60 uppercase tracking-wider font-semibold mb-1">
                                    Forecast
                                  </p>
                                  <p className="text-xl font-bold text-accent tabular-nums">
                                    {event.forecast}
                                  </p>
                                </div>
                              )}
                              <div className="flex items-center">
                                <span
                                  className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border ${impactStyle.badge}`}
                                >
                                  {event.impact === "high"
                                    ? "HIGH IMPACT"
                                    : "MEDIUM IMPACT"}
                                </span>
                              </div>
                            </div>

                            {/* What & Why */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <p className="text-[10px] uppercase tracking-wider text-muted/60 font-semibold">
                                  What it measures
                                </p>
                                <p className="text-sm text-foreground/80 leading-relaxed">
                                  {meta.whatItMeasures}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-[10px] uppercase tracking-wider text-muted/60 font-semibold">
                                  Why it matters
                                </p>
                                <p className="text-sm text-foreground/80 leading-relaxed">
                                  {meta.whyItMatters}
                                </p>
                              </div>
                            </div>

                            {/* Key Levels */}
                            <div className="space-y-2">
                              <p className="text-[10px] uppercase tracking-wider text-muted/60 font-semibold">
                                Key Levels to Watch
                              </p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                                {meta.keyLevels.map((level, idx) => (
                                  <p
                                    key={idx}
                                    className="text-xs text-muted leading-relaxed flex items-start gap-2"
                                  >
                                    <span className="text-accent mt-0.5 shrink-0">
                                      &#8250;
                                    </span>
                                    {level}
                                  </p>
                                ))}
                              </div>
                            </div>

                            {/* Related Chart */}
                            <div className="space-y-2">
                              <p className="text-[10px] uppercase tracking-wider text-muted/60 font-semibold">
                                Related Market
                              </p>
                              <p className="text-xs text-muted/80 leading-relaxed">
                                {meta.chartExplanation}
                              </p>
                              <div className="rounded-xl overflow-hidden border border-border/20">
                                <TradingViewMiniChart
                                  symbol={meta.relevantSymbol}
                                  height={160}
                                  dateRange="3M"
                                />
                              </div>
                            </div>

                            {/* ForexFactory link */}
                            {event.url && (
                              <a
                                href={event.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-[10px] text-accent hover:underline"
                              >
                                View on Forex Factory
                                <ExternalLink size={10} />
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Show more / less */}
          {allEvents.total > maxVisible && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="w-full text-center py-2 text-[10px] font-semibold text-accent hover:text-accent/80 transition-colors"
            >
              {showAll
                ? "Show less"
                : `Show ${allEvents.total - maxVisible} more events`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

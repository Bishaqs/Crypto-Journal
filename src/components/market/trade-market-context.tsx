"use client";

import { useState, useEffect } from "react";
import { CalendarDays, AlertTriangle, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { TradeMarketContext as TmcType } from "@/lib/market/types";

interface Props {
  entryDate: string; // ISO string
  exitDate?: string | null;
}

const IMPACT_DOT: Record<string, string> = {
  high: "bg-loss",
  medium: "bg-amber-500",
  low: "bg-foreground/30",
};

function FearGreedBadge({ value, label }: { value: number; label: string }) {
  const color =
    value <= 24 ? "text-loss" :
    value <= 44 ? "text-orange-400" :
    value <= 54 ? "text-yellow-400" :
    value <= 74 ? "text-emerald-400" :
    "text-win";

  return (
    <span className={`text-xs font-bold tabular-nums ${color}`}>
      {value} — {label}
    </span>
  );
}

export function TradeMarketContext({ entryDate, exitDate }: Props) {
  const [data, setData] = useState<TmcType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams({ from: entryDate });
    if (exitDate) params.set("to", exitDate);

    fetch(`/api/market/trade-context?${params}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [entryDate, exitDate]);

  if (loading) {
    return (
      <div className="animate-pulse rounded-xl bg-surface border border-border/50 p-4">
        <div className="h-3 bg-foreground/5 rounded w-1/3 mb-3" />
        <div className="space-y-2">
          <div className="h-2.5 bg-foreground/5 rounded w-2/3" />
          <div className="h-2.5 bg-foreground/5 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const hasEvents = data.eventsNearEntry.length > 0 || data.eventsNearExit.length > 0;
  const hasAlert = !!data.highImpactAlert;
  const hasFG = !!data.fearGreedAtEntry;

  if (!hasEvents && !hasAlert && !hasFG) return null;

  return (
    <div
      className="rounded-xl bg-surface border border-border/50 p-4 space-y-3"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <h4 className="text-xs font-semibold text-foreground flex items-center gap-2">
        <CalendarDays size={14} className="text-accent" />
        Market Context
      </h4>

      {/* High-impact alert */}
      {hasAlert && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <AlertTriangle size={14} className="text-amber-500 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-200">{data.highImpactAlert}</p>
        </div>
      )}

      {/* Fear & Greed at entry */}
      {hasFG && data.fearGreedAtEntry && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted/60 uppercase font-semibold">
            Market Sentiment:
          </span>
          <FearGreedBadge
            value={data.fearGreedAtEntry.value}
            label={data.fearGreedAtEntry.classification}
          />
        </div>
      )}

      {/* Events near entry */}
      {data.eventsNearEntry.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] text-muted/60 uppercase font-semibold tracking-wider">
            Events near entry
          </p>
          {data.eventsNearEntry.map((e, i) => (
            <div key={i} className="flex items-center gap-2 px-2 py-1">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${IMPACT_DOT[e.impact] ?? IMPACT_DOT.low}`} />
              <span className="text-[10px] text-muted/60 w-8 shrink-0">{e.country}</span>
              <span className="text-xs text-foreground/80 truncate">{e.title}</span>
              {e.forecast && (
                <span className="text-[10px] text-accent tabular-nums shrink-0 ml-auto">
                  F: {e.forecast}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Events near exit */}
      {data.eventsNearExit.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] text-muted/60 uppercase font-semibold tracking-wider">
            Events near exit
          </p>
          {data.eventsNearExit.map((e, i) => (
            <div key={i} className="flex items-center gap-2 px-2 py-1">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${IMPACT_DOT[e.impact] ?? IMPACT_DOT.low}`} />
              <span className="text-[10px] text-muted/60 w-8 shrink-0">{e.country}</span>
              <span className="text-xs text-foreground/80 truncate">{e.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

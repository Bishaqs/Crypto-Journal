"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { EMOTION_CONFIG } from "@/components/psychology-inputs";
import type { TradeEmotionLog } from "@/lib/types";

interface EmotionTimelineProps {
  tradeId: string;
  tradeTable: "trades" | "stock_trades" | "commodity_trades" | "forex_trades";
  preEmotion: string | null;
  openTimestamp: string;
  closeTimestamp: string | null;
}

type TimelineEntry = {
  emotion: string;
  label: string;
  note: string | null;
  timestamp: string;
  endTimestamp?: string;
};

function formatTimestamp(ts: string): string {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) +
    " " +
    d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function formatDuration(start: string, end: string): string {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return remainMins > 0 ? `${hours}h ${remainMins}m` : `${hours}h`;
}

export function EmotionTimeline({
  tradeId,
  tradeTable,
  preEmotion,
  openTimestamp,
  closeTimestamp,
}: EmotionTimelineProps) {
  const [logs, setLogs] = useState<TradeEmotionLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      const supabase = createClient();
      const { data } = await supabase
        .from("trade_emotion_logs")
        .select("*")
        .eq("trade_id", tradeId)
        .eq("trade_table", tradeTable)
        .order("created_at", { ascending: true });
      setLogs(data ?? []);
      setLoading(false);
    }
    fetchLogs();
  }, [tradeId, tradeTable]);

  const entries: TimelineEntry[] = [];

  // Pre-trade emotion from the trade itself
  if (preEmotion) {
    entries.push({
      emotion: preEmotion,
      label: "Pre-Trade",
      note: null,
      timestamp: openTimestamp,
    });
  }

  // Follow-up and post-trade emotions from logs
  for (const log of logs) {
    const effectiveStart = log.started_at ?? log.created_at;
    entries.push({
      emotion: log.emotion,
      label: log.phase === "follow_up" ? "Check-In" : "Post-Trade",
      note: log.note,
      timestamp: log.phase === "post" && closeTimestamp ? closeTimestamp : effectiveStart,
      endTimestamp: log.ended_at ?? undefined,
    });
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted">
        <div className="w-3 h-3 rounded-full border-2 border-muted/40 border-t-accent animate-spin" />
        Loading emotions...
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <p className="text-xs text-muted/50 italic">No emotions recorded.</p>
    );
  }

  return (
    <div className="space-y-0">
      {entries.map((entry, i) => {
        const config = EMOTION_CONFIG[entry.emotion];
        const emoji = config?.emoji ?? "";
        const isLast = i === entries.length - 1;

        const isDuration = !!entry.endTimestamp;

        return (
          <div key={`${entry.label}-${i}`} className="flex gap-3">
            {/* Timeline line + dot(s) */}
            <div className="flex flex-col items-center">
              <div
                className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1 ${
                  entry.label === "Pre-Trade"
                    ? "bg-accent"
                    : entry.label === "Post-Trade"
                    ? "bg-foreground"
                    : "bg-muted/60"
                }`}
              />
              {isDuration && (
                <div className="w-1 flex-1 bg-accent/30 min-h-[20px] rounded-full" />
              )}
              {isDuration && (
                <div
                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    entry.label === "Pre-Trade"
                      ? "bg-accent"
                      : entry.label === "Post-Trade"
                      ? "bg-foreground"
                      : "bg-muted/60"
                  }`}
                />
              )}
              {!isLast && (
                <div className="w-px flex-1 bg-border/50 min-h-[16px]" />
              )}
            </div>

            {/* Content */}
            <div className={`pb-3 ${isLast ? "pb-0" : ""}`}>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider text-muted font-semibold">
                  {entry.label}
                </span>
                <span className="text-[10px] text-muted/50">
                  {formatTimestamp(entry.timestamp)}
                  {entry.endTimestamp && (
                    <>
                      {" \u2192 "}
                      {formatTimestamp(entry.endTimestamp)}
                      <span className="ml-1 text-accent/70">
                        ({formatDuration(entry.timestamp, entry.endTimestamp)})
                      </span>
                    </>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-sm">{emoji}</span>
                <span className="text-sm text-foreground">{entry.emotion}</span>
              </div>
              {entry.note && (
                <p className="text-xs text-muted mt-0.5">{entry.note}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

"use client";

import { useState, useCallback } from "react";
import { Sparkles, RefreshCw } from "lucide-react";

type Props = {
  periodType: "daily" | "weekly" | "monthly" | "yearly";
  periodStart: string;
  narrative: string | null;
};

export function NovaNarrative({ periodType, periodStart, narrative: initial }: Props) {
  const [narrative, setNarrative] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const generate = useCallback(async (force: boolean) => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/ai/generate-narrative", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period_type: periodType, period_start: periodStart, force }),
      });
      if (!res.ok) {
        setError(true);
        return;
      }
      const data = await res.json();
      if (data.narrative) setNarrative(data.narrative);
      else setError(true);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [periodType, periodStart]);

  // Don't render at all if no narrative and generation failed silently
  if (!narrative && !loading && error) return null;

  return (
    <div
      className="glass rounded-2xl border border-accent/20 bg-accent/5 p-5"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-accent" />
          <h3 className="text-xs font-bold text-accent uppercase tracking-wider">
            Nova&apos;s Analysis
          </h3>
        </div>
        {narrative && !loading && (
          <button
            onClick={() => generate(true)}
            className="flex items-center gap-1 text-[10px] text-muted hover:text-accent transition-colors"
            title="Regenerate narrative"
          >
            <RefreshCw size={10} />
            Refresh
          </button>
        )}
      </div>

      {loading && (
        <div className="space-y-2">
          <div className="h-3 bg-accent/10 rounded animate-pulse w-full" />
          <div className="h-3 bg-accent/10 rounded animate-pulse w-5/6" />
          <div className="h-3 bg-accent/10 rounded animate-pulse w-4/6" />
        </div>
      )}

      {!loading && narrative && (
        <p className="text-sm text-foreground/80 leading-relaxed">{narrative}</p>
      )}

      {!loading && !narrative && !error && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted italic">
            Nova hasn&apos;t analyzed this period yet.
          </p>
          <button
            onClick={() => generate(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-accent bg-accent/10 hover:bg-accent/20 transition-colors"
          >
            <Sparkles size={12} />
            Generate
          </button>
        </div>
      )}
    </div>
  );
}

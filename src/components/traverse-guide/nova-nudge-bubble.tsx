"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, X, Clock } from "lucide-react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import type { NovaNudge } from "@/lib/nova-triggers";

type NovaNudgeBubbleProps = {
  nudge: NovaNudge;
  onCta: () => void;
  onSnooze: () => void;
  onDismiss: () => void;
  autoDismissMs: number;
  onAutoDismiss: () => void;
};

export function NovaNudgeBubble({
  nudge,
  onCta,
  onSnooze,
  onDismiss,
  autoDismissMs,
  onAutoDismiss,
}: NovaNudgeBubbleProps) {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pausedRef = useRef(false);
  const remainingRef = useRef(autoDismissMs);
  const startTimeRef = useRef(Date.now());

  const startTimer = useCallback(() => {
    timerRef.current = setTimeout(() => {
      onAutoDismiss();
    }, remainingRef.current);
    startTimeRef.current = Date.now();
    pausedRef.current = false;
  }, [onAutoDismiss]);

  const pauseTimer = useCallback(() => {
    if (timerRef.current && !pausedRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      remainingRef.current -= Date.now() - startTimeRef.current;
      pausedRef.current = true;
    }
  }, []);

  const resumeTimer = useCallback(() => {
    if (pausedRef.current && remainingRef.current > 0) {
      startTimer();
    }
  }, [startTimer]);

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [startTimer]);

  function handleCta() {
    if (timerRef.current) clearTimeout(timerRef.current);
    onCta();
    router.push(nudge.ctaLink);
  }

  return (
    <div
      className="glass rounded-2xl border border-border/50 relative"
      style={{ boxShadow: "0 0 24px var(--accent-glow), var(--shadow-card)" }}
      onMouseEnter={pauseTimer}
      onMouseLeave={resumeTimer}
    >
      {/* Tail pointing to guide */}
      <div
        className="absolute -bottom-[6px] right-6 w-3 h-3 rotate-45"
        style={{
          borderBottom: "1px solid var(--border)",
          borderRight: "1px solid var(--border)",
          background: "var(--background)",
        }}
      />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Sparkles size={12} className="text-accent" />
            <span className="text-[10px] font-semibold text-accent uppercase tracking-wider">
              Nova
            </span>
          </div>
          <button
            onClick={() => {
              if (timerRef.current) clearTimeout(timerRef.current);
              onDismiss();
            }}
            className="p-0.5 rounded-md text-muted hover:text-foreground transition-colors"
          >
            <X size={12} />
          </button>
        </div>

        {/* Message */}
        <p className="text-sm text-foreground leading-relaxed mb-3">
          {nudge.message}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCta}
            className="px-3 py-1.5 rounded-lg bg-accent text-background text-xs font-semibold hover:bg-accent-hover transition-colors"
          >
            {nudge.cta}
          </button>
          <button
            onClick={() => {
              if (timerRef.current) clearTimeout(timerRef.current);
              onSnooze();
            }}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] text-muted hover:text-foreground transition-colors"
          >
            <Clock size={9} /> Later
          </button>
        </div>
      </div>

      {/* Auto-dismiss progress bar */}
      {!reducedMotion && (
        <div className="h-0.5 bg-border/30 rounded-b-2xl overflow-hidden">
          <div
            className="h-full bg-accent/40 nudge-progress-bar"
            style={{ ["--nudge-duration" as string]: `${autoDismissMs}ms` }}
          />
        </div>
      )}
    </div>
  );
}

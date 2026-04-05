"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Trade, DailyCheckin } from "@/lib/types";
import { TiltSignal } from "@/lib/calculations";
import {
  computeReadinessScore,
  getScoreColor,
  getScoreLabel,
  type ReadinessResult,
} from "@/lib/readiness-score";
import { type MiniArchetype } from "@/lib/mini-quiz-archetypes";
import { createClient } from "@/lib/supabase/client";
import { getLocalDateString } from "@/lib/date-utils";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Sun,
  Coffee,
  Zap,
  Check,
} from "lucide-react";

const MOOD_OPTIONS = [
  { value: 1, emoji: "😞", label: "Awful" },
  { value: 2, emoji: "😔", label: "Low" },
  { value: 3, emoji: "😐", label: "Neutral" },
  { value: 4, emoji: "🙂", label: "Good" },
  { value: 5, emoji: "🔥", label: "Great" },
];

const TRAFFIC_OPTIONS = [
  { value: "green" as const, label: "Go", icon: Zap, color: "bg-win/10 border-win/30 text-win" },
  { value: "yellow" as const, label: "Caution", icon: Coffee, color: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400" },
  { value: "red" as const, label: "Sit out", icon: Sun, color: "bg-loss/10 border-loss/30 text-loss" },
];

function ScoreRing({ score, size = 72 }: { score: number; size?: number }) {
  const colors = getScoreColor(score);
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 10) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={4}
          className="text-border/20"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          className={`${colors.ring} transition-all duration-700`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-xl font-bold ${colors.text}`}>{score}</span>
      </div>
    </div>
  );
}

export function ReadinessScoreWidget({
  trades,
  tiltSignals,
}: {
  trades: Trade[];
  tiltSignals: TiltSignal[];
}) {
  const [checkin, setCheckin] = useState<DailyCheckin | null>(null);
  const [checkinLoaded, setCheckinLoaded] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Inline mini check-in state
  const [inlineMood, setInlineMood] = useState<number | null>(null);
  const [inlineTraffic, setInlineTraffic] = useState<"green" | "yellow" | "red" | null>(null);
  const [saving, setSaving] = useState(false);
  const [justCheckedIn, setJustCheckedIn] = useState(false);

  const supabase = createClient();

  // Get archetype from localStorage
  const archetype = useMemo<MiniArchetype | null>(() => {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem("stargate-mini-archetype");
    return stored as MiniArchetype | null;
  }, []);

  // Fetch today's check-in
  const fetchCheckin = useCallback(async () => {
    const today = getLocalDateString();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("daily_checkins")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", today)
      .limit(1)
      .maybeSingle();

    if (data) {
      setCheckin(data as DailyCheckin);
    }
    setCheckinLoaded(true);
  }, [supabase]);

  useEffect(() => {
    fetchCheckin();
  }, [fetchCheckin]);

  // Compute readiness
  const result: ReadinessResult = useMemo(() => {
    if (!checkinLoaded) {
      return { score: 7, components: [], warnings: [], recommendation: "Loading...", hasCheckin: false };
    }
    return computeReadinessScore({
      trades,
      checkin,
      archetype,
      tiltSignals,
    });
  }, [trades, checkin, archetype, tiltSignals, checkinLoaded]);

  // Handle inline mini check-in submit
  async function handleInlineCheckin() {
    if (!inlineMood || !inlineTraffic) return;
    setSaving(true);

    try {
      const today = getLocalDateString();
      const { error } = await supabase
        .from("daily_checkins")
        .upsert(
          {
            date: today,
            mood: inlineMood,
            traffic_light: inlineTraffic,
          },
          { onConflict: "user_id,date" },
        );

      if (error) {
        console.error("[ReadinessWidget] Check-in save failed:", error.message);
        return;
      }

      // Award XP
      try {
        const { awardXP } = await import("@/lib/xp/engine");
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) await awardXP(supabase, user.id, "checkin");
      } catch {
        /* XP tables may not exist */
      }

      // Mark daily checkin as done (so the modal doesn't appear)
      localStorage.setItem(`checkin-dismissed-${today}`, "1");

      // Refetch to update score
      setJustCheckedIn(true);
      await fetchCheckin();
    } finally {
      setSaving(false);
    }
  }

  const colors = getScoreColor(result.score);
  const label = getScoreLabel(result.score);
  const showInlineCheckin = checkinLoaded && !checkin && !justCheckedIn;
  const topWarning = result.warnings[0] ?? null;

  return (
    <div
      className={`rounded-xl border ${colors.border} ${colors.bg} overflow-hidden transition-all`}
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      {/* Main bar */}
      <div className="flex items-center gap-4 px-4 py-3">
        <ScoreRing score={result.score} size={56} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className={`text-sm font-bold ${colors.text}`}>
              Trading Readiness: {result.score}/10
            </h3>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${colors.bg} ${colors.text} border ${colors.border}`}
            >
              {label}
            </span>
          </div>
          <p className="text-xs text-muted mt-0.5 line-clamp-1">
            {topWarning ?? result.recommendation}
          </p>
        </div>

        {/* Expand/collapse for details */}
        {result.components.length > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-all shrink-0"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}
      </div>

      {/* Inline mini check-in (if no check-in today) */}
      {showInlineCheckin && (
        <div className="border-t border-border/30 px-4 py-3">
          <p className="text-[11px] text-muted mb-2.5 font-medium">
            Quick check-in to refine your score:
          </p>

          {/* Mood row */}
          <div className="flex items-center gap-2 mb-2.5">
            <span className="text-[10px] text-muted w-10 shrink-0">Mood</span>
            <div className="flex gap-1.5">
              {MOOD_OPTIONS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setInlineMood(m.value)}
                  className={`w-9 h-9 flex items-center justify-center rounded-lg border transition-all text-base ${
                    inlineMood === m.value
                      ? "bg-accent/10 border-accent/30 scale-110"
                      : "bg-background border-border/50 hover:border-accent/20"
                  }`}
                  title={m.label}
                >
                  {m.emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Traffic light row */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] text-muted w-10 shrink-0">Trade?</span>
            <div className="flex gap-1.5">
              {TRAFFIC_OPTIONS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setInlineTraffic(t.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-medium transition-all ${
                    inlineTraffic === t.value
                      ? t.color
                      : "bg-background border-border/50 text-muted hover:border-accent/20"
                  }`}
                >
                  <t.icon size={12} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleInlineCheckin}
            disabled={!inlineMood || !inlineTraffic || saving}
            className="w-full py-2 rounded-lg bg-accent text-background font-semibold text-xs hover:bg-accent-hover transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            {saving ? "Saving..." : (
              <>
                <Check size={12} />
                Update Readiness Score
              </>
            )}
          </button>
        </div>
      )}

      {/* Just checked in confirmation */}
      {justCheckedIn && !checkin && (
        <div className="border-t border-border/30 px-4 py-2.5 flex items-center gap-2">
          <Check size={14} className="text-win" />
          <span className="text-xs text-win font-medium">Checked in! Score updated.</span>
        </div>
      )}

      {/* Expanded details */}
      {expanded && result.components.length > 0 && (
        <div className="border-t border-border/30 px-4 py-3 space-y-1.5">
          <p className="text-[10px] text-muted uppercase tracking-wider font-semibold mb-2">
            Score Breakdown
          </p>
          {result.components.map((c, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span
                className={`w-8 text-right font-mono font-bold ${
                  c.value > 0 ? "text-win" : c.value < 0 ? "text-loss" : "text-muted"
                }`}
              >
                {c.value > 0 ? "+" : ""}
                {c.value}
              </span>
              <span className="text-muted">{c.reason}</span>
            </div>
          ))}

          {/* Warnings */}
          {result.warnings.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {result.warnings.map((w, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <AlertTriangle size={12} className="text-amber-400 shrink-0 mt-0.5" />
                  <span className="text-foreground/70">{w}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useMemo } from "react";
import { Trade } from "@/lib/types";
import { EMOTION_CONFIG } from "@/components/psychology-inputs";
import { Brain, TrendingUp, TrendingDown } from "lucide-react";
import Link from "next/link";

export function MindsetWidget({ trades }: { trades: Trade[] }) {
  const data = useMemo(() => {
    const closed = trades.filter(
      (t) => t.close_timestamp !== null && t.pnl !== null,
    );
    if (closed.length === 0) return null;

    // Most frequent recent emotion (last 20 trades)
    const recent = closed
      .sort((a, b) =>
        (b.close_timestamp ?? "").localeCompare(a.close_timestamp ?? ""),
      )
      .slice(0, 20);

    const emotionCounts = new Map<string, number>();
    for (const t of recent) {
      if (!t.emotion) continue;
      emotionCounts.set(t.emotion, (emotionCounts.get(t.emotion) ?? 0) + 1);
    }

    let topEmotion: string | null = null;
    let topCount = 0;
    for (const [emotion, count] of emotionCounts) {
      if (count > topCount) {
        topEmotion = emotion;
        topCount = count;
      }
    }

    // Discipline score (average process_score)
    const processScores = closed
      .filter((t) => t.process_score !== null)
      .map((t) => t.process_score!);
    const avgDiscipline =
      processScores.length > 0
        ? processScores.reduce((a, b) => a + b, 0) / processScores.length
        : null;

    // Best / worst emotion by win rate (need at least 3 trades per emotion)
    const emotionStats = new Map<
      string,
      { wins: number; total: number; pnl: number }
    >();
    for (const t of closed) {
      if (!t.emotion) continue;
      const e = emotionStats.get(t.emotion) ?? { wins: 0, total: 0, pnl: 0 };
      e.total++;
      if ((t.pnl ?? 0) > 0) e.wins++;
      e.pnl += t.pnl ?? 0;
      emotionStats.set(t.emotion, e);
    }

    let bestEmotion: { name: string; winRate: number } | null = null;
    let worstEmotion: { name: string; winRate: number } | null = null;

    for (const [emotion, stats] of emotionStats) {
      if (stats.total < 3) continue;
      const wr = stats.wins / stats.total;
      if (!bestEmotion || wr > bestEmotion.winRate) {
        bestEmotion = { name: emotion, winRate: wr };
      }
      if (!worstEmotion || wr < worstEmotion.winRate) {
        worstEmotion = { name: emotion, winRate: wr };
      }
    }

    // Tagged ratio
    const taggedCount = closed.filter((t) => t.emotion).length;
    const taggedPct =
      closed.length > 0 ? Math.round((taggedCount / closed.length) * 100) : 0;

    return {
      topEmotion,
      topCount,
      avgDiscipline,
      bestEmotion,
      worstEmotion,
      taggedPct,
      totalClosed: closed.length,
    };
  }, [trades]);

  if (!data || data.totalClosed < 3) return null;

  const topConfig = data.topEmotion
    ? EMOTION_CONFIG[data.topEmotion] ?? { emoji: "❓", color: "" }
    : null;

  // Generate insight text
  let insight: string | null = null;
  if (data.bestEmotion && data.worstEmotion && data.bestEmotion.name !== data.worstEmotion.name) {
    const bestEmoji = EMOTION_CONFIG[data.bestEmotion.name]?.emoji ?? "";
    const worstEmoji = EMOTION_CONFIG[data.worstEmotion.name]?.emoji ?? "";
    insight = `${bestEmoji} Best when ${data.bestEmotion.name} (${Math.round(data.bestEmotion.winRate * 100)}% WR)  ·  ${worstEmoji} Worst when ${data.worstEmotion.name} (${Math.round(data.worstEmotion.winRate * 100)}% WR)`;
  }

  return (
    <div
      className="glass rounded-2xl border border-border/50 p-4 overflow-hidden"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Brain size={14} className="text-accent" />
          <span className="text-[11px] text-muted font-medium uppercase tracking-widest">
            Your Trading Mindset
          </span>
        </div>
        <Link
          href="/dashboard/insights"
          className="text-[10px] text-accent hover:text-accent-hover transition-colors font-medium"
        >
          Deep Dive →
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Most common emotion */}
        <div>
          <p className="text-[10px] text-muted mb-1">Dominant Emotion</p>
          {data.topEmotion && topConfig ? (
            <div className="flex items-center gap-1.5">
              <span className="text-lg">{topConfig.emoji}</span>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {data.topEmotion}
                </p>
                <p className="text-[10px] text-muted">
                  {data.topCount} of last 20
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted">No emotions tagged yet</p>
          )}
        </div>

        {/* Discipline score */}
        <div>
          <p className="text-[10px] text-muted mb-1">Plan Discipline</p>
          {data.avgDiscipline !== null ? (
            <div className="flex items-center gap-1.5">
              <span
                className={`text-2xl font-bold ${
                  data.avgDiscipline >= 7
                    ? "text-win"
                    : data.avgDiscipline >= 4
                      ? "text-foreground"
                      : "text-loss"
                }`}
              >
                {data.avgDiscipline.toFixed(1)}
              </span>
              <span className="text-[10px] text-muted">/10</span>
            </div>
          ) : (
            <p className="text-xs text-muted">
              Rate trades to unlock
            </p>
          )}
        </div>

        {/* Emotion tagging rate */}
        <div>
          <p className="text-[10px] text-muted mb-1">Emotions Logged</p>
          <div className="flex items-center gap-1.5">
            <span
              className={`text-2xl font-bold ${
                data.taggedPct >= 70
                  ? "text-win"
                  : data.taggedPct >= 30
                    ? "text-foreground"
                    : "text-muted"
              }`}
            >
              {data.taggedPct}%
            </span>
            <span className="text-[10px] text-muted">of trades</span>
          </div>
        </div>
      </div>

      {/* Behavioral insight */}
      {insight && (
        <div className="mt-3 pt-3 border-t border-border/30">
          <div className="flex items-start gap-2">
            <div className="flex items-center gap-3 text-xs text-foreground/70">
              {data.bestEmotion && (
                <span className="flex items-center gap-1">
                  <TrendingUp size={10} className="text-win" />
                  {EMOTION_CONFIG[data.bestEmotion.name]?.emoji}{" "}
                  {data.bestEmotion.name}{" "}
                  <span className="text-win font-medium">
                    {Math.round(data.bestEmotion.winRate * 100)}%
                  </span>
                </span>
              )}
              {data.worstEmotion &&
                data.worstEmotion.name !== data.bestEmotion?.name && (
                  <span className="flex items-center gap-1">
                    <TrendingDown size={10} className="text-loss" />
                    {EMOTION_CONFIG[data.worstEmotion.name]?.emoji}{" "}
                    {data.worstEmotion.name}{" "}
                    <span className="text-loss font-medium">
                      {Math.round(data.worstEmotion.winRate * 100)}%
                    </span>
                  </span>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

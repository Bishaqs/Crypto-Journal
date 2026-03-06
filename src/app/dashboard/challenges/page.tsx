"use client";

import { useEffect } from "react";
import {
  Flame,
  Target,
  Trophy,
  CheckCircle2,
  Circle,
  Clock,
  Zap,
  RefreshCw,
} from "lucide-react";
import { useChallenges, CHALLENGE_MAP, CATEGORY_META } from "@/lib/challenges";
import type { ChallengeDefinition, ChallengeStatus } from "@/lib/challenges";
import { useLevel } from "@/lib/xp";
import { XPBar } from "@/components/dashboard/xp-bar";
import { ActivityHeatmap } from "@/components/dashboard/activity-heatmap";
import { StreakWidget } from "@/components/dashboard/streak-widget";

function ChallengeCard({
  challenge,
}: {
  challenge: ChallengeDefinition & ChallengeStatus;
}) {
  const catMeta = CATEGORY_META[challenge.category];

  return (
    <div
      className={`group relative rounded-2xl border p-5 transition-all duration-300 ${
        challenge.completed
          ? "border-accent/40 bg-accent/5 shadow-[0_0_20px_var(--accent-glow)]"
          : "border-border/50 bg-card/60 hover:border-border hover:bg-card/80"
      }`}
    >
      {/* Completion glow effect */}
      {challenge.completed && (
        <div className="absolute inset-0 rounded-2xl bg-accent/5 animate-pulse pointer-events-none" />
      )}

      <div className="relative flex items-start gap-4">
        {/* Status icon */}
        <div
          className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all duration-500 ${
            challenge.completed
              ? "bg-accent/20 scale-110"
              : "bg-card/80 group-hover:scale-105"
          }`}
        >
          {challenge.completed ? (
            <CheckCircle2 size={24} className="text-accent animate-[scale-in_0.3s_ease-out]" />
          ) : (
            <span>{challenge.emoji}</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Category tag */}
          <span
            className={`inline-block text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${catMeta.bgColor} ${catMeta.color} mb-1`}
          >
            {catMeta.label}
          </span>

          {/* Title */}
          <h3
            className={`text-sm font-bold ${
              challenge.completed ? "text-accent" : "text-foreground"
            }`}
          >
            {challenge.title}
          </h3>

          {/* Description */}
          <p className="text-xs text-muted mt-0.5">{challenge.description}</p>

          {/* Progress bar */}
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full bg-border/30 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${
                  challenge.completed
                    ? "bg-accent"
                    : "bg-accent/60"
                }`}
                style={{ width: `${challenge.progress}%` }}
              />
            </div>
            <span className="text-[10px] font-mono font-bold text-muted shrink-0">
              {challenge.currentValue}/{challenge.targetValue}
            </span>
          </div>

          {/* XP reward */}
          <div className="mt-2 flex items-center gap-1">
            <Zap size={12} className={challenge.completed ? "text-accent" : "text-muted"} />
            <span
              className={`text-[10px] font-bold ${
                challenge.completed ? "text-accent" : "text-muted"
              }`}
            >
              {challenge.completed ? "+" : ""}
              {challenge.xpReward} XP
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function DailyProgressCircles({ completed, total }: { completed: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
            i < completed
              ? "border-accent bg-accent/20 scale-110"
              : "border-border/40 bg-card/40"
          }`}
        >
          {i < completed ? (
            <CheckCircle2
              size={16}
              className="text-accent animate-[scale-in_0.3s_ease-out]"
            />
          ) : (
            <Circle size={16} className="text-muted/30" />
          )}
        </div>
      ))}
    </div>
  );
}

export default function ChallengesPage() {
  const {
    dailyChallenges,
    weeklyChallenges,
    dailyCompleted,
    allDailiesDone,
    loading,
    refresh,
  } = useChallenges();
  const { level } = useLevel();

  // Get current time info
  const now = new Date();
  const hoursLeft = 23 - now.getHours();
  const minutesLeft = 59 - now.getMinutes();

  // Days until end of week (Sunday)
  const dayOfWeek = now.getDay();
  const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw size={24} className="text-muted animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Target size={24} className="text-accent" />
            Daily Challenges
          </h1>
          <p className="text-sm text-muted mt-1">
            Complete challenges to earn XP and level up
          </p>
        </div>

        {/* Daily progress circles */}
        <div className="flex items-center gap-4">
          <DailyProgressCircles completed={dailyCompleted} total={3} />
          {allDailiesDone && (
            <span className="text-xs font-bold text-accent flex items-center gap-1 animate-pulse">
              <Flame size={14} />
              All Done!
            </span>
          )}
        </div>
      </div>

      {/* XP Bar + Streak */}
      <div className="grid gap-4 md:grid-cols-[1fr_280px]">
        <XPBar />
        <StreakWidget />
      </div>

      {/* Daily Challenges */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Flame size={18} className="text-orange-400" />
            Today&apos;s Challenges
          </h2>
          <div className="flex items-center gap-2 text-xs text-muted">
            <Clock size={12} />
            <span>
              {hoursLeft}h {minutesLeft}m left
            </span>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {dailyChallenges.map((challenge) => (
            <ChallengeCard key={challenge.id} challenge={challenge} />
          ))}
        </div>

        {dailyChallenges.length === 0 && (
          <div className="text-center py-12 text-muted">
            <Target size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-sm">Challenges loading...</p>
          </div>
        )}
      </section>

      {/* Weekly Challenges */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Trophy size={18} className="text-amber-400" />
            Weekly Challenges
          </h2>
          <div className="flex items-center gap-2 text-xs text-muted">
            <Clock size={12} />
            <span>
              {daysUntilSunday} day{daysUntilSunday !== 1 ? "s" : ""} left
            </span>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {weeklyChallenges.map((challenge) => (
            <ChallengeCard key={challenge.id} challenge={challenge} />
          ))}
        </div>
      </section>

      {/* Bonus XP section when all dailies done */}
      {allDailiesDone && (
        <section className="rounded-2xl border border-accent/30 bg-accent/5 p-6 text-center">
          <div className="text-4xl mb-3">🎉</div>
          <h3 className="text-lg font-bold text-accent">
            All Daily Challenges Complete!
          </h3>
          <p className="text-sm text-muted mt-1">
            Come back tomorrow for new challenges. Keep the streak going!
          </p>
          <p className="text-xs font-bold text-accent mt-3">
            +{dailyChallenges.reduce((sum, c) => sum + c.xpReward, 0)} XP earned
            today from challenges
          </p>
        </section>
      )}

      {/* Activity Heat Map */}
      <section>
        <h2 className="text-lg font-bold text-foreground mb-4">
          Activity Overview
        </h2>
        <ActivityHeatmap />
      </section>

      {/* How it works */}
      <section className="rounded-2xl border border-border/30 bg-card/40 p-6">
        <h3 className="text-sm font-bold text-foreground mb-3">
          How Challenges Work
        </h3>
        <div className="grid gap-3 sm:grid-cols-3 text-xs text-muted">
          <div className="flex items-start gap-2">
            <Target size={14} className="text-accent shrink-0 mt-0.5" />
            <span>
              3 new daily challenges appear each day. Complete them by trading
              and journaling.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <Trophy size={14} className="text-amber-400 shrink-0 mt-0.5" />
            <span>
              Weekly challenges run Monday–Sunday with bigger XP rewards.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <Zap size={14} className="text-accent shrink-0 mt-0.5" />
            <span>
              Each challenge rewards XP. Level up to unlock cosmetics and
              titles.
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

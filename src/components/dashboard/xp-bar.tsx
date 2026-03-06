"use client";

import { useLevel } from "@/lib/xp";
import { xpForLevel, MAX_LEVEL } from "@/lib/xp/types";

/**
 * XP progress bar showing current level, XP, and progress to next level.
 * Used on the dashboard home and achievements page.
 */
export function XPBar({ compact = false }: { compact?: boolean }) {
  const { level, totalXP, xpToNext, xpProgress, loading } = useLevel();

  if (loading) return null;

  const currentLevelXP = xpForLevel(level);
  const nextLevelXP = xpForLevel(level + 1);

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-accent">LVL {level}</span>
        </div>
        <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
          <div
            className="h-full rounded-full bg-accent transition-all duration-500"
            style={{ width: `${xpProgress}%` }}
          />
        </div>
        <span className="text-[10px] text-muted font-medium">
          {totalXP.toLocaleString()} XP
        </span>
      </div>
    );
  }

  return (
    <div
      className="glass rounded-2xl border border-border/50 p-5"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
            <span className="text-lg font-bold text-accent">{level}</span>
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Level {level}</p>
            <p className="text-[10px] text-muted">
              {totalXP.toLocaleString()} total XP
            </p>
          </div>
        </div>
        {level < MAX_LEVEL ? (
          <div className="text-right">
            <p className="text-xs font-semibold text-accent">
              {xpToNext.toLocaleString()} XP to next
            </p>
            <p className="text-[10px] text-muted">
              Level {level + 1} at {nextLevelXP.toLocaleString()} XP
            </p>
          </div>
        ) : (
          <div className="text-right">
            <p className="text-xs font-semibold text-accent">MAX LEVEL</p>
            <p className="text-[10px] text-muted">
              {totalXP.toLocaleString()} total XP
            </p>
          </div>
        )}
      </div>
      <div className="w-full h-2.5 rounded-full bg-border overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent to-accent-hover transition-all duration-700 ease-out"
          style={{ width: `${xpProgress}%` }}
        />
      </div>
    </div>
  );
}

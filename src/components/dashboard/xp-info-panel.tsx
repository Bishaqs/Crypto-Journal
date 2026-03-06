"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Zap } from "lucide-react";
import { useLevel } from "@/lib/xp";
import { XP_AMOUNTS, DAILY_XP_CAP } from "@/lib/xp/types";

const ACTIVITY_SOURCES = [
  { key: "trade_with_notes" as const, label: "Log a trade with notes" },
  { key: "trade_logged" as const, label: "Log a trade" },
  { key: "checkin" as const, label: "Daily check-in" },
  { key: "journal_entry" as const, label: "Journal entry" },
  { key: "behavioral_log" as const, label: "Behavioral log" },
  { key: "trade_plan" as const, label: "Create a trade plan" },
  { key: "weekly_review" as const, label: "Weekly review" },
];

const ACHIEVEMENT_XP = [
  { tier: "Bronze", xp: 50, color: "text-orange-400" },
  { tier: "Silver", xp: 100, color: "text-gray-300" },
  { tier: "Gold", xp: 200, color: "text-yellow-400" },
  { tier: "Diamond", xp: 500, color: "text-cyan-300" },
  { tier: "Legendary", xp: 1000, color: "text-amber-400" },
];

export function XPInfoPanel() {
  const [expanded, setExpanded] = useState(false);
  const { xpToday, dailyCapRemaining } = useLevel();

  const dailyProgress = Math.min(100, (xpToday / DAILY_XP_CAP) * 100);

  return (
    <div className="mt-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-xs text-muted hover:text-foreground transition-colors group"
      >
        <Zap size={12} className="text-accent" />
        <span>How do you earn XP?</span>
        {expanded ? (
          <ChevronUp size={12} className="opacity-50 group-hover:opacity-100" />
        ) : (
          <ChevronDown size={12} className="opacity-50 group-hover:opacity-100" />
        )}
      </button>

      {expanded && (
        <div
          className="mt-3 glass rounded-2xl border border-border/50 p-5"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          {/* Daily progress */}
          <div className="mb-5 p-3 rounded-xl bg-accent/5 border border-accent/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-foreground">Today&apos;s XP</span>
              <span className="text-xs font-bold text-accent">
                {xpToday} / {DAILY_XP_CAP}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-border overflow-hidden">
              <div
                className="h-full rounded-full bg-accent transition-all duration-500"
                style={{ width: `${dailyProgress}%` }}
              />
            </div>
            {dailyCapRemaining > 0 ? (
              <p className="text-[10px] text-muted mt-1.5">
                {dailyCapRemaining} XP remaining today from activities
              </p>
            ) : (
              <p className="text-[10px] text-accent mt-1.5">
                Daily cap reached! Achievement XP is still uncapped.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Activity XP */}
            <div>
              <h4 className="text-xs font-bold text-foreground mb-3 uppercase tracking-wider">
                Activity XP
                <span className="ml-2 text-[10px] font-normal text-muted normal-case tracking-normal">
                  (capped at {DAILY_XP_CAP}/day)
                </span>
              </h4>
              <div className="space-y-2">
                {ACTIVITY_SOURCES.map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-xs text-muted">{label}</span>
                    <span className="text-xs font-semibold text-accent">
                      +{XP_AMOUNTS[key]}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between border-t border-border/30 pt-2 mt-2">
                  <span className="text-xs text-muted">Streak bonus</span>
                  <span className="text-xs font-semibold text-accent">
                    +streak days x 2
                  </span>
                </div>
              </div>
            </div>

            {/* Achievement XP */}
            <div>
              <h4 className="text-xs font-bold text-foreground mb-3 uppercase tracking-wider">
                Achievement XP
                <span className="ml-2 text-[10px] font-normal text-muted normal-case tracking-normal">
                  (uncapped)
                </span>
              </h4>
              <div className="space-y-2">
                {ACHIEVEMENT_XP.map(({ tier, xp, color }) => (
                  <div key={tier} className="flex items-center justify-between">
                    <span className={`text-xs font-medium ${color}`}>{tier}</span>
                    <span className="text-xs font-semibold text-accent">+{xp}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between border-t border-border/30 pt-2 mt-2">
                  <span className="text-xs text-muted">Single-tier</span>
                  <span className="text-xs font-semibold text-accent">+75</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

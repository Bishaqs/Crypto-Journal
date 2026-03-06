"use client";

import { useState } from "react";
import { Trophy, Star, Check, Gift } from "lucide-react";
import {
  useAchievements,
  getProgressValue,
  isUnlocked,
  ACHIEVEMENTS,
  ACHIEVEMENT_MAP,
  CATEGORY_META,
  TIER_META,
} from "@/lib/achievements";
import type { AchievementCategory, AchievementTier } from "@/lib/achievements";
import { useLevel } from "@/lib/xp";
import { XPBar } from "@/components/dashboard/xp-bar";
import { XPInfoPanel } from "@/components/dashboard/xp-info-panel";
import { CosmeticGrid } from "@/components/cosmetics/cosmetic-grid";

const CATEGORIES: AchievementCategory[] = [
  "consistency",
  "risk",
  "psychology",
  "analysis",
  "milestones",
];

const SINGLE_TIER_THRESHOLDS: Record<string, number> = {
  total_trades: 1,
  total_trades_100: 100,
  total_trades_1000: 1000,
  total_trades_5000: 5000,
  account_age_365: 365,
  account_age_730: 730,
  account_age_1095: 1095,
  journal_entries_500: 500,
  journal_entries_10000: 10000,
  current_streak_1000: 1000,
  total_checkins_500: 500,
  player_level_50: 50,
  player_level_100: 100,
  player_level_150: 150,
  player_level_200: 200,
  player_level_300: 300,
  player_level_500: 500,
  all_achievements_maxed: 1,
  early_checkins: 50,
  unique_emotions_logged: 10,
  consistent_setup_usage: 50,
  journal_with_gratitude: 50,
  consecutive_within_size_rules: 100,
};

export default function AchievementsPage() {
  const { progress, unlocked, activeBadge, setActiveBadge, loading } =
    useAchievements();
  const { level } = useLevel();
  const [selectedCategory, setSelectedCategory] =
    useState<AchievementCategory | "all">("all");
  const [activeTab, setActiveTab] = useState<"achievements" | "rewards">(
    "achievements",
  );

  const totalUnlocked = new Set(unlocked.map((u) => u.achievement_id)).size;
  const totalAchievements = ACHIEVEMENTS.length;

  const filtered =
    selectedCategory === "all"
      ? ACHIEVEMENTS
      : ACHIEVEMENTS.filter((a) => a.category === selectedCategory);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-accent">
          Loading achievements...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto">
      {/* Header with level + XP */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Trophy size={24} className="text-accent" />
            Achievements & Rewards
          </h1>
          <p className="text-sm text-muted mt-0.5">
            Level {level} — {totalUnlocked} of {totalAchievements} achievements
            unlocked
          </p>
        </div>

        {activeBadge && ACHIEVEMENT_MAP[activeBadge.achievement_id] && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent/10 border border-accent/20">
            <span className="text-lg">
              {ACHIEVEMENT_MAP[activeBadge.achievement_id].emoji}
            </span>
            <div>
              <p className="text-[10px] text-muted uppercase tracking-wider font-semibold">
                Active Badge
              </p>
              <p className="text-xs font-bold text-foreground">
                {ACHIEVEMENT_MAP[activeBadge.achievement_id].title}
                {activeBadge.tier && (
                  <span
                    className={`ml-1.5 ${TIER_META[activeBadge.tier as AchievementTier]?.color}`}
                  >
                    ({TIER_META[activeBadge.tier as AchievementTier]?.label})
                  </span>
                )}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* XP bar */}
      <div className="mb-6">
        <XPBar />
        <XPInfoPanel />
      </div>

      {/* Tab switch */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("achievements")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
            activeTab === "achievements"
              ? "bg-accent/10 border-accent/30 text-accent"
              : "bg-background border-border text-muted hover:text-foreground"
          }`}
        >
          <Trophy size={16} />
          Achievements
        </button>
        <button
          onClick={() => setActiveTab("rewards")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
            activeTab === "rewards"
              ? "bg-accent/10 border-accent/30 text-accent"
              : "bg-background border-border text-muted hover:text-foreground"
          }`}
        >
          <Gift size={16} />
          Rewards
        </button>
      </div>

      {activeTab === "rewards" ? (
        <CosmeticGrid />
      ) : (
        <>
          {/* Overall progress bar */}
          <div
            className="glass rounded-2xl border border-border/50 p-5 mb-6"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                Overall Progress
              </span>
              <span className="text-sm font-bold text-accent">
                {Math.round((totalUnlocked / totalAchievements) * 100)}%
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-border overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent to-accent-hover transition-all duration-500"
                style={{
                  width: `${(totalUnlocked / totalAchievements) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Category skill radar */}
          <div className="grid grid-cols-5 gap-3 mb-6">
            {CATEGORIES.map((cat) => {
              const meta = CATEGORY_META[cat];
              const catAchievements = ACHIEVEMENTS.filter(
                (a) => a.category === cat,
              );
              const catUnlocked = new Set(
                unlocked
                  .filter((u) =>
                    catAchievements.some((a) => a.id === u.achievement_id),
                  )
                  .map((u) => u.achievement_id),
              ).size;

              return (
                <button
                  key={cat}
                  onClick={() =>
                    setSelectedCategory(
                      selectedCategory === cat ? "all" : cat,
                    )
                  }
                  className={`glass rounded-2xl border p-4 text-center transition-all ${
                    selectedCategory === cat
                      ? "border-accent/40 bg-accent/5"
                      : "border-border/50 hover:border-accent/20"
                  }`}
                  style={{ boxShadow: "var(--shadow-card)" }}
                >
                  <div className="text-2xl mb-1">{meta.emoji}</div>
                  <p className="text-xs font-semibold text-foreground">
                    {meta.label}
                  </p>
                  <p className="text-[10px] text-muted mt-0.5">
                    {catUnlocked}/{catAchievements.length}
                  </p>
                  <div className="w-full h-1 rounded-full bg-border mt-2 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent transition-all"
                      style={{
                        width: `${
                          catAchievements.length > 0
                            ? (catUnlocked / catAchievements.length) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Achievement grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((achievement) => {
              const unlockStatus = isUnlocked(achievement.id, unlocked);
              const progressValue = getProgressValue(
                achievement.id,
                progress,
              );
              const catMeta = CATEGORY_META[achievement.category];

              let highestTier: AchievementTier | null = null;
              if (achievement.tiers) {
                const tiers: AchievementTier[] = [
                  "legendary",
                  "diamond",
                  "gold",
                  "silver",
                  "bronze",
                ];
                for (const t of tiers) {
                  if (
                    unlocked.some(
                      (u) =>
                        u.achievement_id === achievement.id &&
                        u.tier === t,
                    )
                  ) {
                    highestTier = t;
                    break;
                  }
                }
              }

              let nextThreshold = 0;
              let currentTierThreshold = 0;
              if (achievement.tiers) {
                for (const t of achievement.tiers) {
                  if (progressValue < t.threshold) {
                    nextThreshold = t.threshold;
                    break;
                  }
                  currentTierThreshold = t.threshold;
                }
                if (
                  nextThreshold === 0 &&
                  achievement.tiers.length > 0
                ) {
                  nextThreshold =
                    achievement.tiers[achievement.tiers.length - 1]
                      .threshold;
                  currentTierThreshold = nextThreshold;
                }
              } else {
                nextThreshold =
                  SINGLE_TIER_THRESHOLDS[achievement.metric] ?? 1;
              }

              const progressPercent =
                nextThreshold > 0
                  ? Math.min(
                      100,
                      ((progressValue - currentTierThreshold) /
                        Math.max(
                          1,
                          nextThreshold - currentTierThreshold,
                        )) *
                        100,
                    )
                  : 0;

              const tierMeta = highestTier
                ? TIER_META[highestTier]
                : null;
              const isActive =
                activeBadge?.achievement_id === achievement.id;

              return (
                <div
                  key={achievement.id}
                  className={`glass rounded-2xl border p-5 transition-all ${
                    unlockStatus
                      ? tierMeta
                        ? `${tierMeta.borderColor} ${tierMeta.bgColor}`
                        : "border-accent/30 bg-accent/5"
                      : "border-border/50 opacity-70"
                  }`}
                  style={{ boxShadow: "var(--shadow-card)" }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`text-3xl ${unlockStatus ? "" : "grayscale opacity-40"}`}
                    >
                      {achievement.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-bold text-foreground truncate">
                          {achievement.title}
                        </p>
                        {unlockStatus && (
                          <Check
                            size={14}
                            className="text-win shrink-0"
                          />
                        )}
                      </div>
                      <p className="text-xs text-muted mt-0.5">
                        {achievement.description}
                      </p>
                      <span
                        className={`text-[10px] font-semibold ${catMeta.color}`}
                      >
                        {catMeta.emoji} {catMeta.label}
                      </span>
                    </div>
                  </div>

                  {achievement.tiers && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {achievement.tiers.map((t) => {
                        const tm = TIER_META[t.tier];
                        const isEarned = unlocked.some(
                          (u) =>
                            u.achievement_id === achievement.id &&
                            u.tier === t.tier,
                        );
                        return (
                          <div
                            key={t.tier}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold border transition-all ${
                              isEarned
                                ? `${tm.bgColor} ${tm.borderColor} ${tm.color}`
                                : "bg-border/30 border-border/50 text-muted/40"
                            }`}
                            title={t.label}
                          >
                            {isEarned && <Star size={8} />}
                            {tm.label}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-muted">
                        {Math.round(progressValue)}/{nextThreshold}
                      </span>
                      {unlockStatus &&
                        progressValue >= nextThreshold && (
                          <span className="text-[10px] font-bold text-win">
                            Complete
                          </span>
                        )}
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-border overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          tierMeta
                            ? `bg-gradient-to-r ${
                                highestTier === "legendary"
                                  ? "from-amber-400 to-amber-200"
                                  : highestTier === "diamond"
                                    ? "from-cyan-400 to-cyan-200"
                                    : highestTier === "gold"
                                      ? "from-yellow-500 to-yellow-300"
                                      : highestTier === "silver"
                                        ? "from-gray-400 to-gray-300"
                                        : "from-orange-500 to-orange-400"
                              }`
                            : "bg-accent"
                        }`}
                        style={{
                          width: `${unlockStatus && !achievement.tiers ? 100 : Math.max(progressPercent, 0)}%`,
                        }}
                      />
                    </div>
                  </div>

                  {unlockStatus && (
                    <button
                      onClick={() =>
                        setActiveBadge(achievement.id, highestTier)
                      }
                      className={`mt-3 w-full py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                        isActive
                          ? "bg-accent/20 text-accent border border-accent/30"
                          : "bg-surface-hover text-muted hover:text-foreground border border-border"
                      }`}
                    >
                      {isActive ? "Active Badge" : "Set as Badge"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

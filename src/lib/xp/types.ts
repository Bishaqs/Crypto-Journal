/**
 * XP & Level system types and constants.
 *
 * XP is earned through journaling activity and achievement unlocks.
 * Daily activity XP is capped at 300 to prevent gaming.
 * Achievement XP is uncapped.
 */

export type XPSource =
  | "trade_logged"
  | "trade_with_notes"
  | "checkin"
  | "behavioral_log"
  | "journal_entry"
  | "trade_plan"
  | "weekly_review"
  | "streak_bonus"
  | "challenge_completed"
  | "achievement_bronze"
  | "achievement_silver"
  | "achievement_gold"
  | "achievement_diamond"
  | "achievement_legendary"
  | "achievement_single"
  | "onboarding_bonus"
  | "lesson_completed"
  | "course_completed";

export type XPEvent = {
  id: string;
  user_id: string;
  source: XPSource;
  source_id: string | null;
  xp_amount: number;
  created_at: string;
};

export type UserLevel = {
  user_id: string;
  total_xp: number;
  current_level: number;
  xp_today: number;
  today_date: string;
  updated_at: string;
};

/** Base XP amounts per source. streak_bonus is calculated dynamically. */
export const XP_AMOUNTS: Record<XPSource, number> = {
  trade_logged: 5,
  trade_with_notes: 15,
  checkin: 20,
  behavioral_log: 10,
  journal_entry: 15,
  trade_plan: 10,
  weekly_review: 50,
  streak_bonus: 0, // calculated: streak_days * 2
  challenge_completed: 0, // uses customAmount from challenge definition
  achievement_bronze: 50,
  achievement_silver: 100,
  achievement_gold: 200,
  achievement_diamond: 500,
  achievement_legendary: 1000,
  achievement_single: 75,
  onboarding_bonus: 0, // uses customAmount based on experience level
  lesson_completed: 0, // uses customAmount from lesson definition
  course_completed: 0, // uses customAmount (bonus for finishing all lessons)
};

/** Sources that count toward the daily XP cap */
export const CAPPED_SOURCES: XPSource[] = [
  "trade_logged",
  "trade_with_notes",
  "checkin",
  "behavioral_log",
  "journal_entry",
  "trade_plan",
  "weekly_review",
  "streak_bonus",
  "lesson_completed",
  "course_completed",
];

export const DAILY_XP_CAP = 300;
export const MAX_LEVEL = 500;

/** XP required to reach a given level. Level 1 = 0 XP. */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.floor(100 * Math.pow(level, 1.5));
}

/** Calculate level from total XP */
export function levelFromXP(totalXP: number): number {
  let level = 1;
  while (level < MAX_LEVEL && totalXP >= xpForLevel(level + 1)) {
    level++;
  }
  return level;
}

/** XP needed to go from current level to the next level */
export function xpToNextLevel(currentLevel: number, totalXP: number): number {
  if (currentLevel >= MAX_LEVEL) return 0;
  return xpForLevel(currentLevel + 1) - totalXP;
}

/** Progress percentage within the current level (0-100) */
export function levelProgress(currentLevel: number, totalXP: number): number {
  if (currentLevel >= MAX_LEVEL) return 100;
  const currentLevelXP = xpForLevel(currentLevel);
  const nextLevelXP = xpForLevel(currentLevel + 1);
  const range = nextLevelXP - currentLevelXP;
  if (range <= 0) return 100;
  return Math.min(100, ((totalXP - currentLevelXP) / range) * 100);
}

/**
 * XP engine — awards XP and manages level progression.
 *
 * Call awardXP() after trades, checkins, journal entries, etc.
 * The engine enforces the daily cap for activity sources.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  type XPSource,
  type UserLevel,
  XP_AMOUNTS,
  CAPPED_SOURCES,
  DAILY_XP_CAP,
  levelFromXP,
} from "./types";

type AwardResult = {
  xpAwarded: number;
  totalXP: number;
  newLevel: number;
  previousLevel: number;
  leveledUp: boolean;
};

/**
 * Award XP to a user. Enforces daily cap for activity sources.
 * Returns the XP actually awarded (may be less than base if cap is hit).
 */
export async function awardXP(
  supabase: SupabaseClient,
  userId: string,
  source: XPSource,
  sourceId?: string,
  customAmount?: number,
): Promise<AwardResult> {
  const baseAmount = customAmount ?? XP_AMOUNTS[source];
  if (baseAmount <= 0) {
    return { xpAwarded: 0, totalXP: 0, newLevel: 1, previousLevel: 1, leveledUp: false };
  }

  // Get or create user level row
  let userLevel = await getUserLevel(supabase, userId);

  const today = new Date().toISOString().split("T")[0];
  const isCapped = CAPPED_SOURCES.includes(source);

  // Reset daily counter if it's a new day
  let xpToday = userLevel.xp_today;
  if (userLevel.today_date !== today) {
    xpToday = 0;
  }

  // Calculate actual XP to award (respecting daily cap for activity sources)
  let xpToAward = baseAmount;
  if (isCapped) {
    const remaining = Math.max(0, DAILY_XP_CAP - xpToday);
    xpToAward = Math.min(xpToAward, remaining);
  }

  if (xpToAward <= 0) {
    return {
      xpAwarded: 0,
      totalXP: userLevel.total_xp,
      newLevel: userLevel.current_level,
      previousLevel: userLevel.current_level,
      leveledUp: false,
    };
  }

  // Insert XP event
  await supabase.from("user_xp_events").insert({
    user_id: userId,
    source,
    source_id: sourceId ?? null,
    xp_amount: xpToAward,
  });

  // Update user level
  const previousLevel = userLevel.current_level;
  const newTotalXP = userLevel.total_xp + xpToAward;
  const newLevel = levelFromXP(newTotalXP);
  const newXpToday = isCapped ? xpToday + xpToAward : xpToday;

  await supabase.from("user_levels").upsert({
    user_id: userId,
    total_xp: newTotalXP,
    current_level: newLevel,
    xp_today: newXpToday,
    today_date: today,
    updated_at: new Date().toISOString(),
  });

  return {
    xpAwarded: xpToAward,
    totalXP: newTotalXP,
    newLevel,
    previousLevel,
    leveledUp: newLevel > previousLevel,
  };
}

/**
 * Award XP for an achievement unlock based on its tier.
 */
export async function awardAchievementXP(
  supabase: SupabaseClient,
  userId: string,
  achievementId: string,
  tier: string | null,
): Promise<AwardResult> {
  let source: XPSource;
  if (!tier) {
    source = "achievement_single";
  } else {
    switch (tier) {
      case "bronze": source = "achievement_bronze"; break;
      case "silver": source = "achievement_silver"; break;
      case "gold": source = "achievement_gold"; break;
      case "diamond": source = "achievement_diamond"; break;
      case "legendary": source = "achievement_legendary"; break;
      default: source = "achievement_single";
    }
  }
  return awardXP(supabase, userId, source, `${achievementId}:${tier ?? "single"}`);
}

/** Get or create a user_levels row */
async function getUserLevel(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserLevel> {
  const { data } = await supabase
    .from("user_levels")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (data) return data as UserLevel;

  // Create default row
  const today = new Date().toISOString().split("T")[0];
  const defaultLevel: Omit<UserLevel, "updated_at"> & { updated_at: string } = {
    user_id: userId,
    total_xp: 0,
    current_level: 1,
    xp_today: 0,
    today_date: today,
    updated_at: new Date().toISOString(),
  };

  await supabase.from("user_levels").upsert(defaultLevel);

  return defaultLevel as UserLevel;
}

/** Recalculate level from total XP (useful for backfill/repair) */
export async function recalculateLevel(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserLevel> {
  // Sum all XP events
  const { data: events } = await supabase
    .from("user_xp_events")
    .select("xp_amount")
    .eq("user_id", userId);

  const totalXP = (events ?? []).reduce(
    (sum, e) => sum + (e.xp_amount ?? 0),
    0,
  );
  const level = levelFromXP(totalXP);
  const today = new Date().toISOString().split("T")[0];

  // Sum today's capped XP
  const todayStart = `${today}T00:00:00.000Z`;
  const { data: todayEvents } = await supabase
    .from("user_xp_events")
    .select("xp_amount, source")
    .eq("user_id", userId)
    .gte("created_at", todayStart);

  const cappedSources = new Set(CAPPED_SOURCES);
  const xpToday = (todayEvents ?? [])
    .filter((e) => cappedSources.has(e.source as XPSource))
    .reduce((sum, e) => sum + (e.xp_amount ?? 0), 0);

  const updated: UserLevel = {
    user_id: userId,
    total_xp: totalXP,
    current_level: level,
    xp_today: xpToday,
    today_date: today,
    updated_at: new Date().toISOString(),
  };

  await supabase.from("user_levels").upsert(updated);
  return updated;
}

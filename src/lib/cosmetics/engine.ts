/**
 * Cosmetics engine — checks unlock conditions and manages inventory/equip.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { CosmeticDefinition, CosmeticType, UnlockCondition } from "./types";
import type { AchievementTier } from "@/lib/achievements/definitions";

const TIER_ORDER: AchievementTier[] = ["bronze", "silver", "gold", "diamond", "legendary"];

function tierIndex(tier: string): number {
  return TIER_ORDER.indexOf(tier as AchievementTier);
}

/**
 * Evaluate a single unlock condition against current user state.
 */
function isConditionMet(
  condition: UnlockCondition,
  level: number,
  unlockedAchievements: { achievement_id: string; tier: string | null }[],
  achievementsByCategory: Map<string, string[]>,
): boolean {
  switch (condition.type) {
    case "level":
      return level >= condition.value;

    case "achievement":
      return unlockedAchievements.some(
        (u) => u.achievement_id === condition.id && u.tier === condition.tier,
      );

    case "achievement_category": {
      const categoryAchievementIds = achievementsByCategory.get(condition.category) ?? [];
      if (categoryAchievementIds.length === 0) return false;
      const minTierIdx = tierIndex(condition.min_tier);
      return categoryAchievementIds.every((id) =>
        unlockedAchievements.some((u) => {
          if (u.achievement_id !== id) return false;
          if (u.tier === null) return true; // single-tier = fully unlocked
          return tierIndex(u.tier) >= minTierIdx;
        }),
      );
    }

    case "special":
      if (condition.id === "completionist") {
        return unlockedAchievements.some(
          (u) => u.achievement_id === "completionist",
        );
      }
      return false;
  }
}

/**
 * Check all cosmetic definitions against current user state.
 * Returns IDs of cosmetics the user qualifies for but doesn't own yet.
 */
export async function checkCosmeticUnlocks(
  supabase: SupabaseClient,
  userId: string,
  level: number,
  unlockedAchievements: { achievement_id: string; tier: string | null }[],
): Promise<string[]> {
  // Fetch all cosmetic definitions
  const { data: definitions } = await supabase
    .from("cosmetic_definitions")
    .select("*");

  if (!definitions || definitions.length === 0) return [];

  // Fetch already-owned cosmetics
  const { data: owned } = await supabase
    .from("user_cosmetics")
    .select("cosmetic_id")
    .eq("user_id", userId);

  const ownedSet = new Set((owned ?? []).map((o) => o.cosmetic_id));

  // Build category → achievement_id map from definitions
  const { ACHIEVEMENTS } = await import("@/lib/achievements/definitions");
  const achievementsByCategory = new Map<string, string[]>();
  for (const a of ACHIEVEMENTS) {
    const existing = achievementsByCategory.get(a.category) ?? [];
    existing.push(a.id);
    achievementsByCategory.set(a.category, existing);
  }

  const newUnlocks: string[] = [];

  for (const def of definitions as CosmeticDefinition[]) {
    if (ownedSet.has(def.id)) continue;

    const met = isConditionMet(
      def.unlock_condition,
      level,
      unlockedAchievements,
      achievementsByCategory,
    );

    if (met) {
      newUnlocks.push(def.id);
    }
  }

  return newUnlocks;
}

/**
 * Award a cosmetic to a user (insert into user_cosmetics).
 */
export async function awardCosmetic(
  supabase: SupabaseClient,
  userId: string,
  cosmeticId: string,
): Promise<void> {
  await supabase.from("user_cosmetics").upsert(
    { user_id: userId, cosmetic_id: cosmeticId },
    { onConflict: "user_id,cosmetic_id" },
  );
}

/**
 * Equip a cosmetic in a slot.
 */
export async function equipCosmetic(
  supabase: SupabaseClient,
  userId: string,
  cosmeticType: CosmeticType,
  cosmeticId: string,
): Promise<void> {
  await supabase.from("user_equipped_cosmetics").upsert(
    {
      user_id: userId,
      cosmetic_type: cosmeticType,
      cosmetic_id: cosmeticId,
    },
    { onConflict: "user_id,cosmetic_type" },
  );
}

/**
 * Unequip a cosmetic from a slot.
 */
export async function unequipCosmetic(
  supabase: SupabaseClient,
  userId: string,
  cosmeticType: CosmeticType,
): Promise<void> {
  await supabase
    .from("user_equipped_cosmetics")
    .delete()
    .eq("user_id", userId)
    .eq("cosmetic_type", cosmeticType);
}

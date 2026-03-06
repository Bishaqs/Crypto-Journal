// Cosmetic system types for the Stargate reward system

export type CosmeticType =
  | "avatar_frame"
  | "banner"
  | "title_badge"
  | "sidebar_flair"
  | "avatar_icon"
  | "theme_accent";

export type CosmeticRarity =
  | "common"
  | "uncommon"
  | "rare"
  | "epic"
  | "legendary";

export type UnlockCondition =
  | { type: "level"; value: number }
  | { type: "achievement"; id: string; tier: string }
  | { type: "achievement_category"; category: string; min_tier: string }
  | { type: "special"; id: string };

export type CosmeticDefinition = {
  id: string;
  type: CosmeticType;
  name: string;
  description: string | null;
  rarity: CosmeticRarity;
  unlock_condition: UnlockCondition;
  css_class: string | null;
  created_at: string;
};

export type UserCosmetic = {
  cosmetic_id: string;
  earned_at: string;
};

export type EquippedCosmetics = {
  avatar_frame: string | null;
  banner: string | null;
  title_badge: string | null;
  sidebar_flair: string | null;
  avatar_icon: string | null;
  theme_accent: string | null;
};

/** Row shape from the leaderboard_view materialized view */
export type LeaderboardEntry = {
  user_id: string;
  display_name: string;
  avatar_frame: string | null;
  banner: string | null;
  title_badge: string | null;
  avatar_icon: string | null;
  theme_accent: string | null;
  current_level: number;
  total_xp: number;
  current_streak: number;
  longest_streak: number;
  achievement_count: number;
  active_badge: string | null;
  active_tier: string | null;
};

/** User profile row */
export type UserProfile = {
  user_id: string;
  display_name: string;
  is_public: boolean;
  show_level: boolean;
  show_achievements: boolean;
  show_streak: boolean;
  avatar_frame: string | null;
  banner: string | null;
  title_badge: string | null;
  avatar_icon: string | null;
  sidebar_flair: string | null;
  theme_accent: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * Daily & Weekly Challenge definitions.
 *
 * Challenges rotate daily from this pool. 3 daily challenges offered per day.
 * Weekly challenges run Monday-Sunday.
 *
 * GOLDEN RULE: Gamify the PROCESS, never the OUTCOME.
 * All challenges reward journaling discipline, risk management, and self-awareness.
 * Never reward trade frequency, profit, or trade execution.
 */

export type ChallengeType = "daily" | "weekly";

export type ChallengeCategory =
  | "journaling"
  | "risk"
  | "learning"
  | "psychology";

export type ChallengeDefinition = {
  id: string;
  type: ChallengeType;
  category: ChallengeCategory;
  title: string;
  description: string;
  emoji: string;
  /** XP reward on completion */
  xpReward: number;
  /** Metric key used to check completion */
  metric: string;
  /** Target value the metric must reach */
  target: number;
};

// ── Daily Challenges (pool of ~20, 3 offered per day) ──────────────────

export const DAILY_CHALLENGES: ChallengeDefinition[] = [
  // Journaling
  {
    id: "quick_draw",
    type: "daily",
    category: "journaling",
    title: "Quick Draw",
    description: "Log at least 1 trade today",
    emoji: "🎯",
    xpReward: 25,
    metric: "trades_logged_today",
    target: 1,
  },
  {
    id: "storyteller",
    type: "daily",
    category: "journaling",
    title: "Storyteller",
    description: "Write trade notes on at least 1 trade today",
    emoji: "📝",
    xpReward: 25,
    metric: "trades_with_notes_today",
    target: 1,
  },
  {
    id: "snapshot_pro",
    type: "daily",
    category: "journaling",
    title: "Snapshot Pro",
    description: "Attach a chart screenshot to a trade",
    emoji: "📸",
    xpReward: 25,
    metric: "trades_with_screenshots_today",
    target: 1,
  },
  {
    id: "pre_game",
    type: "daily",
    category: "journaling",
    title: "Pre-Game",
    description: "Complete your daily check-in before trading",
    emoji: "☀️",
    xpReward: 25,
    metric: "checkin_completed_today",
    target: 1,
  },
  {
    id: "tag_master",
    type: "daily",
    category: "journaling",
    title: "Tag Master",
    description: "Use at least 2 different tags on your trades today",
    emoji: "🏷️",
    xpReward: 25,
    metric: "unique_tags_today",
    target: 2,
  },
  {
    id: "triple_entry",
    type: "daily",
    category: "journaling",
    title: "Triple Entry",
    description: "Log at least 3 trades today",
    emoji: "3️⃣",
    xpReward: 25,
    metric: "trades_logged_today",
    target: 3,
  },
  {
    id: "detail_oriented",
    type: "daily",
    category: "journaling",
    title: "Detail Oriented",
    description: "Fill in all fields on at least 1 trade (notes, emotion, setup)",
    emoji: "🔍",
    xpReward: 25,
    metric: "complete_trades_today",
    target: 1,
  },

  // Risk Management
  {
    id: "risk_disciple",
    type: "daily",
    category: "risk",
    title: "Risk Disciple",
    description: "Log a trade with a stop-loss set",
    emoji: "🛡️",
    xpReward: 25,
    metric: "trades_with_stop_loss_today",
    target: 1,
  },
  {
    id: "by_the_book",
    type: "daily",
    category: "risk",
    title: "By the Book",
    description: "Rate process score 7+ on all trades today",
    emoji: "📖",
    xpReward: 25,
    metric: "all_trades_high_process_today",
    target: 1,
  },
  {
    id: "position_check",
    type: "daily",
    category: "risk",
    title: "Position Check",
    description: "Log a trade with position size noted",
    emoji: "📐",
    xpReward: 25,
    metric: "trades_with_size_today",
    target: 1,
  },

  // Psychology
  {
    id: "mood_tracker",
    type: "daily",
    category: "psychology",
    title: "Mood Tracker",
    description: "Tag an emotion on at least 1 trade",
    emoji: "🧠",
    xpReward: 25,
    metric: "trades_with_emotion_today",
    target: 1,
  },
  {
    id: "post_mortem",
    type: "daily",
    category: "psychology",
    title: "Post-Mortem",
    description: "Write a behavioral log entry today",
    emoji: "💭",
    xpReward: 25,
    metric: "behavioral_logs_today",
    target: 1,
  },
  {
    id: "calm_trader",
    type: "daily",
    category: "psychology",
    title: "Calm Trader",
    description: "No revenge or FOMO trades detected today",
    emoji: "🧘",
    xpReward: 25,
    metric: "no_tilt_trades_today",
    target: 1,
  },

  // Learning
  {
    id: "study_hall",
    type: "daily",
    category: "learning",
    title: "Study Hall",
    description: "Review a past trade from your journal",
    emoji: "📚",
    xpReward: 25,
    metric: "journal_entries_today",
    target: 1,
  },
  {
    id: "market_recap",
    type: "daily",
    category: "learning",
    title: "Market Recap",
    description: "Write a journal entry about today's market",
    emoji: "📰",
    xpReward: 25,
    metric: "journal_entries_today",
    target: 1,
  },
  {
    id: "setup_scout",
    type: "daily",
    category: "learning",
    title: "Setup Scout",
    description: "Tag a setup/strategy on at least 1 trade",
    emoji: "🔭",
    xpReward: 25,
    metric: "trades_with_setup_today",
    target: 1,
  },
];

// ── Weekly Challenges (1-2 offered per week) ──────────────────────────

export const WEEKLY_CHALLENGES: ChallengeDefinition[] = [
  {
    id: "consistency_king",
    type: "weekly",
    category: "journaling",
    title: "Consistency King",
    description: "Log trades on at least 4 trading days this week",
    emoji: "👑",
    xpReward: 100,
    metric: "trading_days_this_week",
    target: 4,
  },
  {
    id: "review_week",
    type: "weekly",
    category: "journaling",
    title: "Review Week",
    description: "Write notes on at least 10 trades this week",
    emoji: "✍️",
    xpReward: 100,
    metric: "trades_with_notes_this_week",
    target: 10,
  },
  {
    id: "risk_manager",
    type: "weekly",
    category: "risk",
    title: "Risk Manager",
    description: "Set stop-losses on at least 5 trades this week",
    emoji: "🏰",
    xpReward: 100,
    metric: "trades_with_stop_loss_this_week",
    target: 5,
  },
  {
    id: "the_grinder",
    type: "weekly",
    category: "journaling",
    title: "The Grinder",
    description: "Complete all 3 daily challenges on at least 3 days",
    emoji: "⚡",
    xpReward: 150,
    metric: "days_all_dailies_completed",
    target: 3,
  },
  {
    id: "checkin_streak",
    type: "weekly",
    category: "psychology",
    title: "Check-In Champion",
    description: "Complete your daily check-in on at least 4 days",
    emoji: "🌅",
    xpReward: 100,
    metric: "checkins_this_week",
    target: 4,
  },
  {
    id: "emotion_analyst",
    type: "weekly",
    category: "psychology",
    title: "Emotion Analyst",
    description: "Tag emotions on at least 8 trades this week",
    emoji: "🎭",
    xpReward: 100,
    metric: "trades_with_emotion_this_week",
    target: 8,
  },
];

/** Build a lookup map by challenge ID */
export const CHALLENGE_MAP: Record<string, ChallengeDefinition> = {};
for (const c of [...DAILY_CHALLENGES, ...WEEKLY_CHALLENGES]) {
  CHALLENGE_MAP[c.id] = c;
}

/** Category display metadata */
export const CATEGORY_META: Record<
  ChallengeCategory,
  { label: string; color: string; bgColor: string }
> = {
  journaling: {
    label: "Journaling",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
  },
  risk: {
    label: "Risk Management",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
  },
  learning: {
    label: "Learning",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
  },
  psychology: {
    label: "Psychology",
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
  },
};

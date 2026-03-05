/**
 * Achievement definitions — all achievements, categories, tiers, and thresholds.
 *
 * Golden Rule: reward PROCESS, never reward P&L or trade volume.
 */

export type AchievementCategory =
  | "consistency"
  | "risk"
  | "psychology"
  | "analysis"
  | "milestones";

export type AchievementTier = "bronze" | "silver" | "gold" | "diamond";

export type AchievementDefinition = {
  id: string;
  category: AchievementCategory;
  title: string;
  description: string;
  emoji: string;
  /** Tiers with thresholds — null means single-tier (unlock once) */
  tiers: { tier: AchievementTier; threshold: number; label: string }[] | null;
  /** How to compute progress (the engine maps this to a query) */
  metric: string;
};

export const CATEGORY_META: Record<
  AchievementCategory,
  { label: string; emoji: string; color: string; description: string }
> = {
  consistency: {
    label: "Consistency",
    emoji: "🔥",
    color: "text-orange-400",
    description: "Journaling habits and daily discipline",
  },
  risk: {
    label: "Risk Management",
    emoji: "🛡️",
    color: "text-blue-400",
    description: "Discipline, position sizing, and loss control",
  },
  psychology: {
    label: "Psychology",
    emoji: "🧠",
    color: "text-purple-400",
    description: "Emotional awareness and mindful trading",
  },
  analysis: {
    label: "Analysis",
    emoji: "🔬",
    color: "text-emerald-400",
    description: "Learning habits and strategic thinking",
  },
  milestones: {
    label: "Milestones",
    emoji: "🏆",
    color: "text-amber-400",
    description: "Celebrating durability, not luck",
  },
};

export const TIER_META: Record<
  AchievementTier,
  { label: string; color: string; bgColor: string; borderColor: string }
> = {
  bronze: {
    label: "Bronze",
    color: "text-orange-600",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/30",
  },
  silver: {
    label: "Silver",
    color: "text-gray-400",
    bgColor: "bg-gray-400/10",
    borderColor: "border-gray-400/30",
  },
  gold: {
    label: "Gold",
    color: "text-yellow-400",
    bgColor: "bg-yellow-400/10",
    borderColor: "border-yellow-400/30",
  },
  diamond: {
    label: "Diamond",
    color: "text-cyan-300",
    bgColor: "bg-cyan-300/10",
    borderColor: "border-cyan-300/30",
  },
};

export const ACHIEVEMENTS: AchievementDefinition[] = [
  // ── Consistency ──────────────────────────────────────────────
  {
    id: "journal_streak",
    category: "consistency",
    title: "Chronicler",
    description: "Maintain a journaling streak",
    emoji: "📝",
    tiers: [
      { tier: "bronze", threshold: 7, label: "7-day streak" },
      { tier: "silver", threshold: 30, label: "30-day streak" },
      { tier: "gold", threshold: 90, label: "90-day streak" },
      { tier: "diamond", threshold: 365, label: "365-day streak" },
    ],
    metric: "current_streak",
  },
  {
    id: "first_entry",
    category: "consistency",
    title: "First Step",
    description: "Log your very first trade",
    emoji: "🚀",
    tiers: null,
    metric: "total_trades",
  },
  {
    id: "weekly_review",
    category: "consistency",
    title: "Weekly Reviewer",
    description: "Complete weekly reviews consistently",
    emoji: "📊",
    tiers: [
      { tier: "bronze", threshold: 4, label: "4 weekly reviews" },
      { tier: "silver", threshold: 12, label: "12 weekly reviews" },
      { tier: "gold", threshold: 26, label: "26 weekly reviews" },
      { tier: "diamond", threshold: 52, label: "52 weekly reviews" },
    ],
    metric: "weekly_reviews",
  },
  {
    id: "journal_losing_trades",
    category: "consistency",
    title: "No Excuses",
    description: "Journal trades even when they lose",
    emoji: "💪",
    tiers: [
      { tier: "bronze", threshold: 10, label: "10 losing trades journaled" },
      { tier: "silver", threshold: 50, label: "50 losing trades journaled" },
      { tier: "gold", threshold: 100, label: "100 losing trades journaled" },
    ],
    metric: "losing_trades_with_notes",
  },

  // ── Risk Management ──────────────────────────────────────────
  {
    id: "stop_loss_sentinel",
    category: "risk",
    title: "Stop-Loss Sentinel",
    description: "Always use stop-losses on your trades",
    emoji: "🛑",
    tiers: [
      { tier: "bronze", threshold: 10, label: "10 trades with stop-loss" },
      { tier: "silver", threshold: 50, label: "50 trades with stop-loss" },
      { tier: "gold", threshold: 100, label: "100 trades with stop-loss" },
    ],
    metric: "trades_with_stop_loss",
  },
  {
    id: "risk_controller",
    category: "risk",
    title: "Risk Controller",
    description: "Stay within your daily loss limit",
    emoji: "🎯",
    tiers: [
      { tier: "bronze", threshold: 7, label: "7 days within limit" },
      { tier: "silver", threshold: 30, label: "30 days within limit" },
      { tier: "gold", threshold: 90, label: "90 days within limit" },
    ],
    metric: "days_within_loss_limit",
  },
  {
    id: "process_master",
    category: "risk",
    title: "Process Master",
    description: "Maintain a high process score average",
    emoji: "⚡",
    tiers: [
      { tier: "bronze", threshold: 7, label: "Avg process score 7+" },
      { tier: "silver", threshold: 8, label: "Avg process score 8+" },
      { tier: "gold", threshold: 9, label: "Avg process score 9+" },
    ],
    metric: "avg_process_score",
  },

  // ── Psychology ───────────────────────────────────────────────
  {
    id: "mindful_trader",
    category: "psychology",
    title: "Mindful Trader",
    description: "Log emotions on your trades",
    emoji: "🧘",
    tiers: [
      { tier: "bronze", threshold: 10, label: "10 trades with emotion" },
      { tier: "silver", threshold: 50, label: "50 trades with emotion" },
      { tier: "gold", threshold: 100, label: "100 trades with emotion" },
      { tier: "diamond", threshold: 500, label: "500 trades with emotion" },
    ],
    metric: "trades_with_emotion",
  },
  {
    id: "tilt_proof",
    category: "psychology",
    title: "Tilt-Proof",
    description: "Avoid revenge trading after a loss",
    emoji: "🧊",
    tiers: [
      { tier: "bronze", threshold: 5, label: "5 cool-down periods honored" },
      { tier: "silver", threshold: 20, label: "20 cool-down periods honored" },
      { tier: "gold", threshold: 50, label: "50 cool-down periods honored" },
    ],
    metric: "cooldowns_honored",
  },
  {
    id: "walk_away",
    category: "psychology",
    title: "Walk Away",
    description: "Log a red traffic light and stop trading for the day",
    emoji: "🚶",
    tiers: [
      { tier: "bronze", threshold: 3, label: "3 red-light walkways" },
      { tier: "silver", threshold: 10, label: "10 red-light walkways" },
      { tier: "gold", threshold: 25, label: "25 red-light walkways" },
    ],
    metric: "red_light_walkways",
  },
  {
    id: "emotion_logger",
    category: "psychology",
    title: "Self-Aware",
    description: "Log your emotional state with the quick emotion FAB",
    emoji: "❤️",
    tiers: [
      { tier: "bronze", threshold: 10, label: "10 emotion logs" },
      { tier: "silver", threshold: 50, label: "50 emotion logs" },
      { tier: "gold", threshold: 100, label: "100 emotion logs" },
    ],
    metric: "behavioral_logs",
  },

  // ── Analysis ─────────────────────────────────────────────────
  {
    id: "setup_tracker",
    category: "analysis",
    title: "Setup Tracker",
    description: "Tag all your trades with a setup type",
    emoji: "🏷️",
    tiers: [
      { tier: "bronze", threshold: 10, label: "10 trades tagged" },
      { tier: "silver", threshold: 50, label: "50 trades tagged" },
      { tier: "gold", threshold: 100, label: "100 trades tagged" },
    ],
    metric: "trades_with_setup",
  },
  {
    id: "trade_planner",
    category: "analysis",
    title: "Trade Planner",
    description: "Create and follow trade plans",
    emoji: "📋",
    tiers: [
      { tier: "bronze", threshold: 5, label: "5 planned trades" },
      { tier: "silver", threshold: 25, label: "25 planned trades" },
      { tier: "gold", threshold: 50, label: "50 planned trades" },
    ],
    metric: "trades_on_plan",
  },
  {
    id: "note_taker",
    category: "analysis",
    title: "Note Taker",
    description: "Add notes to your trades for future reference",
    emoji: "✏️",
    tiers: [
      { tier: "bronze", threshold: 10, label: "10 trades with notes" },
      { tier: "silver", threshold: 50, label: "50 trades with notes" },
      { tier: "gold", threshold: 200, label: "200 trades with notes" },
    ],
    metric: "trades_with_notes",
  },

  // ── Milestones ───────────────────────────────────────────────
  {
    id: "century_club",
    category: "milestones",
    title: "Century Club",
    description: "Log 100 trades in your journal",
    emoji: "💯",
    tiers: null,
    metric: "total_trades_100",
  },
  {
    id: "one_year_in",
    category: "milestones",
    title: "One Year In",
    description: "Use Stargate for a full year",
    emoji: "🎂",
    tiers: null,
    metric: "account_age_365",
  },
  {
    id: "thousand_trades",
    category: "milestones",
    title: "Market Veteran",
    description: "Log 1,000 trades",
    emoji: "🎖️",
    tiers: null,
    metric: "total_trades_1000",
  },
  {
    id: "five_hundred_journal",
    category: "milestones",
    title: "Historian",
    description: "Write 500 journal entries",
    emoji: "📚",
    tiers: null,
    metric: "journal_entries_500",
  },
];

/** Quick lookup map */
export const ACHIEVEMENT_MAP = Object.fromEntries(
  ACHIEVEMENTS.map((a) => [a.id, a])
) as Record<string, AchievementDefinition>;

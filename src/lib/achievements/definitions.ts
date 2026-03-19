/**
 * Achievement definitions — all achievements, categories, tiers, and thresholds.
 *
 * Golden Rule: reward PROCESS, never reward P&L or trade volume.
 *
 * 57 total achievements across 5 categories.
 * Tiers: Bronze → Silver → Gold → Diamond → Legendary
 */

export type AchievementCategory =
  | "consistency"
  | "risk"
  | "psychology"
  | "analysis"
  | "milestones";

export type AchievementTier = "bronze" | "silver" | "gold" | "diamond" | "legendary";

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
  /** Hide from UI if metric calculation isn't implemented yet */
  hidden?: boolean;
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
  legendary: {
    label: "Legendary",
    color: "text-amber-300",
    bgColor: "bg-amber-400/10",
    borderColor: "border-amber-400/40",
  },
};

export const ACHIEVEMENTS: AchievementDefinition[] = [
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ── Consistency (12 achievements) ─────────────────────────────────
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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
  // ── NEW Consistency ────────────────────────────────────────────
  {
    id: "daily_checkin_streak",
    category: "consistency",
    title: "Sunrise Ritual",
    description: "Complete daily check-ins consistently",
    emoji: "🌅",
    tiers: [
      { tier: "bronze", threshold: 7, label: "7-day check-in streak" },
      { tier: "silver", threshold: 30, label: "30-day check-in streak" },
      { tier: "gold", threshold: 90, label: "90-day check-in streak" },
      { tier: "diamond", threshold: 180, label: "180-day check-in streak" },
      { tier: "legendary", threshold: 365, label: "365-day check-in streak" },
    ],
    metric: "checkin_streak",
  },
  {
    id: "trade_planner_streak",
    category: "consistency",
    title: "The Strategist",
    description: "Create a trade plan every day you trade",
    emoji: "♟️",
    tiers: [
      { tier: "bronze", threshold: 5, label: "5 trading days with plan" },
      { tier: "silver", threshold: 20, label: "20 trading days with plan" },
      { tier: "gold", threshold: 50, label: "50 trading days with plan" },
      { tier: "diamond", threshold: 100, label: "100 trading days with plan" },
    ],
    metric: "trading_days_with_plan",
  },
  {
    id: "weekend_reviewer",
    category: "consistency",
    title: "Weekend Warrior",
    description: "Review your trading week every weekend",
    emoji: "📅",
    tiers: [
      { tier: "bronze", threshold: 4, label: "4 weekend reviews" },
      { tier: "silver", threshold: 12, label: "12 weekend reviews" },
      { tier: "gold", threshold: 26, label: "26 weekend reviews" },
      { tier: "diamond", threshold: 52, label: "52 weekend reviews" },
      { tier: "legendary", threshold: 104, label: "104 weekend reviews (2 years)" },
    ],
    metric: "weekend_reviews",
  },
  {
    id: "multi_asset_logger",
    category: "consistency",
    title: "Diversified",
    description: "Log trades across multiple symbols",
    emoji: "🌐",
    tiers: [
      { tier: "bronze", threshold: 5, label: "5 unique symbols" },
      { tier: "silver", threshold: 15, label: "15 unique symbols" },
      { tier: "gold", threshold: 30, label: "30 unique symbols" },
      { tier: "diamond", threshold: 50, label: "50 unique symbols" },
    ],
    metric: "unique_symbols_traded",
  },
  {
    id: "month_perfect",
    category: "consistency",
    title: "Perfect Month",
    description: "Journal every single trading day in a calendar month",
    emoji: "⭐",
    tiers: [
      { tier: "bronze", threshold: 1, label: "1 perfect month" },
      { tier: "silver", threshold: 3, label: "3 perfect months" },
      { tier: "gold", threshold: 6, label: "6 perfect months" },
      { tier: "diamond", threshold: 12, label: "12 perfect months" },
    ],
    metric: "perfect_months",
  },
  {
    id: "early_bird",
    category: "consistency",
    title: "Early Bird",
    description: "Complete your daily check-in before market open 50 times",
    emoji: "🐦",
    tiers: null,
    metric: "early_checkins",
  },
  {
    id: "two_year_veteran",
    category: "consistency",
    title: "Two-Year Veteran",
    description: "Use Traverse for two full years",
    emoji: "🏅",
    tiers: null,
    metric: "account_age_730",
  },
  {
    id: "three_year_legend",
    category: "consistency",
    title: "Three-Year Legend",
    description: "Use Traverse for three full years",
    emoji: "👑",
    tiers: null,
    metric: "account_age_1095",
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ── Risk Management (10 achievements) ─────────────────────────────
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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
    hidden: true, // TODO: implement daily P&L limit tracking
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
  // ── NEW Risk Management ────────────────────────────────────────
  {
    id: "position_sizer",
    category: "risk",
    title: "Position Sizer",
    description: "Define position size before entering trades",
    emoji: "📏",
    tiers: [
      { tier: "bronze", threshold: 10, label: "10 trades sized" },
      { tier: "silver", threshold: 50, label: "50 trades sized" },
      { tier: "gold", threshold: 100, label: "100 trades sized" },
      { tier: "diamond", threshold: 250, label: "250 trades sized" },
    ],
    metric: "trades_with_position_size",
  },
  {
    id: "risk_reward_tracker",
    category: "risk",
    title: "R:R Disciplined",
    description: "Log your risk-reward ratio before entering",
    emoji: "🎯",
    tiers: [
      { tier: "bronze", threshold: 10, label: "10 trades with R:R" },
      { tier: "silver", threshold: 50, label: "50 trades with R:R" },
      { tier: "gold", threshold: 100, label: "100 trades with R:R" },
      { tier: "diamond", threshold: 200, label: "200 trades with R:R" },
    ],
    metric: "trades_with_rr_ratio",
  },
  {
    id: "loss_limit_master",
    category: "risk",
    title: "Loss Limit Master",
    description: "Respect your daily loss limit for an extended period",
    emoji: "🛡️",
    tiers: [
      { tier: "bronze", threshold: 30, label: "30 days within limit" },
      { tier: "silver", threshold: 90, label: "90 days within limit" },
      { tier: "gold", threshold: 180, label: "180 days within limit" },
      { tier: "diamond", threshold: 365, label: "365 days within limit" },
      { tier: "legendary", threshold: 730, label: "730 days within limit (2 years)" },
    ],
    metric: "consecutive_days_within_loss_limit",
    hidden: true, // TODO: implement consecutive loss limit tracking
  },
  {
    id: "max_drawdown_guardian",
    category: "risk",
    title: "Drawdown Guardian",
    description: "Keep max drawdown under your threshold for a month",
    emoji: "⚓",
    tiers: [
      { tier: "bronze", threshold: 1, label: "1 month under threshold" },
      { tier: "silver", threshold: 3, label: "3 months under threshold" },
      { tier: "gold", threshold: 6, label: "6 months under threshold" },
      { tier: "diamond", threshold: 12, label: "12 months under threshold" },
    ],
    metric: "months_under_drawdown_threshold",
    hidden: true, // TODO: implement drawdown threshold tracking
  },
  {
    id: "checklist_master",
    category: "risk",
    title: "Checklist Master",
    description: "Complete your trade checklist 100% on trades",
    emoji: "✅",
    tiers: [
      { tier: "bronze", threshold: 10, label: "10 full checklists" },
      { tier: "silver", threshold: 50, label: "50 full checklists" },
      { tier: "gold", threshold: 150, label: "150 full checklists" },
      { tier: "diamond", threshold: 300, label: "300 full checklists" },
    ],
    metric: "trades_with_full_checklist",
  },
  {
    id: "green_light_discipline",
    category: "risk",
    title: "Green Light Only",
    description: "Only trade on green traffic-light days",
    emoji: "🚦",
    tiers: [
      { tier: "bronze", threshold: 10, label: "10 green-only trading days" },
      { tier: "silver", threshold: 30, label: "30 green-only trading days" },
      { tier: "gold", threshold: 60, label: "60 green-only trading days" },
      { tier: "diamond", threshold: 100, label: "100 green-only trading days" },
    ],
    metric: "trades_on_green_days_only",
  },
  {
    id: "zero_overleverage",
    category: "risk",
    title: "Never Overleveraged",
    description: "Stay within position size rules for 100 consecutive trades",
    emoji: "🔒",
    tiers: null,
    metric: "consecutive_within_size_rules",
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ── Psychology (11 achievements) ──────────────────────────────────
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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
    hidden: true, // TODO: implement post-loss cooldown detection
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
  // ── NEW Psychology ─────────────────────────────────────────────
  {
    id: "emotion_diversity",
    category: "psychology",
    title: "Emotional Range",
    description: "Log 10 different emotions across your trades",
    emoji: "🌈",
    tiers: null,
    metric: "unique_emotions_logged",
  },
  {
    id: "post_loss_reflection",
    category: "psychology",
    title: "Post-Loss Reflector",
    description: "Write a reflection note after every losing trade",
    emoji: "🪞",
    tiers: [
      { tier: "bronze", threshold: 10, label: "10 post-loss reflections" },
      { tier: "silver", threshold: 30, label: "30 post-loss reflections" },
      { tier: "gold", threshold: 75, label: "75 post-loss reflections" },
      { tier: "diamond", threshold: 150, label: "150 post-loss reflections" },
    ],
    metric: "losing_trades_with_reflection",
  },
  {
    id: "confidence_calibrator",
    category: "psychology",
    title: "Confidence Calibrator",
    description: "Log your confidence level on trades consistently",
    emoji: "📊",
    tiers: [
      { tier: "bronze", threshold: 20, label: "20 trades with confidence" },
      { tier: "silver", threshold: 75, label: "75 trades with confidence" },
      { tier: "gold", threshold: 150, label: "150 trades with confidence" },
      { tier: "diamond", threshold: 300, label: "300 trades with confidence" },
    ],
    metric: "trades_with_confidence",
  },
  {
    id: "bias_spotter",
    category: "psychology",
    title: "Bias Spotter",
    description: "Identify and log cognitive biases in your behavioral logs",
    emoji: "👁️",
    tiers: [
      { tier: "bronze", threshold: 5, label: "5 bias identifications" },
      { tier: "silver", threshold: 20, label: "20 bias identifications" },
      { tier: "gold", threshold: 50, label: "50 bias identifications" },
      { tier: "diamond", threshold: 100, label: "100 bias identifications" },
    ],
    metric: "logs_with_biases_identified",
  },
  {
    id: "emotional_awareness_streak",
    category: "psychology",
    title: "Emotionally Consistent",
    description: "Log emotions on every trade for consecutive trading days",
    emoji: "🧠",
    tiers: [
      { tier: "bronze", threshold: 7, label: "7 consecutive days" },
      { tier: "silver", threshold: 30, label: "30 consecutive days" },
      { tier: "gold", threshold: 60, label: "60 consecutive days" },
      { tier: "diamond", threshold: 90, label: "90 consecutive days" },
    ],
    metric: "consecutive_trading_days_with_emotions",
  },
  {
    id: "calm_after_storm",
    category: "psychology",
    title: "Calm After the Storm",
    description: "Take a day off after 3 consecutive losing trades",
    emoji: "☮️",
    tiers: [
      { tier: "bronze", threshold: 3, label: "3 rest days taken" },
      { tier: "silver", threshold: 10, label: "10 rest days taken" },
      { tier: "gold", threshold: 25, label: "25 rest days taken" },
    ],
    metric: "rest_days_after_losing_streaks",
  },
  {
    id: "gratitude_journalist",
    category: "psychology",
    title: "Gratitude Journalist",
    description: "End 50 journal entries with what you learned",
    emoji: "🙏",
    tiers: null,
    metric: "journal_with_gratitude",
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ── Analysis (10 achievements) ────────────────────────────────────
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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
  // ── NEW Analysis ───────────────────────────────────────────────
  {
    id: "tag_master",
    category: "analysis",
    title: "Tag Master",
    description: "Create and use many different tags to categorize trades",
    emoji: "🏷️",
    tiers: [
      { tier: "bronze", threshold: 5, label: "5 unique tags" },
      { tier: "silver", threshold: 10, label: "10 unique tags" },
      { tier: "gold", threshold: 20, label: "20 unique tags" },
      { tier: "diamond", threshold: 30, label: "30 unique tags" },
    ],
    metric: "unique_tags_used",
  },
  {
    id: "multi_timeframe_analyst",
    category: "analysis",
    title: "Multi-Timeframe Analyst",
    description: "Log and tag your trades by timeframe",
    emoji: "🕐",
    tiers: [
      { tier: "bronze", threshold: 10, label: "10 timeframe-tagged trades" },
      { tier: "silver", threshold: 30, label: "30 timeframe-tagged trades" },
      { tier: "gold", threshold: 75, label: "75 timeframe-tagged trades" },
    ],
    metric: "trades_with_timeframe_tag",
  },
  {
    id: "playbook_builder",
    category: "analysis",
    title: "Playbook Builder",
    description: "Create entries in your trading playbook",
    emoji: "📖",
    tiers: [
      { tier: "bronze", threshold: 3, label: "3 playbook entries" },
      { tier: "silver", threshold: 10, label: "10 playbook entries" },
      { tier: "gold", threshold: 20, label: "20 playbook entries" },
      { tier: "diamond", threshold: 30, label: "30 playbook entries" },
    ],
    metric: "playbook_entries",
  },
  {
    id: "sector_analyst",
    category: "analysis",
    title: "Sector Analyst",
    description: "Trade and tag across multiple sectors",
    emoji: "📈",
    tiers: [
      { tier: "bronze", threshold: 3, label: "3 sectors" },
      { tier: "silver", threshold: 7, label: "7 sectors" },
      { tier: "gold", threshold: 12, label: "12 sectors" },
      { tier: "diamond", threshold: 20, label: "20 sectors" },
    ],
    metric: "unique_sectors_traded",
  },
  {
    id: "review_scholar",
    category: "analysis",
    title: "Review Scholar",
    description: "Add a detailed post-trade review to your trades",
    emoji: "🔍",
    tiers: [
      { tier: "bronze", threshold: 10, label: "10 reviews" },
      { tier: "silver", threshold: 50, label: "50 reviews" },
      { tier: "gold", threshold: 100, label: "100 reviews" },
      { tier: "diamond", threshold: 250, label: "250 reviews" },
    ],
    metric: "trades_with_review",
  },
  {
    id: "pattern_recognizer",
    category: "analysis",
    title: "Pattern Recognizer",
    description: "Use the same setup type consistently across 50+ trades",
    emoji: "💡",
    tiers: null,
    metric: "consistent_setup_usage",
  },
  {
    id: "data_scientist",
    category: "analysis",
    title: "Data Scientist",
    description: "Log 500 trades to power deep analytics",
    emoji: "🔬",
    tiers: null,
    metric: "total_trades_500",
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ── Milestones (11 achievements) ──────────────────────────────────
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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
    description: "Use Traverse for a full year",
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
  // ── NEW Milestones ─────────────────────────────────────────────
  {
    id: "five_thousand_trades",
    category: "milestones",
    title: "Market Oracle",
    description: "Log 5,000 trades",
    emoji: "🔮",
    tiers: null,
    metric: "total_trades_5000",
  },
  {
    id: "ten_thousand_entries",
    category: "milestones",
    title: "Encyclopedia",
    description: "Write 10,000 journal entries",
    emoji: "📚",
    tiers: null,
    metric: "journal_entries_10000",
  },
  {
    id: "thousand_day_streak",
    category: "milestones",
    title: "The Unstoppable",
    description: "Maintain a 1,000-day journaling streak",
    emoji: "🔥",
    tiers: null,
    metric: "current_streak_1000",
  },
  {
    id: "five_hundred_checkins",
    category: "milestones",
    title: "Habitual",
    description: "Complete 500 daily check-ins",
    emoji: "☀️",
    tiers: null,
    metric: "total_checkins_500",
  },
  {
    id: "level_50",
    category: "milestones",
    title: "Halfway There",
    description: "Reach Level 50",
    emoji: "🏆",
    tiers: null,
    metric: "player_level_50",
  },
  {
    id: "level_100",
    category: "milestones",
    title: "The Summit",
    description: "Reach Level 100",
    emoji: "🏔️",
    tiers: null,
    metric: "player_level_100",
  },
  {
    id: "level_150",
    category: "milestones",
    title: "Ascension",
    description: "Reach Level 150",
    emoji: "🌟",
    tiers: null,
    metric: "player_level_150",
  },
  {
    id: "level_200",
    category: "milestones",
    title: "Titan",
    description: "Reach Level 200",
    emoji: "⚡",
    tiers: null,
    metric: "player_level_200",
  },
  {
    id: "level_300",
    category: "milestones",
    title: "Celestial",
    description: "Reach Level 300",
    emoji: "🌌",
    tiers: null,
    metric: "player_level_300",
  },
  {
    id: "level_500",
    category: "milestones",
    title: "The Infinite",
    description: "Reach the maximum level",
    emoji: "♾️",
    tiers: null,
    metric: "player_level_500",
  },
  {
    id: "completionist",
    category: "milestones",
    title: "Completionist",
    description: "Unlock every single achievement at maximum tier",
    emoji: "✨",
    tiers: null,
    metric: "all_achievements_maxed",
  },
];

/** Quick lookup map */
export const ACHIEVEMENT_MAP = Object.fromEntries(
  ACHIEVEMENTS.map((a) => [a.id, a])
) as Record<string, AchievementDefinition>;

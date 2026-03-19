import { z } from "zod";

// Zod schemas validate data BEFORE it hits your database.
// If someone submits a trade with a negative quantity or missing symbol, Zod catches it.

export const EMOTIONS = [
  "Calm",
  "Anxious",
  "Excited",
  "Frustrated",
  "FOMO",
  "Revenge",
  "Bored",
  "Confident",
  "Greedy",
  "Fearful",
  "Disciplined",
  "Hopeful",
  "Impatient",
  "Regretful",
  "Overconfident",
  "Confused",
  "Indifferent",
] as const;

export const SETUP_TYPES = [
  "Breakout",
  "Reversal",
  "Trend Follow",
  "Scalp",
  "Range",
  "News",
  "Custom",
] as const;

export const BEHAVIORAL_EMOTIONS = [
  "Calm",
  "Anxious",
  "Excited",
  "Frustrated",
  "FOMO",
  "Revenge",
  "Bored",
  "Confident",
  "Greedy",
  "Fearful",
] as const;

// Expanded emotion set for journal notes (multi-select)
export const JOURNAL_EMOTIONS = [
  // Positive
  "Calm", "Confident", "Excited", "Disciplined", "Relieved", "Hopeful",
  // Negative
  "Anxious", "Frustrated", "Fearful", "Greedy", "Impatient", "Regretful",
  // Destructive
  "FOMO", "Revenge", "Overconfident",
  // Neutral
  "Bored", "Confused", "Indifferent",
] as const;

export const EMOTION_TRIGGERS = [
  "Loss streak",
  "Big win",
  "Missed entry",
  "News event",
  "Market volatility",
  "Boredom",
  "External stress",
  "Other",
] as const;

export const PHYSICAL_STATES = [
  "Tired",
  "Wired",
  "Hungry",
  "Headache",
  "Normal",
] as const;

export const BEHAVIORAL_BIASES = [
  "FOMO",
  "Revenge trading",
  "Overconfidence",
  "Hesitation",
  "Oversize",
  "Confirmation bias",
] as const;

// ─── Psychology Tier Constants ───────────────────────────────────────────────

// Emotion Quadrants (Russell's circumplex model adapted for trading)
export const EMOTION_QUADRANTS = {
  danger: {
    label: "Danger Zone",
    description: "High energy, negative — likely to cause impulsive trades",
    color: "red",
    emoji: "🔴",
    emotions: ["FOMO", "Revenge", "Greedy", "Overconfident"] as const,
  },
  caution: {
    label: "Caution Zone",
    description: "Low energy, negative — may lead to hesitation or avoidance",
    color: "yellow",
    emoji: "🟡",
    emotions: ["Anxious", "Fearful", "Frustrated", "Regretful", "Impatient"] as const,
  },
  edge: {
    label: "Edge State",
    description: "High energy, positive — your peak performance zone",
    color: "green",
    emoji: "🟢",
    emotions: ["Confident", "Disciplined", "Excited", "Hopeful"] as const,
  },
  baseline: {
    label: "Baseline",
    description: "Low energy, neutral — fine for rule-based execution",
    color: "blue",
    emoji: "🔵",
    emotions: ["Calm", "Bored", "Indifferent", "Confused"] as const,
  },
} as const;

export type EmotionQuadrant = keyof typeof EMOTION_QUADRANTS;

// Cognitive distortions (Beck's taxonomy adapted for trading)
export const COGNITIVE_DISTORTIONS = [
  { id: "all_or_nothing", label: "All-or-Nothing", example: "This trade will make or break my week" },
  { id: "catastrophizing", label: "Catastrophizing", example: "If I lose here, I'll blow the account" },
  { id: "fortune_telling", label: "Fortune Telling", example: "I just know this will reverse on me" },
  { id: "mind_reading", label: "Mind Reading", example: "Market makers are targeting my stop" },
  { id: "emotional_reasoning", label: "Emotional Reasoning", example: "I feel scared, so this must be a bad trade" },
  { id: "should_statements", label: "Should Statements", example: "I should have entered earlier" },
  { id: "labeling", label: "Labeling", example: "I'm a terrible trader" },
  { id: "magnification", label: "Magnification", example: "This loss is devastating" },
  { id: "minimization", label: "Minimization", example: "That win was just luck" },
  { id: "personalization", label: "Personalization", example: "The market is against me specifically" },
  { id: "overgeneralization", label: "Overgeneralization", example: "I always lose on Mondays" },
  { id: "mental_filter", label: "Mental Filter", example: "Ignore 5 wins, focus on 1 loss" },
] as const;

// Defense mechanisms
export const DEFENSE_MECHANISMS = [
  { id: "rationalization", label: "Rationalization", example: "I didn't follow the plan but it worked out..." },
  { id: "denial", label: "Denial", example: "That loss wasn't really my fault" },
  { id: "projection", label: "Projection", example: "The market is irrational, not me" },
  { id: "intellectualization", label: "Intellectualization", example: "I'll study more charts instead of fixing my process" },
] as const;

// Somatic body areas
export const SOMATIC_AREAS = [
  { id: "chest", label: "Chest", emoji: "💗" },
  { id: "stomach", label: "Stomach", emoji: "🫄" },
  { id: "jaw", label: "Jaw", emoji: "😬" },
  { id: "shoulders", label: "Shoulders", emoji: "🤷" },
  { id: "hands", label: "Hands", emoji: "🤲" },
  { id: "none", label: "No tension", emoji: "✅" },
] as const;

// Flow states
export const FLOW_STATES = [
  { id: "forced", label: "Forced", emoji: "😣", description: "Everything feels like a struggle" },
  { id: "effortful", label: "Effortful", emoji: "😤", description: "Requires constant focus" },
  { id: "neutral", label: "Neutral", emoji: "😐", description: "Neither easy nor hard" },
  { id: "smooth", label: "Smooth", emoji: "🎯", description: "Decisions come naturally" },
  { id: "flow", label: "Flow", emoji: "🌊", description: "Effortless execution, fully absorbed" },
] as const;

// Expanded triggers (Advanced tier)
export const EXPANDED_TRIGGERS = [
  // Market triggers
  "Loss streak",
  "Big win",
  "Missed entry",
  "News event",
  "Market volatility",
  "Stopped out then reversed",
  "Seeing others profit",
  "Exited too early",
  "Multiple timeframe conflict",
  // Personal triggers
  "Boredom",
  "External stress",
  "Sleep deprivation",
  "Argument or conflict",
  "Financial pressure",
  "Screen fatigue",
  "Comparing self to others",
  // Behavioral triggers
  "Broke a rule but got rewarded",
  "Approaching P&L milestone",
  "Approaching drawdown threshold",
  "Other",
] as const;

// Expanded physical states (Advanced tier)
export const EXPANDED_PHYSICAL_STATES = [
  "Well-rested",
  "Tired",
  "Wired",
  "Caffeinated",
  "Exercised today",
  "Hungry",
  "Headache",
  "Back pain",
  "Eye strain",
  "Restless",
  "Relaxed",
  "Dehydrated",
  "Stomach discomfort",
  "Normal",
] as const;

// Expanded biases (Advanced tier)
export const EXPANDED_BIASES = [
  "FOMO",
  "Revenge trading",
  "Overconfidence",
  "Hesitation",
  "Oversize",
  "Confirmation bias",
  "Recency bias",
  "Anchoring",
  "Sunk cost fallacy",
  "Disposition effect",
  "Endowment effect",
  "Gambler's fallacy",
  "Availability bias",
  "Loss aversion",
  "Status quo bias",
  "Hindsight bias",
] as const;

// Risk personality archetypes
export const RISK_PERSONALITIES = [
  { id: "conservative_guardian", label: "Conservative Guardian", emoji: "🛡️", description: "Prioritizes capital preservation, methodical entry/exit" },
  { id: "calculated_risk_taker", label: "Calculated Risk-Taker", emoji: "🧮", description: "Data-driven risk-reward decisions, balanced approach" },
  { id: "aggressive_hunter", label: "Aggressive Hunter", emoji: "🎯", description: "High conviction sizing, comfortable with volatility" },
  { id: "adaptive_chameleon", label: "Adaptive Chameleon", emoji: "🦎", description: "Adjusts strategy to market conditions, flexible" },
] as const;

// Self-concept identities
export const SELF_CONCEPT_IDENTITIES = [
  { id: "disciplined_executor", label: "Disciplined Executor", description: "I follow my rules above all else" },
  { id: "pattern_hunter", label: "Pattern Hunter", description: "I see patterns others miss" },
  { id: "contrarian", label: "Contrarian", description: "I profit when others panic" },
  { id: "survivor", label: "Survivor", description: "I've been through drawdowns and come back stronger" },
  { id: "student", label: "Student", description: "I'm always learning, always improving" },
] as const;

// Idea source tracking (Cognitive Defense Framework)
export const IDEA_SOURCES = [
  { id: "own_analysis", label: "My Own Analysis" },
  { id: "social_media", label: "Social Media (Twitter/X, Reddit)" },
  { id: "influencer", label: "Influencer / Guru" },
  { id: "news", label: "News / Headlines" },
  { id: "friend", label: "Friend / Chat" },
  { id: "chat_group", label: "Discord / Telegram Group" },
  { id: "other", label: "Other" },
] as const;

export const IDEA_SOURCE_VALUES = [
  "own_analysis", "social_media", "influencer", "news", "friend", "chat_group", "other",
] as const;

export const CHAIN_VALUES = [
  "ethereum", "solana", "base", "arbitrum", "bsc", "polygon", "avalanche",
] as const;

export const tradeSchema = z.object({
  symbol: z
    .string()
    .min(1, "Symbol is required")
    .transform((s) => s.toUpperCase()),
  position: z.enum(["long", "short"]),
  entry_price: z.coerce.number().positive("Entry price must be positive"),
  exit_price: z.coerce.number().positive("Exit price must be positive").optional(),
  stop_loss: z.coerce.number().positive("Stop loss must be positive").optional(),
  profit_target: z.coerce.number().positive("Profit target must be positive").optional(),
  quantity: z.coerce.number().positive("Quantity must be positive"),
  fees: z.coerce.number().min(0, "Fees cannot be negative").default(0),
  open_timestamp: z.string().min(1, "Open time is required"),
  close_timestamp: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
  // Psychology fields
  emotion: z.string().optional(),
  confidence: z.coerce.number().min(1).max(10).optional(),
  setup_type: z.string().optional(),
  process_score: z.coerce.number().min(1).max(10).optional(),
  checklist: z.record(z.string(), z.boolean()).optional(),
  review: z.record(z.string(), z.string()).optional(),
  // DEX fields
  trade_source: z.enum(["cex", "dex"]).default("cex"),
  chain: z.enum(CHAIN_VALUES).optional(),
  dex_protocol: z.string().optional(),
  tx_hash: z.string().optional(),
  wallet_address: z.string().optional(),
  gas_fee: z.coerce.number().min(0).default(0),
  gas_fee_native: z.coerce.number().min(0).default(0),
  // MAE/MFE fields
  price_mae: z.coerce.number().positive().optional(),
  price_mfe: z.coerce.number().positive().optional(),
  mfe_timestamp: z.string().optional(),
  mae_timestamp: z.string().optional(),
  playbook_id: z.string().uuid().optional(),
  idea_source: z.enum(IDEA_SOURCE_VALUES).optional(),
});

export type TradeFormData = z.infer<typeof tradeSchema>;

export const stockTradeSchema = z.object({
  symbol: z.string().min(1, "Symbol is required").transform((s) => s.toUpperCase()),
  company_name: z.string().optional(),
  asset_type: z.enum(["stock", "option"]).default("stock"),
  position: z.enum(["long", "short"]),
  entry_price: z.coerce.number().positive("Entry price must be positive"),
  exit_price: z.coerce.number().positive("Exit price must be positive").optional(),
  stop_loss: z.coerce.number().positive("Stop loss must be positive").optional(),
  profit_target: z.coerce.number().positive("Profit target must be positive").optional(),
  quantity: z.coerce.number().positive("Quantity must be positive"),
  fees: z.coerce.number().min(0).default(0),
  open_timestamp: z.string().min(1, "Open time is required"),
  close_timestamp: z.string().optional(),
  sector: z.string().optional(),
  industry: z.string().optional(),
  market_session: z.enum(["pre_market", "regular", "after_hours"]).optional(),
  // Options fields
  option_type: z.enum(["call", "put"]).optional(),
  strike_price: z.coerce.number().positive().optional(),
  expiration_date: z.string().optional(),
  premium_per_contract: z.coerce.number().min(0).optional(),
  contracts: z.coerce.number().int().positive().optional(),
  underlying_symbol: z.string().optional(),
  // Psychology (shared)
  emotion: z.string().optional(),
  confidence: z.coerce.number().min(1).max(10).optional(),
  setup_type: z.string().optional(),
  process_score: z.coerce.number().min(1).max(10).optional(),
  checklist: z.record(z.string(), z.boolean()).optional(),
  review: z.record(z.string(), z.string()).optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
  // MAE/MFE fields
  price_mae: z.coerce.number().positive().optional(),
  price_mfe: z.coerce.number().positive().optional(),
  mfe_timestamp: z.string().optional(),
  mae_timestamp: z.string().optional(),
  playbook_id: z.string().uuid().optional(),
  idea_source: z.enum(IDEA_SOURCE_VALUES).optional(),
});

export type StockTradeFormData = z.infer<typeof stockTradeSchema>;

export const journalNoteSchema = z.object({
  title: z.string().optional(),
  content: z.string().min(1, "Note content is required"),
  tags: z.array(z.string()).default([]),
  trade_id: z.string().uuid().optional(),
});

export type JournalNoteFormData = z.infer<typeof journalNoteSchema>;

// ─── Commodity Trade Schema ─────────────────────────────────────────────────

export const COMMODITY_CATEGORY_VALUES = [
  "metals", "energy", "grains", "softs", "livestock",
] as const;

export const COMMODITY_CONTRACT_TYPE_VALUES = [
  "spot", "futures", "options",
] as const;

export const commodityTradeSchema = z.object({
  symbol: z.string().min(1, "Symbol is required").transform((s) => s.toUpperCase()),
  commodity_name: z.string().optional(),
  commodity_category: z.enum(COMMODITY_CATEGORY_VALUES).optional(),
  contract_type: z.enum(COMMODITY_CONTRACT_TYPE_VALUES).default("futures"),
  position: z.enum(["long", "short"]),
  entry_price: z.coerce.number().positive("Entry price must be positive"),
  exit_price: z.coerce.number().positive("Exit price must be positive").optional(),
  stop_loss: z.coerce.number().positive("Stop loss must be positive").optional(),
  profit_target: z.coerce.number().positive("Profit target must be positive").optional(),
  quantity: z.coerce.number().positive("Quantity must be positive"),
  contract_size: z.coerce.number().positive().optional(),
  tick_size: z.coerce.number().positive().optional(),
  tick_value: z.coerce.number().positive().optional(),
  fees: z.coerce.number().min(0).default(0),
  open_timestamp: z.string().min(1, "Open time is required"),
  close_timestamp: z.string().optional(),
  exchange: z.string().optional(),
  // Futures fields
  contract_month: z.string().optional(),
  expiration_date: z.string().optional(),
  margin_required: z.coerce.number().min(0).optional(),
  // Options fields
  option_type: z.enum(["call", "put"]).optional(),
  strike_price: z.coerce.number().positive().optional(),
  premium_per_contract: z.coerce.number().min(0).optional(),
  underlying_contract: z.string().optional(),
  // Psychology (shared)
  emotion: z.string().optional(),
  confidence: z.coerce.number().min(1).max(10).optional(),
  setup_type: z.string().optional(),
  process_score: z.coerce.number().min(1).max(10).optional(),
  checklist: z.record(z.string(), z.boolean()).optional(),
  review: z.record(z.string(), z.string()).optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
  // MAE/MFE fields
  price_mae: z.coerce.number().positive().optional(),
  price_mfe: z.coerce.number().positive().optional(),
  mfe_timestamp: z.string().optional(),
  mae_timestamp: z.string().optional(),
  playbook_id: z.string().uuid().optional(),
  idea_source: z.enum(IDEA_SOURCE_VALUES).optional(),
});

export type CommodityTradeFormData = z.infer<typeof commodityTradeSchema>;

// ─── Forex Trade Schema ─────────────────────────────────────────────────────

export const FOREX_LOT_TYPE_VALUES = [
  "standard", "mini", "micro",
] as const;

export const FOREX_SESSION_VALUES = [
  "london", "new_york", "tokyo", "sydney", "overlap",
] as const;

export const FOREX_PAIR_CATEGORY_VALUES = [
  "major", "minor", "exotic",
] as const;

export const forexTradeSchema = z.object({
  pair: z.string().min(1, "Currency pair is required"),
  base_currency: z.string().min(1),
  quote_currency: z.string().min(1),
  pair_category: z.enum(FOREX_PAIR_CATEGORY_VALUES).optional(),
  lot_type: z.enum(FOREX_LOT_TYPE_VALUES).default("standard"),
  lot_size: z.coerce.number().positive("Lot size must be positive"),
  position: z.enum(["long", "short"]),
  entry_price: z.coerce.number().positive("Entry price must be positive"),
  exit_price: z.coerce.number().positive("Exit price must be positive").optional(),
  stop_loss: z.coerce.number().positive("Stop loss must be positive").optional(),
  profit_target: z.coerce.number().positive("Profit target must be positive").optional(),
  fees: z.coerce.number().min(0).default(0),
  open_timestamp: z.string().min(1, "Open time is required"),
  close_timestamp: z.string().optional(),
  pip_value: z.coerce.number().min(0).optional(),
  leverage: z.coerce.number().positive().optional(),
  spread: z.coerce.number().min(0).optional(),
  swap_fee: z.coerce.number().min(0).default(0),
  session: z.enum(FOREX_SESSION_VALUES).optional(),
  broker: z.string().optional(),
  // Psychology (shared)
  emotion: z.string().optional(),
  confidence: z.coerce.number().min(1).max(10).optional(),
  setup_type: z.string().optional(),
  process_score: z.coerce.number().min(1).max(10).optional(),
  checklist: z.record(z.string(), z.boolean()).optional(),
  review: z.record(z.string(), z.string()).optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
  // MAE/MFE fields
  price_mae: z.coerce.number().positive().optional(),
  price_mfe: z.coerce.number().positive().optional(),
  mfe_timestamp: z.string().optional(),
  mae_timestamp: z.string().optional(),
  playbook_id: z.string().uuid().optional(),
  idea_source: z.enum(IDEA_SOURCE_VALUES).optional(),
});

export type ForexTradeFormData = z.infer<typeof forexTradeSchema>;

// ─── Phantom Trade Schema ─────────────────────────────────────────────────────

export const phantomTradeSchema = z.object({
  symbol: z.string().min(1, "Symbol is required").transform((s) => s.toUpperCase()),
  position: z.enum(["long", "short"]),
  entry_price: z.coerce.number().positive("Entry price must be positive"),
  stop_loss: z.coerce.number().positive("Stop loss must be positive").optional(),
  profit_target: z.coerce.number().positive("Profit target must be positive").optional(),
  thesis: z.string().optional(),
  setup_type: z.string().optional(),
  confidence: z.coerce.number().min(1).max(10).optional(),
  emotion: z.string().optional(),
  tags: z.array(z.string()).default([]),
  observed_at: z.string().min(1, "Observation time is required"),
  order_type: z.enum(["observation", "limit"]).default("observation"),
});

export type PhantomTradeFormData = z.infer<typeof phantomTradeSchema>;

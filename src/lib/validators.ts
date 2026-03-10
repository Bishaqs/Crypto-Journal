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
});

export type ForexTradeFormData = z.infer<typeof forexTradeSchema>;

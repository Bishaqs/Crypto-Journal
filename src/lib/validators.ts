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

export const tradeSchema = z.object({
  symbol: z
    .string()
    .min(1, "Symbol is required")
    .transform((s) => s.toUpperCase()),
  position: z.enum(["long", "short"]),
  entry_price: z.coerce.number().positive("Entry price must be positive"),
  exit_price: z.coerce.number().positive("Exit price must be positive").optional(),
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
});

export type TradeFormData = z.infer<typeof tradeSchema>;

export const journalNoteSchema = z.object({
  title: z.string().optional(),
  content: z.string().min(1, "Note content is required"),
  tags: z.array(z.string()).default([]),
  trade_id: z.string().uuid().optional(),
});

export type JournalNoteFormData = z.infer<typeof journalNoteSchema>;

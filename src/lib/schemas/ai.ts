import { z } from "zod";

/**
 * Shared Zod schemas for AI API route request validation.
 */

// A trade object passed to the AI chat context
const TradeSchema = z.object({
  symbol: z.string().optional(),
  position: z.string().optional(),
  entry_price: z.union([z.string(), z.number()]).optional(),
  exit_price: z.union([z.string(), z.number()]).nullable().optional(),
  pnl: z.union([z.string(), z.number()]).nullable().optional(),
  quantity: z.union([z.string(), z.number()]).optional(),
  fees: z.union([z.string(), z.number()]).optional(),
  emotion: z.string().nullable().optional(),
  confidence: z.number().nullable().optional(),
  process_score: z.number().nullable().optional(),
  setup_type: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
  open_timestamp: z.string().nullable().optional(),
  close_timestamp: z.string().nullable().optional(),
  checklist: z.record(z.string(), z.boolean()).nullable().optional(),
  review: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).nullable().optional(),
}).passthrough();

// AI chat request body (used by /api/ai and /api/ai/stream)
export const AiChatSchema = z.object({
  message: z.string().min(1, "Message is required").max(5000, "Message must be under 5000 characters"),
  trades: z.array(TradeSchema).max(200).optional().default([]),
  context: z.object({
    weeklyReport: z.string().optional(),
  }).passthrough().optional().default({}),
});

// Trade summary request body (used by /api/ai/trade-summary)
export const TradeSummarySchema = z.object({
  trade: TradeSchema.refine((t) => t.symbol, { message: "Trade must have a symbol" }),
});

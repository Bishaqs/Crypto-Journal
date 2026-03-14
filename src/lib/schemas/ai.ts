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

// A journal note passed to the AI chat context
const JournalNoteSchema = z.object({
  title: z.string().nullable().optional(),
  content: z.string().nullable().default(""),
  tags: z.array(z.string()).nullable().optional().default([]),
  note_type: z.string().nullable().optional(),
  asset_type: z.string().nullable().optional(),
  note_date: z.string().nullable().optional(),
  created_at: z.string().optional(),
  trade_id: z.string().nullable().optional(),
  structured_data: z.record(z.string(), z.any()).nullable().optional(),
}).passthrough();

// A playbook entry passed to the AI chat context
const PlaybookSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional().default(""),
  entry_rules: z.array(z.string()).optional().default([]),
  exit_rules: z.array(z.string()).optional().default([]),
  stop_loss_strategy: z.string().nullable().optional(),
  risk_per_trade: z.string().nullable().optional(),
  timeframes: z.array(z.string()).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
  asset_class: z.string().optional().default("all"),
  is_active: z.boolean().optional().default(true),
}).passthrough();

// AI chat request body (used by /api/ai and /api/ai/stream)
export const AiChatSchema = z.object({
  message: z.string().min(1, "Message is required").max(5000, "Message must be under 5000 characters"),
  trades: z.array(TradeSchema).max(10000).optional().default([]),
  notes: z.array(JournalNoteSchema).max(500).optional().default([]),
  playbooks: z.array(PlaybookSchema).max(50).optional().default([]),
  context: z.object({
    weeklyReport: z.string().optional(),
  }).passthrough().optional().default({}),
  provider: z.string().optional(),
  model: z.string().optional(),
  apiKey: z.string().max(256).optional(),
});

// Trade summary request body (used by /api/ai/trade-summary)
export const TradeSummarySchema = z.object({
  trade: TradeSchema.refine((t) => t.symbol, { message: "Trade must have a symbol" }),
  provider: z.string().optional(),
  model: z.string().optional(),
  apiKey: z.string().max(256).optional(),
});

// Dashboard insight request body (used by /api/ai/trade-summary with mode: "dashboard-insight")
export const DashboardInsightSchema = z.object({
  mode: z.literal("dashboard-insight"),
  context: z.string().max(2000),
  trades: z.array(TradeSchema).max(20),
  provider: z.string().optional(),
  model: z.string().optional(),
  apiKey: z.string().max(256).optional(),
});

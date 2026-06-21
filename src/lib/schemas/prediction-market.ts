import { z } from "zod";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const dateString = z
  .string()
  .regex(ISO_DATE, "Date must be in YYYY-MM-DD format");

export const PredictionMarketLegSchema = z.object({
  selection: z.string().max(200).default(""),
  odds: z.number().positive("Odds must be > 0").nullable().optional(),
  market_prob: z.number().min(0).max(100).nullable().optional(),
});

export const PredictionMarketCreateSchema = z.object({
  title: z.string().min(1, "Title is required").max(300),
  platform: z.string().max(100).nullable().optional(),
  event: z.string().max(120).nullable().optional(),
  direction: z.string().max(300).nullable().optional(),
  tags: z.array(z.string().max(60)).max(20).default([]),
  your_prob: z
    .number()
    .int("Your probability must be a whole number")
    .min(0, "Your probability must be 0-100")
    .max(100, "Your probability must be 0-100"),
  market_prob: z
    .number()
    .int("Market probability must be a whole number")
    .min(0, "Market probability must be 0-100")
    .max(100, "Market probability must be 0-100")
    .nullable()
    .optional(),
  stake: z.number().min(0, "Stake cannot be negative").nullable().optional(),
  entry_date: dateString,
  resolve_date: dateString.nullable().optional(),
  outcome: z
    .enum(["pending", "won", "lost", "void"])
    .default("pending"),
  realized_result: z.number().nullable().optional(),
  // Sports-betting fields
  bet_type: z.enum(["single", "combo"]).default("single"),
  legs: z.array(PredictionMarketLegSchema).default([]),
  odds: z.number().positive("Odds must be > 0").nullable().optional(),
  stake_units: z.number().positive("Stake (units) must be > 0").nullable().optional(),
  realized_units: z.number().nullable().optional(),
});

// Update schema: every field optional AND defaults stripped, so a partial
// update never writes a default. (Otherwise editing a resolved bet without
// sending `outcome` would reset it to the "pending" default.)
export const PredictionMarketUpdateSchema = PredictionMarketCreateSchema.partial().extend({
  outcome: z.enum(["pending", "won", "lost", "void"]).optional(),
  bet_type: z.enum(["single", "combo"]).optional(),
  legs: z.array(PredictionMarketLegSchema).optional(),
  tags: z.array(z.string().max(60)).max(20).optional(),
});

export const PredictionMarketNoteCreateSchema = z.object({
  prediction_id: z.string().uuid("Invalid prediction id"),
  content: z.string().min(1, "Note content is required").max(5000),
  note_date: dateString.optional(),
});

export const PredictionMarketNoteUpdateSchema =
  PredictionMarketNoteCreateSchema.partial();

export type PredictionMarketLeg = {
  selection: string;
  odds: number | null;
  market_prob: number | null;
};

export type PredictionMarket = {
  id: string;
  user_id: string;
  title: string;
  platform: string | null;
  event: string | null;
  direction: string | null;
  tags: string[];
  your_prob: number;
  market_prob: number | null;
  stake: number | null;
  entry_date: string;
  resolve_date: string | null;
  outcome: "pending" | "won" | "lost" | "void";
  realized_result: number | null;
  // Sports-betting fields
  bet_type: "single" | "combo";
  legs: PredictionMarketLeg[];
  odds: number | null;
  stake_units: number | null;
  realized_units: number | null;
  created_at: string;
  updated_at: string;
};

export type PredictionMarketNote = {
  id: string;
  prediction_id: string;
  user_id: string;
  content: string;
  note_date: string;
  created_at: string;
  updated_at: string;
};

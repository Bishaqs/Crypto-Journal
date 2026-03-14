import { z } from "zod";

export const PlaybookCreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(2000).default(""),
  asset_class: z
    .enum(["all", "crypto", "stocks", "commodities", "forex"])
    .default("all"),
  entry_rules: z.array(z.string().max(500)).max(20).default([]),
  exit_rules: z.array(z.string().max(500)).max(20).default([]),
  stop_loss_strategy: z.string().max(500).nullable().optional(),
  risk_per_trade: z.string().max(100).nullable().optional(),
  timeframes: z.array(z.string()).max(10).default([]),
  tags: z.array(z.string().max(50)).max(20).default([]),
  is_active: z.boolean().default(true),
});

export const PlaybookUpdateSchema = PlaybookCreateSchema.partial();

export type Playbook = {
  id: string;
  user_id: string;
  name: string;
  description: string;
  asset_class: "all" | "crypto" | "stocks" | "commodities" | "forex";
  entry_rules: string[];
  exit_rules: string[];
  stop_loss_strategy: string | null;
  risk_per_trade: string | null;
  timeframes: string[];
  tags: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

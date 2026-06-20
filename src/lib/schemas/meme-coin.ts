import { z } from "zod";

export const MemeCoinCreateSchema = z.object({
  chain: z.string().min(1, "Chain is required").max(50),
  contract_address: z.string().min(1, "Contract address is required").max(120),
  pair_address: z.string().max(120).nullable().optional(),
  symbol: z.string().max(50).nullable().optional(),
  name: z.string().max(120).nullable().optional(),
  is_watchlist: z.boolean().default(false),
  status: z.enum(["holding", "sold", "rugged"]).default("holding"),
  entry_market_cap: z.number().min(0, "Entry market cap must be >= 0").nullable().optional(),
  position_size: z.number().min(0, "Position size must be >= 0").nullable().optional(),
  exit_market_cap: z.number().min(0, "Exit market cap must be >= 0").nullable().optional(),
  realized_pnl: z.number().nullable().optional(),
});

export const MemeCoinUpdateSchema = MemeCoinCreateSchema.partial();

export const MemeCoinNoteCreateSchema = z.object({
  coin_id: z.string().uuid("Invalid coin id"),
  content: z.string().min(1, "Note content is required").max(5000),
  note_date: z.string().optional(),
});

export const MemeCoinNoteUpdateSchema = MemeCoinNoteCreateSchema.partial();

export type MemeCoinStatus = "holding" | "sold" | "rugged";

export type MemeCoin = {
  id: string;
  user_id: string;
  chain: string;
  contract_address: string;
  pair_address: string | null;
  symbol: string | null;
  name: string | null;
  is_watchlist: boolean;
  status: MemeCoinStatus;
  entry_market_cap: number | null;
  position_size: number | null;
  exit_market_cap: number | null;
  realized_pnl: number | null;
  created_at: string;
  updated_at: string;
};

export type MemeCoinNote = {
  id: string;
  coin_id: string;
  user_id: string;
  content: string;
  note_date: string;
  created_at: string;
  updated_at: string;
};

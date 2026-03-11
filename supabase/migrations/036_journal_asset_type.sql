-- Migration 036: Add asset_type to journal_notes for per-dashboard journals
-- Allows filtering journal entries by asset class (crypto, stocks, commodities, forex)

-- 1. Add asset_type column (defaults to 'crypto' for existing notes)
ALTER TABLE public.journal_notes
  ADD COLUMN IF NOT EXISTS asset_type TEXT NOT NULL DEFAULT 'crypto';

-- 2. Add trade_asset_type to track which trade table the trade_id references
ALTER TABLE public.journal_notes
  ADD COLUMN IF NOT EXISTS trade_asset_type TEXT DEFAULT 'crypto';

-- 3. Drop the existing FK constraint on trade_id → trades(id)
-- PostgreSQL doesn't support polymorphic FKs, so we need to remove this
-- to allow trade_id to reference stock_trades, commodity_trades, or forex_trades
ALTER TABLE public.journal_notes
  DROP CONSTRAINT IF EXISTS journal_notes_trade_id_fkey;

-- 4. Backfill: ensure all existing notes have asset_type set
UPDATE public.journal_notes
  SET asset_type = 'crypto'
  WHERE asset_type IS NULL;

-- 5. Set trade_asset_type for existing linked notes (all are crypto)
UPDATE public.journal_notes
  SET trade_asset_type = 'crypto'
  WHERE trade_id IS NOT NULL AND trade_asset_type IS NULL;

-- 6. Create index for filtered queries
CREATE INDEX IF NOT EXISTS idx_journal_notes_user_asset_type
  ON public.journal_notes (user_id, asset_type);

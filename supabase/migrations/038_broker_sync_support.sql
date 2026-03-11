-- ============================================================
-- Migration 038: Broker sync support
-- Fixes per-field IV storage, adds passphrase column,
-- adds broker_order_id for deduplication of API-synced trades
-- ============================================================

-- Per-field IV columns (fixes bug where only key IV was stored)
ALTER TABLE public.broker_connections
  ADD COLUMN IF NOT EXISTS secret_iv text,
  ADD COLUMN IF NOT EXISTS encrypted_passphrase text,
  ADD COLUMN IF NOT EXISTS passphrase_iv text;

-- Dedup columns on trades table
ALTER TABLE public.trades
  ADD COLUMN IF NOT EXISTS broker_order_id text,
  ADD COLUMN IF NOT EXISTS broker_name text;

-- Composite index for fast dedup lookups during sync
CREATE INDEX IF NOT EXISTS idx_trades_broker_dedup
  ON public.trades (user_id, broker_name, broker_order_id)
  WHERE broker_order_id IS NOT NULL;

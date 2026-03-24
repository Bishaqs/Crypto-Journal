-- ============================================================
-- Migration 065: Add connection_id to trades for multi-connection support
-- Scopes broker sync dedup to the specific connection, preventing
-- trades from different sub-accounts from colliding on the same symbol.
-- ============================================================

ALTER TABLE public.trades
  ADD COLUMN IF NOT EXISTS connection_id uuid REFERENCES public.broker_connections(id) ON DELETE SET NULL;

-- Update composite index to include connection_id for scoped dedup lookups
DROP INDEX IF EXISTS idx_trades_broker_dedup;
CREATE INDEX IF NOT EXISTS idx_trades_broker_dedup
  ON public.trades (user_id, broker_name, connection_id, broker_order_id)
  WHERE broker_order_id IS NOT NULL;

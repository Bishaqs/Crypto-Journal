-- Extend phantom_trades for limit order monitoring
ALTER TABLE phantom_trades
  ADD COLUMN IF NOT EXISTS order_type TEXT NOT NULL DEFAULT 'observation',
  ADD COLUMN IF NOT EXISTS filled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- Allow 'pending' and 'cancelled' as valid status values
-- (The status column is TEXT so no enum constraint to alter)

-- Phantom Trades: missed opportunity tracker
-- Logs trade ideas you passed on, then tracks whether they would have hit target or stop

CREATE TABLE IF NOT EXISTS phantom_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- What you were watching
  symbol TEXT NOT NULL,
  asset_type TEXT NOT NULL DEFAULT 'crypto',
  position TEXT NOT NULL CHECK (position IN ('long', 'short')),

  -- Price levels
  entry_price NUMERIC NOT NULL,
  stop_loss NUMERIC,
  profit_target NUMERIC,

  -- Why you considered it
  thesis TEXT,
  setup_type TEXT,
  confidence INT CHECK (confidence BETWEEN 1 AND 10),
  emotion TEXT,
  tags TEXT[] DEFAULT '{}',

  -- When you saw the setup
  observed_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Tracking status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved')),

  -- Resolution
  outcome TEXT CHECK (outcome IN ('target_hit', 'stop_hit', 'neither', 'partial')),
  outcome_price NUMERIC,
  outcome_notes TEXT,
  resolved_at TIMESTAMPTZ,

  -- Cached price extremes (avoid re-fetching)
  price_high_since NUMERIC,
  price_high_date TIMESTAMPTZ,
  price_low_since NUMERIC,
  price_low_date TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE phantom_trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own phantom trades"
  ON phantom_trades FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own phantom trades"
  ON phantom_trades FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own phantom trades"
  ON phantom_trades FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own phantom trades"
  ON phantom_trades FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_phantom_trades_user_id ON phantom_trades(user_id);
CREATE INDEX idx_phantom_trades_status ON phantom_trades(user_id, status);
CREATE INDEX idx_phantom_trades_observed ON phantom_trades(user_id, observed_at DESC);

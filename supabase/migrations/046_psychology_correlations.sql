-- Psychology Correlation Engine: extend behavioral_logs + add idea_source + correlation cache
-- Run this in Supabase SQL Editor after deploying code

-- Extend behavioral_logs with pre-trade phase and override tracking
ALTER TABLE behavioral_logs ADD COLUMN IF NOT EXISTS phase TEXT DEFAULT 'daily';
ALTER TABLE behavioral_logs ADD COLUMN IF NOT EXISTS readiness_score SMALLINT;
ALTER TABLE behavioral_logs ADD COLUMN IF NOT EXISTS override BOOLEAN DEFAULT false;
ALTER TABLE behavioral_logs ADD COLUMN IF NOT EXISTS override_outcome_pnl NUMERIC;

-- Add idea_source to all trade tables
ALTER TABLE trades ADD COLUMN IF NOT EXISTS idea_source TEXT;
ALTER TABLE stock_trades ADD COLUMN IF NOT EXISTS idea_source TEXT;
ALTER TABLE commodity_trades ADD COLUMN IF NOT EXISTS idea_source TEXT;
ALTER TABLE forex_trades ADD COLUMN IF NOT EXISTS idea_source TEXT;

-- Psychology correlation cache (computed on-demand, not real-time)
CREATE TABLE IF NOT EXISTS psychology_correlations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  correlation_type TEXT NOT NULL,
  dimension TEXT NOT NULL,
  value TEXT NOT NULL,
  trade_count INT NOT NULL,
  win_rate NUMERIC,
  avg_pnl NUMERIC,
  total_pnl NUMERIC,
  statistical_significance NUMERIC,
  computed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, correlation_type, dimension, value)
);

-- RLS for psychology_correlations
ALTER TABLE psychology_correlations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own correlations"
  ON psychology_correlations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own correlations"
  ON psychology_correlations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own correlations"
  ON psychology_correlations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own correlations"
  ON psychology_correlations FOR DELETE
  USING (auth.uid() = user_id);

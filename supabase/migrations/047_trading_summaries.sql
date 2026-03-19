-- Hierarchical trading summaries for Nova AI context compression
-- Daily → Weekly → Monthly → Yearly pyramid

CREATE TABLE IF NOT EXISTS trading_summaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  period_type TEXT NOT NULL, -- 'daily' | 'weekly' | 'monthly' | 'yearly'
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  stats JSONB NOT NULL,
  narrative TEXT, -- optional AI-generated 2-3 sentence summary
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, period_type, period_start)
);

ALTER TABLE trading_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own summaries"
  ON trading_summaries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own summaries"
  ON trading_summaries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own summaries"
  ON trading_summaries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own summaries"
  ON trading_summaries FOR DELETE
  USING (auth.uid() = user_id);

-- Index for fast lookups by user + period type + date range
CREATE INDEX IF NOT EXISTS idx_trading_summaries_user_period
  ON trading_summaries (user_id, period_type, period_start DESC);

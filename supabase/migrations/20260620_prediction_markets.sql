-- ============================================================
-- Prediction Markets: track forecasts on prediction markets
-- (Polymarket / Kalshi / Manifold / etc.) with calibration
-- scoring, plus a per-prediction notes log kept separate from
-- the trading journal so the two don't overlap.
-- ============================================================

-- 1. Predictions table
CREATE TABLE IF NOT EXISTS public.prediction_markets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE DEFAULT auth.uid(),
  title text NOT NULL,
  platform text,                         -- e.g. Polymarket / Kalshi / Manifold / Other
  direction text,                        -- free text, e.g. "Yes" / "No" / "Above $100k"
  your_prob integer NOT NULL CHECK (your_prob >= 0 AND your_prob <= 100),
  market_prob integer CHECK (market_prob >= 0 AND market_prob <= 100),
  stake numeric,                         -- amount risked (currency-agnostic)
  entry_date date NOT NULL DEFAULT current_date,
  resolve_date date,
  outcome text NOT NULL DEFAULT 'pending'
    CHECK (outcome IN ('pending', 'won', 'lost', 'void')),
  realized_result numeric,               -- signed P/L once resolved
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.prediction_markets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own predictions" ON public.prediction_markets;
CREATE POLICY "Users can view own predictions"
  ON public.prediction_markets FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own predictions" ON public.prediction_markets;
CREATE POLICY "Users can insert own predictions"
  ON public.prediction_markets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own predictions" ON public.prediction_markets;
CREATE POLICY "Users can update own predictions"
  ON public.prediction_markets FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own predictions" ON public.prediction_markets;
CREATE POLICY "Users can delete own predictions"
  ON public.prediction_markets FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_prediction_markets_user
  ON public.prediction_markets (user_id);
CREATE INDEX IF NOT EXISTS idx_prediction_markets_user_resolve
  ON public.prediction_markets (user_id, resolve_date);

-- 2. Per-prediction notes (scoped to a single prediction, kept
-- separate from the trade journal so the two never overlap).
CREATE TABLE IF NOT EXISTS public.prediction_market_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id uuid NOT NULL REFERENCES public.prediction_markets ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE DEFAULT auth.uid(),
  content text NOT NULL,
  note_date date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.prediction_market_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own prediction notes" ON public.prediction_market_notes;
CREATE POLICY "Users can view own prediction notes"
  ON public.prediction_market_notes FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own prediction notes" ON public.prediction_market_notes;
CREATE POLICY "Users can insert own prediction notes"
  ON public.prediction_market_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own prediction notes" ON public.prediction_market_notes;
CREATE POLICY "Users can update own prediction notes"
  ON public.prediction_market_notes FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own prediction notes" ON public.prediction_market_notes;
CREATE POLICY "Users can delete own prediction notes"
  ON public.prediction_market_notes FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_prediction_market_notes_prediction
  ON public.prediction_market_notes (prediction_id);
CREATE INDEX IF NOT EXISTS idx_prediction_market_notes_user
  ON public.prediction_market_notes (user_id);

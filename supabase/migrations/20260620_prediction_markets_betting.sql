-- ============================================================
-- Prediction Markets — sports-betting upgrade.
-- Adds combo/parlay support, decimal odds, and unit staking to
-- the existing prediction_markets table. Idempotent.
-- Bankroll/unit settings live in user_preferences.preferences.betting
-- (no schema change needed for those).
-- ============================================================

ALTER TABLE public.prediction_markets
  ADD COLUMN IF NOT EXISTS bet_type text NOT NULL DEFAULT 'single',
  ADD COLUMN IF NOT EXISTS legs jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS odds numeric,
  ADD COLUMN IF NOT EXISTS stake_units numeric,
  ADD COLUMN IF NOT EXISTS realized_units numeric;

-- Constrain bet_type (guarded so re-running is safe)
DO $$ BEGIN
  ALTER TABLE public.prediction_markets
    ADD CONSTRAINT prediction_markets_bet_type_chk CHECK (bet_type IN ('single', 'combo'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

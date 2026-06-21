-- ============================================================
-- Prediction Markets — event/group label.
-- Adds a free-text `event` column so bets can be grouped into
-- tabs (e.g. "WM 2026", "Bundesliga"). Idempotent.
-- ============================================================

ALTER TABLE public.prediction_markets
  ADD COLUMN IF NOT EXISTS event text;

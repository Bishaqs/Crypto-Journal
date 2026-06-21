-- ============================================================
-- Prediction Markets — tags.
-- Replaces the single free-text `direction` with reusable tags
-- (e.g. "handicap 1:0", "over 2.5") so bets can be grouped and
-- scored per bet-type. Backfills existing directions as tags so
-- no data is lost. `direction` is kept for backward-compat.
-- Idempotent.
-- ============================================================

ALTER TABLE public.prediction_markets
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}'::text[];

-- Backfill: seed tags from any existing direction value (lowercased to match
-- the tag-input normalisation). Only touches rows that have no tags yet.
UPDATE public.prediction_markets
SET tags = ARRAY[lower(trim(direction))]
WHERE direction IS NOT NULL
  AND trim(direction) <> ''
  AND (tags IS NULL OR array_length(tags, 1) IS NULL);

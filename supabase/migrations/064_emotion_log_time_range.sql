-- ============================================================
-- Stargate — Emotion Log Time Ranges
-- Allow emotion check-ins to specify a duration (start→end)
-- ============================================================

-- Add time range columns
ALTER TABLE public.trade_emotion_logs
ADD COLUMN IF NOT EXISTS started_at timestamptz,
ADD COLUMN IF NOT EXISTS ended_at timestamptz,
ADD COLUMN IF NOT EXISTS price_at_end numeric;

-- Backfill: set started_at = created_at for existing point-in-time logs
UPDATE public.trade_emotion_logs
SET started_at = created_at
WHERE started_at IS NULL;

-- Ensure ended_at is always after started_at
ALTER TABLE public.trade_emotion_logs
ADD CONSTRAINT chk_time_range CHECK (
  ended_at IS NULL OR started_at IS NULL OR ended_at >= started_at
);

-- Index for range queries
CREATE INDEX IF NOT EXISTS idx_emotion_logs_time_range
  ON public.trade_emotion_logs(started_at, ended_at);

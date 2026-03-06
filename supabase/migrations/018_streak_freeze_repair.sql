-- Add streak freeze and repair columns to user_streaks
-- Streak Freeze: protects streak for 1 missed day (earned at milestones)
-- Streak Repair: restores a recently broken streak (within 24h, costs 1 freeze)

ALTER TABLE public.user_streaks
  ADD COLUMN IF NOT EXISTS streak_freezes int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS broken_streak int,
  ADD COLUMN IF NOT EXISTS broken_at timestamptz;

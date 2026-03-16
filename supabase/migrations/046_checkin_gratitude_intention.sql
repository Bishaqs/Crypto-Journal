-- Add gratitude and intention fields to daily check-ins
-- Supports psychological reflection in the daily check-in modal

ALTER TABLE public.daily_checkins ADD COLUMN IF NOT EXISTS gratitude text;
ALTER TABLE public.daily_checkins ADD COLUMN IF NOT EXISTS intention text;

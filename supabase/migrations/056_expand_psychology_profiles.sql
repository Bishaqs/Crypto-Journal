-- Expand psychology_profiles with new assessment categories
-- Part of Psychology Kickstart + Lead Magnet Quiz feature

ALTER TABLE public.psychology_profiles
  ADD COLUMN IF NOT EXISTS discipline_score numeric(3,1),
  ADD COLUMN IF NOT EXISTS discipline_responses jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS emotional_regulation text CHECK (emotional_regulation IN ('reactive', 'aware', 'managed', 'mastered')),
  ADD COLUMN IF NOT EXISTS emotional_regulation_responses jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS bias_awareness_score numeric(4,1),
  ADD COLUMN IF NOT EXISTS bias_awareness_responses jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS fomo_revenge_score numeric(3,1),
  ADD COLUMN IF NOT EXISTS fomo_revenge_responses jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS journaling_style text,
  ADD COLUMN IF NOT EXISTS stress_response text CHECK (stress_response IN ('resilient', 'analytical', 'emotional', 'avoidant')),
  ADD COLUMN IF NOT EXISTS stress_response_responses jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'wizard' CHECK (source IN ('wizard', 'kickstart', 'quiz'));

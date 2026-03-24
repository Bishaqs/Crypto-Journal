-- Education platform: lesson completion tracking
-- Course/lesson definitions are hardcoded in TypeScript (like achievements)
-- Only progress is stored in the database

CREATE TABLE IF NOT EXISTS education_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_slug TEXT NOT NULL,
  lesson_slug TEXT NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  xp_awarded INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, course_slug, lesson_slug)
);

ALTER TABLE education_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own education progress"
  ON education_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own education progress"
  ON education_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_education_progress_user
  ON education_progress(user_id);

CREATE INDEX IF NOT EXISTS idx_education_progress_course
  ON education_progress(user_id, course_slug);

-- Add trading archetype to user_preferences for personalized course ordering
ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS trading_archetype TEXT;

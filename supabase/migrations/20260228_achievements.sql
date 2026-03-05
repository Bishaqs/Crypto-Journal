-- Achievement system tables
-- Run this in the Supabase SQL Editor

-- Stores unlocked achievements per user
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  tier TEXT, -- 'bronze', 'silver', 'gold', 'diamond' or NULL for single-tier
  unlocked_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, achievement_id, tier)
);

-- Stores progress toward achievements
CREATE TABLE IF NOT EXISTS achievement_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  current_value NUMERIC DEFAULT 0 NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, achievement_id)
);

-- User's selected display badge/banner
CREATE TABLE IF NOT EXISTS user_badges (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  active_badge TEXT, -- achievement_id of the badge to display
  active_tier TEXT,  -- tier of the active badge
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- RLS policies
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievement_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- Users can read their own achievements
CREATE POLICY "Users can read own achievements"
  ON user_achievements FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own achievements
CREATE POLICY "Users can insert own achievements"
  ON user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can read own progress
CREATE POLICY "Users can read own progress"
  ON achievement_progress FOR SELECT
  USING (auth.uid() = user_id);

-- Users can upsert own progress
CREATE POLICY "Users can upsert own progress"
  ON achievement_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON achievement_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can read/write own badge
CREATE POLICY "Users can read own badge"
  ON user_badges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert own badge"
  ON user_badges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own badge"
  ON user_badges FOR UPDATE
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_achievement_progress_user ON achievement_progress(user_id);

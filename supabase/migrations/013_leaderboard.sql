-- Leaderboard & User Profiles
-- Public profile system + materialized leaderboard view

-- ============================================================
-- 1. USER PROFILES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  is_public BOOLEAN DEFAULT false NOT NULL,
  show_level BOOLEAN DEFAULT true NOT NULL,
  show_achievements BOOLEAN DEFAULT true NOT NULL,
  show_streak BOOLEAN DEFAULT true NOT NULL,
  avatar_frame TEXT,
  banner TEXT,
  title_badge TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================================
-- 2. RLS POLICIES
-- ============================================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Anyone can read public profiles (is_public = true)
CREATE POLICY "Anyone can read public profiles"
  ON user_profiles FOR SELECT
  USING (is_public = true);

-- ============================================================
-- 3. MATERIALIZED VIEW: LEADERBOARD
-- Joins user_levels, user_profiles, user_streaks,
-- user_achievements (count), and user_badges
-- Only includes users who opted into public profiles
-- ============================================================
CREATE MATERIALIZED VIEW leaderboard_view AS
SELECT
  ul.user_id,
  up.display_name,
  up.avatar_frame,
  up.banner,
  up.title_badge,
  ul.current_level,
  ul.total_xp,
  COALESCE(us.current_streak, 0) AS current_streak,
  COALESCE(us.longest_streak, 0) AS longest_streak,
  COALESCE(ua_count.achievement_count, 0) AS achievement_count,
  ub.active_badge,
  ub.active_tier
FROM user_levels ul
INNER JOIN user_profiles up
  ON ul.user_id = up.user_id
  AND up.is_public = true
LEFT JOIN user_streaks us
  ON ul.user_id = us.user_id
LEFT JOIN (
  SELECT user_id, COUNT(*) AS achievement_count
  FROM user_achievements
  GROUP BY user_id
) ua_count
  ON ul.user_id = ua_count.user_id
LEFT JOIN user_badges ub
  ON ul.user_id = ub.user_id
ORDER BY ul.current_level DESC, ul.total_xp DESC;

-- Unique index required for REFRESH MATERIALIZED VIEW CONCURRENTLY
CREATE UNIQUE INDEX idx_leaderboard_view_user_id
  ON leaderboard_view(user_id);

-- Additional index for sorting queries
CREATE INDEX idx_leaderboard_view_rank
  ON leaderboard_view(current_level DESC, total_xp DESC);

-- ============================================================
-- 4. AUTO-UPDATE updated_at ON user_profiles
-- ============================================================
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profiles_updated_at();

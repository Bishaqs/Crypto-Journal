-- XP & Level System
-- Append-only XP event ledger + materialized user level

-- XP ledger: every XP event is recorded
CREATE TABLE IF NOT EXISTS user_xp_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source TEXT NOT NULL, -- 'trade_logged', 'trade_with_notes', 'checkin', 'behavioral_log', 'journal_entry', 'trade_plan', 'weekly_review', 'streak_bonus', 'achievement_bronze', 'achievement_silver', 'achievement_gold', 'achievement_diamond', 'achievement_legendary', 'achievement_single'
  source_id TEXT, -- optional: references the specific trade/log/achievement id
  xp_amount INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Materialized user level for fast reads
CREATE TABLE IF NOT EXISTS user_levels (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_xp BIGINT DEFAULT 0 NOT NULL,
  current_level INTEGER DEFAULT 1 NOT NULL,
  xp_today INTEGER DEFAULT 0 NOT NULL,
  today_date DATE DEFAULT CURRENT_DATE NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- RLS
ALTER TABLE user_xp_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own xp events"
  ON user_xp_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own xp events"
  ON user_xp_events FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own level"
  ON user_levels FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can upsert own level"
  ON user_levels FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own level"
  ON user_levels FOR UPDATE USING (auth.uid() = user_id);

-- Leaderboard needs public reads
CREATE POLICY "Anyone can read levels for leaderboard"
  ON user_levels FOR SELECT USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_xp_events_user ON user_xp_events(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_events_user_date ON user_xp_events(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_user_levels_level ON user_levels(current_level DESC, total_xp DESC);

-- Daily/Weekly Challenge tracking tables
-- Tracks which challenges a user has completed on each day

-- Individual challenge completion records
CREATE TABLE IF NOT EXISTS user_daily_challenges (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id text NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  xp_awarded boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT uq_user_challenge_date UNIQUE (user_id, challenge_id, date)
);

-- Daily summary (tracks if all 3 dailies were completed)
CREATE TABLE IF NOT EXISTS user_daily_challenge_summary (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  all_completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT uq_user_summary_date UNIQUE (user_id, date)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_daily_challenges_user_date
  ON user_daily_challenges(user_id, date);

CREATE INDEX IF NOT EXISTS idx_user_daily_challenges_completed
  ON user_daily_challenges(user_id, completed, date);

CREATE INDEX IF NOT EXISTS idx_user_daily_challenge_summary_user_date
  ON user_daily_challenge_summary(user_id, date);

-- RLS policies
ALTER TABLE user_daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_daily_challenge_summary ENABLE ROW LEVEL SECURITY;

-- Users can read and write their own challenge data
CREATE POLICY "Users can read own challenges"
  ON user_daily_challenges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own challenges"
  ON user_daily_challenges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own challenges"
  ON user_daily_challenges FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read own challenge summary"
  ON user_daily_challenge_summary FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own challenge summary"
  ON user_daily_challenge_summary FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own challenge summary"
  ON user_daily_challenge_summary FOR UPDATE
  USING (auth.uid() = user_id);

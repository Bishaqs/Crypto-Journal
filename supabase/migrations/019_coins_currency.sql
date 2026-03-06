-- In-App Coins currency system
-- Coins are earned through daily logins, challenges, streak milestones
-- Spent on: streak freezes, XP boosts, cosmetics, re-rolling challenges

-- Coins balance per user
CREATE TABLE IF NOT EXISTS user_coins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance int NOT NULL DEFAULT 0,
  total_earned int NOT NULL DEFAULT 0,
  total_spent int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Coin transaction log
CREATE TABLE IF NOT EXISTS coin_transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount int NOT NULL,
  type text NOT NULL CHECK (type IN ('earn', 'spend')),
  source text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_coin_transactions_user
  ON coin_transactions(user_id, created_at DESC);

-- RLS
ALTER TABLE user_coins ENABLE ROW LEVEL SECURITY;
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own coins"
  ON user_coins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own coins"
  ON user_coins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own coins"
  ON user_coins FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read own coin transactions"
  ON coin_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own coin transactions"
  ON coin_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

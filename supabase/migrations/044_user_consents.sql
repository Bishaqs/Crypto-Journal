-- User consent tracking for GDPR Art. 7 compliance
-- Stores verifiable consent records with timestamps and policy versions

CREATE TABLE IF NOT EXISTS user_consents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type text NOT NULL CHECK (consent_type IN ('ai_data_processing', 'functional_cookies', 'leaderboard_profile', 'shared_trades')),
  granted boolean NOT NULL DEFAULT false,
  privacy_policy_version text NOT NULL DEFAULT '2026-03-14',
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for fast lookups by user
CREATE INDEX idx_user_consents_user_id ON user_consents(user_id);

-- Unique constraint: one consent record per type per user (upsert pattern)
CREATE UNIQUE INDEX idx_user_consents_unique ON user_consents(user_id, consent_type);

-- RLS
ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;

-- Users can read their own consents
CREATE POLICY "Users can view own consents"
  ON user_consents FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own consents
CREATE POLICY "Users can insert own consents"
  ON user_consents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own consents
CREATE POLICY "Users can update own consents"
  ON user_consents FOR UPDATE
  USING (auth.uid() = user_id);

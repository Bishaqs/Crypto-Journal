-- Migration 025: Ban system
-- Adds ban tracking columns to user_subscriptions
-- Run in Supabase SQL Editor

-- Add ban columns
ALTER TABLE user_subscriptions
  ADD COLUMN IF NOT EXISTS is_banned boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS banned_at timestamptz,
  ADD COLUMN IF NOT EXISTS banned_reason text;

-- Partial index for efficient ban lookups (only indexes banned users)
CREATE INDEX IF NOT EXISTS idx_user_subs_banned
  ON user_subscriptions(user_id) WHERE is_banned = true;

-- Migration 029: Add last_seen column for online user tracking
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS last_seen timestamptz;

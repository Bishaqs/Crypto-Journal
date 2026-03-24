-- Add beta tester flag to user_subscriptions
-- Beta testers can see unreleased features alongside the owner
ALTER TABLE user_subscriptions
  ADD COLUMN IF NOT EXISTS is_beta_tester boolean DEFAULT false;

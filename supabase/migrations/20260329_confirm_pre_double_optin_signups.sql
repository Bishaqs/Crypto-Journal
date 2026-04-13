-- Safety fix: mark any pre-double-opt-in signups as confirmed.
-- Migration 068 added email_confirmed (default false) but existing signups
-- were legitimate and never went through the confirmation flow.
-- The cleanup cron then deleted them as "unconfirmed".
-- This prevents that from happening to any remaining pre-068 rows.

UPDATE waitlist_signups
SET email_confirmed = true
WHERE email_confirmed = false
  AND confirmation_token IS NOT NULL
  AND discount_code IS NOT NULL;

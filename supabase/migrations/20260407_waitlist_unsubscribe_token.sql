-- Add unsubscribe_token to waitlist_signups for GDPR-compliant unsubscribe links.
-- Backfills existing rows via DEFAULT gen_random_uuid().
ALTER TABLE public.waitlist_signups
  ADD COLUMN IF NOT EXISTS unsubscribe_token uuid DEFAULT gen_random_uuid() NOT NULL UNIQUE;

CREATE INDEX IF NOT EXISTS idx_waitlist_unsubscribe_token
  ON public.waitlist_signups(unsubscribe_token);

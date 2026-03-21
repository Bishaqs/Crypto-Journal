-- Migration 055: Early Access Allowlist
-- Run in Supabase SQL Editor

-- Manually granted early access emails (admin-only)
CREATE TABLE IF NOT EXISTS early_access_emails (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL UNIQUE,
  granted_by text DEFAULT 'admin',  -- 'admin' for manual grants
  "note" text,                        -- optional admin note
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_early_access_email ON early_access_emails(email);

ALTER TABLE early_access_emails ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to check if their own email has early access
-- (used by middleware to gate dashboard access)
CREATE POLICY "Users can check own early access"
  ON early_access_emails FOR SELECT
  USING (email = lower(auth.jwt() ->> 'email'));

-- Also add a read policy to waitlist_signups so middleware can check membership
-- (waitlist_signups previously had no SELECT policies)
CREATE POLICY "Users can check own waitlist status"
  ON waitlist_signups FOR SELECT
  USING (email = lower(auth.jwt() ->> 'email'));

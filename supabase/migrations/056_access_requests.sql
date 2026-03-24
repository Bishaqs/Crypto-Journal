-- Migration 056: Access Requests
-- Users can request access; admin approves/denies from the admin panel.
-- Run in Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS access_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  email text NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'denied')),
  deny_reason text,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- One request per email
CREATE UNIQUE INDEX idx_access_requests_email ON access_requests(email);

-- Fast lookup for admin panel (pending first)
CREATE INDEX idx_access_requests_status ON access_requests(status, created_at DESC);

ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;

-- Users can insert their own request
CREATE POLICY "Users can request access"
  ON access_requests FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can view their own request status
CREATE POLICY "Users can view own request"
  ON access_requests FOR SELECT
  USING (user_id = auth.uid());

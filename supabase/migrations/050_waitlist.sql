-- Migration 050: Waitlist + Feature Voting
-- Run in Supabase SQL Editor

-- Waitlist signups (no auth required, email-only)
CREATE TABLE IF NOT EXISTS waitlist_signups (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL UNIQUE,
  position integer NOT NULL,
  access_token uuid DEFAULT gen_random_uuid() NOT NULL UNIQUE,
  discount_code text,
  email_confirmed boolean DEFAULT false,
  ip_address text,
  referral_source text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_waitlist_email ON waitlist_signups(email);
CREATE INDEX idx_waitlist_token ON waitlist_signups(access_token);

ALTER TABLE waitlist_signups ENABLE ROW LEVEL SECURITY;
-- No public SELECT — all access via admin client in API routes

-- Feature proposals (admin-created or user-suggested)
CREATE TABLE IF NOT EXISTS feature_proposals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  category text DEFAULT 'general' CHECK (category IN ('analytics', 'psychology', 'automation', 'social', 'general')),
  is_approved boolean DEFAULT false,
  created_by_admin boolean DEFAULT false,
  vote_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE feature_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved proposals"
  ON feature_proposals FOR SELECT
  USING (is_approved = true);

-- Feature votes (waitlist member -> proposal)
CREATE TABLE IF NOT EXISTS feature_votes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id uuid REFERENCES feature_proposals NOT NULL,
  waitlist_signup_id uuid REFERENCES waitlist_signups NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(proposal_id, waitlist_signup_id)
);

ALTER TABLE feature_votes ENABLE ROW LEVEL SECURITY;

-- Atomic signup function (prevents race condition on position + 100-cap)
CREATE OR REPLACE FUNCTION waitlist_signup(p_email text, p_ip text DEFAULT NULL, p_referral text DEFAULT NULL)
RETURNS json AS $$
DECLARE
  v_count integer;
  v_position integer;
  v_token uuid;
  v_id uuid;
BEGIN
  -- Check if already signed up
  IF EXISTS (SELECT 1 FROM waitlist_signups WHERE email = p_email) THEN
    SELECT access_token, position INTO v_token, v_position
      FROM waitlist_signups WHERE email = p_email;
    RETURN json_build_object(
      'success', false,
      'error', 'already_exists',
      'position', v_position,
      'access_token', v_token
    );
  END IF;

  -- Check cap
  SELECT COUNT(*) INTO v_count FROM waitlist_signups;
  IF v_count >= 100 THEN
    RETURN json_build_object('success', false, 'error', 'waitlist_full', 'total', v_count);
  END IF;

  -- Assign position atomically
  v_position := v_count + 1;

  INSERT INTO waitlist_signups (email, position, ip_address, referral_source)
    VALUES (p_email, v_position, p_ip, p_referral)
    RETURNING id, access_token INTO v_id, v_token;

  RETURN json_build_object(
    'success', true,
    'id', v_id,
    'position', v_position,
    'access_token', v_token,
    'remaining', 100 - v_position
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atomic vote function
CREATE OR REPLACE FUNCTION cast_feature_vote(p_token uuid, p_proposal_id uuid)
RETURNS json AS $$
DECLARE
  v_signup_id uuid;
  v_new_count integer;
BEGIN
  SELECT id INTO v_signup_id FROM waitlist_signups WHERE access_token = p_token;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid access token');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM feature_proposals WHERE id = p_proposal_id AND is_approved = true) THEN
    RETURN json_build_object('success', false, 'error', 'Proposal not found');
  END IF;

  IF EXISTS (SELECT 1 FROM feature_votes WHERE proposal_id = p_proposal_id AND waitlist_signup_id = v_signup_id) THEN
    RETURN json_build_object('success', false, 'error', 'Already voted');
  END IF;

  INSERT INTO feature_votes (proposal_id, waitlist_signup_id) VALUES (p_proposal_id, v_signup_id);
  UPDATE feature_proposals SET vote_count = vote_count + 1 WHERE id = p_proposal_id
    RETURNING vote_count INTO v_new_count;

  RETURN json_build_object('success', true, 'vote_count', v_new_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atomic unvote function
CREATE OR REPLACE FUNCTION remove_feature_vote(p_token uuid, p_proposal_id uuid)
RETURNS json AS $$
DECLARE
  v_signup_id uuid;
  v_deleted integer;
BEGIN
  SELECT id INTO v_signup_id FROM waitlist_signups WHERE access_token = p_token;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid access token');
  END IF;

  DELETE FROM feature_votes WHERE proposal_id = p_proposal_id AND waitlist_signup_id = v_signup_id;
  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  IF v_deleted > 0 THEN
    UPDATE feature_proposals SET vote_count = GREATEST(vote_count - 1, 0) WHERE id = p_proposal_id;
  END IF;

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Seed initial feature proposals
INSERT INTO feature_proposals (title, description, category, is_approved, created_by_admin) VALUES
  ('Tilt Circuit Breaker', 'Set a personal daily loss limit — when hit, Traverse locks new trade entries and guides you through a cooldown protocol', 'automation', true, true),
  ('Pre-Trade Checklist', 'Build a customizable pre-trade ritual with rules you must check off before opening any position', 'psychology', true, true),
  ('Emotional Heatmap Calendar', 'See your emotional states mapped across a calendar — spot recurring patterns and correlate with P&L performance', 'psychology', true, true),
  ('Trade Autopsy Mode', 'Guided deep-dive review of your worst trades with structured questions to uncover the psychological root cause', 'psychology', true, true),
  ('Mobile App', 'Native iOS/Android app for logging trades on the go', 'general', true, true),
  ('Trade Replay', 'Replay your trades with candlestick charts and emotional annotations', 'analytics', true, true),
  ('Accountability Partner', 'Get matched with a trader at your level for weekly check-ins — share process scores, not P&L', 'social', true, true),
  ('Drawdown Recovery Protocol', 'When you hit a drawdown threshold, activates guided recovery mode with position sizing rules and mandatory journaling', 'psychology', true, true),
  ('Trade Screenshot Annotation', 'Paste chart screenshots onto trades, draw entries/exits/zones, and annotate with visual proof for every decision', 'analytics', true, true),
  ('Custom Alerts', 'Get notified when you are entering a revenge trade pattern', 'automation', true, true);

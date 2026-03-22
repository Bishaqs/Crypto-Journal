-- Migration 061: Tiered Waitlist (100 → 2000) + Protocol Support
-- Run in Supabase SQL Editor

-- 1. Add tier + referral_code columns to waitlist_signups
ALTER TABLE waitlist_signups
  ADD COLUMN IF NOT EXISTS tier text CHECK (tier IN ('founding_100', 'pioneer', 'early_adopter', 'vanguard', 'trailblazer'));

-- referral_code column was referenced by signup route but never created
ALTER TABLE waitlist_signups
  ADD COLUMN IF NOT EXISTS referral_code text;

-- 2. Add protocol columns to quiz_results
ALTER TABLE quiz_results
  ADD COLUMN IF NOT EXISTS protocol jsonb,
  ADD COLUMN IF NOT EXISTS protocol_generated_at timestamptz;

-- 3. Fix email_sequences unique constraint to support multiple sequence types
ALTER TABLE email_sequences
  DROP CONSTRAINT IF EXISTS email_sequences_quiz_result_id_day_index_key;

ALTER TABLE email_sequences
  ADD CONSTRAINT email_sequences_quiz_result_id_seq_day_key
    UNIQUE (quiz_result_id, sequence_name, day_index);

-- Allow email_sequences rows without a quiz_result_id (waitlist nurture emails)
-- quiz_result_id is already nullable via the REFERENCES definition

-- 4. Add waitlist_signup_id to email_sequences for waitlist nurture emails
ALTER TABLE email_sequences
  ADD COLUMN IF NOT EXISTS waitlist_signup_id uuid REFERENCES waitlist_signups(id);

-- 5. Replace waitlist_signup RPC: cap 2000, tier calculation
CREATE OR REPLACE FUNCTION waitlist_signup(p_email text, p_ip text DEFAULT NULL, p_referral text DEFAULT NULL)
RETURNS json AS $$
DECLARE
  v_count integer;
  v_position integer;
  v_token uuid;
  v_id uuid;
  v_tier text;
  v_discount integer;
BEGIN
  -- Check if already signed up
  IF EXISTS (SELECT 1 FROM waitlist_signups WHERE email = p_email) THEN
    SELECT access_token, position, tier INTO v_token, v_position, v_tier
      FROM waitlist_signups WHERE email = p_email;
    RETURN json_build_object(
      'success', false,
      'error', 'already_exists',
      'position', v_position,
      'access_token', v_token,
      'tier', v_tier
    );
  END IF;

  -- Check cap (2000)
  SELECT COUNT(*) INTO v_count FROM waitlist_signups;
  IF v_count >= 2000 THEN
    RETURN json_build_object('success', false, 'error', 'waitlist_full', 'total', v_count);
  END IF;

  -- Assign position atomically
  v_position := v_count + 1;

  -- Calculate tier and discount
  v_tier := CASE
    WHEN v_position <= 100 THEN 'founding_100'
    WHEN v_position <= 500 THEN 'pioneer'
    WHEN v_position <= 1000 THEN 'early_adopter'
    WHEN v_position <= 1500 THEN 'vanguard'
    ELSE 'trailblazer'
  END;

  v_discount := CASE
    WHEN v_position <= 100 THEN 50
    WHEN v_position <= 500 THEN 40
    WHEN v_position <= 1000 THEN 30
    WHEN v_position <= 1500 THEN 20
    ELSE 10
  END;

  INSERT INTO waitlist_signups (email, position, tier, ip_address, referral_source)
    VALUES (p_email, v_position, v_tier, p_ip, p_referral)
    RETURNING id, access_token INTO v_id, v_token;

  RETURN json_build_object(
    'success', true,
    'id', v_id,
    'position', v_position,
    'access_token', v_token,
    'remaining', 2000 - v_position,
    'tier', v_tier,
    'discount', v_discount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Backfill tier for any existing waitlist rows
UPDATE waitlist_signups
SET tier = CASE
  WHEN position <= 100 THEN 'founding_100'
  WHEN position <= 500 THEN 'pioneer'
  WHEN position <= 1000 THEN 'early_adopter'
  WHEN position <= 1500 THEN 'vanguard'
  ELSE 'trailblazer'
END
WHERE tier IS NULL;

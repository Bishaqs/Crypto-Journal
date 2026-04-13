-- Migration 068: Double Opt-In for Waitlist (UWG §7 Compliance)
-- Adds confirmation_token column and updates RPC to return it

-- 1. Add confirmation_token column
ALTER TABLE waitlist_signups
  ADD COLUMN IF NOT EXISTS confirmation_token uuid DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX IF NOT EXISTS idx_waitlist_confirmation_token
  ON waitlist_signups(confirmation_token)
  WHERE confirmation_token IS NOT NULL;

-- 2. Update RPC to return confirmation_token and handle re-sends
CREATE OR REPLACE FUNCTION waitlist_signup(p_email text, p_ip text DEFAULT NULL, p_referral text DEFAULT NULL)
RETURNS json AS $$
DECLARE
  v_count integer;
  v_position integer;
  v_token uuid;
  v_confirmation_token uuid;
  v_id uuid;
  v_tier text;
  v_discount integer;
  v_confirmed boolean;
BEGIN
  -- Check if already signed up
  IF EXISTS (SELECT 1 FROM waitlist_signups WHERE email = p_email) THEN
    SELECT id, access_token, confirmation_token, position, tier, email_confirmed
      INTO v_id, v_token, v_confirmation_token, v_position, v_tier, v_confirmed
      FROM waitlist_signups WHERE email = p_email;
    RETURN json_build_object(
      'success', false,
      'error', 'already_exists',
      'id', v_id,
      'position', v_position,
      'access_token', v_token,
      'confirmation_token', v_confirmation_token,
      'tier', v_tier,
      'email_confirmed', v_confirmed
    );
  END IF;

  -- Check cap (2000) - only count confirmed signups for cap
  SELECT COUNT(*) INTO v_count FROM waitlist_signups WHERE email_confirmed = true;
  IF v_count >= 2000 THEN
    RETURN json_build_object('success', false, 'error', 'waitlist_full', 'total', v_count);
  END IF;

  -- Position based on total rows (including unconfirmed) to avoid gaps
  SELECT COUNT(*) INTO v_position FROM waitlist_signups;
  v_position := v_position + 1;

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
    RETURNING id, access_token, confirmation_token INTO v_id, v_token, v_confirmation_token;

  RETURN json_build_object(
    'success', true,
    'id', v_id,
    'position', v_position,
    'access_token', v_token,
    'confirmation_token', v_confirmation_token,
    'remaining', 2000 - v_position,
    'tier', v_tier,
    'discount', v_discount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

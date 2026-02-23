-- Migration 007: Referral system

-- Each user gets a unique referral code
CREATE TABLE IF NOT EXISTS referral_links (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL UNIQUE,
  code text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_referral_links_code ON referral_links(code);
CREATE INDEX idx_referral_links_user ON referral_links(user_id);
ALTER TABLE referral_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referral link"
  ON referral_links FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert referral links"
  ON referral_links FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Track who referred whom
CREATE TABLE IF NOT EXISTS referrals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id uuid REFERENCES auth.users NOT NULL,
  referred_user_id uuid REFERENCES auth.users NOT NULL UNIQUE,
  status text DEFAULT 'signed_up' CHECK (status IN ('signed_up', 'converted', 'expired')),
  created_at timestamptz DEFAULT now(),
  converted_at timestamptz
);

CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX idx_referrals_referred ON referrals(referred_user_id);
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referrals"
  ON referrals FOR SELECT USING (auth.uid() = referrer_id);
CREATE POLICY "System can insert referrals"
  ON referrals FOR INSERT WITH CHECK (true);
CREATE POLICY "System can update referrals"
  ON referrals FOR UPDATE USING (true);

-- Reward ledger
CREATE TABLE IF NOT EXISTS referral_rewards (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  reward_days integer NOT NULL,
  reason text NOT NULL,
  applied_at timestamptz DEFAULT now()
);

CREATE INDEX idx_referral_rewards_user ON referral_rewards(user_id);
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rewards"
  ON referral_rewards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert rewards"
  ON referral_rewards FOR INSERT WITH CHECK (true);

-- Get or create a referral link for a user
CREATE OR REPLACE FUNCTION get_or_create_referral_link(p_user_id uuid)
RETURNS json AS $$
DECLARE
  v_link referral_links%ROWTYPE;
  v_code text;
BEGIN
  SELECT * INTO v_link FROM referral_links WHERE user_id = p_user_id;
  IF FOUND THEN
    RETURN json_build_object('code', v_link.code);
  END IF;

  -- Generate unique code
  v_code := 'STARGATE-REF-' || upper(substr(md5(random()::text), 1, 8));

  INSERT INTO referral_links (user_id, code)
  VALUES (p_user_id, v_code)
  ON CONFLICT (user_id) DO NOTHING
  RETURNING * INTO v_link;

  IF v_link IS NULL THEN
    SELECT * INTO v_link FROM referral_links WHERE user_id = p_user_id;
  END IF;

  RETURN json_build_object('code', v_link.code);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Track a referral signup
CREATE OR REPLACE FUNCTION track_referral_signup(p_code text, p_new_user_id uuid)
RETURNS json AS $$
DECLARE
  v_link referral_links%ROWTYPE;
BEGIN
  SELECT * INTO v_link FROM referral_links WHERE code = p_code;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid referral code');
  END IF;

  -- Can't refer yourself
  IF v_link.user_id = p_new_user_id THEN
    RETURN json_build_object('success', false, 'error', 'Cannot refer yourself');
  END IF;

  -- Already referred
  IF EXISTS (SELECT 1 FROM referrals WHERE referred_user_id = p_new_user_id) THEN
    RETURN json_build_object('success', false, 'error', 'Already referred');
  END IF;

  INSERT INTO referrals (referrer_id, referred_user_id, status)
  VALUES (v_link.user_id, p_new_user_id, 'signed_up');

  RETURN json_build_object('success', true, 'referrer_id', v_link.user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check referral count and apply rewards
CREATE OR REPLACE FUNCTION check_and_apply_rewards(p_referrer_id uuid)
RETURNS json AS $$
DECLARE
  v_converted_count integer;
  v_already_rewarded integer;
  v_new_days integer := 0;
  v_total_days integer;
BEGIN
  SELECT count(*) INTO v_converted_count
  FROM referrals WHERE referrer_id = p_referrer_id AND status = 'converted';

  SELECT coalesce(sum(reward_days), 0) INTO v_already_rewarded
  FROM referral_rewards WHERE user_id = p_referrer_id;

  -- Calculate total entitled days based on tier milestones
  v_total_days := 0;
  IF v_converted_count >= 1 THEN v_total_days := 14; END IF;
  IF v_converted_count >= 3 THEN v_total_days := 30; END IF;
  IF v_converted_count >= 5 THEN v_total_days := 60; END IF;
  IF v_converted_count >= 10 THEN v_total_days := 180; END IF;
  IF v_converted_count >= 25 THEN v_total_days := 365; END IF;
  IF v_converted_count >= 50 THEN v_total_days := 36500; END IF; -- "Lifetime"

  v_new_days := v_total_days - v_already_rewarded;
  IF v_new_days > 0 THEN
    INSERT INTO referral_rewards (user_id, reward_days, reason)
    VALUES (p_referrer_id, v_new_days, v_converted_count || ' referral milestone');

    -- Upgrade referrer to pro if not already higher
    UPDATE user_subscriptions
    SET tier = CASE WHEN tier = 'max' THEN 'max' ELSE 'pro' END,
        is_trial = true,
        trial_start = coalesce(trial_start, now()),
        trial_end = coalesce(trial_end, now()) + (v_new_days || ' days')::interval,
        updated_at = now()
    WHERE user_id = p_referrer_id AND tier = 'free';
  END IF;

  RETURN json_build_object(
    'converted', v_converted_count,
    'total_reward_days', v_total_days,
    'new_days_added', greatest(v_new_days, 0)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get referral stats for a user
CREATE OR REPLACE FUNCTION get_referral_stats(p_user_id uuid)
RETURNS json AS $$
DECLARE
  v_total integer;
  v_converted integer;
  v_total_days integer;
BEGIN
  SELECT count(*) INTO v_total FROM referrals WHERE referrer_id = p_user_id;
  SELECT count(*) INTO v_converted FROM referrals WHERE referrer_id = p_user_id AND status = 'converted';
  SELECT coalesce(sum(reward_days), 0) INTO v_total_days FROM referral_rewards WHERE user_id = p_user_id;

  RETURN json_build_object(
    'total_referrals', v_total,
    'converted', v_converted,
    'free_days_earned', v_total_days
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Migration 006: Subscription gating + invite codes

-- User subscriptions
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL UNIQUE,
  tier text NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'max')),
  is_owner boolean DEFAULT false,
  is_trial boolean DEFAULT false,
  trial_start timestamptz,
  trial_end timestamptz,
  billing_cycle text CHECK (billing_cycle IN ('monthly', 'yearly')),
  granted_by_invite_code text,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_user_subs_user ON user_subscriptions(user_id);
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON user_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own subscription"
  ON user_subscriptions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can insert subscriptions"
  ON user_subscriptions FOR INSERT WITH CHECK (true);

-- Invite codes
CREATE TABLE IF NOT EXISTS invite_codes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  grants_tier text NOT NULL CHECK (grants_tier IN ('pro', 'max')),
  description text,
  max_uses integer,
  current_uses integer DEFAULT 0,
  expires_at timestamptz,
  created_by uuid REFERENCES auth.users,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_invite_code ON invite_codes(code);
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active codes"
  ON invite_codes FOR SELECT
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));
CREATE POLICY "Owner can insert codes"
  ON invite_codes FOR INSERT WITH CHECK (true);
CREATE POLICY "Owner can update codes"
  ON invite_codes FOR UPDATE USING (true);

-- Invite redemption audit log
CREATE TABLE IF NOT EXISTS invite_code_redemptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  invite_code_id uuid REFERENCES invite_codes NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  redeemed_at timestamptz DEFAULT now()
);

ALTER TABLE invite_code_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own redemptions"
  ON invite_code_redemptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert redemptions"
  ON invite_code_redemptions FOR INSERT WITH CHECK (true);

-- Auto-create Free subscription on user signup
CREATE OR REPLACE FUNCTION create_default_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_subscriptions (user_id, tier)
  VALUES (NEW.id, 'free')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_default_subscription();

-- Atomic invite code redemption
CREATE OR REPLACE FUNCTION redeem_invite_code(p_code text, p_user_id uuid)
RETURNS json AS $$
DECLARE
  v_invite invite_codes%ROWTYPE;
BEGIN
  SELECT * INTO v_invite FROM invite_codes WHERE code = p_code FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid code');
  END IF;
  IF NOT v_invite.is_active THEN
    RETURN json_build_object('success', false, 'error', 'Code is no longer active');
  END IF;
  IF v_invite.expires_at IS NOT NULL AND v_invite.expires_at < now() THEN
    RETURN json_build_object('success', false, 'error', 'Code has expired');
  END IF;
  IF v_invite.max_uses IS NOT NULL AND v_invite.current_uses >= v_invite.max_uses THEN
    RETURN json_build_object('success', false, 'error', 'Code has reached maximum uses');
  END IF;
  IF EXISTS (SELECT 1 FROM invite_code_redemptions WHERE invite_code_id = v_invite.id AND user_id = p_user_id) THEN
    RETURN json_build_object('success', false, 'error', 'You already redeemed this code');
  END IF;

  -- Upgrade subscription
  UPDATE user_subscriptions
  SET tier = v_invite.grants_tier, granted_by_invite_code = p_code, updated_at = now()
  WHERE user_id = p_user_id;

  -- Log redemption + increment counter
  INSERT INTO invite_code_redemptions (invite_code_id, user_id) VALUES (v_invite.id, p_user_id);
  UPDATE invite_codes SET current_uses = current_uses + 1 WHERE id = v_invite.id;

  RETURN json_build_object('success', true, 'tier', v_invite.grants_tier);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

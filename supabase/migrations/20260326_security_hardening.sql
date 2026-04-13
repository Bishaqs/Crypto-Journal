-- Security Hardening Migration
-- Fixes 4 findings: privilege escalation, missing WITH CHECK, invite code auth

-- ============================================================
-- FIX 1: redeem_invite_code — remove client-supplied user_id,
-- use auth.uid() to prevent privilege escalation
-- ============================================================
CREATE OR REPLACE FUNCTION redeem_invite_code(p_code text)
RETURNS json AS $$
DECLARE
  v_invite invite_codes%ROWTYPE;
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

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
  IF EXISTS (SELECT 1 FROM invite_code_redemptions WHERE invite_code_id = v_invite.id AND user_id = v_user_id) THEN
    RETURN json_build_object('success', false, 'error', 'You already redeemed this code');
  END IF;

  -- Upgrade subscription
  UPDATE user_subscriptions
  SET tier = v_invite.grants_tier, granted_by_invite_code = p_code, updated_at = now()
  WHERE user_id = v_user_id;

  -- Log redemption + increment counter
  INSERT INTO invite_code_redemptions (invite_code_id, user_id) VALUES (v_invite.id, v_user_id);
  UPDATE invite_codes SET current_uses = current_uses + 1 WHERE id = v_invite.id;

  RETURN json_build_object('success', true, 'tier', v_invite.grants_tier);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FIX 2: Add WITH CHECK to all UPDATE policies missing it
-- Prevents user_id reassignment on UPDATE
-- ============================================================

-- user_subscriptions
DROP POLICY IF EXISTS "Users can update own subscription" ON user_subscriptions;
CREATE POLICY "Users can update own subscription"
  ON user_subscriptions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- stock_trades
DROP POLICY IF EXISTS "Users can update own stock trades" ON stock_trades;
CREATE POLICY "Users can update own stock trades"
  ON stock_trades FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- user_addons
DROP POLICY IF EXISTS "Users can update own addons" ON user_addons;
CREATE POLICY "Users can update own addons"
  ON user_addons FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- user_levels
DROP POLICY IF EXISTS "Users can update own level" ON user_levels;
CREATE POLICY "Users can update own level"
  ON user_levels FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- user_profiles
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ai_conversations
DROP POLICY IF EXISTS "Users can update own conversations" ON ai_conversations;
CREATE POLICY "Users can update own conversations"
  ON ai_conversations FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ai_memories
DROP POLICY IF EXISTS "Users can update own memories" ON ai_memories;
CREATE POLICY "Users can update own memories"
  ON ai_memories FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- FIX 3: Storage RLS for journal-images bucket
-- Enforces user-scoped paths and file type restrictions
-- ============================================================

-- Users can only upload to their own folder, only image types
CREATE POLICY "Users can upload own journal images"
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'journal-images' AND
    auth.uid()::text = (storage.foldername(name))[1] AND
    (storage.extension(name) IN ('jpeg', 'jpg', 'png', 'webp', 'gif'))
  );

-- Users can only read their own images
CREATE POLICY "Users can view own journal images"
  ON storage.objects FOR SELECT USING (
    bucket_id = 'journal-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can only delete their own images
CREATE POLICY "Users can delete own journal images"
  ON storage.objects FOR DELETE USING (
    bucket_id = 'journal-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Migration 011: Tighten overly permissive RLS policies
--
-- Problem: WITH CHECK (true) / USING (true) allows any authenticated user
-- to insert/update rows for ANY user via the browser Supabase client.
-- The Supabase URL and anon key are public (NEXT_PUBLIC_), so anyone can
-- instantiate a client and bypass API routes entirely.
--
-- Safe to change because:
-- - All server-side code uses createAdminClient() (service role) which bypasses RLS
-- - All SECURITY DEFINER functions (redeem_invite_code, track_referral_signup, etc.) bypass RLS
-- - Core tables (trades, journal_notes, etc.) already have correct auth.uid() = user_id policies

-- ============================================================
-- 1. user_subscriptions: INSERT — only allow inserting own row
-- ============================================================
DROP POLICY IF EXISTS "System can insert subscriptions" ON user_subscriptions;
CREATE POLICY "Users can insert own subscription"
  ON user_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 2. invite_codes: Block all direct INSERT/UPDATE from client
--    Only admin API (service role) should manage these
-- ============================================================
DROP POLICY IF EXISTS "Owner can insert codes" ON invite_codes;
CREATE POLICY "No direct insert on invite_codes"
  ON invite_codes FOR INSERT
  WITH CHECK (false);

DROP POLICY IF EXISTS "Owner can update codes" ON invite_codes;
CREATE POLICY "No direct update on invite_codes"
  ON invite_codes FOR UPDATE
  USING (false);

-- ============================================================
-- 3. invite_code_redemptions: Only allow inserting own rows
-- ============================================================
DROP POLICY IF EXISTS "System can insert redemptions" ON invite_code_redemptions;
CREATE POLICY "Users can insert own redemption"
  ON invite_code_redemptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 4. referrals: Block direct insert/update from client
--    All operations go through SECURITY DEFINER functions
-- ============================================================
DROP POLICY IF EXISTS "System can insert referrals" ON referrals;
CREATE POLICY "No direct insert on referrals"
  ON referrals FOR INSERT
  WITH CHECK (false);

DROP POLICY IF EXISTS "System can update referrals" ON referrals;
CREATE POLICY "No direct update on referrals"
  ON referrals FOR UPDATE
  USING (false);

-- ============================================================
-- 5. referral_rewards: Block direct insert from client
--    Only check_and_apply_rewards (SECURITY DEFINER) inserts
-- ============================================================
DROP POLICY IF EXISTS "System can insert rewards" ON referral_rewards;
CREATE POLICY "No direct insert on referral_rewards"
  ON referral_rewards FOR INSERT
  WITH CHECK (false);

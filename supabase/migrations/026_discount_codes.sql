-- Migration 026: Discount codes
-- Creates discount_codes + discount_code_redemptions tables
-- Adds applied_discount_code to user_subscriptions
-- Run in Supabase SQL Editor

-- Discount codes table
CREATE TABLE IF NOT EXISTS discount_codes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value numeric NOT NULL CHECK (discount_value > 0),
  applicable_tiers text[] DEFAULT ARRAY['pro', 'max'],
  applicable_billing text[] DEFAULT ARRAY['monthly', 'yearly'],
  description text,
  max_uses integer,
  current_uses integer DEFAULT 0,
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_discount_code ON discount_codes(code);

ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;

-- RLS: Admin (service role) handles all writes; allow SELECT on active codes for validation
CREATE POLICY "Anyone can view active discount codes"
  ON discount_codes FOR SELECT
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Discount code redemptions audit log
CREATE TABLE IF NOT EXISTS discount_code_redemptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  discount_code_id uuid REFERENCES discount_codes NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  redeemed_at timestamptz DEFAULT now(),
  UNIQUE(discount_code_id, user_id)
);

ALTER TABLE discount_code_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own discount redemptions"
  ON discount_code_redemptions FOR SELECT
  USING (auth.uid() = user_id);

-- Add applied discount code column to user_subscriptions
ALTER TABLE user_subscriptions
  ADD COLUMN IF NOT EXISTS applied_discount_code text;

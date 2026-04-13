-- Restore waitlist signup for XeroIdo.7@gmail.com
-- They signed up before double opt-in (migration 068) was added.
-- The cleanup cron deleted their row because email_confirmed defaulted to false.

DO $$
DECLARE
  v_signup_id uuid;
  v_discount_code text;
  v_referral_code text;
BEGIN
  -- Generate codes
  v_discount_code := 'TRAVERSE50-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  v_referral_code := 'REF-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  -- Re-insert the waitlist signup at position #1, already confirmed
  INSERT INTO waitlist_signups (
    email,
    position,
    tier,
    email_confirmed,
    discount_code,
    referral_code,
    created_at
  ) VALUES (
    'XeroIdo.7@gmail.com',
    1,
    'founding_100',
    true,
    v_discount_code,
    v_referral_code,
    now()
  )
  ON CONFLICT (email) DO NOTHING
  RETURNING id INTO v_signup_id;

  -- Only create discount code if the signup was actually inserted
  IF v_signup_id IS NOT NULL THEN
    INSERT INTO discount_codes (
      code,
      discount_type,
      discount_value,
      applicable_tiers,
      applicable_billing,
      description,
      max_uses,
      is_active
    ) VALUES (
      v_discount_code,
      'percentage',
      50,
      ARRAY['pro', 'max'],
      ARRAY['monthly', 'yearly'],
      'Founding 100 waitlist #1 - 50% forever',
      1,
      true
    );

    RAISE NOTICE 'Restored signup for XeroIdo.7@gmail.com at position #1 (Founding 100). Discount code: %', v_discount_code;
  ELSE
    RAISE NOTICE 'Signup for XeroIdo.7@gmail.com already exists, skipping.';
  END IF;
END $$;

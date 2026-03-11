-- Atomic counter increment to prevent race conditions on concurrent redemptions.
-- Used by invite code and discount code redemption routes.
CREATE OR REPLACE FUNCTION increment_counter(
  table_name text,
  row_id uuid,
  column_name text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE format(
    'UPDATE %I SET %I = %I + 1 WHERE id = $1',
    table_name, column_name, column_name
  ) USING row_id;
END;
$$;

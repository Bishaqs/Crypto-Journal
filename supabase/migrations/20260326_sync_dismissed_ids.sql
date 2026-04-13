-- Tracks broker_order_ids that users have intentionally deleted.
-- The sync engine checks this table during dedup to avoid re-inserting dismissed trades.

CREATE TABLE IF NOT EXISTS public.sync_dismissed_ids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  broker_order_id text NOT NULL,
  broker_name text NOT NULL DEFAULT 'Bitget',
  dismissed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, broker_order_id, broker_name)
);

ALTER TABLE public.sync_dismissed_ids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own dismissed sync IDs"
  ON public.sync_dismissed_ids
  FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX idx_sync_dismissed_lookup
  ON public.sync_dismissed_ids (user_id, broker_name);

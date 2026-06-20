-- Meme Coins tracker: watchlist + positions with live DexScreener data + per-coin notes

CREATE TABLE IF NOT EXISTS public.meme_coins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE DEFAULT auth.uid(),
  chain text NOT NULL,                  -- DexScreener chainId, e.g. 'solana','ethereum','base','bsc'
  contract_address text NOT NULL,       -- the token address
  pair_address text,                    -- the chosen DexScreener pair address (for live refresh)
  symbol text,
  name text,
  is_watchlist boolean NOT NULL DEFAULT false,  -- true = watching only, no position
  status text NOT NULL DEFAULT 'holding' CHECK (status IN ('holding', 'sold', 'rugged')),
  entry_market_cap numeric,             -- mcap at entry (null for pure watchlist)
  position_size numeric,                -- amount invested in USD (null for watchlist)
  exit_market_cap numeric,              -- set when sold
  realized_pnl numeric,                 -- signed, set when sold/rugged
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.meme_coins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own meme coins" ON public.meme_coins;
CREATE POLICY "Users can view own meme coins"
  ON public.meme_coins FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own meme coins" ON public.meme_coins;
CREATE POLICY "Users can insert own meme coins"
  ON public.meme_coins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own meme coins" ON public.meme_coins;
CREATE POLICY "Users can update own meme coins"
  ON public.meme_coins FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own meme coins" ON public.meme_coins;
CREATE POLICY "Users can delete own meme coins"
  ON public.meme_coins FOR DELETE
  USING (auth.uid() = user_id);

-- Per-coin notes (journal entries scoped to a coin)
CREATE TABLE IF NOT EXISTS public.meme_coin_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coin_id uuid NOT NULL REFERENCES public.meme_coins ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE DEFAULT auth.uid(),
  content text NOT NULL,
  note_date date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.meme_coin_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own meme coin notes" ON public.meme_coin_notes;
CREATE POLICY "Users can view own meme coin notes"
  ON public.meme_coin_notes FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own meme coin notes" ON public.meme_coin_notes;
CREATE POLICY "Users can insert own meme coin notes"
  ON public.meme_coin_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own meme coin notes" ON public.meme_coin_notes;
CREATE POLICY "Users can update own meme coin notes"
  ON public.meme_coin_notes FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own meme coin notes" ON public.meme_coin_notes;
CREATE POLICY "Users can delete own meme coin notes"
  ON public.meme_coin_notes FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_meme_coins_user ON public.meme_coins (user_id);
CREATE INDEX IF NOT EXISTS idx_meme_coins_user_status ON public.meme_coins (user_id, status);
CREATE INDEX IF NOT EXISTS idx_meme_coins_user_watchlist ON public.meme_coins (user_id, is_watchlist);
CREATE INDEX IF NOT EXISTS idx_meme_coin_notes_coin ON public.meme_coin_notes (coin_id);
CREATE INDEX IF NOT EXISTS idx_meme_coin_notes_user ON public.meme_coin_notes (user_id);

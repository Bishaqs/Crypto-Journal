-- Migration 024: Forex trades table
-- Follows the same pattern as commodity_trades and stock_trades

-- ─── Forex Trades Table ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.forex_trades (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,

  -- Pair identity
  pair text NOT NULL,                               -- e.g. "EUR/USD", "GBP/JPY"
  base_currency text NOT NULL,                      -- e.g. "EUR"
  quote_currency text NOT NULL,                     -- e.g. "USD"
  pair_category text CHECK (pair_category IN (
    'major', 'minor', 'exotic'
  )),

  -- Lot sizing
  lot_type text NOT NULL DEFAULT 'standard' CHECK (lot_type IN (
    'standard', 'mini', 'micro'
  )),
  lot_size numeric NOT NULL,                        -- number of lots

  -- Trade basics
  position text NOT NULL CHECK (position IN ('long', 'short')),
  entry_price numeric NOT NULL,
  exit_price numeric,
  fees numeric DEFAULT 0,
  open_timestamp timestamptz NOT NULL,
  close_timestamp timestamptz,

  -- Forex-specific fields
  pip_value numeric,                                -- value per pip in account currency
  leverage numeric,                                 -- e.g. 50, 100
  spread numeric,                                   -- spread in pips at entry
  swap_fee numeric DEFAULT 0,                       -- overnight rollover cost
  session text CHECK (session IN (
    'london', 'new_york', 'tokyo', 'sydney', 'overlap'
  )),
  broker text,                                      -- broker name

  -- Psychology (shared with all asset types)
  emotion text,
  confidence integer CHECK (confidence BETWEEN 1 AND 10),
  setup_type text,
  process_score integer CHECK (process_score BETWEEN 1 AND 10),
  checklist jsonb DEFAULT '{}',
  review jsonb DEFAULT '{}',

  -- Notes & classification
  notes text,
  tags text[] DEFAULT '{}',
  pnl numeric,
  created_at timestamptz DEFAULT now()
);

-- ─── RLS Policies ───────────────────────────────────────────────────────────

ALTER TABLE public.forex_trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own forex trades"
  ON public.forex_trades FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own forex trades"
  ON public.forex_trades FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own forex trades"
  ON public.forex_trades FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own forex trades"
  ON public.forex_trades FOR DELETE
  USING (auth.uid() = user_id);

-- ─── Indexes ────────────────────────────────────────────────────────────────

CREATE INDEX idx_forex_trades_user ON public.forex_trades (user_id);
CREATE INDEX idx_forex_trades_open ON public.forex_trades (user_id, open_timestamp DESC);

-- ─── Add forex addon flag ───────────────────────────────────────────────────

ALTER TABLE public.user_addons ADD COLUMN IF NOT EXISTS forex boolean DEFAULT false;

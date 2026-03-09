-- Migration 023: Commodity trades table
-- Follows the same pattern as 005_dex_and_stocks.sql (stock_trades table)

-- ─── Commodity Trades Table ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.commodity_trades (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,

  -- Symbol & identity
  symbol text NOT NULL,                             -- e.g. "GC", "CL", "ZW"
  commodity_name text,                              -- e.g. "Gold", "Crude Oil", "Wheat"
  commodity_category text CHECK (commodity_category IN (
    'metals', 'energy', 'grains', 'softs', 'livestock'
  )),

  -- Contract type
  contract_type text NOT NULL DEFAULT 'futures' CHECK (contract_type IN (
    'spot', 'futures', 'options'
  )),

  -- Trade basics
  position text NOT NULL CHECK (position IN ('long', 'short')),
  entry_price numeric NOT NULL,
  exit_price numeric,
  quantity numeric NOT NULL,                        -- number of contracts
  fees numeric DEFAULT 0,
  open_timestamp timestamptz NOT NULL,
  close_timestamp timestamptz,

  -- Contract specifications
  contract_size numeric,                            -- units per contract (e.g. 100 oz gold, 1000 bbl oil)
  tick_size numeric,                                -- minimum price increment
  tick_value numeric,                               -- dollar value per tick per contract
  exchange text,                                    -- COMEX, NYMEX, CBOT, ICE, CME

  -- Futures-specific fields
  contract_month text,                              -- e.g. "2026-06" (June 2026 contract)
  expiration_date date,                             -- contract expiry date
  margin_required numeric,                          -- initial margin per contract

  -- Options fields (null for spot/futures)
  option_type text CHECK (option_type IN ('call', 'put')),
  strike_price numeric,
  premium_per_contract numeric,
  underlying_contract text,                         -- e.g. "GCM26" (Gold June 2026)

  -- Psychology (shared with crypto/stocks)
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

ALTER TABLE public.commodity_trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own commodity trades"
  ON public.commodity_trades FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own commodity trades"
  ON public.commodity_trades FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own commodity trades"
  ON public.commodity_trades FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own commodity trades"
  ON public.commodity_trades FOR DELETE
  USING (auth.uid() = user_id);

-- ─── Indexes ────────────────────────────────────────────────────────────────

CREATE INDEX idx_commodity_trades_user ON public.commodity_trades (user_id);
CREATE INDEX idx_commodity_trades_open ON public.commodity_trades (user_id, open_timestamp DESC);

-- ─── Add commodities addon flag ─────────────────────────────────────────────

ALTER TABLE public.user_addons ADD COLUMN IF NOT EXISTS commodities boolean DEFAULT false;

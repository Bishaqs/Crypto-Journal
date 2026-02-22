-- Migration 005: DEX fields on trades + Stock trades table
-- Adds decentralized exchange tracking fields to existing trades
-- Creates a separate stock_trades table for equities/options

-- ═══════════════════════════════════════════
-- Part A: DEX fields on existing trades table
-- ═══════════════════════════════════════════
ALTER TABLE trades ADD COLUMN IF NOT EXISTS trade_source text DEFAULT 'cex';
ALTER TABLE trades ADD COLUMN IF NOT EXISTS chain text;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS dex_protocol text;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS tx_hash text;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS wallet_address text;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS gas_fee numeric DEFAULT 0;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS gas_fee_native numeric DEFAULT 0;

-- ═══════════════════════════════════════════
-- Part B: Stock trades table
-- ═══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS stock_trades (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  symbol text NOT NULL,
  company_name text,
  asset_type text NOT NULL DEFAULT 'stock' CHECK (asset_type IN ('stock', 'option')),
  position text NOT NULL CHECK (position IN ('long', 'short')),
  entry_price numeric NOT NULL,
  exit_price numeric,
  quantity numeric NOT NULL,
  fees numeric DEFAULT 0,
  open_timestamp timestamptz NOT NULL,
  close_timestamp timestamptz,
  sector text,
  industry text,
  market_session text CHECK (market_session IN ('pre_market', 'regular', 'after_hours')),
  -- Options fields (null for stocks)
  option_type text CHECK (option_type IN ('call', 'put')),
  strike_price numeric,
  expiration_date date,
  premium_per_contract numeric,
  contracts integer,
  underlying_symbol text,
  -- Psychology (shared with crypto trades)
  emotion text,
  confidence integer CHECK (confidence BETWEEN 1 AND 10),
  setup_type text,
  process_score integer CHECK (process_score BETWEEN 1 AND 10),
  checklist jsonb DEFAULT '{}',
  review jsonb DEFAULT '{}',
  notes text,
  tags text[] DEFAULT '{}',
  pnl numeric,
  created_at timestamptz DEFAULT now()
);

-- Row Level Security
ALTER TABLE stock_trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own stock trades"
  ON stock_trades FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stock trades"
  ON stock_trades FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stock trades"
  ON stock_trades FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own stock trades"
  ON stock_trades FOR DELETE
  USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════
-- Part C: User add-ons table
-- ═══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS user_addons (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL UNIQUE,
  stocks boolean DEFAULT false,
  purchased_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_addons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own addons"
  ON user_addons FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own addons"
  ON user_addons FOR UPDATE
  USING (auth.uid() = user_id);

-- Migration 032: Add stop_loss and profit_target to all trade tables

-- Crypto trades
ALTER TABLE public.trades
  ADD COLUMN IF NOT EXISTS stop_loss numeric,
  ADD COLUMN IF NOT EXISTS profit_target numeric;

-- Stock trades
ALTER TABLE public.stock_trades
  ADD COLUMN IF NOT EXISTS stop_loss numeric,
  ADD COLUMN IF NOT EXISTS profit_target numeric;

-- Commodity trades
ALTER TABLE public.commodity_trades
  ADD COLUMN IF NOT EXISTS stop_loss numeric,
  ADD COLUMN IF NOT EXISTS profit_target numeric;

-- Forex trades
ALTER TABLE public.forex_trades
  ADD COLUMN IF NOT EXISTS stop_loss numeric,
  ADD COLUMN IF NOT EXISTS profit_target numeric;

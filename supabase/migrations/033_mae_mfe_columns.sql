-- Add MAE/MFE tracking columns to all trade tables
-- MAE = Maximum Adverse Excursion (worst price during trade)
-- MFE = Maximum Favorable Excursion (best price during trade)

ALTER TABLE trades
  ADD COLUMN IF NOT EXISTS price_mae DECIMAL,
  ADD COLUMN IF NOT EXISTS price_mfe DECIMAL,
  ADD COLUMN IF NOT EXISTS mfe_timestamp TIMESTAMPTZ;

ALTER TABLE stock_trades
  ADD COLUMN IF NOT EXISTS price_mae DECIMAL,
  ADD COLUMN IF NOT EXISTS price_mfe DECIMAL,
  ADD COLUMN IF NOT EXISTS mfe_timestamp TIMESTAMPTZ;

ALTER TABLE commodity_trades
  ADD COLUMN IF NOT EXISTS price_mae DECIMAL,
  ADD COLUMN IF NOT EXISTS price_mfe DECIMAL,
  ADD COLUMN IF NOT EXISTS mfe_timestamp TIMESTAMPTZ;

ALTER TABLE forex_trades
  ADD COLUMN IF NOT EXISTS price_mae DECIMAL,
  ADD COLUMN IF NOT EXISTS price_mfe DECIMAL,
  ADD COLUMN IF NOT EXISTS mfe_timestamp TIMESTAMPTZ;

-- Add mae_timestamp column to all 4 trade tables
-- This records when the Maximum Adverse Excursion (worst price) occurred

ALTER TABLE trades ADD COLUMN IF NOT EXISTS mae_timestamp TIMESTAMPTZ;
ALTER TABLE stock_trades ADD COLUMN IF NOT EXISTS mae_timestamp TIMESTAMPTZ;
ALTER TABLE commodity_trades ADD COLUMN IF NOT EXISTS mae_timestamp TIMESTAMPTZ;
ALTER TABLE forex_trades ADD COLUMN IF NOT EXISTS mae_timestamp TIMESTAMPTZ;

-- Add sector classification field to trades table
ALTER TABLE trades ADD COLUMN IF NOT EXISTS sector text;

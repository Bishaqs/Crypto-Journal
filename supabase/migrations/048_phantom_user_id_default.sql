-- Fix: phantom_trades INSERT fails because user_id has no DEFAULT
-- The trades table (001) uses DEFAULT auth.uid() but phantom_trades (041) omitted it
ALTER TABLE phantom_trades ALTER COLUMN user_id SET DEFAULT auth.uid();

-- 042_playbooks.sql
-- Playbook system: user-defined trading setups with entry/exit rules

CREATE TABLE IF NOT EXISTS playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Identity
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  asset_class TEXT NOT NULL DEFAULT 'all'
    CHECK (asset_class IN ('all', 'crypto', 'stocks', 'commodities', 'forex')),

  -- Rules
  entry_rules JSONB NOT NULL DEFAULT '[]'::jsonb,
  exit_rules JSONB NOT NULL DEFAULT '[]'::jsonb,
  stop_loss_strategy TEXT,
  risk_per_trade TEXT,

  -- Classification
  timeframes TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',

  -- State
  is_active BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE playbooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own playbooks"
  ON playbooks FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own playbooks"
  ON playbooks FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own playbooks"
  ON playbooks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own playbooks"
  ON playbooks FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_playbooks_user_id ON playbooks(user_id);
CREATE INDEX idx_playbooks_active ON playbooks(user_id, is_active);

-- Add playbook_id FK to all trade tables
ALTER TABLE trades ADD COLUMN IF NOT EXISTS playbook_id UUID REFERENCES playbooks(id) ON DELETE SET NULL;
ALTER TABLE stock_trades ADD COLUMN IF NOT EXISTS playbook_id UUID REFERENCES playbooks(id) ON DELETE SET NULL;
ALTER TABLE commodity_trades ADD COLUMN IF NOT EXISTS playbook_id UUID REFERENCES playbooks(id) ON DELETE SET NULL;
ALTER TABLE forex_trades ADD COLUMN IF NOT EXISTS playbook_id UUID REFERENCES playbooks(id) ON DELETE SET NULL;
ALTER TABLE phantom_trades ADD COLUMN IF NOT EXISTS playbook_id UUID REFERENCES playbooks(id) ON DELETE SET NULL;

-- Partial indexes on trade tables for playbook_id (only index non-null values)
CREATE INDEX IF NOT EXISTS idx_trades_playbook ON trades(playbook_id) WHERE playbook_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stock_trades_playbook ON stock_trades(playbook_id) WHERE playbook_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_commodity_trades_playbook ON commodity_trades(playbook_id) WHERE playbook_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_forex_trades_playbook ON forex_trades(playbook_id) WHERE playbook_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_phantom_trades_playbook ON phantom_trades(playbook_id) WHERE playbook_id IS NOT NULL;

-- Trading Rules Engine: user-defined rules + automated violation tracking

CREATE TABLE IF NOT EXISTS public.trading_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE DEFAULT auth.uid(),
  name text NOT NULL,
  description text,
  rule_type text NOT NULL CHECK (rule_type IN (
    'max_trades_per_day', 'stop_after_consecutive_losses',
    'min_readiness_score', 'max_loss_per_day',
    'no_trading_after_time', 'no_trading_before_time',
    'cooldown_after_loss_minutes', 'custom'
  )),
  parameters jsonb NOT NULL DEFAULT '{}',
  active boolean NOT NULL DEFAULT true,
  suggested_by text, -- e.g. 'archetype:tilt', 'insight:emotion', null for user-created
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.trading_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trading rules"
  ON public.trading_rules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trading rules"
  ON public.trading_rules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trading rules"
  ON public.trading_rules FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own trading rules"
  ON public.trading_rules FOR DELETE
  USING (auth.uid() = user_id);

-- Rule violations: tracked automatically when trades break rules
CREATE TABLE IF NOT EXISTS public.rule_violations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE DEFAULT auth.uid(),
  rule_id uuid NOT NULL REFERENCES public.trading_rules ON DELETE CASCADE,
  trade_id uuid REFERENCES public.trades ON DELETE SET NULL,
  violation_date date NOT NULL,
  pnl_impact numeric,
  details text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rule_violations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rule violations"
  ON public.rule_violations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rule violations"
  ON public.rule_violations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own rule violations"
  ON public.rule_violations FOR DELETE
  USING (auth.uid() = user_id);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_rule_violations_rule_id ON public.rule_violations (rule_id);
CREATE INDEX IF NOT EXISTS idx_rule_violations_date ON public.rule_violations (user_id, violation_date);
CREATE INDEX IF NOT EXISTS idx_trading_rules_user ON public.trading_rules (user_id);

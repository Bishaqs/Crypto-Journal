-- ============================================================
-- Migration 030: Broker connections & sync logs
-- Stores encrypted API credentials for auto-sync feature
-- ============================================================

-- Broker connections table
CREATE TABLE IF NOT EXISTS public.broker_connections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,

  -- Broker identity
  broker_name text NOT NULL,
  broker_type text NOT NULL CHECK (broker_type IN ('crypto_exchange', 'stock_broker', 'dex', 'forex_broker')),
  account_label text,

  -- Credentials (encrypted at application layer before storage)
  encrypted_api_key text NOT NULL,
  encrypted_api_secret text NOT NULL,
  encryption_iv text NOT NULL,

  -- Sync configuration
  target_table text NOT NULL DEFAULT 'trades' CHECK (target_table IN ('trades', 'stock_trades', 'commodity_trades', 'forex_trades')),
  sync_frequency text DEFAULT 'manual' CHECK (sync_frequency IN ('manual', 'hourly', 'daily', 'weekly')),
  timezone text DEFAULT 'UTC',
  currency text DEFAULT 'USD',
  auto_sync_enabled boolean DEFAULT false,

  -- Status tracking
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'error', 'paused', 'disconnected')),
  last_sync_at timestamptz,
  total_trades_synced integer DEFAULT 0,
  last_error text,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Sync logs table
CREATE TABLE IF NOT EXISTS public.sync_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  connection_id uuid REFERENCES public.broker_connections ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,

  sync_type text NOT NULL CHECK (sync_type IN ('manual', 'scheduled', 'initial')),
  status text NOT NULL CHECK (status IN ('started', 'success', 'partial', 'failed')),

  trades_fetched integer DEFAULT 0,
  trades_imported integer DEFAULT 0,
  trades_skipped integer DEFAULT 0,
  trades_failed integer DEFAULT 0,

  error_message text,
  duration_ms integer,

  started_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE public.broker_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

-- broker_connections policies
CREATE POLICY "Users can view own connections"
  ON public.broker_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own connections"
  ON public.broker_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own connections"
  ON public.broker_connections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own connections"
  ON public.broker_connections FOR DELETE
  USING (auth.uid() = user_id);

-- sync_logs policies
CREATE POLICY "Users can view own sync logs"
  ON public.sync_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sync logs"
  ON public.sync_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX idx_broker_connections_user ON public.broker_connections (user_id);
CREATE INDEX idx_sync_logs_connection ON public.sync_logs (connection_id, started_at DESC);
CREATE INDEX idx_sync_logs_user ON public.sync_logs (user_id, started_at DESC);

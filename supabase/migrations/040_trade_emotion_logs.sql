-- ============================================================
-- Stargate — Trade Emotion Logs
-- Follow-up and post-trade emotions for multi-phase tracking
-- ============================================================

create table if not exists public.trade_emotion_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),

  -- Which trade this emotion belongs to
  trade_id uuid not null,
  trade_table text not null default 'trades'
    check (trade_table in ('trades', 'stock_trades', 'commodity_trades', 'forex_trades')),

  -- The emotion (uses SIMPLE_EMOTIONS / ADVANCED_EMOTIONS vocabulary)
  emotion text not null,

  -- Optional note explaining the emotion
  note text,

  -- Phase: follow_up (during open trade) or post (when closing)
  phase text not null check (phase in ('follow_up', 'post')),

  created_at timestamptz default now()
);

alter table public.trade_emotion_logs enable row level security;

create policy "Users can view their own emotion logs"
  on public.trade_emotion_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert their own emotion logs"
  on public.trade_emotion_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own emotion logs"
  on public.trade_emotion_logs for update
  using (auth.uid() = user_id);

create policy "Users can delete their own emotion logs"
  on public.trade_emotion_logs for delete
  using (auth.uid() = user_id);

-- Index for fast lookups by trade
create index idx_emotion_logs_trade on public.trade_emotion_logs(trade_id, trade_table);
create index idx_emotion_logs_user on public.trade_emotion_logs(user_id);

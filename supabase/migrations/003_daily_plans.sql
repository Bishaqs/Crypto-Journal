-- ============================================================
-- Stargate v3.0 — Daily Plans Table
-- ============================================================
-- Run this SQL in your Supabase dashboard: SQL Editor > New Query

create table if not exists public.daily_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),
  date date not null,
  watchlist text[] default '{}',
  max_trades smallint,
  max_loss numeric,
  session_goal text,
  notes text,
  eod_review text,
  created_at timestamptz default now(),
  unique(user_id, date)
);

alter table public.daily_plans enable row level security;

create policy "Users can view their own plans"
  on public.daily_plans for select
  using (auth.uid() = user_id);

create policy "Users can insert their own plans"
  on public.daily_plans for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own plans"
  on public.daily_plans for update
  using (auth.uid() = user_id);

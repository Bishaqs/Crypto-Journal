-- ============================================================
-- Crypto Journal — Database Schema
-- ============================================================
-- Run this SQL in your Supabase dashboard: SQL Editor > New Query
-- This creates all the tables and security policies you need.

-- 1. TRADES TABLE
-- Every trade you make gets recorded here.
create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),
  symbol text not null,
  position text not null check (position in ('long', 'short')),
  entry_price numeric not null,
  exit_price numeric,
  quantity numeric not null,
  fees numeric default 0,
  open_timestamp timestamptz not null,
  close_timestamp timestamptz,
  notes text,
  tags text[] default '{}',
  pnl numeric,
  created_at timestamptz default now()
);

-- 2. JOURNAL NOTES TABLE
-- Your trading journal entries, observations, and lessons.
create table if not exists public.journal_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),
  title text,
  content text not null,
  tags text[] default '{}',
  trade_id uuid references public.trades,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. ACCOUNT SNAPSHOTS TABLE
-- Daily snapshots for the equity curve (balance over time).
create table if not exists public.account_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),
  date date not null,
  balance numeric not null,
  realized_pnl numeric default 0,
  unrealized_pnl numeric default 0,
  created_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
-- This is critical: it ensures users can ONLY see their own data.
-- Without this, anyone could read everyone's trades.

alter table public.trades enable row level security;
alter table public.journal_notes enable row level security;
alter table public.account_snapshots enable row level security;

-- Trades policies
create policy "Users can view their own trades"
  on public.trades for select
  using (auth.uid() = user_id);

create policy "Users can insert their own trades"
  on public.trades for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own trades"
  on public.trades for update
  using (auth.uid() = user_id);

create policy "Users can delete their own trades"
  on public.trades for delete
  using (auth.uid() = user_id);

-- Journal notes policies
create policy "Users can view their own notes"
  on public.journal_notes for select
  using (auth.uid() = user_id);

create policy "Users can insert their own notes"
  on public.journal_notes for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own notes"
  on public.journal_notes for update
  using (auth.uid() = user_id);

create policy "Users can delete their own notes"
  on public.journal_notes for delete
  using (auth.uid() = user_id);

-- Account snapshots policies
create policy "Users can view their own snapshots"
  on public.account_snapshots for select
  using (auth.uid() = user_id);

create policy "Users can insert their own snapshots"
  on public.account_snapshots for insert
  with check (auth.uid() = user_id);

-- ============================================================
-- Stargate v2.0 — Psychology & Habit Formation
-- ============================================================
-- Run this SQL in your Supabase dashboard: SQL Editor > New Query

-- 1. ADD PSYCHOLOGY COLUMNS TO TRADES
alter table public.trades add column if not exists emotion text;
alter table public.trades add column if not exists confidence smallint;
alter table public.trades add column if not exists setup_type text;
alter table public.trades add column if not exists process_score smallint;
alter table public.trades add column if not exists checklist jsonb;
alter table public.trades add column if not exists review jsonb;

-- 2. DAILY CHECK-INS TABLE
create table if not exists public.daily_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),
  date date not null,
  mood smallint not null,
  energy smallint,
  focus text,
  traffic_light text not null check (traffic_light in ('green', 'yellow', 'red')),
  created_at timestamptz default now(),
  unique(user_id, date)
);

alter table public.daily_checkins enable row level security;

create policy "Users can view their own checkins"
  on public.daily_checkins for select
  using (auth.uid() = user_id);

create policy "Users can insert their own checkins"
  on public.daily_checkins for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own checkins"
  on public.daily_checkins for update
  using (auth.uid() = user_id);

-- 3. USER STREAKS TABLE
create table if not exists public.user_streaks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),
  current_streak int default 0,
  longest_streak int default 0,
  last_active_date date,
  grace_days_used int default 0,
  updated_at timestamptz default now(),
  unique(user_id)
);

alter table public.user_streaks enable row level security;

create policy "Users can view their own streaks"
  on public.user_streaks for select
  using (auth.uid() = user_id);

create policy "Users can insert their own streaks"
  on public.user_streaks for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own streaks"
  on public.user_streaks for update
  using (auth.uid() = user_id);

-- ============================================================
-- Stargate v4.0 — Behavioral Logs Table
-- Structured emotion check-ins with triggers, biases, and
-- traffic light readiness assessment
-- ============================================================

create table if not exists public.behavioral_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),

  -- Primary emotion
  emotion text not null,

  -- Emotional intensity (1-5)
  intensity smallint not null check (intensity between 1 and 5),

  -- What triggered this emotion
  trigger text,
  trigger_detail text,

  -- Physical state (array of strings)
  physical_state text[] default '{}',

  -- Behavioral biases detected (array of bias names)
  biases text[] default '{}',

  -- Traffic light: am I fit to trade?
  traffic_light text not null check (traffic_light in ('green', 'yellow', 'red')),

  -- Quick note
  note text,

  -- Auto-generated
  created_at timestamptz default now()
);

alter table public.behavioral_logs enable row level security;

create policy "Users can view their own behavioral logs"
  on public.behavioral_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert their own behavioral logs"
  on public.behavioral_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own behavioral logs"
  on public.behavioral_logs for update
  using (auth.uid() = user_id);

create policy "Users can delete their own behavioral logs"
  on public.behavioral_logs for delete
  using (auth.uid() = user_id);

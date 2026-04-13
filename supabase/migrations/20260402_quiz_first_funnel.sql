-- Quiz-First Funnel: mini quiz results, deep quiz results, funnel analytics
-- Existing quiz_results table is preserved (legacy data).

-- ─── Mini Quiz Results ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.mini_quiz_results (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id text NOT NULL,
  answers jsonb NOT NULL DEFAULT '{}',
  archetype text NOT NULL,
  dimension_scores jsonb NOT NULL DEFAULT '{}',
  ip_address text,
  waitlist_signup_id uuid REFERENCES public.waitlist_signups(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_mini_quiz_archetype ON public.mini_quiz_results(archetype);
CREATE INDEX idx_mini_quiz_session ON public.mini_quiz_results(session_id);

ALTER TABLE public.mini_quiz_results ENABLE ROW LEVEL SECURITY;

-- Public can insert (anonymous quiz takers), no one can select without service role
CREATE POLICY "Anyone can insert mini quiz results"
  ON public.mini_quiz_results FOR INSERT
  WITH CHECK (true);

-- ─── Deep Quiz Results ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.deep_quiz_results (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  waitlist_signup_id uuid REFERENCES public.waitlist_signups(id) NOT NULL,
  mini_archetype text NOT NULL,
  answers jsonb NOT NULL DEFAULT '{}',
  scores jsonb NOT NULL DEFAULT '{}',
  advice jsonb,
  protocol jsonb,
  protocol_generated_at timestamptz,
  unsubscribe_token uuid DEFAULT gen_random_uuid() NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_deep_quiz_email ON public.deep_quiz_results(email);
CREATE INDEX idx_deep_quiz_waitlist ON public.deep_quiz_results(waitlist_signup_id);

ALTER TABLE public.deep_quiz_results ENABLE ROW LEVEL SECURITY;

-- ─── Funnel Events (Analytics) ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.funnel_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id text NOT NULL,
  event_type text NOT NULL CHECK (event_type IN (
    'mini_quiz_start',
    'mini_quiz_complete',
    'archetype_reveal_view',
    'archetype_share',
    'waitlist_signup_from_quiz',
    'deep_quiz_start',
    'deep_quiz_complete'
  )),
  archetype text,
  metadata jsonb DEFAULT '{}',
  ip_address text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_funnel_session ON public.funnel_events(session_id);
CREATE INDEX idx_funnel_event_type ON public.funnel_events(event_type);
CREATE INDEX idx_funnel_created ON public.funnel_events(created_at);

ALTER TABLE public.funnel_events ENABLE ROW LEVEL SECURITY;

-- Public can insert events, no one can select without service role
CREATE POLICY "Anyone can insert funnel events"
  ON public.funnel_events FOR INSERT
  WITH CHECK (true);

-- ─── Extend waitlist_signups with archetype data ────────────────────────────

ALTER TABLE public.waitlist_signups
  ADD COLUMN IF NOT EXISTS mini_archetype text,
  ADD COLUMN IF NOT EXISTS mini_quiz_result_id uuid REFERENCES public.mini_quiz_results(id);

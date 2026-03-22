-- Quiz results table (public, no auth required)
CREATE TABLE IF NOT EXISTS public.quiz_results (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  answers jsonb NOT NULL DEFAULT '{}',
  archetype text NOT NULL,
  scores jsonb NOT NULL DEFAULT '{}',
  waitlist_signup_id uuid REFERENCES public.waitlist_signups(id),
  unsubscribe_token uuid DEFAULT gen_random_uuid() NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quiz_email ON public.quiz_results(email);
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;
-- No public SELECT — admin access via service role only

-- Email sequence tracking
CREATE TABLE IF NOT EXISTS public.email_sequences (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  quiz_result_id uuid REFERENCES public.quiz_results(id),
  sequence_name text NOT NULL DEFAULT 'nurture',
  day_index integer NOT NULL,
  sent_at timestamptz,
  scheduled_for timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'unsubscribed')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(quiz_result_id, day_index)
);

CREATE INDEX IF NOT EXISTS idx_email_seq_pending
  ON public.email_sequences(status, scheduled_for)
  WHERE status = 'pending';
ALTER TABLE public.email_sequences ENABLE ROW LEVEL SECURITY;

-- Email unsubscribe tracking (GDPR)
CREATE TABLE IF NOT EXISTS public.email_unsubscribes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL UNIQUE,
  unsubscribed_at timestamptz DEFAULT now()
);

ALTER TABLE public.email_unsubscribes ENABLE ROW LEVEL SECURITY;

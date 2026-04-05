-- Trading Readiness Score: daily cache + historical tracking
-- Computed client-side, persisted for trend analysis

CREATE TABLE IF NOT EXISTS public.readiness_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE DEFAULT auth.uid(),
  date date NOT NULL,
  score smallint NOT NULL CHECK (score BETWEEN 1 AND 10),
  components jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE public.readiness_scores ENABLE ROW LEVEL SECURITY;

-- Users can only see/manage their own scores
CREATE POLICY "Users can view own readiness scores"
  ON public.readiness_scores FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own readiness scores"
  ON public.readiness_scores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own readiness scores"
  ON public.readiness_scores FOR UPDATE
  USING (auth.uid() = user_id);

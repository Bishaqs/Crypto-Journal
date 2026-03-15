-- ─── Psychology Tiers Migration ──────────────────────────────────────────────
-- Adds three-tier psychology system: simple / advanced / expert

-- 1. User preferences table (stores tier selection)
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE DEFAULT auth.uid(),
  psychology_tier text NOT NULL DEFAULT 'simple' CHECK (psychology_tier IN ('simple', 'advanced', 'expert')),
  preferences jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own preferences"
  ON public.user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON public.user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON public.user_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. Psychology profiles table (Expert tier assessment)
CREATE TABLE IF NOT EXISTS public.psychology_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE DEFAULT auth.uid(),
  version integer NOT NULL DEFAULT 1,

  -- Risk personality
  risk_personality text CHECK (risk_personality IN ('conservative_guardian', 'calculated_risk_taker', 'aggressive_hunter', 'adaptive_chameleon')),
  risk_scenario_responses jsonb NOT NULL DEFAULT '{}',

  -- Money scripts (1-5 aggregate scores)
  money_avoidance numeric(3,1),
  money_worship numeric(3,1),
  money_status numeric(3,1),
  money_vigilance numeric(3,1),
  money_script_responses jsonb NOT NULL DEFAULT '{}',

  -- Decision style
  decision_style text CHECK (decision_style IN ('intuitive', 'analytical', 'hybrid')),
  decision_style_responses jsonb NOT NULL DEFAULT '{}',

  -- Position attachment
  position_attachment_score numeric(3,1),
  attachment_responses jsonb NOT NULL DEFAULT '{}',

  -- Self-concept
  self_concept_text text,
  self_concept_identity text CHECK (self_concept_identity IN ('disciplined_executor', 'pattern_hunter', 'contrarian', 'survivor', 'student')),

  -- Loss aversion
  loss_aversion_coefficient numeric(4,2),
  loss_aversion_responses jsonb NOT NULL DEFAULT '{}',

  -- Metadata
  completed_at timestamptz,
  reassess_after date,
  created_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE(user_id, version)
);

ALTER TABLE public.psychology_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profiles"
  ON public.psychology_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profiles"
  ON public.psychology_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profiles"
  ON public.psychology_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Expert session logs table
CREATE TABLE IF NOT EXISTS public.expert_session_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE DEFAULT auth.uid(),
  session_date date NOT NULL,

  -- Somatic state
  somatic_areas text[] NOT NULL DEFAULT '{}',
  somatic_intensity text CHECK (somatic_intensity IN ('light', 'moderate', 'strong')),

  -- Session psychology
  flow_state text CHECK (flow_state IN ('forced', 'effortful', 'neutral', 'smooth', 'flow')),
  cognitive_distortions text[] NOT NULL DEFAULT '{}',
  defense_mechanisms text[] NOT NULL DEFAULT '{}',
  internal_dialogue text,

  -- Decision tracking
  decisions_count integer,
  decision_quality_trend text CHECK (decision_quality_trend IN ('improving', 'stable', 'declining')),

  created_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE(user_id, session_date)
);

ALTER TABLE public.expert_session_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own session logs"
  ON public.expert_session_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own session logs"
  ON public.expert_session_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own session logs"
  ON public.expert_session_logs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Extend behavioral_logs with advanced/expert fields
ALTER TABLE public.behavioral_logs
  ADD COLUMN IF NOT EXISTS cognitive_load smallint CHECK (cognitive_load BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS sleep_quality smallint CHECK (sleep_quality BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS narrative_attachment smallint CHECK (narrative_attachment BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS environment_context jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS psychology_tier text NOT NULL DEFAULT 'simple' CHECK (psychology_tier IN ('simple', 'advanced', 'expert'));

-- 5. Extend daily_checkins with advanced fields
ALTER TABLE public.daily_checkins
  ADD COLUMN IF NOT EXISTS sleep_quality smallint CHECK (sleep_quality BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS cognitive_load smallint CHECK (cognitive_load BETWEEN 1 AND 5);

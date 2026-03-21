-- User onboarding responses — track questionnaire answers for analytics and personalization
CREATE TABLE IF NOT EXISTS public.user_onboarding (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  experience_level TEXT,
  account_type TEXT,
  broker TEXT,
  instruments TEXT[],
  goals TEXT[],
  risk_tolerance TEXT,
  preferred_analytics TEXT[],
  referral TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own onboarding" ON public.user_onboarding
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own onboarding" ON public.user_onboarding
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own onboarding" ON public.user_onboarding
  FOR UPDATE USING (auth.uid() = user_id);

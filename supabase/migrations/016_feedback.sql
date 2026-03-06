-- Migration 016: User feedback
-- Run manually in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS feedback (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL DEFAULT auth.uid(),
  category text NOT NULL DEFAULT 'general'
    CHECK (category IN ('bug', 'feature', 'general')),
  message text NOT NULL
    CHECK (char_length(message) >= 10 AND char_length(message) <= 2000),
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_feedback_created ON feedback(created_at DESC);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Users can view their own feedback
CREATE POLICY "Users can view own feedback"
  ON feedback FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own feedback
CREATE POLICY "Users can insert own feedback"
  ON feedback FOR INSERT WITH CHECK (auth.uid() = user_id);

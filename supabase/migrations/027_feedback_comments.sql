-- ============================================================
-- 027: Feedback Comments + Public Feedback Visibility
-- Adds reply/comment system on feedback items,
-- makes all feedback visible to authenticated users,
-- and adds display_name for attribution.
-- ============================================================

-- 1. Add display_name to feedback table
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS display_name text;

-- 2. Create feedback_comments table
CREATE TABLE IF NOT EXISTS feedback_comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  feedback_id uuid REFERENCES feedback(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL DEFAULT auth.uid(),
  message text NOT NULL
    CHECK (char_length(message) >= 1 AND char_length(message) <= 1000),
  display_name text,
  is_owner_reply boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feedback_comments_feedback ON feedback_comments(feedback_id);
CREATE INDEX IF NOT EXISTS idx_feedback_comments_created ON feedback_comments(created_at DESC);

-- 3. Enable RLS on feedback_comments
ALTER TABLE feedback_comments ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read all comments
CREATE POLICY "Authenticated users can read all comments"
  ON feedback_comments FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Users can insert their own comments
CREATE POLICY "Users can insert own comments"
  ON feedback_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 4. Update feedback RLS: make all feedback visible to authenticated users
-- Drop the old restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view own feedback" ON feedback;

-- Create new public SELECT policy
CREATE POLICY "Authenticated users can read all feedback"
  ON feedback FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Keep existing INSERT policy (users can only insert their own)
-- It was created in 016_feedback.sql as "Users can insert own feedback"

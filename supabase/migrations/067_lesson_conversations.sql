-- Link AI conversations to education lessons
-- Enables resumable lesson conversations and one-conversation-per-lesson constraint

ALTER TABLE ai_conversations
  ADD COLUMN IF NOT EXISTS lesson_course_slug TEXT,
  ADD COLUMN IF NOT EXISTS lesson_slug TEXT;

-- Ensure only one conversation per user per lesson
CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_conversations_lesson
  ON ai_conversations(user_id, lesson_course_slug, lesson_slug)
  WHERE lesson_course_slug IS NOT NULL AND lesson_slug IS NOT NULL;

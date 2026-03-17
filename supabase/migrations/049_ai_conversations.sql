-- Migration 049: AI Coach Conversations, Messages, and Memories
-- Adds persistent chat history and cross-session memory for the Nova AI Coach.

-- ============================================================
-- Table 1: ai_conversations — conversation metadata
-- ============================================================
CREATE TABLE ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Chat',
  model TEXT,
  message_count INTEGER NOT NULL DEFAULT 0,
  summary TEXT,
  summary_through_index INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations"
  ON ai_conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own conversations"
  ON ai_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own conversations"
  ON ai_conversations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own conversations"
  ON ai_conversations FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX idx_ai_conversations_updated ON ai_conversations(user_id, updated_at DESC);

-- ============================================================
-- Table 2: ai_messages — individual chat messages
-- ============================================================
CREATE TABLE ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  message_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages"
  ON ai_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own messages"
  ON ai_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own messages"
  ON ai_messages FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_ai_messages_conversation ON ai_messages(conversation_id, message_index);
CREATE INDEX idx_ai_messages_user_id ON ai_messages(user_id);

-- ============================================================
-- Table 3: ai_memories — facts Nova remembers across sessions
-- ============================================================
CREATE TABLE ai_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'pattern', 'commitment', 'progress', 'preference')),
  source_conversation_id UUID REFERENCES ai_conversations(id) ON DELETE SET NULL,
  source_message_index INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE ai_memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own memories"
  ON ai_memories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own memories"
  ON ai_memories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own memories"
  ON ai_memories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own memories"
  ON ai_memories FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_ai_memories_user_active ON ai_memories(user_id, is_active);

-- ============================================================
-- Auto-title trigger: set title from first user message,
-- always increment message_count and update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION auto_title_conversation()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-title from first user message
  IF NEW.role = 'user' AND NEW.message_index = 0 THEN
    UPDATE ai_conversations
      SET title = LEFT(NEW.content, 60),
          message_count = message_count + 1,
          updated_at = now()
      WHERE id = NEW.conversation_id
        AND title = 'New Chat';
    -- If title was already changed (user renamed), just update count
    IF NOT FOUND THEN
      UPDATE ai_conversations
        SET message_count = message_count + 1,
            updated_at = now()
        WHERE id = NEW.conversation_id;
    END IF;
  ELSE
    UPDATE ai_conversations
      SET message_count = message_count + 1,
          updated_at = now()
      WHERE id = NEW.conversation_id;
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Don't block message insertion if trigger fails
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_ai_message_insert
  AFTER INSERT ON ai_messages
  FOR EACH ROW EXECUTE FUNCTION auto_title_conversation();

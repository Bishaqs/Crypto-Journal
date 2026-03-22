-- Nova Journal Memories: source tracking + expanded categories
-- Enables memory extraction from journal entries, not just conversations

-- Source tracking: where did this memory come from?
ALTER TABLE ai_memories ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'conversation'
  CHECK (source_type IN ('conversation', 'journal', 'pattern_snapshot', 'manual'));
ALTER TABLE ai_memories ADD COLUMN IF NOT EXISTS source_note_id UUID REFERENCES journal_notes(id) ON DELETE SET NULL;

-- Expand categories to include 'insight' (journal-discovered patterns) and 'snapshot' (future: trade pattern snapshots)
ALTER TABLE ai_memories DROP CONSTRAINT IF EXISTS ai_memories_category_check;
ALTER TABLE ai_memories ADD CONSTRAINT ai_memories_category_check
  CHECK (category IN ('general', 'pattern', 'commitment', 'progress', 'preference', 'insight', 'snapshot'));

-- Index for filtering by source type
CREATE INDEX IF NOT EXISTS idx_ai_memories_source_type ON ai_memories(user_id, source_type) WHERE is_active = true;

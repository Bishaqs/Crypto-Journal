-- Nova Memory Enhancements: decay tracking + proactive nudges
-- Run in Supabase SQL Editor after applying

-- ai_memories: add decay/relevance tracking columns
ALTER TABLE ai_memories ADD COLUMN IF NOT EXISTS last_referenced_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE ai_memories ADD COLUMN IF NOT EXISTS relevance_score REAL DEFAULT 1.0;

-- nova_nudges: track proactive nudge state per user
CREATE TABLE IF NOT EXISTS nova_nudges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nudge_type TEXT NOT NULL,
  trigger_data JSONB,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'dismissed', 'snoozed', 'clicked')),
  snoozed_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE nova_nudges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own nudges"
  ON nova_nudges FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_nova_nudges_user ON nova_nudges(user_id, status);

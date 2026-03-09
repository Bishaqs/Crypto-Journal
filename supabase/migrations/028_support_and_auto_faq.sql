-- ============================================================
-- 028: Support Tickets + Auto-FAQ Pipeline
-- Adds live support chat system and user-submitted FAQ pipeline.
-- Run manually in Supabase SQL Editor.
-- ============================================================

-- 1. Support tickets
CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL DEFAULT auth.uid(),
  subject text NOT NULL CHECK (char_length(subject) BETWEEN 3 AND 200),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'closed')),
  display_name text,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created ON support_tickets(created_at DESC);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Users can view their own tickets
CREATE POLICY "Users can view own tickets"
  ON support_tickets FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own tickets
CREATE POLICY "Users can insert own tickets"
  ON support_tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 2. Support messages
CREATE TABLE IF NOT EXISTS support_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id uuid REFERENCES support_tickets(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL DEFAULT auth.uid(),
  message text NOT NULL CHECK (char_length(message) BETWEEN 1 AND 2000),
  display_name text,
  is_owner_reply boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_messages_ticket ON support_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_created ON support_messages(created_at ASC);

ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages on their own tickets
CREATE POLICY "Users can view own ticket messages"
  ON support_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE support_tickets.id = support_messages.ticket_id
      AND support_tickets.user_id = auth.uid()
    )
  );

-- Users can insert messages on their own tickets
CREATE POLICY "Users can insert own ticket messages"
  ON support_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. Submitted questions (auto-FAQ pipeline)
CREATE TABLE IF NOT EXISTS submitted_questions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL DEFAULT auth.uid(),
  question text NOT NULL CHECK (char_length(question) BETWEEN 5 AND 500),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'published')),
  display_name text,
  created_at timestamptz DEFAULT now(),
  reviewed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_submitted_questions_status ON submitted_questions(status);
CREATE INDEX IF NOT EXISTS idx_submitted_questions_created ON submitted_questions(created_at DESC);

ALTER TABLE submitted_questions ENABLE ROW LEVEL SECURITY;

-- Users can view their own submitted questions
CREATE POLICY "Users can view own questions"
  ON submitted_questions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can submit their own questions
CREATE POLICY "Users can insert own questions"
  ON submitted_questions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 4. Dynamic FAQs (admin-curated from submissions)
CREATE TABLE IF NOT EXISTS dynamic_faqs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  question text NOT NULL,
  answer text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  tags text[] DEFAULT '{}',
  source_question_id uuid REFERENCES submitted_questions(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dynamic_faqs_category ON dynamic_faqs(category);
CREATE INDEX IF NOT EXISTS idx_dynamic_faqs_created ON dynamic_faqs(created_at DESC);

ALTER TABLE dynamic_faqs ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read dynamic FAQs
CREATE POLICY "Authenticated users can read dynamic FAQs"
  ON dynamic_faqs FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- 5. Enable Supabase Realtime on support_messages for live chat
ALTER PUBLICATION supabase_realtime ADD TABLE support_messages;

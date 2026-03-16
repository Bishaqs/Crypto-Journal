-- Migration 047: Many-to-many relationship between journal notes and trades
-- Replaces the single trade_id column on journal_notes with a junction table

-- 1. Create the junction table
CREATE TABLE IF NOT EXISTS public.journal_note_trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id uuid NOT NULL REFERENCES public.journal_notes(id) ON DELETE CASCADE,
  trade_id uuid NOT NULL,
  trade_asset_type text NOT NULL DEFAULT 'crypto',
  user_id uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now(),

  UNIQUE (note_id, trade_id)
);

-- 2. Enable RLS
ALTER TABLE public.journal_note_trades ENABLE ROW LEVEL SECURITY;

-- 3. RLS policies
CREATE POLICY "Users can view their own note-trade links"
  ON public.journal_note_trades FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own note-trade links"
  ON public.journal_note_trades FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own note-trade links"
  ON public.journal_note_trades FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own note-trade links"
  ON public.journal_note_trades FOR UPDATE
  USING (auth.uid() = user_id);

-- 4. Indexes for common query patterns
CREATE INDEX idx_jnt_note_id ON public.journal_note_trades (note_id);
CREATE INDEX idx_jnt_trade_id ON public.journal_note_trades (trade_id);
CREATE INDEX idx_jnt_user_id ON public.journal_note_trades (user_id);

-- 5. Migrate existing data from journal_notes.trade_id into junction table
INSERT INTO public.journal_note_trades (note_id, trade_id, trade_asset_type, user_id)
SELECT id, trade_id, COALESCE(trade_asset_type, 'crypto'), user_id
FROM public.journal_notes
WHERE trade_id IS NOT NULL;

-- NOTE: trade_id and trade_asset_type columns on journal_notes are kept during transition.
-- A follow-up migration will drop them after verifying all code paths use the junction table.

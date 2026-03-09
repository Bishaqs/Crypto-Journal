-- Add note_type and is_favorite to journal_notes
-- note_type: 'trade' (linked to a trade), 'daily' (morning plan/daily summary), 'other' (default)
-- is_favorite: allows starring/favoriting individual notes

ALTER TABLE public.journal_notes
  ADD COLUMN IF NOT EXISTS note_type TEXT DEFAULT 'other';

ALTER TABLE public.journal_notes
  ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;

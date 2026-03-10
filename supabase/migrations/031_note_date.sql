-- Add user-editable note_date to journal_notes
-- Defaults to now() for new notes. Backfill existing notes with created_at.
ALTER TABLE public.journal_notes
  ADD COLUMN IF NOT EXISTS note_date timestamptz DEFAULT now();

-- Backfill: set note_date = created_at for all existing rows
UPDATE public.journal_notes SET note_date = created_at WHERE note_date IS NULL;

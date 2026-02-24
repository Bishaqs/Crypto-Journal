-- Add auto_link_on_import flag to journal_notes
-- When true, the system will auto-link this note to the closest trade on next CSV import.
ALTER TABLE public.journal_notes
  ADD COLUMN IF NOT EXISTS auto_link_on_import boolean DEFAULT false;

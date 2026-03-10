-- Add structured_data JSONB column to journal_notes
-- Stores raw structured template field values alongside HTML content
-- Enables: structured form persistence on edit, psychology data extraction for insights

ALTER TABLE public.journal_notes
  ADD COLUMN IF NOT EXISTS structured_data JSONB,
  ADD COLUMN IF NOT EXISTS template_id TEXT;

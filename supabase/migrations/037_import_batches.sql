-- Import batch tracking: each CSV/Excel upload creates a batch record
-- Trades reference their batch via import_batch_id (CASCADE delete)

CREATE TABLE import_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  filename text,
  exchange_preset text,
  detected_format text,
  target_table text NOT NULL,
  total_rows integer DEFAULT 0,
  imported_count integer DEFAULT 0,
  skipped_count integer DEFAULT 0,
  failed_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE import_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own batches"
  ON import_batches FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own batches"
  ON import_batches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own batches"
  ON import_batches FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own batches"
  ON import_batches FOR DELETE
  USING (auth.uid() = user_id);

-- Add batch reference to all trade tables
ALTER TABLE trades ADD COLUMN IF NOT EXISTS import_batch_id uuid REFERENCES import_batches(id) ON DELETE CASCADE;
ALTER TABLE stock_trades ADD COLUMN IF NOT EXISTS import_batch_id uuid REFERENCES import_batches(id) ON DELETE CASCADE;
ALTER TABLE commodity_trades ADD COLUMN IF NOT EXISTS import_batch_id uuid REFERENCES import_batches(id) ON DELETE CASCADE;
ALTER TABLE forex_trades ADD COLUMN IF NOT EXISTS import_batch_id uuid REFERENCES import_batches(id) ON DELETE CASCADE;

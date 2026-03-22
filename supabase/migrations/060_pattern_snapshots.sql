-- Pattern Snapshots: store weekly behavioral pattern data for change detection
-- Used by Nova to track how trading patterns evolve over time (zero LLM cost)

ALTER TABLE trading_summaries ADD COLUMN IF NOT EXISTS pattern_snapshot JSONB;

-- Add price_at_log to track asset price when emotion was logged
-- Combined with created_at, this gives (time, price) coordinates for chart markers
ALTER TABLE public.trade_emotion_logs
ADD COLUMN IF NOT EXISTS price_at_log numeric;

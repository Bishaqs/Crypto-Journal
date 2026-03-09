-- ============================================================
-- Owner Account: Set to Level 500, all achievements, all cosmetics
-- Run in Supabase SQL Editor
-- ============================================================

DO $$
DECLARE
  owner_id uuid;
BEGIN
  -- Find owner from user_subscriptions
  SELECT user_id INTO owner_id FROM user_subscriptions WHERE is_owner = true LIMIT 1;

  IF owner_id IS NULL THEN
    RAISE EXCEPTION 'No owner found in user_subscriptions. Set is_owner = true first.';
  END IF;

  RAISE NOTICE 'Owner ID: %', owner_id;

  -- ── 1. Level 500 with correct XP ─────────────────────────────
  -- xpForLevel(500) = floor(100 * 500^1.5) = 1,118,033
  INSERT INTO user_levels (user_id, total_xp, current_level, xp_today, today_date)
  VALUES (owner_id, 1118034, 500, 0, CURRENT_DATE)
  ON CONFLICT (user_id) DO UPDATE SET
    total_xp = 1118034,
    current_level = 500,
    updated_at = now();

  -- ── 2. Award ALL cosmetics from catalog ──────────────────────
  INSERT INTO user_cosmetics (user_id, cosmetic_id)
  SELECT owner_id, id FROM cosmetic_definitions
  ON CONFLICT (user_id, cosmetic_id) DO NOTHING;

  -- ── 3. Equip prestige set (Level 500 cosmetics) ─────────────
  INSERT INTO user_equipped_cosmetics (user_id, cosmetic_type, cosmetic_id)
  VALUES
    (owner_id, 'avatar_frame',  'frame_infinite_gate'),
    (owner_id, 'banner',        'banner_infinite_origin'),
    (owner_id, 'title_badge',   'title_stargate_legend'),
    (owner_id, 'avatar_icon',   'icon_stargate_key'),
    (owner_id, 'sidebar_flair', 'flair_infinite_portal'),
    (owner_id, 'theme_accent',  'accent_infinite')
  ON CONFLICT (user_id, cosmetic_type) DO UPDATE SET
    cosmetic_id = EXCLUDED.cosmetic_id,
    updated_at = now();

  -- ── 4. Single-tier achievements (tier = NULL) ────────────────
  INSERT INTO user_achievements (user_id, achievement_id, tier) VALUES
    (owner_id, 'first_entry', NULL),
    (owner_id, 'early_bird', NULL),
    (owner_id, 'two_year_veteran', NULL),
    (owner_id, 'three_year_legend', NULL),
    (owner_id, 'zero_overleverage', NULL),
    (owner_id, 'emotion_diversity', NULL),
    (owner_id, 'gratitude_journalist', NULL),
    (owner_id, 'pattern_recognizer', NULL),
    (owner_id, 'data_scientist', NULL),
    (owner_id, 'century_club', NULL),
    (owner_id, 'one_year_in', NULL),
    (owner_id, 'thousand_trades', NULL),
    (owner_id, 'five_hundred_journal', NULL),
    (owner_id, 'five_thousand_trades', NULL),
    (owner_id, 'ten_thousand_entries', NULL),
    (owner_id, 'thousand_day_streak', NULL),
    (owner_id, 'five_hundred_checkins', NULL),
    (owner_id, 'level_50', NULL),
    (owner_id, 'level_100', NULL),
    (owner_id, 'level_150', NULL),
    (owner_id, 'level_200', NULL),
    (owner_id, 'level_300', NULL),
    (owner_id, 'level_500', NULL),
    (owner_id, 'completionist', NULL)
  ON CONFLICT (user_id, achievement_id, tier) DO NOTHING;

  -- ── 5. Multi-tier achievements (all tiers) ───────────────────

  -- Consistency
  INSERT INTO user_achievements (user_id, achievement_id, tier) VALUES
    -- journal_streak (b/s/g/d)
    (owner_id, 'journal_streak', 'bronze'),
    (owner_id, 'journal_streak', 'silver'),
    (owner_id, 'journal_streak', 'gold'),
    (owner_id, 'journal_streak', 'diamond'),
    -- weekly_review (b/s/g/d)
    (owner_id, 'weekly_review', 'bronze'),
    (owner_id, 'weekly_review', 'silver'),
    (owner_id, 'weekly_review', 'gold'),
    (owner_id, 'weekly_review', 'diamond'),
    -- journal_losing_trades (b/s/g)
    (owner_id, 'journal_losing_trades', 'bronze'),
    (owner_id, 'journal_losing_trades', 'silver'),
    (owner_id, 'journal_losing_trades', 'gold'),
    -- daily_checkin_streak (b/s/g/d/legendary)
    (owner_id, 'daily_checkin_streak', 'bronze'),
    (owner_id, 'daily_checkin_streak', 'silver'),
    (owner_id, 'daily_checkin_streak', 'gold'),
    (owner_id, 'daily_checkin_streak', 'diamond'),
    (owner_id, 'daily_checkin_streak', 'legendary'),
    -- trade_planner_streak (b/s/g/d)
    (owner_id, 'trade_planner_streak', 'bronze'),
    (owner_id, 'trade_planner_streak', 'silver'),
    (owner_id, 'trade_planner_streak', 'gold'),
    (owner_id, 'trade_planner_streak', 'diamond'),
    -- weekend_reviewer (b/s/g/d/legendary)
    (owner_id, 'weekend_reviewer', 'bronze'),
    (owner_id, 'weekend_reviewer', 'silver'),
    (owner_id, 'weekend_reviewer', 'gold'),
    (owner_id, 'weekend_reviewer', 'diamond'),
    (owner_id, 'weekend_reviewer', 'legendary'),
    -- multi_asset_logger (b/s/g/d)
    (owner_id, 'multi_asset_logger', 'bronze'),
    (owner_id, 'multi_asset_logger', 'silver'),
    (owner_id, 'multi_asset_logger', 'gold'),
    (owner_id, 'multi_asset_logger', 'diamond'),
    -- month_perfect (b/s/g/d)
    (owner_id, 'month_perfect', 'bronze'),
    (owner_id, 'month_perfect', 'silver'),
    (owner_id, 'month_perfect', 'gold'),
    (owner_id, 'month_perfect', 'diamond')
  ON CONFLICT (user_id, achievement_id, tier) DO NOTHING;

  -- Risk Management
  INSERT INTO user_achievements (user_id, achievement_id, tier) VALUES
    -- stop_loss_sentinel (b/s/g)
    (owner_id, 'stop_loss_sentinel', 'bronze'),
    (owner_id, 'stop_loss_sentinel', 'silver'),
    (owner_id, 'stop_loss_sentinel', 'gold'),
    -- risk_controller (b/s/g)
    (owner_id, 'risk_controller', 'bronze'),
    (owner_id, 'risk_controller', 'silver'),
    (owner_id, 'risk_controller', 'gold'),
    -- process_master (b/s/g)
    (owner_id, 'process_master', 'bronze'),
    (owner_id, 'process_master', 'silver'),
    (owner_id, 'process_master', 'gold'),
    -- position_sizer (b/s/g/d)
    (owner_id, 'position_sizer', 'bronze'),
    (owner_id, 'position_sizer', 'silver'),
    (owner_id, 'position_sizer', 'gold'),
    (owner_id, 'position_sizer', 'diamond'),
    -- risk_reward_tracker (b/s/g/d)
    (owner_id, 'risk_reward_tracker', 'bronze'),
    (owner_id, 'risk_reward_tracker', 'silver'),
    (owner_id, 'risk_reward_tracker', 'gold'),
    (owner_id, 'risk_reward_tracker', 'diamond'),
    -- loss_limit_master (b/s/g/d/legendary)
    (owner_id, 'loss_limit_master', 'bronze'),
    (owner_id, 'loss_limit_master', 'silver'),
    (owner_id, 'loss_limit_master', 'gold'),
    (owner_id, 'loss_limit_master', 'diamond'),
    (owner_id, 'loss_limit_master', 'legendary'),
    -- max_drawdown_guardian (b/s/g/d)
    (owner_id, 'max_drawdown_guardian', 'bronze'),
    (owner_id, 'max_drawdown_guardian', 'silver'),
    (owner_id, 'max_drawdown_guardian', 'gold'),
    (owner_id, 'max_drawdown_guardian', 'diamond'),
    -- checklist_master (b/s/g/d)
    (owner_id, 'checklist_master', 'bronze'),
    (owner_id, 'checklist_master', 'silver'),
    (owner_id, 'checklist_master', 'gold'),
    (owner_id, 'checklist_master', 'diamond'),
    -- green_light_discipline (b/s/g/d)
    (owner_id, 'green_light_discipline', 'bronze'),
    (owner_id, 'green_light_discipline', 'silver'),
    (owner_id, 'green_light_discipline', 'gold'),
    (owner_id, 'green_light_discipline', 'diamond')
  ON CONFLICT (user_id, achievement_id, tier) DO NOTHING;

  -- Psychology
  INSERT INTO user_achievements (user_id, achievement_id, tier) VALUES
    -- mindful_trader (b/s/g/d)
    (owner_id, 'mindful_trader', 'bronze'),
    (owner_id, 'mindful_trader', 'silver'),
    (owner_id, 'mindful_trader', 'gold'),
    (owner_id, 'mindful_trader', 'diamond'),
    -- tilt_proof (b/s/g)
    (owner_id, 'tilt_proof', 'bronze'),
    (owner_id, 'tilt_proof', 'silver'),
    (owner_id, 'tilt_proof', 'gold'),
    -- walk_away (b/s/g)
    (owner_id, 'walk_away', 'bronze'),
    (owner_id, 'walk_away', 'silver'),
    (owner_id, 'walk_away', 'gold'),
    -- emotion_logger (b/s/g)
    (owner_id, 'emotion_logger', 'bronze'),
    (owner_id, 'emotion_logger', 'silver'),
    (owner_id, 'emotion_logger', 'gold'),
    -- post_loss_reflection (b/s/g/d)
    (owner_id, 'post_loss_reflection', 'bronze'),
    (owner_id, 'post_loss_reflection', 'silver'),
    (owner_id, 'post_loss_reflection', 'gold'),
    (owner_id, 'post_loss_reflection', 'diamond'),
    -- confidence_calibrator (b/s/g/d)
    (owner_id, 'confidence_calibrator', 'bronze'),
    (owner_id, 'confidence_calibrator', 'silver'),
    (owner_id, 'confidence_calibrator', 'gold'),
    (owner_id, 'confidence_calibrator', 'diamond'),
    -- bias_spotter (b/s/g/d)
    (owner_id, 'bias_spotter', 'bronze'),
    (owner_id, 'bias_spotter', 'silver'),
    (owner_id, 'bias_spotter', 'gold'),
    (owner_id, 'bias_spotter', 'diamond'),
    -- emotional_awareness_streak (b/s/g/d)
    (owner_id, 'emotional_awareness_streak', 'bronze'),
    (owner_id, 'emotional_awareness_streak', 'silver'),
    (owner_id, 'emotional_awareness_streak', 'gold'),
    (owner_id, 'emotional_awareness_streak', 'diamond'),
    -- calm_after_storm (b/s/g)
    (owner_id, 'calm_after_storm', 'bronze'),
    (owner_id, 'calm_after_storm', 'silver'),
    (owner_id, 'calm_after_storm', 'gold')
  ON CONFLICT (user_id, achievement_id, tier) DO NOTHING;

  -- Analysis
  INSERT INTO user_achievements (user_id, achievement_id, tier) VALUES
    -- setup_tracker (b/s/g)
    (owner_id, 'setup_tracker', 'bronze'),
    (owner_id, 'setup_tracker', 'silver'),
    (owner_id, 'setup_tracker', 'gold'),
    -- trade_planner (b/s/g)
    (owner_id, 'trade_planner', 'bronze'),
    (owner_id, 'trade_planner', 'silver'),
    (owner_id, 'trade_planner', 'gold'),
    -- note_taker (b/s/g)
    (owner_id, 'note_taker', 'bronze'),
    (owner_id, 'note_taker', 'silver'),
    (owner_id, 'note_taker', 'gold'),
    -- tag_master (b/s/g/d)
    (owner_id, 'tag_master', 'bronze'),
    (owner_id, 'tag_master', 'silver'),
    (owner_id, 'tag_master', 'gold'),
    (owner_id, 'tag_master', 'diamond'),
    -- multi_timeframe_analyst (b/s/g)
    (owner_id, 'multi_timeframe_analyst', 'bronze'),
    (owner_id, 'multi_timeframe_analyst', 'silver'),
    (owner_id, 'multi_timeframe_analyst', 'gold'),
    -- playbook_builder (b/s/g/d)
    (owner_id, 'playbook_builder', 'bronze'),
    (owner_id, 'playbook_builder', 'silver'),
    (owner_id, 'playbook_builder', 'gold'),
    (owner_id, 'playbook_builder', 'diamond'),
    -- sector_analyst (b/s/g/d)
    (owner_id, 'sector_analyst', 'bronze'),
    (owner_id, 'sector_analyst', 'silver'),
    (owner_id, 'sector_analyst', 'gold'),
    (owner_id, 'sector_analyst', 'diamond'),
    -- review_scholar (b/s/g/d)
    (owner_id, 'review_scholar', 'bronze'),
    (owner_id, 'review_scholar', 'silver'),
    (owner_id, 'review_scholar', 'gold'),
    (owner_id, 'review_scholar', 'diamond')
  ON CONFLICT (user_id, achievement_id, tier) DO NOTHING;

  -- ── 6. Max out achievement progress ──────────────────────────
  INSERT INTO achievement_progress (user_id, achievement_id, current_value) VALUES
    -- Consistency
    (owner_id, 'journal_streak', 999),
    (owner_id, 'first_entry', 1),
    (owner_id, 'weekly_review', 999),
    (owner_id, 'journal_losing_trades', 999),
    (owner_id, 'daily_checkin_streak', 999),
    (owner_id, 'trade_planner_streak', 999),
    (owner_id, 'weekend_reviewer', 999),
    (owner_id, 'multi_asset_logger', 999),
    (owner_id, 'month_perfect', 999),
    (owner_id, 'early_bird', 1),
    (owner_id, 'two_year_veteran', 1),
    (owner_id, 'three_year_legend', 1),
    -- Risk
    (owner_id, 'stop_loss_sentinel', 999),
    (owner_id, 'risk_controller', 999),
    (owner_id, 'process_master', 10),
    (owner_id, 'position_sizer', 999),
    (owner_id, 'risk_reward_tracker', 999),
    (owner_id, 'loss_limit_master', 999),
    (owner_id, 'max_drawdown_guardian', 999),
    (owner_id, 'checklist_master', 999),
    (owner_id, 'green_light_discipline', 999),
    (owner_id, 'zero_overleverage', 1),
    -- Psychology
    (owner_id, 'mindful_trader', 999),
    (owner_id, 'tilt_proof', 999),
    (owner_id, 'walk_away', 999),
    (owner_id, 'emotion_logger', 999),
    (owner_id, 'emotion_diversity', 1),
    (owner_id, 'post_loss_reflection', 999),
    (owner_id, 'confidence_calibrator', 999),
    (owner_id, 'bias_spotter', 999),
    (owner_id, 'emotional_awareness_streak', 999),
    (owner_id, 'calm_after_storm', 999),
    (owner_id, 'gratitude_journalist', 1),
    -- Analysis
    (owner_id, 'setup_tracker', 999),
    (owner_id, 'trade_planner', 999),
    (owner_id, 'note_taker', 999),
    (owner_id, 'tag_master', 999),
    (owner_id, 'multi_timeframe_analyst', 999),
    (owner_id, 'playbook_builder', 999),
    (owner_id, 'sector_analyst', 999),
    (owner_id, 'review_scholar', 999),
    (owner_id, 'pattern_recognizer', 1),
    (owner_id, 'data_scientist', 1),
    -- Milestones
    (owner_id, 'century_club', 1),
    (owner_id, 'one_year_in', 1),
    (owner_id, 'thousand_trades', 1),
    (owner_id, 'five_hundred_journal', 1),
    (owner_id, 'five_thousand_trades', 1),
    (owner_id, 'ten_thousand_entries', 1),
    (owner_id, 'thousand_day_streak', 1),
    (owner_id, 'five_hundred_checkins', 1),
    (owner_id, 'level_50', 1),
    (owner_id, 'level_100', 1),
    (owner_id, 'level_150', 1),
    (owner_id, 'level_200', 1),
    (owner_id, 'level_300', 1),
    (owner_id, 'level_500', 1),
    (owner_id, 'completionist', 1)
  ON CONFLICT (user_id, achievement_id) DO UPDATE SET
    current_value = EXCLUDED.current_value,
    updated_at = now();

  -- ── 7. Coins ─────────────────────────────────────────────────
  INSERT INTO user_coins (user_id, balance, total_earned, total_spent)
  VALUES (owner_id, 99999, 99999, 0)
  ON CONFLICT (user_id) DO UPDATE SET
    balance = 99999,
    total_earned = 99999,
    updated_at = now();

  -- ── 8. Streaks ───────────────────────────────────────────────
  INSERT INTO user_streaks (user_id, current_streak, longest_streak, streak_freezes)
  VALUES (owner_id, 365, 365, 10)
  ON CONFLICT (user_id) DO UPDATE SET
    current_streak = 365,
    longest_streak = 365,
    streak_freezes = 10;

  -- ── 9. Profile (public, show everything) ─────────────────────
  INSERT INTO user_profiles (user_id, display_name, is_public, show_level, show_achievements, show_streak)
  VALUES (owner_id, 'Stargate Legend', true, true, true, true)
  ON CONFLICT (user_id) DO UPDATE SET
    display_name = 'Stargate Legend',
    is_public = true,
    show_level = true,
    show_achievements = true,
    show_streak = true,
    updated_at = now();

  -- ── 10. Active badge ─────────────────────────────────────────
  INSERT INTO user_badges (user_id, active_badge, active_tier)
  VALUES (owner_id, 'level_500', NULL)
  ON CONFLICT (user_id) DO UPDATE SET
    active_badge = 'level_500',
    active_tier = NULL,
    updated_at = now();

  RAISE NOTICE 'Done! Owner set to Level 500 with all rewards.';
END $$;

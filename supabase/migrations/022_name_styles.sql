-- ============================================================
-- Migration 022: Name Styles Cosmetic Type
-- Adds name_style as a new cosmetic type for colored/animated
-- display names. Includes 15 name styles across all rarities.
-- ============================================================

-- ============================================================
-- 1. ALTER CHECK CONSTRAINTS
--    Allow 'name_style' in cosmetic_definitions.type
--    and user_equipped_cosmetics.cosmetic_type
-- ============================================================

-- cosmetic_definitions: drop and re-add type check
ALTER TABLE cosmetic_definitions
  DROP CONSTRAINT IF EXISTS cosmetic_definitions_type_check;

ALTER TABLE cosmetic_definitions
  ADD CONSTRAINT cosmetic_definitions_type_check
  CHECK (type IN ('avatar_frame', 'banner', 'title_badge', 'sidebar_flair', 'avatar_icon', 'theme_accent', 'name_style'));

-- user_equipped_cosmetics: drop and re-add type check
ALTER TABLE user_equipped_cosmetics
  DROP CONSTRAINT IF EXISTS user_equipped_cosmetics_cosmetic_type_check;

ALTER TABLE user_equipped_cosmetics
  ADD CONSTRAINT user_equipped_cosmetics_cosmetic_type_check
  CHECK (cosmetic_type IN ('avatar_frame', 'banner', 'title_badge', 'sidebar_flair', 'avatar_icon', 'theme_accent', 'name_style'));

-- ============================================================
-- 2. ADD name_style COLUMN TO user_profiles
-- ============================================================

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS name_style TEXT DEFAULT NULL;

-- ============================================================
-- 3. INSERT NAME STYLE COSMETICS
-- ============================================================

INSERT INTO cosmetic_definitions (id, type, name, description, rarity, css_class, unlock_condition) VALUES
  -- Common (Levels 5, 10, 18)
  ('name_gold',      'name_style', 'Gold Name',         'Display your name in gold',                          'common',    'name-gold',         '{"type":"level","value":5}'),
  ('name_silver',    'name_style', 'Silver Name',       'Display your name in silver',                        'common',    'name-silver',       '{"type":"level","value":10}'),
  ('name_crimson',   'name_style', 'Crimson Name',      'Display your name in crimson red',                   'common',    'name-crimson',      '{"type":"level","value":18}'),

  -- Uncommon (Levels 25, 35, 45)
  ('name_ocean',     'name_style', 'Ocean Name',        'Deep blue name color',                               'uncommon',  'name-ocean',        '{"type":"level","value":25}'),
  ('name_toxic',     'name_style', 'Toxic Name',        'Toxic green with a subtle glow',                     'uncommon',  'name-toxic',        '{"type":"level","value":35}'),
  ('name_sunset',    'name_style', 'Sunset Name',       'Orange to pink gradient',                            'uncommon',  'name-sunset',       '{"type":"level","value":45}'),

  -- Rare (Levels 60, 80, 100)
  ('name_ice',       'name_style', 'Ice Name',          'Icy blue with frosty glow',                          'rare',      'name-ice',          '{"type":"level","value":60}'),
  ('name_fire',      'name_style', 'Fire Name',         'Animated fire gradient',                             'rare',      'name-fire',         '{"type":"level","value":80}'),
  ('name_electric',  'name_style', 'Electric Name',     'Yellow with lightning flash effect',                  'rare',      'name-electric',     '{"type":"level","value":100}'),

  -- Epic (Levels 150, 200, 250)
  ('name_neon',      'name_style', 'Neon Name',         'Hot pink with neon glow',                            'epic',      'name-neon',         '{"type":"level","value":150}'),
  ('name_rainbow',   'name_style', 'Rainbow Name',      'Animated rainbow gradient',                          'epic',      'name-rainbow',      '{"type":"level","value":200}'),
  ('name_matrix',    'name_style', 'Matrix Name',       'Matrix green with glitch animation',                 'epic',      'name-matrix',       '{"type":"level","value":250}'),

  -- Legendary (Levels 350, 400)
  ('name_holographic', 'name_style', 'Holographic Name', 'Prismatic holographic color shift',                 'legendary', 'name-holographic',  '{"type":"level","value":350}'),
  ('name_chromatic',   'name_style', 'Chromatic Name',   'Full spectrum chromatic animation',                 'legendary', 'name-chromatic',    '{"type":"level","value":400}'),

  -- Mythic (Level 500)
  ('name_void',      'name_style', 'Void Name',         'Dark purple with ethereal void pulse',               'mythic',    'name-void',         '{"type":"level","value":500}')

ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 4. RECREATE LEADERBOARD MATERIALIZED VIEW
--    (includes new name_style column from user_profiles)
-- ============================================================

DROP MATERIALIZED VIEW IF EXISTS leaderboard_view;

CREATE MATERIALIZED VIEW leaderboard_view AS
SELECT
  ul.user_id,
  up.display_name,
  up.avatar_frame,
  up.banner,
  up.title_badge,
  up.avatar_icon,
  up.theme_accent,
  up.name_style,
  ul.current_level,
  ul.total_xp,
  COALESCE(us.current_streak, 0) AS current_streak,
  COALESCE(us.longest_streak, 0) AS longest_streak,
  COALESCE(ua_count.achievement_count, 0) AS achievement_count,
  ub.active_badge,
  ub.active_tier
FROM user_levels ul
INNER JOIN user_profiles up ON ul.user_id = up.user_id AND up.is_public = true
LEFT JOIN user_streaks us ON ul.user_id = us.user_id
LEFT JOIN (
  SELECT user_id, COUNT(*) AS achievement_count
  FROM user_achievements
  GROUP BY user_id
) ua_count ON ul.user_id = ua_count.user_id
LEFT JOIN user_badges ub ON ul.user_id = ub.user_id
ORDER BY ul.current_level DESC, ul.total_xp DESC;

CREATE UNIQUE INDEX idx_leaderboard_view_user_id ON leaderboard_view(user_id);
CREATE INDEX idx_leaderboard_view_rank ON leaderboard_view(current_level DESC, total_xp DESC);

-- ============================================================
-- 5. RLS POLICY (name_style follows same pattern as other cosmetics)
-- ============================================================

-- user_profiles already has RLS; the new column is covered by existing policies.
-- No additional RLS needed for name_style.

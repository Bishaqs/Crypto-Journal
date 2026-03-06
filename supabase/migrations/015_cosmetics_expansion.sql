-- Cosmetics Expansion
-- Adds avatar_icon + theme_accent types, fills levels 1-100 with unlocks

-- ============================================================
-- 1. EXPAND TYPE CHECK ON cosmetic_definitions
-- ============================================================
ALTER TABLE cosmetic_definitions DROP CONSTRAINT cosmetic_definitions_type_check;
ALTER TABLE cosmetic_definitions ADD CONSTRAINT cosmetic_definitions_type_check
  CHECK (type IN ('avatar_frame', 'banner', 'title_badge', 'sidebar_flair', 'avatar_icon', 'theme_accent'));

-- ============================================================
-- 2. EXPAND TYPE CHECK ON user_equipped_cosmetics
-- ============================================================
ALTER TABLE user_equipped_cosmetics DROP CONSTRAINT user_equipped_cosmetics_cosmetic_type_check;
ALTER TABLE user_equipped_cosmetics ADD CONSTRAINT user_equipped_cosmetics_cosmetic_type_check
  CHECK (cosmetic_type IN ('avatar_frame', 'banner', 'title_badge', 'sidebar_flair', 'avatar_icon', 'theme_accent'));

-- ============================================================
-- 3. ADD NEW COLUMNS TO user_profiles
-- ============================================================
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS avatar_icon TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS sidebar_flair TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS theme_accent TEXT;

-- ============================================================
-- 4. RECREATE LEADERBOARD MATERIALIZED VIEW
--    (includes new profile columns)
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
-- 5. SEED NEW COSMETICS
-- ============================================================

-- ----- NEW AVATAR FRAMES -----
INSERT INTO cosmetic_definitions (id, type, name, description, rarity, unlock_condition, css_class) VALUES
  ('frame_copper_ring', 'avatar_frame', 'Copper Ring', 'A warm copper border marks your first steps.', 'common',
    '{"type": "level", "value": 3}', 'frame-copper-ring'),
  ('frame_iron_chain', 'avatar_frame', 'Iron Chain', 'Interlocking iron links protect your avatar.', 'common',
    '{"type": "level", "value": 8}', 'frame-iron-chain'),
  ('frame_crystal_shell', 'avatar_frame', 'Crystal Shell', 'Transparent crystalline energy encases your avatar.', 'uncommon',
    '{"type": "level", "value": 12}', 'frame-crystal-shell'),
  ('frame_sapphire_edge', 'avatar_frame', 'Sapphire Edge', 'A deep blue sapphire ring with subtle inner light.', 'uncommon',
    '{"type": "level", "value": 22}', 'frame-sapphire-edge'),
  ('frame_obsidian_edge', 'avatar_frame', 'Obsidian Edge', 'Dark volcanic glass catches light at every angle.', 'rare',
    '{"type": "level", "value": 38}', 'frame-obsidian-edge'),
  ('frame_nova_core', 'avatar_frame', 'Nova Core', 'The compressed energy of a dying star.', 'rare',
    '{"type": "level", "value": 55}', 'frame-nova-core'),
  ('frame_plasma_shell', 'avatar_frame', 'Plasma Shell', 'Superheated plasma contained in a magnetic field.', 'epic',
    '{"type": "level", "value": 65}', 'frame-plasma-shell'),
  ('frame_void_rift', 'avatar_frame', 'Void Rift', 'Cracks in reality leak otherworldly light.', 'epic',
    '{"type": "level", "value": 78}', 'frame-void-rift'),
  ('frame_nebula_crown', 'avatar_frame', 'Nebula Crown', 'Swirling nebula gas forms a regal crown.', 'epic',
    '{"type": "level", "value": 85}', 'frame-nebula-crown'),
  ('frame_eternal_gate', 'avatar_frame', 'Eternal Gate', 'The penultimate frame. A gate between dimensions.', 'legendary',
    '{"type": "level", "value": 95}', 'frame-eternal-gate')
ON CONFLICT DO NOTHING;

-- ----- NEW BANNERS -----
INSERT INTO cosmetic_definitions (id, type, name, description, rarity, unlock_condition, css_class) VALUES
  ('banner_dawn_light', 'banner', 'Dawn Light', 'The first rays of morning break across the horizon.', 'common',
    '{"type": "level", "value": 6}', 'banner-dawn-light'),
  ('banner_storm_front', 'banner', 'Storm Front', 'Brewing storm clouds with electric potential.', 'uncommon',
    '{"type": "level", "value": 14}', 'banner-storm-front'),
  ('banner_ember_trail', 'banner', 'Ember Trail', 'Glowing embers drift upward in warm currents.', 'uncommon',
    '{"type": "level", "value": 18}', 'banner-ember-trail'),
  ('banner_aurora_waves', 'banner', 'Aurora Waves', 'Shimmering northern lights dance overhead.', 'rare',
    '{"type": "level", "value": 32}', 'banner-aurora-waves'),
  ('banner_supernova_burst', 'banner', 'Supernova Burst', 'The brilliant explosion of a massive star.', 'rare',
    '{"type": "level", "value": 55}', 'banner-supernova-burst'),
  ('banner_dark_matter', 'banner', 'Dark Matter', 'Invisible force bending light around your profile.', 'epic',
    '{"type": "level", "value": 65}', 'banner-dark-matter'),
  ('banner_quantum_field', 'banner', 'Quantum Field', 'Probability waves ripple through spacetime.', 'epic',
    '{"type": "level", "value": 85}', 'banner-quantum-field'),
  ('banner_event_horizon', 'banner', 'Event Horizon', 'The boundary where light cannot escape.', 'legendary',
    '{"type": "level", "value": 95}', 'banner-event-horizon')
ON CONFLICT DO NOTHING;

-- ----- NEW TITLE BADGES -----
INSERT INTO cosmetic_definitions (id, type, name, description, rarity, unlock_condition, css_class) VALUES
  ('title_rookie', 'title_badge', 'Rookie', 'Everyone starts somewhere.', 'common',
    '{"type": "level", "value": 3}', 'title-rookie'),
  ('title_observer', 'title_badge', 'Observer', 'Watching the markets with keen interest.', 'common',
    '{"type": "level", "value": 8}', 'title-observer'),
  ('title_analyst', 'title_badge', 'Analyst', 'Data speaks louder than opinions.', 'uncommon',
    '{"type": "level", "value": 16}', 'title-analyst'),
  ('title_strategist', 'title_badge', 'Strategist', 'Planning every move before execution.', 'uncommon',
    '{"type": "level", "value": 28}', 'title-strategist'),
  ('title_tactician', 'title_badge', 'Tactician', 'Adapting to any market condition.', 'rare',
    '{"type": "level", "value": 42}', 'title-tactician'),
  ('title_oracle', 'title_badge', 'Oracle', 'Seeing patterns others miss.', 'rare',
    '{"type": "level", "value": 58}', 'title-oracle'),
  ('title_sage', 'title_badge', 'Sage', 'Wisdom earned through years of disciplined trading.', 'epic',
    '{"type": "level", "value": 85}', 'title-sage'),
  ('title_ascendant', 'title_badge', 'Ascendant', 'Rising above the noise.', 'uncommon',
    '{"type": "level", "value": 12}', 'title-ascendant')
ON CONFLICT DO NOTHING;

-- ----- NEW SIDEBAR FLAIR -----
INSERT INTO cosmetic_definitions (id, type, name, description, rarity, unlock_condition, css_class) VALUES
  ('flair_glow', 'sidebar_flair', 'Glow', 'A soft ambient light.', 'common',
    '{"type": "level", "value": 10}', 'flair-glow'),
  ('flair_shimmer', 'sidebar_flair', 'Shimmer', 'Light dances across the surface.', 'uncommon',
    '{"type": "level", "value": 18}', 'flair-shimmer'),
  ('flair_aurora', 'sidebar_flair', 'Aurora', 'Shifting colors like the northern lights.', 'rare',
    '{"type": "level", "value": 35}', 'flair-aurora'),
  ('flair_nebula', 'sidebar_flair', 'Nebula', 'Swirling cosmic gas and stardust.', 'rare',
    '{"type": "level", "value": 55}', 'flair-nebula'),
  ('flair_solar_wind', 'sidebar_flair', 'Solar Wind', 'Charged particles streaming from the sun.', 'epic',
    '{"type": "level", "value": 42}', 'flair-solar-wind'),
  ('flair_dark_energy', 'sidebar_flair', 'Dark Energy', 'The mysterious force accelerating expansion.', 'epic',
    '{"type": "level", "value": 85}', 'flair-dark-energy')
ON CONFLICT DO NOTHING;

-- ----- NEW AVATAR ICONS -----
INSERT INTO cosmetic_definitions (id, type, name, description, rarity, unlock_condition, css_class) VALUES
  ('icon_seedling', 'avatar_icon', 'Seedling', 'A tiny sprout reaching for the light.', 'common',
    '{"type": "level", "value": 2}', 'icon-seedling'),
  ('icon_candlestick', 'avatar_icon', 'Candlestick', 'The trader''s most basic tool.', 'common',
    '{"type": "level", "value": 4}', 'icon-candlestick'),
  ('icon_leaf', 'avatar_icon', 'Leaf', 'Growth is a slow but steady process.', 'common',
    '{"type": "level", "value": 7}', 'icon-leaf'),
  ('icon_moon', 'avatar_icon', 'Moon', 'Trading under moonlight.', 'common',
    '{"type": "level", "value": 9}', 'icon-moon'),
  ('icon_chart_up', 'avatar_icon', 'Chart Up', 'The trend is your friend.', 'common',
    '{"type": "level", "value": 11}', 'icon-chart-up'),
  ('icon_coins', 'avatar_icon', 'Coins', 'Building your treasury one trade at a time.', 'common',
    '{"type": "level", "value": 13}', 'icon-coins'),
  ('icon_bar_chart', 'avatar_icon', 'Bar Chart', 'Data visualized, decisions refined.', 'uncommon',
    '{"type": "level", "value": 17}', 'icon-bar-chart'),
  ('icon_star', 'avatar_icon', 'Star', 'Shining brighter with each level.', 'uncommon',
    '{"type": "level", "value": 19}', 'icon-star'),
  ('icon_sun', 'avatar_icon', 'Sun', 'Illuminating the path forward.', 'uncommon',
    '{"type": "level", "value": 21}', 'icon-sun'),
  ('icon_hourglass', 'avatar_icon', 'Hourglass', 'Patience is the ultimate edge.', 'uncommon',
    '{"type": "level", "value": 23}', 'icon-hourglass'),
  ('icon_compass', 'avatar_icon', 'Compass', 'Finding direction in volatile markets.', 'uncommon',
    '{"type": "level", "value": 24}', 'icon-compass'),
  ('icon_shield', 'avatar_icon', 'Shield', 'Protecting capital above all else.', 'uncommon',
    '{"type": "level", "value": 26}', 'icon-shield'),
  ('icon_target', 'avatar_icon', 'Target', 'Precision in every entry and exit.', 'uncommon',
    '{"type": "level", "value": 27}', 'icon-target'),
  ('icon_scale', 'avatar_icon', 'Scale', 'Weighing risk against reward.', 'uncommon',
    '{"type": "level", "value": 29}', 'icon-scale'),
  ('icon_trend_line', 'avatar_icon', 'Trend Line', 'Following the direction of the market.', 'rare',
    '{"type": "level", "value": 31}', 'icon-trend-line'),
  ('icon_bolt', 'avatar_icon', 'Lightning', 'Strike fast, strike precisely.', 'rare',
    '{"type": "level", "value": 33}', 'icon-bolt'),
  ('icon_hexagon', 'avatar_icon', 'Hexagon', 'Structure and discipline in every trade.', 'rare',
    '{"type": "level", "value": 34}', 'icon-hexagon'),
  ('icon_telescope', 'avatar_icon', 'Telescope', 'Seeing opportunities others can''t.', 'rare',
    '{"type": "level", "value": 36}', 'icon-telescope'),
  ('icon_flame', 'avatar_icon', 'Flame', 'The fire of unwavering determination.', 'rare',
    '{"type": "level", "value": 37}', 'icon-flame'),
  ('icon_wallet', 'avatar_icon', 'Wallet', 'A fat wallet from disciplined trading.', 'rare',
    '{"type": "level", "value": 39}', 'icon-wallet'),
  ('icon_sword', 'avatar_icon', 'Sword', 'Cutting through market noise.', 'rare',
    '{"type": "level", "value": 41}', 'icon-sword'),
  ('icon_comet', 'avatar_icon', 'Comet', 'Blazing a trail across the trading sky.', 'rare',
    '{"type": "level", "value": 43}', 'icon-comet'),
  ('icon_infinity', 'avatar_icon', 'Infinity', 'Infinite patience, infinite edge.', 'rare',
    '{"type": "level", "value": 44}', 'icon-infinity'),
  ('icon_gem', 'avatar_icon', 'Gem', 'A polished gem of trading excellence.', 'epic',
    '{"type": "level", "value": 46}', 'icon-gem'),
  ('icon_prism', 'avatar_icon', 'Prism', 'Refracting complexity into clarity.', 'epic',
    '{"type": "level", "value": 47}', 'icon-prism'),
  ('icon_planet', 'avatar_icon', 'Planet', 'Your own world of trading mastery.', 'epic',
    '{"type": "level", "value": 49}', 'icon-planet'),
  ('icon_constellation', 'avatar_icon', 'Constellation', 'Connecting the dots across markets.', 'epic',
    '{"type": "level", "value": 51}', 'icon-constellation'),
  ('icon_spiral', 'avatar_icon', 'Spiral', 'The golden ratio of risk management.', 'epic',
    '{"type": "level", "value": 52}', 'icon-spiral'),
  ('icon_cube', 'avatar_icon', 'Cube', 'Multi-dimensional market analysis.', 'epic',
    '{"type": "level", "value": 53}', 'icon-cube'),
  ('icon_orbit', 'avatar_icon', 'Orbit', 'Gravitational pull of consistent returns.', 'epic',
    '{"type": "level", "value": 54}', 'icon-orbit'),
  ('icon_crown', 'avatar_icon', 'Crown', 'Earned through discipline, not luck.', 'epic',
    '{"type": "level", "value": 56}', 'icon-crown'),
  ('icon_trophy', 'avatar_icon', 'Trophy', 'A symbol of achievement.', 'epic',
    '{"type": "level", "value": 57}', 'icon-trophy'),
  ('icon_medal', 'avatar_icon', 'Medal', 'Decorated for service to the craft.', 'epic',
    '{"type": "level", "value": 59}', 'icon-medal'),
  ('icon_rocket', 'avatar_icon', 'Rocket', 'Breaking through all resistance levels.', 'legendary',
    '{"type": "level", "value": 61}', 'icon-rocket'),
  ('icon_phoenix', 'avatar_icon', 'Phoenix', 'Rising from every drawdown.', 'legendary',
    '{"type": "level", "value": 64}', 'icon-phoenix'),
  ('icon_anchor', 'avatar_icon', 'Anchor', 'Steadfast in turbulent markets.', 'epic',
    '{"type": "level", "value": 63}', 'icon-anchor'),
  ('icon_diamond', 'avatar_icon', 'Diamond', 'Pressure creates brilliance.', 'legendary',
    '{"type": "level", "value": 66}', 'icon-diamond'),
  ('icon_lightning_bolt', 'avatar_icon', 'Lightning Bolt', 'Electrifying speed and precision.', 'legendary',
    '{"type": "level", "value": 67}', 'icon-lightning-bolt'),
  ('icon_eye', 'avatar_icon', 'Eye', 'Seeing through market deception.', 'legendary',
    '{"type": "level", "value": 69}', 'icon-eye'),
  ('icon_mountain', 'avatar_icon', 'Mountain', 'Unmovable conviction in your strategy.', 'legendary',
    '{"type": "level", "value": 71}', 'icon-mountain'),
  ('icon_wave', 'avatar_icon', 'Wave', 'Riding the market cycles with grace.', 'legendary',
    '{"type": "level", "value": 72}', 'icon-wave'),
  ('icon_atom', 'avatar_icon', 'Atom', 'Fundamental forces of the market.', 'legendary',
    '{"type": "level", "value": 73}', 'icon-atom'),
  ('icon_galaxy', 'avatar_icon', 'Galaxy', 'A universe of trading knowledge.', 'legendary',
    '{"type": "level", "value": 74}', 'icon-galaxy'),
  ('icon_dragon', 'avatar_icon', 'Dragon', 'Fearsome power and ancient wisdom.', 'legendary',
    '{"type": "level", "value": 77}', 'icon-dragon'),
  ('icon_supernova', 'avatar_icon', 'Supernova', 'Explosive brilliance that lights up the sky.', 'legendary',
    '{"type": "level", "value": 79}', 'icon-supernova'),
  ('icon_black_hole', 'avatar_icon', 'Black Hole', 'Infinite gravitational pull of mastery.', 'legendary',
    '{"type": "level", "value": 81}', 'icon-black-hole'),
  ('icon_quasar', 'avatar_icon', 'Quasar', 'The brightest object in the trading universe.', 'legendary',
    '{"type": "level", "value": 83}', 'icon-quasar'),
  ('icon_pulsar', 'avatar_icon', 'Pulsar', 'Rhythmic precision like a cosmic lighthouse.', 'legendary',
    '{"type": "level", "value": 84}', 'icon-pulsar'),
  ('icon_nebula_cloud', 'avatar_icon', 'Nebula Cloud', 'Birthing new strategies from cosmic dust.', 'legendary',
    '{"type": "level", "value": 86}', 'icon-nebula-cloud'),
  ('icon_solar_flare', 'avatar_icon', 'Solar Flare', 'Eruptions of trading brilliance.', 'legendary',
    '{"type": "level", "value": 87}', 'icon-solar-flare'),
  ('icon_wormhole', 'avatar_icon', 'Wormhole', 'Shortcuts through the fabric of the market.', 'legendary',
    '{"type": "level", "value": 89}', 'icon-wormhole'),
  ('icon_singularity', 'avatar_icon', 'Singularity', 'Where all trading knowledge converges.', 'legendary',
    '{"type": "level", "value": 91}', 'icon-singularity'),
  ('icon_dark_star', 'avatar_icon', 'Dark Star', 'A hidden force shaping the market around you.', 'legendary',
    '{"type": "level", "value": 92}', 'icon-dark-star'),
  ('icon_cosmic_web', 'avatar_icon', 'Cosmic Web', 'The interconnected fabric of all markets.', 'legendary',
    '{"type": "level", "value": 93}', 'icon-cosmic-web'),
  ('icon_multiverse', 'avatar_icon', 'Multiverse', 'Mastery across infinite market scenarios.', 'legendary',
    '{"type": "level", "value": 94}', 'icon-multiverse'),
  ('icon_time_crystal', 'avatar_icon', 'Time Crystal', 'A structure that defies the entropy of the market.', 'legendary',
    '{"type": "level", "value": 97}', 'icon-time-crystal'),
  ('icon_dyson_sphere', 'avatar_icon', 'Dyson Sphere', 'Harnessing the full energy of a star.', 'legendary',
    '{"type": "level", "value": 98}', 'icon-dyson-sphere'),
  ('icon_omega', 'avatar_icon', 'Omega', 'The end and the beginning. The final icon.', 'legendary',
    '{"type": "level", "value": 99}', 'icon-omega')
ON CONFLICT DO NOTHING;

-- ----- NEW THEME ACCENTS -----
INSERT INTO cosmetic_definitions (id, type, name, description, rarity, unlock_condition, css_class) VALUES
  ('accent_emerald', 'theme_accent', 'Emerald Accent', 'A fresh green that energizes the interface.', 'common',
    '{"type": "level", "value": 5}', 'accent-emerald'),
  ('accent_sapphire', 'theme_accent', 'Sapphire Accent', 'Cool blue tones of deep water.', 'uncommon',
    '{"type": "level", "value": 11}', 'accent-sapphire'),
  ('accent_amber', 'theme_accent', 'Amber Accent', 'Warm golden tones of fossilized resin.', 'uncommon',
    '{"type": "level", "value": 17}', 'accent-amber'),
  ('accent_teal', 'theme_accent', 'Teal Accent', 'The color of tropical waters.', 'uncommon',
    '{"type": "level", "value": 23}', 'accent-teal'),
  ('accent_rose', 'theme_accent', 'Rose Accent', 'Soft pink with bold undertones.', 'rare',
    '{"type": "level", "value": 29}', 'accent-rose'),
  ('accent_indigo', 'theme_accent', 'Indigo Accent', 'Deep and mysterious like twilight.', 'rare',
    '{"type": "level", "value": 36}', 'accent-indigo'),
  ('accent_coral', 'theme_accent', 'Coral Accent', 'Warm and inviting like a sunset reef.', 'rare',
    '{"type": "level", "value": 43}', 'accent-coral'),
  ('accent_lime', 'theme_accent', 'Lime Accent', 'Fresh and energetic citrus tones.', 'rare',
    '{"type": "level", "value": 48}', 'accent-lime'),
  ('accent_violet', 'theme_accent', 'Violet Accent', 'Regal purple with creative energy.', 'epic',
    '{"type": "level", "value": 54}', 'accent-violet'),
  ('accent_copper', 'theme_accent', 'Copper Accent', 'Earthy warmth of patinated metal.', 'epic',
    '{"type": "level", "value": 62}', 'accent-copper'),
  ('accent_ruby', 'theme_accent', 'Ruby Accent', 'Intense red of a precious stone.', 'epic',
    '{"type": "level", "value": 68}', 'accent-ruby'),
  ('accent_crimson', 'theme_accent', 'Crimson Accent', 'Deep red of unwavering determination.', 'epic',
    '{"type": "level", "value": 76}', 'accent-crimson'),
  ('accent_platinum', 'theme_accent', 'Platinum Accent', 'The cool elegance of rare metal.', 'legendary',
    '{"type": "level", "value": 82}', 'accent-platinum'),
  ('accent_obsidian', 'theme_accent', 'Obsidian Accent', 'Dark volcanic glass, sleek and refined.', 'legendary',
    '{"type": "level", "value": 88}', 'accent-obsidian'),
  ('accent_aurora', 'theme_accent', 'Aurora Accent', 'Ethereal colors of the northern lights.', 'legendary',
    '{"type": "level", "value": 96}', 'accent-aurora')
ON CONFLICT DO NOTHING;

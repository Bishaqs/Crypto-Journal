-- Cosmetics Overhaul: Rarity rebalance + ~150 new grindable cosmetics
-- Fixes the "everything prestige is legendary" problem
-- Adds themed banners (fire, lightning, binary, memes), spike frames, better flairs, more icons

-- ============================================================
-- 0. ADD MYTHIC RARITY TO SCHEMA
-- ============================================================
ALTER TABLE cosmetic_definitions DROP CONSTRAINT cosmetic_definitions_rarity_check;
ALTER TABLE cosmetic_definitions ADD CONSTRAINT cosmetic_definitions_rarity_check
  CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'));

-- ============================================================
-- 1. REBALANCE EXISTING PRESTIGE COSMETICS (101-500)
--    Downgrade most from legendary to appropriate tiers
-- ============================================================

-- TITLE BADGES: spread across rarities
UPDATE cosmetic_definitions SET rarity = 'uncommon' WHERE id = 'title_luminary';   -- Lv120
UPDATE cosmetic_definitions SET rarity = 'rare' WHERE id = 'title_archon';         -- Lv150
UPDATE cosmetic_definitions SET rarity = 'rare' WHERE id = 'title_titan';          -- Lv200
UPDATE cosmetic_definitions SET rarity = 'epic' WHERE id = 'title_celestial';      -- Lv300
UPDATE cosmetic_definitions SET rarity = 'legendary' WHERE id = 'title_eternal';   -- Lv400 (stays)
UPDATE cosmetic_definitions SET rarity = 'mythic' WHERE id = 'title_stargate_legend'; -- Lv500 → mythic

-- AVATAR FRAMES: spread across rarities
UPDATE cosmetic_definitions SET rarity = 'uncommon' WHERE id = 'frame_solar_ring';    -- Lv110
UPDATE cosmetic_definitions SET rarity = 'rare' WHERE id = 'frame_astral_shell';      -- Lv150
UPDATE cosmetic_definitions SET rarity = 'epic' WHERE id = 'frame_titan_core';        -- Lv200
UPDATE cosmetic_definitions SET rarity = 'epic' WHERE id = 'frame_void_crown';        -- Lv250
UPDATE cosmetic_definitions SET rarity = 'legendary' WHERE id = 'frame_celestial_halo'; -- Lv350 (stays)
UPDATE cosmetic_definitions SET rarity = 'mythic' WHERE id = 'frame_infinite_gate';   -- Lv500 → mythic

-- BANNERS: spread across rarities
UPDATE cosmetic_definitions SET rarity = 'uncommon' WHERE id = 'banner_solar_flare_prestige'; -- Lv115
UPDATE cosmetic_definitions SET rarity = 'rare' WHERE id = 'banner_void_stream';              -- Lv140
UPDATE cosmetic_definitions SET rarity = 'rare' WHERE id = 'banner_astral_sea';               -- Lv175
UPDATE cosmetic_definitions SET rarity = 'epic' WHERE id = 'banner_titan_horizon';             -- Lv225
UPDATE cosmetic_definitions SET rarity = 'epic' WHERE id = 'banner_celestial_field';           -- Lv300
UPDATE cosmetic_definitions SET rarity = 'mythic' WHERE id = 'banner_infinite_origin';         -- Lv500 → mythic

-- SIDEBAR FLAIR: spread across rarities
UPDATE cosmetic_definitions SET rarity = 'uncommon' WHERE id = 'flair_astral_wind';    -- Lv125
UPDATE cosmetic_definitions SET rarity = 'rare' WHERE id = 'flair_titan_pulse';        -- Lv200
UPDATE cosmetic_definitions SET rarity = 'epic' WHERE id = 'flair_celestial_orbit';    -- Lv350
UPDATE cosmetic_definitions SET rarity = 'mythic' WHERE id = 'flair_infinite_portal';  -- Lv500 → mythic

-- AVATAR ICONS: prestige icons spread across rarities
UPDATE cosmetic_definitions SET rarity = 'uncommon' WHERE id = 'icon_starfall';          -- Lv105
UPDATE cosmetic_definitions SET rarity = 'uncommon' WHERE id = 'icon_void_shard';        -- Lv130
UPDATE cosmetic_definitions SET rarity = 'rare' WHERE id = 'icon_astral_key';            -- Lv160
UPDATE cosmetic_definitions SET rarity = 'rare' WHERE id = 'icon_titan_hammer';          -- Lv190
UPDATE cosmetic_definitions SET rarity = 'rare' WHERE id = 'icon_celestial_eye';         -- Lv220
UPDATE cosmetic_definitions SET rarity = 'epic' WHERE id = 'icon_solar_crest';           -- Lv250
UPDATE cosmetic_definitions SET rarity = 'epic' WHERE id = 'icon_nebula_heart';          -- Lv280
UPDATE cosmetic_definitions SET rarity = 'epic' WHERE id = 'icon_quantum_core';          -- Lv310
UPDATE cosmetic_definitions SET rarity = 'epic' WHERE id = 'icon_dark_matter_shard';     -- Lv340
UPDATE cosmetic_definitions SET rarity = 'epic' WHERE id = 'icon_cosmic_forge';          -- Lv370
UPDATE cosmetic_definitions SET rarity = 'legendary' WHERE id = 'icon_eternal_flame';    -- Lv400 (stays)
UPDATE cosmetic_definitions SET rarity = 'legendary' WHERE id = 'icon_void_walker';      -- Lv430 (stays)
UPDATE cosmetic_definitions SET rarity = 'legendary' WHERE id = 'icon_dimension_rift';   -- Lv460 (stays)
UPDATE cosmetic_definitions SET rarity = 'legendary' WHERE id = 'icon_infinite_star';    -- Lv480 (stays)
UPDATE cosmetic_definitions SET rarity = 'mythic' WHERE id = 'icon_stargate_key';        -- Lv500 → mythic

-- ICONS Lv61-99: too many legendaries, downgrade most to epic/rare
UPDATE cosmetic_definitions SET rarity = 'epic' WHERE id = 'icon_rocket';          -- Lv61
UPDATE cosmetic_definitions SET rarity = 'epic' WHERE id = 'icon_phoenix';         -- Lv64
UPDATE cosmetic_definitions SET rarity = 'epic' WHERE id = 'icon_diamond';         -- Lv66
UPDATE cosmetic_definitions SET rarity = 'epic' WHERE id = 'icon_lightning_bolt';  -- Lv67
UPDATE cosmetic_definitions SET rarity = 'epic' WHERE id = 'icon_eye';             -- Lv69
UPDATE cosmetic_definitions SET rarity = 'epic' WHERE id = 'icon_mountain';        -- Lv71
UPDATE cosmetic_definitions SET rarity = 'epic' WHERE id = 'icon_wave';            -- Lv72
UPDATE cosmetic_definitions SET rarity = 'epic' WHERE id = 'icon_atom';            -- Lv73
UPDATE cosmetic_definitions SET rarity = 'epic' WHERE id = 'icon_galaxy';          -- Lv74
UPDATE cosmetic_definitions SET rarity = 'legendary' WHERE id = 'icon_dragon';     -- Lv77 (stays)
UPDATE cosmetic_definitions SET rarity = 'epic' WHERE id = 'icon_supernova';       -- Lv79
UPDATE cosmetic_definitions SET rarity = 'legendary' WHERE id = 'icon_black_hole'; -- Lv81 (stays)
UPDATE cosmetic_definitions SET rarity = 'epic' WHERE id = 'icon_quasar';          -- Lv83
UPDATE cosmetic_definitions SET rarity = 'epic' WHERE id = 'icon_pulsar';          -- Lv84
UPDATE cosmetic_definitions SET rarity = 'epic' WHERE id = 'icon_nebula_cloud';    -- Lv86
UPDATE cosmetic_definitions SET rarity = 'epic' WHERE id = 'icon_solar_flare';     -- Lv87
UPDATE cosmetic_definitions SET rarity = 'legendary' WHERE id = 'icon_wormhole';   -- Lv89 (stays)
UPDATE cosmetic_definitions SET rarity = 'legendary' WHERE id = 'icon_singularity'; -- Lv91 (stays)
UPDATE cosmetic_definitions SET rarity = 'epic' WHERE id = 'icon_dark_star';       -- Lv92
UPDATE cosmetic_definitions SET rarity = 'epic' WHERE id = 'icon_cosmic_web';      -- Lv93
UPDATE cosmetic_definitions SET rarity = 'legendary' WHERE id = 'icon_multiverse'; -- Lv94 (stays)
UPDATE cosmetic_definitions SET rarity = 'legendary' WHERE id = 'icon_time_crystal'; -- Lv97 (stays)
UPDATE cosmetic_definitions SET rarity = 'legendary' WHERE id = 'icon_dyson_sphere'; -- Lv98 (stays)
UPDATE cosmetic_definitions SET rarity = 'legendary' WHERE id = 'icon_omega';        -- Lv99 (stays)

-- THEME ACCENTS: prestige accents rebalance
UPDATE cosmetic_definitions SET rarity = 'rare' WHERE id = 'accent_solar';         -- Lv130
UPDATE cosmetic_definitions SET rarity = 'rare' WHERE id = 'accent_void';          -- Lv180
UPDATE cosmetic_definitions SET rarity = 'epic' WHERE id = 'accent_titan';         -- Lv250
UPDATE cosmetic_definitions SET rarity = 'legendary' WHERE id = 'accent_celestial'; -- Lv375 (stays)
UPDATE cosmetic_definitions SET rarity = 'legendary' WHERE id = 'accent_infinite'; -- Lv450 (stays)


-- ============================================================
-- 2. NEW BANNERS — Animated, Meme, Trading-Themed
-- ============================================================

-- COMMON BANNERS (early levels, easy to unlock)
INSERT INTO cosmetic_definitions (id, type, name, description, rarity, unlock_condition, css_class) VALUES
  ('banner_paper_hands', 'banner', 'Paper Hands', 'A paper airplane gently floating downward. We''ve all been there.', 'common',
    '{"type": "level", "value": 3}', 'banner-paper-hands'),
  ('banner_wen_lambo', 'banner', 'Wen Lambo', 'Pixel art sports car cruising through an 8-bit landscape.', 'common',
    '{"type": "level", "value": 8}', 'banner-wen-lambo'),
  ('banner_red_alert', 'banner', 'Red Alert', 'Pulsing red gradient. The portfolio is bleeding.', 'common',
    '{"type": "level", "value": 12}', 'banner-red-alert'),
  ('banner_buy_high_sell_low', 'banner', 'Buy High Sell Low', 'The classic strategy nobody asked for, on a gradient.', 'common',
    '{"type": "level", "value": 15}', 'banner-buy-high-sell-low'),
  ('banner_green_candles', 'banner', 'Green Candles', 'A cascade of rising green candlesticks. The dream.', 'common',
    '{"type": "level", "value": 20}', 'banner-green-candles'),
  ('banner_static_noise', 'banner', 'Static Noise', 'Old-school TV static. Sometimes that''s the chart.', 'common',
    '{"type": "level", "value": 28}', 'banner-static-noise'),
  ('banner_moonrise', 'banner', 'Moonrise', 'A serene moon rising over dark mountains.', 'common',
    '{"type": "level", "value": 33}', 'banner-moonrise')
ON CONFLICT (id) DO NOTHING;

-- UNCOMMON BANNERS
INSERT INTO cosmetic_definitions (id, type, name, description, rarity, unlock_condition, css_class) VALUES
  ('banner_stonks', 'banner', 'Stonks', 'Arrow goes up. Always up. Classic.', 'uncommon',
    '{"type": "level", "value": 25}', 'banner-stonks'),
  ('banner_aurora_shimmer', 'banner', 'Aurora Shimmer', 'Animated aurora borealis dancing across the sky.', 'uncommon',
    '{"type": "level", "value": 35}', 'banner-aurora-shimmer'),
  ('banner_neon_pulse', 'banner', 'Neon Pulse', 'Pulsing neon gradient in cyberpunk pink and blue.', 'uncommon',
    '{"type": "level", "value": 45}', 'banner-neon-pulse'),
  ('banner_city_skyline', 'banner', 'City Skyline', 'Neon-lit city skyline at night. Wall Street vibes.', 'uncommon',
    '{"type": "level", "value": 48}', 'banner-city-skyline'),
  ('banner_radar_sweep', 'banner', 'Radar Sweep', 'A rotating radar beam scanning for opportunities.', 'uncommon',
    '{"type": "level", "value": 105}', 'banner-radar-sweep'),
  ('banner_ticker_tape', 'banner', 'Ticker Tape', 'Scrolling stock ticker across the banner.', 'uncommon',
    '{"type": "level", "value": 115}', 'banner-ticker-tape'),
  ('banner_gradient_wave', 'banner', 'Gradient Wave', 'Smooth flowing gradient waves.', 'uncommon',
    '{"type": "level", "value": 125}', 'banner-gradient-wave')
ON CONFLICT (id) DO NOTHING;

-- RARE BANNERS
INSERT INTO cosmetic_definitions (id, type, name, description, rarity, unlock_condition, css_class) VALUES
  ('banner_diamond_hands', 'banner', 'Diamond Hands', 'Crystal refraction shimmer. Hold through anything.', 'rare',
    '{"type": "level", "value": 55}', 'banner-diamond-hands'),
  ('banner_liquidation', 'banner', 'Liquidation Cascade', 'Numbers cascading down like a waterfall. Ouch.', 'rare',
    '{"type": "level", "value": 60}', 'banner-liquidation'),
  ('banner_dumpster_fire', 'banner', 'Dumpster Fire', 'A dumpster with animated CSS flames. This is fine.', 'rare',
    '{"type": "level", "value": 100}', 'banner-dumpster-fire'),
  ('banner_bull_run', 'banner', 'Bull Run', 'Charging bull silhouette with gold particle trail.', 'rare',
    '{"type": "level", "value": 130}', 'banner-bull-run'),
  ('banner_bear_market', 'banner', 'Bear Market', 'Dark storm clouds with animated rain streaks.', 'rare',
    '{"type": "level", "value": 110}', 'banner-bear-market'),
  ('banner_matrix_rain', 'banner', 'Matrix Rain', 'Falling crypto symbols in green digital rain.', 'rare',
    '{"type": "level", "value": 120}', 'banner-matrix-rain'),
  ('banner_inferno', 'banner', 'Inferno', 'Blazing CSS fire effect with rising embers.', 'rare',
    '{"type": "level", "value": 160}', 'banner-inferno'),
  ('banner_trust_process', 'banner', 'Trust The Process', 'An infinite loading bar that never quite finishes.', 'rare',
    '{"type": "level", "value": 180}', 'banner-trust-process'),
  ('banner_candlestick_forest', 'banner', 'Candlestick Forest', 'Dense forest of candles, green and red.', 'rare',
    '{"type": "level", "value": 145}', 'banner-candlestick-forest'),
  ('banner_circuit_flow', 'banner', 'Circuit Flow', 'Glowing circuit traces with data pulses.', 'rare',
    '{"type": "level", "value": 170}', 'banner-circuit-flow')
ON CONFLICT (id) DO NOTHING;

-- EPIC BANNERS
INSERT INTO cosmetic_definitions (id, type, name, description, rarity, unlock_condition, css_class) VALUES
  ('banner_lightning_storm', 'banner', 'Lightning Storm', 'Electric arcs crackle across a dark sky with blue glow.', 'epic',
    '{"type": "level", "value": 70}', 'banner-lightning-storm'),
  ('banner_hodl_fortress', 'banner', 'HODL Fortress', 'A stone fortress with flickering torches. Unbreakable conviction.', 'epic',
    '{"type": "level", "value": 75}', 'banner-hodl-fortress'),
  ('banner_particle_drift', 'banner', 'Particle Drift', 'Golden particles floating upward in warm light.', 'epic',
    '{"type": "level", "value": 90}', 'banner-particle-drift'),
  ('banner_glitch', 'banner', 'Glitch', 'Digital glitch distortion with scan lines and RGB split.', 'epic',
    '{"type": "level", "value": 200}', 'banner-glitch'),
  ('banner_ngmi_wagmi', 'banner', 'NGMI / WAGMI', 'Split banner: dark despair on one side, golden triumph on the other.', 'epic',
    '{"type": "level", "value": 250}', 'banner-ngmi-wagmi'),
  ('banner_northern_lights', 'banner', 'Northern Lights', 'Vivid animated aurora with color shifts.', 'epic',
    '{"type": "level", "value": 190}', 'banner-northern-lights'),
  ('banner_lava_flow', 'banner', 'Lava Flow', 'Molten lava streams with glowing cracks.', 'epic',
    '{"type": "level", "value": 270}', 'banner-lava-flow'),
  ('banner_cyber_grid', 'banner', 'Cyber Grid', 'Perspective grid with neon lines receding to horizon.', 'epic',
    '{"type": "level", "value": 320}', 'banner-cyber-grid')
ON CONFLICT (id) DO NOTHING;

-- LEGENDARY BANNERS
INSERT INTO cosmetic_definitions (id, type, name, description, rarity, unlock_condition, css_class) VALUES
  ('banner_whale_splash', 'banner', 'Whale Splash', 'Ocean waves with gold coins surfacing. Only for the biggest.', 'legendary',
    '{"type": "level", "value": 300}', 'banner-whale-splash'),
  ('banner_holographic', 'banner', 'Holographic', 'Rainbow prismatic shift that follows the light. Mesmerizing.', 'legendary',
    '{"type": "level", "value": 350}', 'banner-holographic'),
  ('banner_moon_shot', 'banner', 'Moon Shot', 'Rocket blazing through a starfield with particle exhaust.', 'legendary',
    '{"type": "level", "value": 400}', 'banner-moon-shot'),
  ('banner_supernova_collapse', 'banner', 'Supernova Collapse', 'A star imploding and exploding in slow motion.', 'legendary',
    '{"type": "level", "value": 450}', 'banner-supernova-collapse')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 3. NEW FRAMES — Spikes, Animations, Creative Designs
-- ============================================================

-- COMMON FRAMES
INSERT INTO cosmetic_definitions (id, type, name, description, rarity, unlock_condition, css_class) VALUES
  ('frame_wooden', 'avatar_frame', 'Wooden', 'A simple wood grain border. Humble beginnings.', 'common',
    '{"type": "level", "value": 5}', 'frame-wooden'),
  ('frame_pixel', 'avatar_frame', 'Pixel', 'Retro pixel art border. 8-bit nostalgia.', 'common',
    '{"type": "level", "value": 8}', 'frame-pixel'),
  ('frame_steel', 'avatar_frame', 'Steel', 'Brushed steel look. Industrial strength.', 'common',
    '{"type": "level", "value": 10}', 'frame-steel'),
  ('frame_frost', 'avatar_frame', 'Frost', 'Frosted icy border with a cool blue tint.', 'common',
    '{"type": "level", "value": 15}', 'frame-frost'),
  ('frame_basic_glow', 'avatar_frame', 'Basic Glow', 'A soft white glow around the avatar.', 'common',
    '{"type": "level", "value": 18}', 'frame-basic-glow'),
  ('frame_dotted', 'avatar_frame', 'Dotted', 'Dotted border. Clean and minimal.', 'common',
    '{"type": "level", "value": 102}', 'frame-dotted'),
  ('frame_double_line', 'avatar_frame', 'Double Line', 'Two concentric border lines.', 'common',
    '{"type": "level", "value": 108}', 'frame-double-line')
ON CONFLICT (id) DO NOTHING;

-- UNCOMMON FRAMES
INSERT INTO cosmetic_definitions (id, type, name, description, rarity, unlock_condition, css_class) VALUES
  ('frame_neon_glow', 'avatar_frame', 'Neon Glow', 'Pulsing neon border that breathes.', 'uncommon',
    '{"type": "level", "value": 20}', 'frame-neon-glow'),
  ('frame_blockchain', 'avatar_frame', 'Blockchain', 'Interlocking chain links form the border.', 'uncommon',
    '{"type": "level", "value": 40}', 'frame-blockchain'),
  ('frame_gradient_ring', 'avatar_frame', 'Gradient Ring', 'Smooth gradient that shifts colors slowly.', 'uncommon',
    '{"type": "level", "value": 120}', 'frame-gradient-ring'),
  ('frame_bamboo', 'avatar_frame', 'Bamboo', 'Natural bamboo segments forming a ring.', 'uncommon',
    '{"type": "level", "value": 135}', 'frame-bamboo'),
  ('frame_hex_grid', 'avatar_frame', 'Hex Grid', 'Hexagonal mesh pattern border.', 'uncommon',
    '{"type": "level", "value": 145}', 'frame-hex-grid')
ON CONFLICT (id) DO NOTHING;

-- RARE FRAMES
INSERT INTO cosmetic_definitions (id, type, name, description, rarity, unlock_condition, css_class) VALUES
  ('frame_barbed_wire', 'avatar_frame', 'Barbed Wire', 'Metallic thorns and spikes. Don''t touch.', 'rare',
    '{"type": "level", "value": 50}', 'frame-barbed-wire'),
  ('frame_circuit_board', 'avatar_frame', 'Circuit Board', 'PCB traces glow with data pulses.', 'rare',
    '{"type": "level", "value": 130}', 'frame-circuit-board'),
  ('frame_runic', 'avatar_frame', 'Runic', 'Ancient runes etched into stone border.', 'rare',
    '{"type": "level", "value": 155}', 'frame-runic'),
  ('frame_gear_ring', 'avatar_frame', 'Gear Ring', 'Interlocking gears that slowly rotate.', 'rare',
    '{"type": "level", "value": 165}', 'frame-gear-ring'),
  ('frame_vine_wrap', 'avatar_frame', 'Vine Wrap', 'Living vines with small glowing flowers.', 'rare',
    '{"type": "level", "value": 175}', 'frame-vine-wrap'),
  ('frame_dragon_scale', 'avatar_frame', 'Dragon Scale', 'Overlapping scales with metallic sheen.', 'rare',
    '{"type": "level", "value": 185}', 'frame-dragon-scale')
ON CONFLICT (id) DO NOTHING;

-- EPIC FRAMES
INSERT INTO cosmetic_definitions (id, type, name, description, rarity, unlock_condition, css_class) VALUES
  ('frame_crystal_shard', 'avatar_frame', 'Crystal Shard', 'Jagged crystalline border with light refraction.', 'epic',
    '{"type": "level", "value": 70}', 'frame-crystal-shard'),
  ('frame_bull_horns', 'avatar_frame', 'Bull Horns', 'Angular spikes pointing upward like bull horns.', 'epic',
    '{"type": "level", "value": 85}', 'frame-bull-horns'),
  ('frame_data_stream', 'avatar_frame', 'Data Stream', 'Flowing data dots tracing the border path.', 'epic',
    '{"type": "level", "value": 210}', 'frame-data-stream'),
  ('frame_lightning_ring', 'avatar_frame', 'Lightning Ring', 'Electric arcs crackling around the avatar.', 'epic',
    '{"type": "level", "value": 230}', 'frame-lightning-ring'),
  ('frame_molten', 'avatar_frame', 'Molten', 'Glowing molten metal with orange cracks.', 'epic',
    '{"type": "level", "value": 260}', 'frame-molten'),
  ('frame_shadow_flame', 'avatar_frame', 'Shadow Flame', 'Dark fire that consumes the border.', 'epic',
    '{"type": "level", "value": 290}', 'frame-shadow-flame')
ON CONFLICT (id) DO NOTHING;

-- LEGENDARY FRAMES
INSERT INTO cosmetic_definitions (id, type, name, description, rarity, unlock_condition, css_class) VALUES
  ('frame_rotating_gradient', 'avatar_frame', 'Rotating Gradient', 'Spinning conic-gradient rainbow border.', 'legendary',
    '{"type": "level", "value": 330}', 'frame-rotating-gradient'),
  ('frame_flame_ring', 'avatar_frame', 'Flame Ring', 'Animated ring of fire around your avatar.', 'legendary',
    '{"type": "level", "value": 380}', 'frame-flame-ring'),
  ('frame_void_fracture', 'avatar_frame', 'Void Fracture', 'Reality shatters around your avatar like broken glass.', 'legendary',
    '{"type": "level", "value": 420}', 'frame-void-fracture')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 4. NEW SIDEBAR FLAIRS — More effects, more animations
-- ============================================================

-- COMMON FLAIRS
INSERT INTO cosmetic_definitions (id, type, name, description, rarity, unlock_condition, css_class) VALUES
  ('flair_confetti', 'sidebar_flair', 'Confetti', 'Small confetti particles float around you.', 'common',
    '{"type": "level", "value": 8}', 'flair-confetti'),
  ('flair_ember', 'sidebar_flair', 'Ember', 'Tiny glowing embers drift upward.', 'common',
    '{"type": "level", "value": 15}', 'flair-ember'),
  ('flair_snowfall', 'sidebar_flair', 'Snowfall', 'Gentle snowflakes falling around your name.', 'common',
    '{"type": "level", "value": 20}', 'flair-snowfall'),
  ('flair_rain', 'sidebar_flair', 'Rain', 'Subtle rain drops for the contemplative trader.', 'common',
    '{"type": "level", "value": 28}', 'flair-rain'),
  ('flair_dust', 'sidebar_flair', 'Dust', 'Floating dust motes in a sunbeam.', 'common',
    '{"type": "level", "value": 105}', 'flair-dust'),
  ('flair_bubbles', 'sidebar_flair', 'Bubbles', 'Tiny bubbles floating up.', 'common',
    '{"type": "level", "value": 112}', 'flair-bubbles')
ON CONFLICT (id) DO NOTHING;

-- UNCOMMON FLAIRS
INSERT INTO cosmetic_definitions (id, type, name, description, rarity, unlock_condition, css_class) VALUES
  ('flair_firefly', 'sidebar_flair', 'Firefly', 'Floating light dots blink softly.', 'uncommon',
    '{"type": "level", "value": 30}', 'flair-firefly'),
  ('flair_sakura', 'sidebar_flair', 'Sakura', 'Cherry blossom petals drifting in the wind.', 'uncommon',
    '{"type": "level", "value": 45}', 'flair-sakura'),
  ('flair_leaves', 'sidebar_flair', 'Leaves', 'Autumn leaves falling gently.', 'uncommon',
    '{"type": "level", "value": 130}', 'flair-leaves'),
  ('flair_ripple', 'sidebar_flair', 'Ripple', 'Concentric ripples emanating outward.', 'uncommon',
    '{"type": "level", "value": 140}', 'flair-ripple'),
  ('flair_stardust', 'sidebar_flair', 'Stardust', 'Tiny twinkling star particles.', 'uncommon',
    '{"type": "level", "value": 155}', 'flair-stardust')
ON CONFLICT (id) DO NOTHING;

-- RARE FLAIRS
INSERT INTO cosmetic_definitions (id, type, name, description, rarity, unlock_condition, css_class) VALUES
  ('flair_electric', 'sidebar_flair', 'Electric', 'Small electric sparks crackle.', 'rare',
    '{"type": "level", "value": 60}', 'flair-electric'),
  ('flair_crystal', 'sidebar_flair', 'Crystal', 'Crystal refraction sparkles around you.', 'rare',
    '{"type": "level", "value": 70}', 'flair-crystal'),
  ('flair_hologram', 'sidebar_flair', 'Hologram', 'Holographic shimmer effect.', 'rare',
    '{"type": "level", "value": 150}', 'flair-hologram'),
  ('flair_smoke', 'sidebar_flair', 'Smoke', 'Wisps of dark smoke curling upward.', 'rare',
    '{"type": "level", "value": 170}', 'flair-smoke'),
  ('flair_frost_aura', 'sidebar_flair', 'Frost Aura', 'Icy crystals form and dissipate.', 'rare',
    '{"type": "level", "value": 185}', 'flair-frost-aura')
ON CONFLICT (id) DO NOTHING;

-- EPIC FLAIRS
INSERT INTO cosmetic_definitions (id, type, name, description, rarity, unlock_condition, css_class) VALUES
  ('flair_matrix', 'sidebar_flair', 'Matrix', 'Mini binary rain drips from your name.', 'epic',
    '{"type": "level", "value": 80}', 'flair-matrix'),
  ('flair_lightning', 'sidebar_flair', 'Lightning', 'Lightning crackles around your presence.', 'epic',
    '{"type": "level", "value": 100}', 'flair-lightning'),
  ('flair_neon_trail', 'sidebar_flair', 'Neon Trail', 'Bright neon light trails follow your name.', 'epic',
    '{"type": "level", "value": 220}', 'flair-neon-trail'),
  ('flair_flame_wisp', 'sidebar_flair', 'Flame Wisp', 'Dancing flame wisps orbit your name.', 'epic',
    '{"type": "level", "value": 260}', 'flair-flame-wisp'),
  ('flair_gravity_well', 'sidebar_flair', 'Gravity Well', 'Particles spiral inward like a gravity well.', 'epic',
    '{"type": "level", "value": 310}', 'flair-gravity-well')
ON CONFLICT (id) DO NOTHING;

-- LEGENDARY FLAIRS
INSERT INTO cosmetic_definitions (id, type, name, description, rarity, unlock_condition, css_class) VALUES
  ('flair_void_particles', 'sidebar_flair', 'Void Particles', 'Dark matter particles warp space around you.', 'legendary',
    '{"type": "level", "value": 350}', 'flair-void-particles'),
  ('flair_plasma_arc', 'sidebar_flair', 'Plasma Arc', 'Plasma electricity arcs between invisible points.', 'legendary',
    '{"type": "level", "value": 400}', 'flair-plasma-arc'),
  ('flair_solar_eruption', 'sidebar_flair', 'Solar Eruption', 'Miniature solar flares burst from your name.', 'legendary',
    '{"type": "level", "value": 450}', 'flair-solar-eruption')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 5. NEW TITLE BADGES — Fill gaps across rarities
-- ============================================================

-- COMMON TITLES
INSERT INTO cosmetic_definitions (id, type, name, description, rarity, unlock_condition, css_class) VALUES
  ('title_newbie', 'title_badge', 'Newbie', 'Fresh off the boat.', 'common',
    '{"type": "level", "value": 1}', 'title-newbie'),
  ('title_student', 'title_badge', 'Student', 'Always learning, never assuming.', 'common',
    '{"type": "level", "value": 10}', 'title-student'),
  ('title_enthusiast', 'title_badge', 'Enthusiast', 'Passion before profit.', 'common',
    '{"type": "level", "value": 15}', 'title-enthusiast'),
  ('title_tracker', 'title_badge', 'Tracker', 'Tracking every move, every lesson.', 'common',
    '{"type": "level", "value": 18}', 'title-tracker'),
  ('title_grinder', 'title_badge', 'Grinder', 'Showing up every single day.', 'common',
    '{"type": "level", "value": 102}', 'title-grinder'),
  ('title_dedicated', 'title_badge', 'Dedicated', 'Commitment is the first step.', 'common',
    '{"type": "level", "value": 106}', 'title-dedicated')
ON CONFLICT (id) DO NOTHING;

-- UNCOMMON TITLES
INSERT INTO cosmetic_definitions (id, type, name, description, rarity, unlock_condition, css_class) VALUES
  ('title_disciplined', 'title_badge', 'Disciplined', 'Rules are rules.', 'uncommon',
    '{"type": "level", "value": 24}', 'title-disciplined'),
  ('title_risk_manager', 'title_badge', 'Risk Manager', 'Position sizing is an art.', 'uncommon',
    '{"type": "level", "value": 32}', 'title-risk-manager'),
  ('title_chart_reader', 'title_badge', 'Chart Reader', 'The candles speak to me.', 'uncommon',
    '{"type": "level", "value": 38}', 'title-chart-reader'),
  ('title_night_owl', 'title_badge', 'Night Owl', 'Trading under the midnight oil.', 'uncommon',
    '{"type": "level", "value": 110}', 'title-night-owl'),
  ('title_early_bird', 'title_badge', 'Early Bird', 'First one at the market open.', 'uncommon',
    '{"type": "level", "value": 118}', 'title-early-bird'),
  ('title_data_miner', 'title_badge', 'Data Miner', 'Digging deep into the numbers.', 'uncommon',
    '{"type": "level", "value": 128}', 'title-data-miner'),
  ('title_iron_will', 'title_badge', 'Iron Will', 'Unshakeable conviction.', 'uncommon',
    '{"type": "level", "value": 138}', 'title-iron-will')
ON CONFLICT (id) DO NOTHING;

-- RARE TITLES
INSERT INTO cosmetic_definitions (id, type, name, description, rarity, unlock_condition, css_class) VALUES
  ('title_diamond_trader', 'title_badge', 'Diamond Trader', 'Pressure creates diamonds.', 'rare',
    '{"type": "level", "value": 48}', 'title-diamond-trader'),
  ('title_whale', 'title_badge', 'Whale', 'Making waves in the market.', 'rare',
    '{"type": "level", "value": 62}', 'title-whale'),
  ('title_market_monk', 'title_badge', 'Market Monk', 'Zen and the art of trading.', 'rare',
    '{"type": "level", "value": 155}', 'title-market-monk'),
  ('title_algorithm', 'title_badge', 'Algorithm', 'Trading like a machine.', 'rare',
    '{"type": "level", "value": 175}', 'title-algorithm'),
  ('title_phoenix', 'title_badge', 'Phoenix', 'Rising from every drawdown.', 'rare',
    '{"type": "level", "value": 195}', 'title-phoenix'),
  ('title_sentinel', 'title_badge', 'Sentinel', 'Watchful guardian of the portfolio.', 'rare',
    '{"type": "level", "value": 215}', 'title-sentinel')
ON CONFLICT (id) DO NOTHING;

-- EPIC TITLES
INSERT INTO cosmetic_definitions (id, type, name, description, rarity, unlock_condition, css_class) VALUES
  ('title_legend', 'title_badge', 'Legend', 'Stories will be told about this one.', 'epic',
    '{"type": "level", "value": 78}', 'title-legend'),
  ('title_warden', 'title_badge', 'Warden', 'Keeper of the discipline.', 'epic',
    '{"type": "level", "value": 240}', 'title-warden'),
  ('title_sovereign', 'title_badge', 'Sovereign', 'Ruling the markets with wisdom.', 'epic',
    '{"type": "level", "value": 280}', 'title-sovereign'),
  ('title_void_trader', 'title_badge', 'Void Trader', 'Trading in the space between certainty.', 'epic',
    '{"type": "level", "value": 340}', 'title-void-trader'),
  ('title_apex', 'title_badge', 'Apex', 'Peak performance, peak discipline.', 'epic',
    '{"type": "level", "value": 370}', 'title-apex')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 6. NEW AVATAR ICONS — Fill common/uncommon/rare gaps
-- ============================================================

-- COMMON ICONS (trading tools, basics)
INSERT INTO cosmetic_definitions (id, type, name, description, rarity, unlock_condition, css_class) VALUES
  ('icon_calculator', 'avatar_icon', 'Calculator', 'Crunching the numbers.', 'common',
    '{"type": "level", "value": 3}', 'icon-calculator'),
  ('icon_notebook', 'avatar_icon', 'Notebook', 'Every trade deserves a note.', 'common',
    '{"type": "level", "value": 5}', 'icon-notebook'),
  ('icon_coffee', 'avatar_icon', 'Coffee', 'Fuel for the grind.', 'common',
    '{"type": "level", "value": 6}', 'icon-coffee'),
  ('icon_magnifier', 'avatar_icon', 'Magnifier', 'Looking closer at the details.', 'common',
    '{"type": "level", "value": 8}', 'icon-magnifier'),
  ('icon_bell', 'avatar_icon', 'Bell', 'Alert set. Now we wait.', 'common',
    '{"type": "level", "value": 10}', 'icon-bell'),
  ('icon_clock', 'avatar_icon', 'Clock', 'Timing is everything.', 'common',
    '{"type": "level", "value": 12}', 'icon-clock'),
  ('icon_key', 'avatar_icon', 'Key', 'Unlocking market secrets.', 'common',
    '{"type": "level", "value": 14}', 'icon-key'),
  ('icon_dice', 'avatar_icon', 'Dice', 'Every trade has an element of chance.', 'common',
    '{"type": "level", "value": 16}', 'icon-dice'),
  ('icon_music', 'avatar_icon', 'Music Note', 'Trading in harmony.', 'common',
    '{"type": "level", "value": 18}', 'icon-music'),
  ('icon_puzzle', 'avatar_icon', 'Puzzle', 'Putting the pieces together.', 'common',
    '{"type": "level", "value": 20}', 'icon-puzzle')
ON CONFLICT (id) DO NOTHING;

-- UNCOMMON ICONS
INSERT INTO cosmetic_definitions (id, type, name, description, rarity, unlock_condition, css_class) VALUES
  ('icon_bitcoin', 'avatar_icon', 'Bitcoin', 'The OG cryptocurrency.', 'uncommon',
    '{"type": "level", "value": 22}', 'icon-bitcoin'),
  ('icon_ethereum', 'avatar_icon', 'Ethereum', 'Smart contracts, smart trading.', 'uncommon',
    '{"type": "level", "value": 25}', 'icon-ethereum'),
  ('icon_bull', 'avatar_icon', 'Bull', 'Charge forward with conviction.', 'uncommon',
    '{"type": "level", "value": 28}', 'icon-bull'),
  ('icon_bear', 'avatar_icon', 'Bear', 'Respect the downtrend.', 'uncommon',
    '{"type": "level", "value": 30}', 'icon-bear'),
  ('icon_fingerprint', 'avatar_icon', 'Fingerprint', 'Your unique trading style.', 'uncommon',
    '{"type": "level", "value": 32}', 'icon-fingerprint'),
  ('icon_stopwatch', 'avatar_icon', 'Stopwatch', 'Speed and precision.', 'uncommon',
    '{"type": "level", "value": 35}', 'icon-stopwatch'),
  ('icon_whale', 'avatar_icon', 'Whale', 'Making big splashes.', 'uncommon',
    '{"type": "level", "value": 38}', 'icon-whale'),
  ('icon_hawk', 'avatar_icon', 'Hawk', 'Eyes like a hawk on the charts.', 'uncommon',
    '{"type": "level", "value": 40}', 'icon-hawk'),
  ('icon_fox', 'avatar_icon', 'Fox', 'Clever and quick on the trade.', 'uncommon',
    '{"type": "level", "value": 42}', 'icon-fox'),
  ('icon_mining', 'avatar_icon', 'Mining Pick', 'Mining for alpha.', 'uncommon',
    '{"type": "level", "value": 44}', 'icon-mining')
ON CONFLICT (id) DO NOTHING;

-- RARE ICONS (fill prestige gap)
INSERT INTO cosmetic_definitions (id, type, name, description, rarity, unlock_condition, css_class) VALUES
  ('icon_binoculars', 'avatar_icon', 'Binoculars', 'Scouting the horizon for setups.', 'rare',
    '{"type": "level", "value": 115}', 'icon-binoculars'),
  ('icon_radar', 'avatar_icon', 'Radar', 'Scanning for opportunities.', 'rare',
    '{"type": "level", "value": 125}', 'icon-radar'),
  ('icon_anvil', 'avatar_icon', 'Anvil', 'Forging discipline through repetition.', 'rare',
    '{"type": "level", "value": 140}', 'icon-anvil'),
  ('icon_tornado', 'avatar_icon', 'Tornado', 'A force of nature in the market.', 'rare',
    '{"type": "level", "value": 150}', 'icon-tornado'),
  ('icon_hourglass_flip', 'avatar_icon', 'Hourglass Flip', 'Time flips, patience pays.', 'rare',
    '{"type": "level", "value": 170}', 'icon-hourglass-flip'),
  ('icon_crosshair', 'avatar_icon', 'Crosshair', 'Precision targeting of entries.', 'rare',
    '{"type": "level", "value": 180}', 'icon-crosshair'),
  ('icon_chain', 'avatar_icon', 'Chain', 'Strong links in the trading chain.', 'rare',
    '{"type": "level", "value": 195}', 'icon-chain'),
  ('icon_satellite', 'avatar_icon', 'Satellite', 'Orbital view of the markets.', 'rare',
    '{"type": "level", "value": 210}', 'icon-satellite')
ON CONFLICT (id) DO NOTHING;

-- EPIC ICONS (prestige mid-range)
INSERT INTO cosmetic_definitions (id, type, name, description, rarity, unlock_condition, css_class) VALUES
  ('icon_crystal_ball', 'avatar_icon', 'Crystal Ball', 'Foreseeing market moves.', 'epic',
    '{"type": "level", "value": 240}', 'icon-crystal-ball'),
  ('icon_trident', 'avatar_icon', 'Trident', 'Ruling the seas of volatility.', 'epic',
    '{"type": "level", "value": 260}', 'icon-trident'),
  ('icon_phoenix_wing', 'avatar_icon', 'Phoenix Wing', 'Wings of the reborn trader.', 'epic',
    '{"type": "level", "value": 290}', 'icon-phoenix-wing'),
  ('icon_lightning_orb', 'avatar_icon', 'Lightning Orb', 'Contained power ready to strike.', 'epic',
    '{"type": "level", "value": 320}', 'icon-lightning-orb'),
  ('icon_void_gem', 'avatar_icon', 'Void Gem', 'A gem from the void between worlds.', 'epic',
    '{"type": "level", "value": 350}', 'icon-void-gem'),
  ('icon_solar_disc', 'avatar_icon', 'Solar Disc', 'The burning disc of solar power.', 'epic',
    '{"type": "level", "value": 380}', 'icon-solar-disc')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 7. NEW THEME ACCENTS — More colors, crypto-themed
-- ============================================================
INSERT INTO cosmetic_definitions (id, type, name, description, rarity, unlock_condition, css_class) VALUES
  ('accent_neon_green', 'theme_accent', 'Neon Green', 'Matrix green. Pure hacker vibes.', 'common',
    '{"type": "level", "value": 15}', 'accent-neon-green'),
  ('accent_neon_pink', 'theme_accent', 'Neon Pink', 'Hot pink cyberpunk energy.', 'common',
    '{"type": "level", "value": 25}', 'accent-neon-pink'),
  ('accent_golden_hour', 'theme_accent', 'Golden Hour', 'Warm sunset gold. The magic hour.', 'uncommon',
    '{"type": "level", "value": 30}', 'accent-golden-hour'),
  ('accent_bitcoin', 'theme_accent', 'Bitcoin', 'The original orange. BTC vibes.', 'uncommon',
    '{"type": "level", "value": 35}', 'accent-bitcoin'),
  ('accent_ethereum', 'theme_accent', 'Ethereum', 'ETH blue. Smart money.', 'uncommon',
    '{"type": "level", "value": 45}', 'accent-ethereum'),
  ('accent_ice_blue', 'theme_accent', 'Ice Blue', 'Frosty and cool. Cold-blooded trading.', 'rare',
    '{"type": "level", "value": 55}', 'accent-ice-blue'),
  ('accent_blood_orange', 'theme_accent', 'Blood Orange', 'Deep warm orange. Intensity.', 'rare',
    '{"type": "level", "value": 65}', 'accent-blood-orange'),
  ('accent_midnight', 'theme_accent', 'Midnight', 'Deep navy with subtle blue glow. Mysterious.', 'epic',
    '{"type": "level", "value": 75}', 'accent-midnight'),
  ('accent_solana', 'theme_accent', 'Solana', 'SOL gradient from purple to green.', 'rare',
    '{"type": "level", "value": 100}', 'accent-solana'),
  ('accent_holographic', 'theme_accent', 'Holographic', 'Rainbow hue-rotate animation. Eye candy.', 'epic',
    '{"type": "level", "value": 200}', 'accent-holographic'),
  ('accent_chromatic', 'theme_accent', 'Chromatic', 'Full spectrum prismatic shift. The ultimate accent.', 'legendary',
    '{"type": "level", "value": 350}', 'accent-chromatic')
ON CONFLICT (id) DO NOTHING;

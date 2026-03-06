-- Extended Levels: Cosmetics for levels 101–500
-- Adds prestige-tier cosmetics for the expanded level cap

-- ============================================================
-- 1. TITLE BADGES (6 new)
-- ============================================================
INSERT INTO cosmetic_definitions (id, type, name, description, rarity, unlock_condition, css_class) VALUES
  ('title_luminary', 'title_badge', 'Luminary', 'A beacon of discipline in the market.', 'legendary',
    '{"type": "level", "value": 120}', 'title-luminary'),
  ('title_archon', 'title_badge', 'Archon', 'Master of process and patience.', 'legendary',
    '{"type": "level", "value": 150}', 'title-archon'),
  ('title_titan', 'title_badge', 'Titan', 'An immovable force of consistency.', 'legendary',
    '{"type": "level", "value": 200}', 'title-titan'),
  ('title_celestial', 'title_badge', 'Celestial', 'Trading discipline transcends the mortal plane.', 'legendary',
    '{"type": "level", "value": 300}', 'title-celestial'),
  ('title_eternal', 'title_badge', 'Eternal', 'Time-tested. Unshakeable. Eternal.', 'legendary',
    '{"type": "level", "value": 400}', 'title-eternal'),
  ('title_stargate_legend', 'title_badge', 'Stargate Legend', 'The pinnacle of the Stargate journey.', 'legendary',
    '{"type": "level", "value": 500}', 'title-stargate-legend')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. AVATAR FRAMES (6 new)
-- ============================================================
INSERT INTO cosmetic_definitions (id, type, name, description, rarity, unlock_condition, css_class) VALUES
  ('frame_solar_ring', 'avatar_frame', 'Solar Ring', 'A blazing ring of solar energy.', 'legendary',
    '{"type": "level", "value": 110}', 'frame-solar-ring'),
  ('frame_astral_shell', 'avatar_frame', 'Astral Shell', 'Ethereal protection from the astral plane.', 'legendary',
    '{"type": "level", "value": 150}', 'frame-astral-shell'),
  ('frame_titan_core', 'avatar_frame', 'Titan Core', 'Dense energy compressed into a brilliant frame.', 'legendary',
    '{"type": "level", "value": 200}', 'frame-titan-core'),
  ('frame_void_crown', 'avatar_frame', 'Void Crown', 'Darkness bends light into a crown of shadow.', 'legendary',
    '{"type": "level", "value": 250}', 'frame-void-crown'),
  ('frame_celestial_halo', 'avatar_frame', 'Celestial Halo', 'A radiant halo of celestial light.', 'legendary',
    '{"type": "level", "value": 350}', 'frame-celestial-halo'),
  ('frame_infinite_gate', 'avatar_frame', 'Infinite Gate', 'The gateway to infinite mastery.', 'legendary',
    '{"type": "level", "value": 500}', 'frame-infinite-gate')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 3. BANNERS (6 new)
-- ============================================================
INSERT INTO cosmetic_definitions (id, type, name, description, rarity, unlock_condition, css_class) VALUES
  ('banner_solar_flare_prestige', 'banner', 'Solar Flare', 'Eruptions of solar plasma streak across your banner.', 'legendary',
    '{"type": "level", "value": 115}', 'banner-solar-flare-prestige'),
  ('banner_void_stream', 'banner', 'Void Stream', 'Dark energy flows through the void.', 'legendary',
    '{"type": "level", "value": 140}', 'banner-void-stream'),
  ('banner_astral_sea', 'banner', 'Astral Sea', 'An endless ocean of stars and nebulae.', 'legendary',
    '{"type": "level", "value": 175}', 'banner-astral-sea'),
  ('banner_titan_horizon', 'banner', 'Titan Horizon', 'The horizon of a titan-class world.', 'legendary',
    '{"type": "level", "value": 225}', 'banner-titan-horizon'),
  ('banner_celestial_field', 'banner', 'Celestial Field', 'A field of celestial energy radiates power.', 'legendary',
    '{"type": "level", "value": 300}', 'banner-celestial-field'),
  ('banner_infinite_origin', 'banner', 'Infinite Origin', 'The origin point of everything.', 'legendary',
    '{"type": "level", "value": 500}', 'banner-infinite-origin')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 4. AVATAR ICONS (15 new)
-- ============================================================
INSERT INTO cosmetic_definitions (id, type, name, description, rarity, unlock_condition, css_class) VALUES
  ('icon_starfall', 'avatar_icon', 'Starfall', 'A shower of falling stars.', 'legendary',
    '{"type": "level", "value": 105}', 'icon-starfall'),
  ('icon_void_shard', 'avatar_icon', 'Void Shard', 'A fragment of the void itself.', 'legendary',
    '{"type": "level", "value": 130}', 'icon-void-shard'),
  ('icon_astral_key', 'avatar_icon', 'Astral Key', 'Unlocks pathways between dimensions.', 'legendary',
    '{"type": "level", "value": 160}', 'icon-astral-key'),
  ('icon_titan_hammer', 'avatar_icon', 'Titan Hammer', 'Forged by titans for those who endure.', 'legendary',
    '{"type": "level", "value": 190}', 'icon-titan-hammer'),
  ('icon_celestial_eye', 'avatar_icon', 'Celestial Eye', 'Sees through all market noise.', 'legendary',
    '{"type": "level", "value": 220}', 'icon-celestial-eye'),
  ('icon_solar_crest', 'avatar_icon', 'Solar Crest', 'Emblem of the sun-forged trader.', 'legendary',
    '{"type": "level", "value": 250}', 'icon-solar-crest'),
  ('icon_nebula_heart', 'avatar_icon', 'Nebula Heart', 'A heart formed from cosmic dust.', 'legendary',
    '{"type": "level", "value": 280}', 'icon-nebula-heart'),
  ('icon_quantum_core', 'avatar_icon', 'Quantum Core', 'Pure energy in its most fundamental state.', 'legendary',
    '{"type": "level", "value": 310}', 'icon-quantum-core'),
  ('icon_dark_matter_shard', 'avatar_icon', 'Dark Matter', 'Invisible force that shapes the cosmos.', 'legendary',
    '{"type": "level", "value": 340}', 'icon-dark-matter-shard'),
  ('icon_cosmic_forge', 'avatar_icon', 'Cosmic Forge', 'Where stars are born and legends are made.', 'legendary',
    '{"type": "level", "value": 370}', 'icon-cosmic-forge'),
  ('icon_eternal_flame', 'avatar_icon', 'Eternal Flame', 'A flame that can never be extinguished.', 'legendary',
    '{"type": "level", "value": 400}', 'icon-eternal-flame'),
  ('icon_void_walker', 'avatar_icon', 'Void Walker', 'Traverses the space between worlds.', 'legendary',
    '{"type": "level", "value": 430}', 'icon-void-walker'),
  ('icon_dimension_rift', 'avatar_icon', 'Dimension Rift', 'A tear in the fabric of reality.', 'legendary',
    '{"type": "level", "value": 460}', 'icon-dimension-rift'),
  ('icon_infinite_star', 'avatar_icon', 'Infinite Star', 'A star that burns forever.', 'legendary',
    '{"type": "level", "value": 480}', 'icon-infinite-star'),
  ('icon_stargate_key', 'avatar_icon', 'Stargate Key', 'The key to the ultimate gate.', 'legendary',
    '{"type": "level", "value": 500}', 'icon-stargate-key')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 5. SIDEBAR FLAIR (4 new)
-- ============================================================
INSERT INTO cosmetic_definitions (id, type, name, description, rarity, unlock_condition, css_class) VALUES
  ('flair_astral_wind', 'sidebar_flair', 'Astral Wind', 'Cosmic winds swirl around your presence.', 'legendary',
    '{"type": "level", "value": 125}', 'flair-astral-wind'),
  ('flair_titan_pulse', 'sidebar_flair', 'Titan Pulse', 'A deep, powerful energy pulse.', 'legendary',
    '{"type": "level", "value": 200}', 'flair-titan-pulse'),
  ('flair_celestial_orbit', 'sidebar_flair', 'Celestial Orbit', 'Celestial bodies orbit your name.', 'legendary',
    '{"type": "level", "value": 350}', 'flair-celestial-orbit'),
  ('flair_infinite_portal', 'sidebar_flair', 'Infinite Portal', 'A portal to infinite possibility.', 'legendary',
    '{"type": "level", "value": 500}', 'flair-infinite-portal')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 6. THEME ACCENTS (5 new)
-- ============================================================
INSERT INTO cosmetic_definitions (id, type, name, description, rarity, unlock_condition, css_class) VALUES
  ('accent_solar', 'theme_accent', 'Solar', 'Warm, radiant gold energy.', 'legendary',
    '{"type": "level", "value": 130}', 'accent-solar'),
  ('accent_void', 'theme_accent', 'Void', 'Deep purple darkness of the void.', 'legendary',
    '{"type": "level", "value": 180}', 'accent-void'),
  ('accent_titan', 'theme_accent', 'Titan', 'Powerful cyan-white titan energy.', 'legendary',
    '{"type": "level", "value": 250}', 'accent-titan'),
  ('accent_celestial', 'theme_accent', 'Celestial', 'Heavenly lavender glow.', 'legendary',
    '{"type": "level", "value": 375}', 'accent-celestial'),
  ('accent_infinite', 'theme_accent', 'Infinite', 'Pure white light of infinity.', 'legendary',
    '{"type": "level", "value": 450}', 'accent-infinite')
ON CONFLICT (id) DO NOTHING;

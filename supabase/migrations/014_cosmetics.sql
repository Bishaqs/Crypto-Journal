-- Cosmetic System
-- Definitions, user inventory, and equipped cosmetics

-- ============================================================
-- 1. COSMETIC DEFINITIONS (global catalog)
-- ============================================================
CREATE TABLE IF NOT EXISTS cosmetic_definitions (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('avatar_frame', 'banner', 'title_badge', 'sidebar_flair')),
  name TEXT NOT NULL,
  description TEXT,
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
  unlock_condition JSONB NOT NULL,
  css_class TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================================
-- 2. USER COSMETICS (earned inventory)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_cosmetics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cosmetic_id TEXT NOT NULL REFERENCES cosmetic_definitions(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, cosmetic_id)
);

-- ============================================================
-- 3. USER EQUIPPED COSMETICS (active loadout)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_equipped_cosmetics (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cosmetic_type TEXT NOT NULL CHECK (cosmetic_type IN ('avatar_frame', 'banner', 'title_badge', 'sidebar_flair')),
  cosmetic_id TEXT NOT NULL REFERENCES cosmetic_definitions(id) ON DELETE CASCADE,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  PRIMARY KEY (user_id, cosmetic_type)
);

-- ============================================================
-- 4. RLS POLICIES
-- ============================================================
ALTER TABLE cosmetic_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_cosmetics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_equipped_cosmetics ENABLE ROW LEVEL SECURITY;

-- Cosmetic definitions are readable by anyone (public catalog)
CREATE POLICY "Anyone can read cosmetic definitions"
  ON cosmetic_definitions FOR SELECT
  USING (true);

-- User cosmetics: own rows
CREATE POLICY "Users can read own cosmetics"
  ON user_cosmetics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cosmetics"
  ON user_cosmetics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- User equipped cosmetics: own rows for write, public read for display
CREATE POLICY "Users can read own equipped cosmetics"
  ON user_equipped_cosmetics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can read equipped cosmetics"
  ON user_equipped_cosmetics FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own equipped cosmetics"
  ON user_equipped_cosmetics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own equipped cosmetics"
  ON user_equipped_cosmetics FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own equipped cosmetics"
  ON user_equipped_cosmetics FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- 5. INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_user_cosmetics_user_id
  ON user_cosmetics(user_id);

CREATE INDEX IF NOT EXISTS idx_user_cosmetics_cosmetic_id
  ON user_cosmetics(cosmetic_id);

CREATE INDEX IF NOT EXISTS idx_user_equipped_cosmetics_user_id
  ON user_equipped_cosmetics(user_id);

CREATE INDEX IF NOT EXISTS idx_cosmetic_definitions_type
  ON cosmetic_definitions(type);

CREATE INDEX IF NOT EXISTS idx_cosmetic_definitions_rarity
  ON cosmetic_definitions(rarity);

-- ============================================================
-- 6. AUTO-UPDATE updated_at ON user_equipped_cosmetics
-- ============================================================
CREATE OR REPLACE FUNCTION update_equipped_cosmetics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_equipped_cosmetics_updated_at
  BEFORE UPDATE ON user_equipped_cosmetics
  FOR EACH ROW
  EXECUTE FUNCTION update_equipped_cosmetics_updated_at();

-- ============================================================
-- 7. SEED DATA: COSMETIC DEFINITIONS
-- ============================================================

-- ----- AVATAR FRAMES -----
INSERT INTO cosmetic_definitions (id, type, name, description, rarity, unlock_condition, css_class) VALUES
  ('frame_initiate', 'avatar_frame', 'Initiate', 'A simple border for new traders beginning their journey.', 'common',
    '{"type": "level", "value": 1}', 'frame-initiate'),
  ('frame_silver_circuit', 'avatar_frame', 'Silver Circuit', 'Gleaming circuits trace the edge of your avatar.', 'uncommon',
    '{"type": "level", "value": 15}', 'frame-silver-circuit'),
  ('frame_gold_forge', 'avatar_frame', 'Gold Forge', 'Forged in the heat of consistent trading discipline.', 'rare',
    '{"type": "level", "value": 30}', 'frame-gold-forge'),
  ('frame_emerald_pulse', 'avatar_frame', 'Emerald Pulse', 'A pulsing green energy field surrounds your profile.', 'rare',
    '{"type": "level", "value": 45}', 'frame-emerald-pulse'),
  ('frame_prismatic_ring', 'avatar_frame', 'Prismatic Ring', 'Refracts light into a shifting rainbow halo.', 'epic',
    '{"type": "level", "value": 60}', 'frame-prismatic-ring'),
  ('frame_legendary_aura', 'avatar_frame', 'Legendary Aura', 'An unmistakable aura of mastery radiates outward.', 'legendary',
    '{"type": "level", "value": 90}', 'frame-legendary-aura'),
  ('frame_stargate', 'avatar_frame', 'Stargate', 'The ultimate frame. A portal of pure energy.', 'legendary',
    '{"type": "level", "value": 100}', 'frame-stargate'),
  ('frame_diamond_sentinel', 'avatar_frame', 'Diamond Sentinel', 'Awarded to those who master every aspect of risk management.', 'epic',
    '{"type": "achievement_category", "category": "risk", "min_tier": "diamond"}', 'frame-diamond-sentinel'),
  ('frame_zen_master', 'avatar_frame', 'Zen Master', 'Inner calm reflected in crystalline clarity.', 'epic',
    '{"type": "achievement_category", "category": "psychology", "min_tier": "diamond"}', 'frame-zen-master');

-- ----- BANNERS -----
INSERT INTO cosmetic_definitions (id, type, name, description, rarity, unlock_condition, css_class) VALUES
  ('banner_rising_star', 'banner', 'Rising Star', 'A dawn sky gradient marking the start of something great.', 'common',
    '{"type": "level", "value": 10}', 'banner-rising-star'),
  ('banner_nebula_trail', 'banner', 'Nebula Trail', 'Swirling cosmic dust follows in your wake.', 'uncommon',
    '{"type": "level", "value": 25}', 'banner-nebula-trail'),
  ('banner_phoenix_wings', 'banner', 'Phoenix Wings', 'Rise from the ashes of every drawdown.', 'rare',
    '{"type": "level", "value": 40}', 'banner-phoenix-wings'),
  ('banner_diamond_horizon', 'banner', 'Diamond Horizon', 'A crystalline landscape stretches behind your name.', 'epic',
    '{"type": "level", "value": 50}', 'banner-diamond-horizon'),
  ('banner_cosmic_void', 'banner', 'Cosmic Void', 'The deep emptiness of space, filled with distant stars.', 'legendary',
    '{"type": "level", "value": 80}', 'banner-cosmic-void'),
  ('banner_stargate_origin', 'banner', 'Stargate Origin', 'The origin point of all journeys through the gate.', 'legendary',
    '{"type": "level", "value": 100}', 'banner-stargate-origin'),
  ('banner_consistency_flame', 'banner', 'Consistency Flame', 'An eternal flame for those who never miss a beat.', 'rare',
    '{"type": "achievement_category", "category": "consistency", "min_tier": "gold"}', 'banner-consistency-flame'),
  ('banner_analyst_grid', 'banner', 'Analyst Grid', 'Data streams and chart grids form your backdrop.', 'rare',
    '{"type": "achievement_category", "category": "analysis", "min_tier": "gold"}', 'banner-analyst-grid');

-- ----- TITLE BADGES -----
INSERT INTO cosmetic_definitions (id, type, name, description, rarity, unlock_condition, css_class) VALUES
  ('title_apprentice', 'title_badge', 'Apprentice', 'Every master was once a beginner.', 'common',
    '{"type": "level", "value": 5}', 'title-apprentice'),
  ('title_journeyman', 'title_badge', 'Journeyman', 'The fundamentals are second nature now.', 'uncommon',
    '{"type": "level", "value": 20}', 'title-journeyman'),
  ('title_veteran', 'title_badge', 'Veteran', 'Battle-tested through countless market cycles.', 'rare',
    '{"type": "level", "value": 35}', 'title-veteran'),
  ('title_master', 'title_badge', 'Master', 'Few reach this level of trading discipline.', 'epic',
    '{"type": "level", "value": 50}', 'title-master'),
  ('title_grand_master', 'title_badge', 'Grand Master', 'A titan of the trading journal craft.', 'epic',
    '{"type": "level", "value": 70}', 'title-grand-master'),
  ('title_transcendent', 'title_badge', 'Transcendent', 'Beyond mastery. You have transcended.', 'legendary',
    '{"type": "level", "value": 100}', 'title-transcendent'),
  ('title_chronicler', 'title_badge', 'Chronicler', 'A full year of daily journaling without fail.', 'rare',
    '{"type": "achievement", "id": "journal_streak", "tier": "diamond"}', 'title-chronicler'),
  ('title_unstoppable', 'title_badge', 'Unstoppable', '1,000 days. Nothing can stop you.', 'legendary',
    '{"type": "achievement", "id": "journal_streak_1000", "tier": "diamond"}', 'title-unstoppable'),
  ('title_completionist', 'title_badge', 'Completionist', 'Every achievement. Every tier. Absolute perfection.', 'legendary',
    '{"type": "special", "id": "completionist"}', 'title-completionist');

-- ----- SIDEBAR FLAIR -----
INSERT INTO cosmetic_definitions (id, type, name, description, rarity, unlock_condition, css_class) VALUES
  ('flair_pulse', 'sidebar_flair', 'Pulse', 'A subtle rhythmic glow on your sidebar presence.', 'uncommon',
    '{"type": "level", "value": 25}', 'flair-pulse'),
  ('flair_sparkle', 'sidebar_flair', 'Sparkle', 'Glittering particles trail your sidebar icon.', 'rare',
    '{"type": "level", "value": 50}', 'flair-sparkle'),
  ('flair_cosmic_ring', 'sidebar_flair', 'Cosmic Ring', 'An orbiting ring of energy around your sidebar avatar.', 'epic',
    '{"type": "level", "value": 75}', 'flair-cosmic-ring'),
  ('flair_stargate_portal', 'sidebar_flair', 'Stargate Portal', 'A miniature portal effect on your sidebar presence.', 'legendary',
    '{"type": "level", "value": 100}', 'flair-stargate-portal');

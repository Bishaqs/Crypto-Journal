# Redesign Spec: 7 Weak Accent Colors

> Prompt for Gemini: Replace 7 weak accent colors in our crypto trading journal's cosmetic system. Output the replacement data in the exact JSON format shown below.

## Context

This is a gamified crypto/equity trading journal. Users earn cosmetic accents through leveling up. When equipped, an accent color replaces the dashboard's entire color scheme — buttons, links, progress bars, card shadows, sidebar highlights, and glowing halos all change to match.

The accent system sets these CSS custom properties:
- `--accent` (primary color, hex) — buttons, links, active states
- `--accent-hover` (hover state, hex) — slightly darker/lighter variant
- `--accent-glow` (glow color, rgba) — used in `box-shadow` and `filter: drop-shadow`
- `--accent-rgb` (r, g, b components) — used in `rgba(var(--accent-rgb), opacity)` for shadows, cosmic glows, card halos
- Shadow variables are auto-derived from `--accent-rgb`

**The dashboard background is dark**: `#080c14` to `#000000`. All colors must have enough contrast to be visible as text, borders, and glows on these backgrounds.

## Existing Accents (Do NOT Duplicate These)

These colors already exist — replacements must be visually distinct from all of them:

| Name | Hex | Visual |
|:-----|:----|:-------|
| Emerald | #10b981 | Medium green |
| Ruby | #e11d48 | Deep red-pink |
| Sapphire | #2563eb | Medium blue |
| Amber | #f59e0b | Warm orange-yellow |
| Rose | #f43f5e | Pink-red |
| Violet | #8b5cf6 | Purple (theme default) |
| Crimson | #9f1239 | Dark red |
| Teal | #0d9488 | Blue-green |
| Coral | #fb7185 | Light pink |
| Indigo | #4f46e5 | Deep blue-purple |
| Lime | #84cc16 | Yellow-green |
| Copper | #b45309 | Dark orange-brown |
| Aurora | #2dd4bf | Cyan-green |
| Neon Green | #39ff14 | Bright neon green |
| Neon Pink | #ff107a | Hot pink |
| Golden Hour | #fcd34d | Light warm gold |
| Bitcoin | #f7931a | BTC orange |
| Ethereum | #627eea | ETH periwinkle |
| Ice Blue | #a5f3fc | Very light cyan |
| Blood Orange | #ea580c | Red-orange |
| Solana | #14f195 | SOL green |
| Holographic | #c084fc | Lavender-purple |
| Chromatic | #f472b6 | Medium pink |
| Solar | #fde047 | Bright yellow |

## Accents to Replace (7)

Replace each with a more vibrant, distinctive color. Keep the same rarity tier and database `id` (it uses underscores). The `css_class` uses hyphens.

### 1. Replace `Platinum` (Legendary)
**Current**: #e5e7eb — near-white gray, invisible on light themes, identical to Infinite.
**ID**: `accent_platinum` | **CSS class**: `accent-platinum`
**Requirement**: A premium, distinctive color worthy of Legendary rarity. NOT gray or white.
**Suggested direction**: Electric silver-blue, moonlight, or liquid mercury feel.

### 2. Replace `Infinite` (Mythic — highest rarity)
**Current**: #ffffff — pure white, useless as an accent color.
**ID**: `accent_infinite` | **CSS class**: `accent-infinite`
**Requirement**: The most impressive accent in the game. Must feel mythic/godlike. Should produce a stunning glow.
**Suggested direction**: Prismatic white-gold with intense glow, or a color that feels "beyond" the spectrum.

### 3. Replace `Void` (Epic)
**Current**: #000000 — pure black, completely invisible on dark backgrounds.
**ID**: `accent_void` | **CSS class**: `accent-void`
**Requirement**: Must convey "void" / darkness / cosmic emptiness while still being visible.
**Suggested direction**: Deep space purple-blue with an eerie glow, or dark matter with a colored aura.

### 4. Replace `Obsidian` (Legendary)
**Current**: #0f172a — near-black dark navy, invisible on dark backgrounds.
**ID**: `accent_obsidian` | **CSS class**: `accent-obsidian`
**Requirement**: Convey volcanic obsidian glass — dark but with reflective/shiny quality.
**Suggested direction**: Dark glass with a red/orange volcanic shimmer glow. Think lava reflecting off black glass.

### 5. Replace `Midnight` (Epic)
**Current**: #1e1b4b — very dark navy, barely visible on dark backgrounds.
**ID**: `accent_midnight` | **CSS class**: `accent-midnight`
**Requirement**: Convey "midnight" without being invisible. Must read as a dark color with presence.
**Suggested direction**: Deep midnight blue that still pops — like moonlit ocean or electric midnight.

### 6. Replace `Titan` (Legendary)
**Current**: #94a3b8 — plain boring gray. Unworthy of Legendary rarity.
**ID**: `accent_titan` | **CSS class**: `accent-titan`
**Requirement**: Feel powerful, mythological, titanic. Legendary rarity demands visual impact.
**Suggested direction**: Metallic gold-bronze, or titan-blue steel with strong glow.

### 7. Replace `Celestial` (Epic)
**Current**: #cffafe — very light cyan, near-identical to Ice Blue (#a5f3fc).
**ID**: `accent_celestial` | **CSS class**: `accent-celestial`
**Requirement**: Distinct from Ice Blue. Should feel celestial/heavenly/cosmic.
**Suggested direction**: Celestial gold, starlight white-blue, or cosmic lavender — something distinctly different from the cyan family.

## Output Format

For each replacement, output this exact JSON structure (I'll paste it directly into code):

```json
{
  "accent-platinum": {
    "label": "NEW_NAME",
    "accent": "#HEX",
    "accentHover": "#HEX_DARKER",
    "accentGlow": "rgba(R, G, B, OPACITY)",
    "accentRgb": "R, G, B"
  }
}
```

**Rules for the color values:**
- `accent`: Primary hex color — must be visible as text on `#080c14` background
- `accentHover`: Slightly darker/more saturated variant for hover states
- `accentGlow`: rgba() with 0.4-0.8 opacity — higher opacity = stronger glow (use higher for Epic+ rarity)
- `accentRgb`: Just the R, G, B numbers separated by commas (used in `rgba(var(--accent-rgb), 0.15)` for subtle shadows)

**Important constraints:**
- All 7 colors must be distinct from each other AND from the 24 existing accents listed above
- Higher rarity = more visually impressive / intense glow
- Every color must have enough luminance to work as button text on dark (#080c14) and light (#eef0f4) backgrounds
- Test mentally: would this color produce a cool-looking `box-shadow: 0 0 20px rgba(R,G,B, 0.5)`?

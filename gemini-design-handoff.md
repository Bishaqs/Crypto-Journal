# Plan: Redesign Frames, Flairs, Icons, Accents — Gemini Design Handoff

## Context
The previous cosmetic upgrade (banners with emoji art, name styles, flair shadow boosts) is complete and building. However, 4 cosmetic types are still poorly designed visually:
*   **Frames (27)** — Simple borders + box-shadows. No dramatic visual difference between rarities.
*   **Flairs (24)** — Just box-shadow glows behind the avatar. Even after boosting opacity/radius, still underwhelming.
*   **Icons (115)** — Monochrome SVG paths, all render as single-color silhouettes. No detail, no multi-color, no animation.
*   **Accents (33)** — Color values in a JS map. Users don't understand what they do. Colors may be too similar to each other.

Banners and Name Styles are fine — no changes needed.

**Workflow:** The user will take the design brief below to Gemini for visual redesign. Gemini produces new CSS/SVG/TS code. I then replace the existing code with Gemini's output.

App location: `/Users/benjaminschwab/crypto-journal/`

## What Gemini Needs to Redesign

### 1. Avatar Frames (27 classes in cosmetic-animations.css)
**Current problem:** All frames look like colored borders with optional glow. A common `.frame-wooden` and legendary `.frame-rotating-gradient` don't feel dramatically different.

**What Gemini should produce:** New CSS for all 27 `.frame-*` classes with clear rarity escalation:
*   **Common:** Simple solid/dashed borders, subtle color
*   **Uncommon:** Gradient borders, gentle pulse animations
*   **Rare:** Multi-layer borders, animated glows, distinct visual identity
*   **Epic:** Complex animations (rotation, shimmer, color-shift), 2-3 shadow layers
*   **Legendary:** Over-the-top — rotating gradients, multi-color flame effects, conic gradients, 4+ shadow layers, dramatic keyframes

**Constraints:**
*   Classes are applied to a `<div>` wrapping a circular avatar (`border-radius: 50%`)
*   Must use border, box-shadow, outline, and/or `::before`/`::after` pseudo-elements
*   Container has `overflow: visible` set, so effects can extend beyond the circle
*   Must include `@keyframes` for any animations
*   Must include `@media (prefers-reduced-motion: reduce)` overrides

**Current class names (keep these exact):**
*   **Common:** `frame-wooden`, `frame-pixel`, `frame-steel`, `frame-frost`, `frame-basic-glow`, `frame-dotted`, `frame-double-line`
*   **Uncommon:** `frame-neon-glow`, `frame-blockchain`, `frame-gradient-ring`, `frame-bamboo`, `frame-hex-grid`
*   **Rare:** `frame-barbed-wire`, `frame-circuit-board`, `frame-runic`, `frame-gear-ring`, `frame-vine-wrap`, `frame-dragon-scale`
*   **Epic:** `frame-crystal-shard`, `frame-bull-horns`, `frame-data-stream`, `frame-lightning-ring`, `frame-molten`, `frame-shadow-flame`
*   **Legendary:** `frame-rotating-gradient`, `frame-flame-ring`, `frame-void-fracture`

### 2. Sidebar Flairs (24 classes in cosmetic-animations.css)
**Current problem:** All flairs are just box-shadow — glows behind the avatar. Even with multi-layer shadows, the concept is limited and repetitive.

**What Gemini should produce:** New CSS that makes flairs feel like particle effects / auras, not just glows:
*   Use `::before` and `::after` pseudo-elements for additional visual layers
*   Consider radial-gradient overlays, animated rings, pulsing halos
*   **Common:** Subtle single-layer glow, soft color
*   **Uncommon:** 2-layer glow with gentle animation (breathing, slow pulse)
*   **Rare:** Animated multi-layer effects, color shifting
*   **Epic:** Complex animations (crackling, swirling, flickering particles via box-shadow tricks)
*   **Legendary:** Massive multi-layer auras with aggressive animations, 80-120px spread

**Constraints:**
*   Applied to a `<div>` behind the avatar circle
*   Container is `position: relative` with `overflow: visible`
*   The div is roughly 40-48px wide/tall (avatar size)
*   Can use `box-shadow`, `::before`, `::after`, `filter`, `background`, animations

**Current class names (keep these exact):**
*   **Common:** `flair-confetti`, `flair-ember`, `flair-snowfall`, `flair-rain`, `flair-dust`, `flair-bubbles`
*   **Uncommon:** `flair-firefly`, `flair-sakura`, `flair-leaves`, `flair-ripple`, `flair-stardust`
*   **Rare:** `flair-electric`, `flair-crystal`, `flair-hologram`, `flair-smoke`, `flair-frost-aura`
*   **Epic:** `flair-matrix`, `flair-lightning`, `flair-neon-trail`, `flair-flame-wisp`, `flair-gravity-well`, `flair-void-particles`
*   **Legendary:** `flair-plasma-arc`, `flair-solar-eruption`

### 3. Avatar Icons (115 icons in icon-registry.tsx)
**Current problem:** All 115 icons are single-color SVG `<path>` data rendered at 16-28px. They look like generic line icons — no personality, no detail, no multi-color.

**What Gemini should produce:** Redesigned SVG path data for key icons (at minimum the ~20 "prestige" and "epic" tier icons). Options:
*   More detailed/complex SVG paths with multiple `<path>` elements (multi-color)
*   Better visual design that matches the icon name (a "dragon" should look like a dragon, not a squiggle)
*   Consider 2-3 color fills per icon (primary + accent)

**Constraints:**
*   Icons render via `renderCosmeticIcon(iconId, size)` which returns a JSX `<svg>` element
*   Current format: `{ id: string, paths: string[] }` where each path is a single SVG `d` attribute
*   `viewBox` is `0 0 24 24` for most icons
*   Can be enhanced to support fill per path if needed (currently all paths use `currentColor`)
*   File: `/Users/benjaminschwab/crypto-journal/src/lib/cosmetics/icon-registry.tsx`

**Priority icons to redesign (prestige/high-rarity):**
`icon-phoenix`, `icon-dragon`, `icon-stargate-key`, `icon-void-walker`, `icon-cosmic-forge`, `icon-eternal-flame`, `icon-dimension-rift`, `icon-infinite-star`, `icon-dark-matter-shard`, `icon-quantum-core`, `icon-nebula-heart`, `icon-celestial-eye`, `icon-titan-hammer`, `icon-crystal-ball`, `icon-trident`, `icon-phoenix-wing`, `icon-lightning-orb`, `icon-void-gem`

### 4. Theme Accents (33 entries in accent-map.ts)
**Current problem:** Accents are just color values. Many are too similar (multiple blues, multiple greens). Users don't understand what accents do until they equip one.

**What Gemini should produce:** Revised accent color palette with:
*   Better differentiation between similar colors (no two accents should look the same at a glance)
*   Each accent definition: `{ accent: string, accentHover: string, accentGlow: string, accentRgb: string }`
*   Optional: accent "previews" that show what the dashboard would look like (but this may be too complex)

**Constraints:**
*   Accents set CSS custom properties: `--accent`, `--accent-hover`, `--accent-glow`, `--accent-rgb`
*   These affect the ENTIRE dashboard theme (buttons, borders, links, progress bars, glows)
*   File: `/Users/benjaminschwab/crypto-journal/src/lib/cosmetics/accent-map.ts`
*   Format: `Record<string, { accent, accentHover, accentGlow, accentRgb }>`

**Current accent IDs (keep these):**
`accent-emerald`, `accent-ruby`, `accent-sapphire`, `accent-amber`, `accent-rose`, `accent-violet`, `accent-crimson`, `accent-teal`, `accent-coral`, `accent-indigo`, `accent-lime`, `accent-copper`, `accent-platinum`, `accent-obsidian`, `accent-aurora`, `accent-neon-green`, `accent-neon-pink`, `accent-golden-hour`, `accent-bitcoin`, `accent-ethereum`, `accent-ice-blue`, `accent-blood-orange`, `accent-midnight`, `accent-solana`, `accent-holographic`, `accent-chromatic`, `accent-solar`, `accent-void`, `accent-titan`, `accent-celestial`, `accent-infinite`

## Implementation (What I Do After Gemini)
Once Gemini provides redesigned CSS/SVG/TS, I will:

**Step 1: Replace Frame CSS**
*   Open `src/styles/cosmetic-animations.css`
*   Find the AVATAR FRAMES section
*   Replace all 27 `.frame-*` classes + their `@keyframes` with Gemini's output
*   Update `@media (prefers-reduced-motion: reduce)` section

**Step 2: Replace Flair CSS**
*   Same file, find SIDEBAR FLAIR section
*   Replace all 24 `.flair-*` classes + their `@keyframes` with Gemini's output
*   Update reduced-motion section

**Step 3: Replace Icon SVG Data**
*   Open `src/lib/cosmetics/icon-registry.tsx`
*   Replace SVG path data for redesigned icons
*   If Gemini adds multi-color support, update `renderCosmeticIcon()` to handle per-path fills

**Step 4: Replace Accent Map**
*   Open `src/lib/cosmetics/accent-map.ts`
*   Replace color values with Gemini's revised palette
*   Keep all existing accent IDs

**Step 5: Build + Verify**
*   `cd /Users/benjaminschwab/crypto-journal && npm run build` — zero errors
*   Visual check: equip a frame, flair, icon, accent and confirm they render correctly

### Files to Modify
| File | What Changes |
| :--- | :--- |
| `src/styles/cosmetic-animations.css` | Replace FRAMES section + FLAIRS section CSS |
| `src/lib/cosmetics/icon-registry.tsx` | Replace SVG path data for priority icons |
| `src/lib/cosmetics/accent-map.ts` | Replace accent color values |

*No TypeScript types, no database changes, no component logic changes. Pure visual asset swap.*

### Verification
*   `npm run build` — zero TypeScript errors
*   Equip each frame rarity tier — visual escalation is clear (common = subtle, legendary = dramatic)
*   Equip each flair rarity tier — flairs are visually distinct and exciting, not just dim glows
*   Equip redesigned icons — they render at correct size with improved detail
*   Equip different accents — each one looks distinct, dashboard theme changes are obvious

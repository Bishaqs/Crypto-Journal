# Redesign Spec: Banners & Flairs

> Prompt for Gemini: Redesign the CSS for 7 weak banners and 4 weak flairs in our crypto trading journal's cosmetic system. Output pure CSS that I can drop into `src/styles/cosmetic-animations.css`.

## Context

This is a gamified crypto/equity trading journal app. Users earn cosmetics (banners, flairs, frames, icons, accents) through achievements and leveling up. Cosmetics are rendered via CSS classes applied to DOM elements.

**Banners** are gradient overlays behind the profile card (full width, ~120px tall). They use `::before` and `::after` pseudo-elements for emoji decorations and effects.

**Flairs** are circular glow/particle effects around the user's avatar (rendered as absolutely-positioned `<div>` elements with `border-radius: 50%` and `position: absolute; inset: 0` or negative inset values). They appear behind the avatar frame.

## Rendering Constraints

### Banners
- The banner `<div>` has `position: absolute; inset: 0; opacity: 0.7` applied via inline styles (these CANNOT be overridden by CSS)
- Banner CSS classes CAN set: `background`, `animation`, `overflow: hidden`, `position: relative` (for pseudo-elements)
- Banner CSS classes MUST NOT set: `position: absolute`, `inset`, `opacity` (these are controlled by inline styles)
- `::before` and `::after` pseudo-elements render emoji decorations inside the banner
- Pseudo-element emoji opacity should be 0.5-0.7 (the parent already has 0.7 opacity, so compound opacity = 0.35-0.49)

### Flairs
- The flair `<div>` has `position: absolute; inset: 0; z-index: 0` applied via inline styles
- Flair CSS classes CAN set: `inset` (to extend beyond container), `border-radius`, `box-shadow`, `background`, `animation`, `filter`, `border`
- Flair CSS classes SHOULD set `position: absolute` and their own `inset` value (e.g., `inset: -8px` to extend 8px beyond the avatar)
- Flair effects must be visible at TWO sizes: 96px (profile card) and 52px (sidebar badge, clipped to container)
- The preview thumbnail renders the flair at 28-40px — effects MUST be visible at this size too

## Reference: Well-Designed Banners (Copy This Quality)

### banner-inferno (Epic) — Best example
```css
.banner-inferno {
  background: linear-gradient(180deg, #1a0000 0%, #4a0a00 30%, #ff4500 60%, #ff8c00 80%, #ffcc00 100%);
  background-size: 100% 200%;
  animation: fire-rise 2s ease-in-out infinite;
  filter: brightness(0.8);
  position: relative;
  overflow: hidden;
}
.banner-inferno::before {
  content: "🔥";
  position: absolute;
  left: 15%;
  top: 50%;
  transform: translateY(-50%);
  font-size: 34px;
  opacity: 0.6;
  pointer-events: none;
  z-index: 1;
  animation: fire-dance 1s ease-in-out infinite;
}
.banner-inferno::after {
  content: "🔥🔥🔥";
  position: absolute;
  right: 5%;
  bottom: 5%;
  font-size: 24px;
  letter-spacing: -4px;
  opacity: 0.5;
  pointer-events: none;
  z-index: 1;
  animation: fire-dance 1.3s ease-in-out infinite reverse;
}
```

**Pattern**: Rich multi-stop gradient + background-size animation + two emoji pseudo-elements with their own animations.

## Banners to Redesign (7)

Replace each banner's CSS with the same quality as the reference above. Keep the class name and thematic identity, but add: animated gradient + 2 emoji decorations (::before + ::after).

### 1. `banner-buy-high-sell-low` (Common)
**Current**: `background: linear-gradient(135deg, #004d00 0%, #006600 30%, #ff0000 70%, #990000 100%);` — static gradient, no animation, no emoji.
**Theme**: The ironic trader mistake of buying at the top and selling at the bottom.
**Suggested emojis**: 📈📉 or 🤡💸

### 2. `banner-city-skyline` (Uncommon)
**Current**: `background: linear-gradient(180deg, #0a0a1a 0%, #1a1a3e 60%, #2a2a5e 100%);` — static dark gradient, no animation, no emoji.
**Theme**: Night city trading vibes, neon lights, urban skyline.
**Suggested emojis**: 🏙️🌃 or 🌆✨

### 3. `banner-ticker-tape` (Uncommon)
**Current**: `background: #0a0a14;` — literally just a solid dark color. Invisible. Worst banner.
**Theme**: Scrolling stock ticker tape, financial data stream.
**Suggested approach**: Animated scrolling text effect or repeating gradient pattern + 📊📈 emojis.

### 4. `banner-candlestick-forest` (Uncommon)
**Current**: Repeating green/red striped gradient over dark base — no animation, no emoji.
**Theme**: Dense candlestick chart pattern, trading floor energy.
**Suggested emojis**: 🕯️📊 or custom approach with animated stripe motion.

### 5. `banner-liquidation` (Rare)
**Current**: `background: linear-gradient(180deg, #1a0000 0%, #330000 100%);` — static dark red, no animation, no emoji.
**Theme**: Getting liquidated — the devastating loss, alarm red, emergency.
**Suggested emojis**: 💀🚨 or ⚠️💥

### 6. `banner-particle-drift` (Rare)
**Current**: `background: linear-gradient(180deg, #1a1a0a 0%, #2a2a1a 100%);` — static brown gradient, no animation, no emoji.
**Theme**: Floating particles, cosmic dust, ethereal drift.
**Suggested approach**: Animated gradient shift with subtle floating particles feel + ✨🌌 emojis.

### 7. `banner-ngmi-wagmi` (Rare)
**Current**: `background: linear-gradient(90deg, #1a0000 0%, #330000 45%, #4a4a00 55%, #006600 100%);` — static red-to-green gradient, no animation, no emoji.
**Theme**: The crypto meme duality — "Not Gonna Make It" vs "We're All Gonna Make It".
**Suggested emojis**: 😤🚀 or the left side could have a bear emoji and right side a rocket.

## Flairs to Improve (4)

These flairs have effects that are too subtle — just a static box-shadow with no animation. Add animation and stronger visual presence while keeping the theme.

### 1. `flair-rain` (Common)
**Current**: `position: absolute; inset: 0; border-radius: 50%; box-shadow: 0 0 15px #4a90e250;` — static faint blue glow.
**Theme**: Rain, water, blue droplets.
**Improve**: Add a rain-drip or pulse animation. Increase box-shadow intensity.

### 2. `flair-dust` (Common)
**Current**: `position: absolute; inset: 0; border-radius: 50%; box-shadow: 0 0 20px #c4a35a50;` — static faint gold glow.
**Theme**: Desert dust, gold particles, arid wind.
**Improve**: Add a swirl or breathe animation. Consider a radial-gradient background with subtle motion.

### 3. `flair-bubbles` (Common)
**Current**: `position: absolute; inset: 0; border-radius: 50%; box-shadow: 0 0 15px #87ceeb50;` — static faint cyan glow.
**Theme**: Underwater bubbles, effervescence, light aquatic.
**Improve**: Add a bubble-rise or pulse animation. Consider a subtle radial gradient.

### 4. `flair-plasma-arc` (Legendary)
**Current**: Uses thin transparent borders with colored top/bottom/left/right + blur filter + spinning animation. Technically animated but the visual impact is too subtle for a LEGENDARY flair.
**Theme**: High-energy plasma, electric arcs, sci-fi energy.
**Improve**: This is a LEGENDARY flair — it should be the most impressive. Add stronger box-shadow glow, brighter colors, maybe a secondary pulsing layer. It should rival `flair-solar-eruption` in visual impact.

## Output Format

Output ONLY the CSS — no explanations. Each banner/flair should include:
1. The main class rule
2. `::before` pseudo-element (for banners: emoji; for flairs: optional decorative element)
3. `::after` pseudo-element (for banners: second emoji; for flairs: optional decorative element)
4. Any `@keyframes` needed (use unique names to avoid conflicts with existing animations)

**Important**:
- Write compact CSS (one declaration per line is fine, but don't spread simple rules across many lines)
- All `@keyframes` names must be unique — prefix with the banner/flair name to avoid collisions (e.g., `@keyframes bhsl-flash`, `@keyframes rain-drip`)
- Flairs MUST include `position: absolute` and `border-radius: 50%` in their main class
- Banner pseudo-elements MUST include `pointer-events: none; z-index: 1`
- Test that colors look good on dark backgrounds (`#0f172a` to `#020617`)

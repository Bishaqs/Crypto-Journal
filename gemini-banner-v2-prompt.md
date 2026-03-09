# Banner V2 Redesign — Gemini Prompt

Copy everything below the line and paste it into Gemini. It will output a complete CSS code block with all 36 banners redesigned to premium quality.

---

You are the world's best CSS animation designer. I hired you because I need the highest quality CSS banner animations ever created for a dark-themed crypto/stock trading journal app. These banners are a core feature — traders unlock them as rewards. They must look premium, polished, and unmistakably communicate their theme at a glance.

## WHAT YOU'RE BUILDING

36 profile card banners. Each banner renders as a full-width overlay div on a dark profile card (~900px wide, ~120px tall). The banner div is `position: absolute; inset: 0; opacity: 0.7` on a dark card with `overflow: hidden` on the parent.

## V1 FEEDBACK — WHAT WORKED AND WHAT DIDN'T

I already have a V1 of these banners. Here's what needs to change:

**What worked well (keep these approaches):**
- `banner-holographic` — the full rainbow spectrum shift with shimmer is excellent
- `banner-supernova-collapse` — the expanding core with shockwave rings is impressive
- `banner-lightning-storm` — the flash timing is dramatic and realistic
- `banner-matrix-rain` — the green phosphor streaks look authentic
- `banner-cyber-grid` — the 3D perspective grid is visually striking
- `banner-liquidation` — the draining void with alarm pulse is intense

**What needs major improvement:**
- `banner-bear-market` — shows generic rain. MUST show red candles going DOWN. This is a trading app.
- `banner-city-skyline` — the clip-path building shapes are too blocky/uniform. Needs varied heights, more realistic silhouette, visible window lights
- `banner-diamond-hands` — too abstract. Needs multiple visible diamond/crystal facet shapes with prismatic light refraction
- `banner-dumpster-fire` — fire is too subtle. Needs intense, layered flames with visible heat distortion
- `banner-bull-run` — just has diagonal stripes. Needs to feel like unstoppable UPWARD momentum with golden energy
- `banner-paper-hands` — barely visible. Needs more contrast and clearer paper-tearing visual
- `banner-green-candles` — only 3 tiny bars. Needs a full row of ascending green candlesticks
- `banner-ticker-tape` — nearly invisible stripes. Needs to look like scrolling market data
- `banner-hodl-fortress` — static and boring. Needs subtle animation (torch flicker, stone shimmer)
- `banner-whale-splash` — the whale shape isn't recognizable. Needs a clearer massive body rising from ocean

**General quality issues:**
- Many banners are too subtle/dark. At 0.7 opacity on a dark card, effects need to be BRIGHTER and more vivid
- Rarity progression must be obvious: Common = simple, Legendary = jaw-dropping
- Every banner must be identifiable within 1 second of looking at it

## CRITICAL TECHNICAL RULES

These are non-negotiable. Violating any one = rejected output.

### Rule 1: ZERO EMOJIS
No `content: "emoji"` anywhere. Not a single emoji character. Only `content: ""` (empty string). Pure CSS visual effects only.

### Rule 2: Base Selector
```css
[class*="banner-"] {
  position: relative;
  overflow: hidden;
  background-color: var(--card-bg, #1e293b);
  border-radius: inherit;
}
```
Use `*=` (contains), NOT `^=` (starts-with). Do NOT include `width` or `height` in the base rule.

### Rule 3: Pseudo-Element Template
Every `::before` and `::after` MUST include ALL of these properties:
```css
content: "";
position: absolute;
pointer-events: none;
z-index: 1;
```

### Rule 4: NO NEGATIVE INSETS
All pseudo-elements MUST use `inset: 0` or explicit `top/right/bottom/left` values within the element bounds. NEVER use `inset: -50px`, `inset: -100px`, `inset: -100%`, or any negative value. The parent has `overflow: hidden` — elements that extend beyond bounds get clipped anyway, so negative insets waste rendering budget.

### Rule 5: Reserved Keyframe Name
`@keyframes holo-shift` is RESERVED by another part of the codebase. For the holographic banner, use `@keyframes banner-holo-shift`.

### Rule 6: Animation Performance
- Use `transform` and `opacity` for animations (GPU-accelerated)
- Avoid animating `width`, `height`, `top`, `left` directly — use `transform: translate()` instead
- Keep total @keyframes under 50
- Reuse @keyframes where themes overlap (e.g., a shared `pulse-glow` with different colors via the banner's own gradient)
- Use `will-change: transform` only on elements with complex transform animations

### Rule 7: Brightness for Dark Theme
The banner renders at `opacity: 0.7` on a dark card (`#1e293b`). This means:
- Colors need to be vivid/saturated (not muted pastels)
- Glows (`box-shadow`) need sufficient spread and opacity
- Gradients should use 0.3-0.8 alpha values, not 0.05-0.1
- White elements need at least `rgba(255,255,255,0.5)` to be visible
- If a banner has a dark background (#000 or #0f172a), its visual elements must be bright enough to see THROUGH the 0.7 opacity multiplier

## COLOR PALETTE (use these exact values)

- Background: `#0f172a` (slate-900)
- Card: `#1e293b` (slate-800), also available as `var(--card-bg, #1e293b)`
- Green (bullish): `#22c55e`
- Red (bearish): `#ef4444`
- Gold: `#eab308`
- Blue: `#3b82f6`
- Purple: `#a855f7`
- Teal: `#14b8a6`
- Orange: `#f97316`
- Pink: `#ec4899`
- Cyan: `#06b6d4`

## OUTPUT FORMAT

Output a single markdown file containing ONE CSS code block with:
1. The base `[class*="banner-"]` rule
2. All 36 banner classes grouped by rarity (Common, Uncommon, Rare, Epic, Legendary)
3. A 1-line comment above each banner describing its visual effect
4. All `@keyframes` at the end, grouped and alphabetized
5. Provide the output inline in the response

---

## THE 36 BANNERS

### COMMON (7 banners) — Simple but clean. One or two effects max.

**1. `.banner-paper-hands`**
Theme: Fragile paper tearing apart — you sold too early.
Visual: Light beige/cream paper texture (use `repeating-linear-gradient` at fine 2px intervals for paper grain). TWO horizontal tear lines — one at 35% height, one at 65% — with ragged edges (use `clip-path` with jagged points). The tear lines slowly widen and narrow (animating `scaleY`). Paper grain should be clearly visible — use `rgba(255,255,255,0.15)` not 0.05. The tears should have a subtle shadow (`box-shadow`) below them suggesting depth where the paper separates.

**2. `.banner-wen-lambo`**
Theme: Speed, luxury, aspiration — when will you afford a Lambo?
Visual: Deep purple-to-black gradient. A bright purple-white light streak (like a sports car's headlights) races horizontally across the banner every 2 seconds. The streak should have a LONG trailing glow tail (at least 40% of banner width). Add a subtle horizontal metallic reflection line at 50% height — a thin, barely visible silver shimmer that pulses gently.

**3. `.banner-red-alert`**
Theme: DANGER — emergency warning, something's wrong.
Visual: Deep crimson background with repeating diagonal hazard stripes (45deg, alternating dark red and darker red, 15px width). A bright red scanning line sweeps top-to-bottom continuously. The ENTIRE background pulses between dark red and brighter red. The diagonal stripes should be clearly visible (use `rgba(239,68,68,0.2)` and `rgba(0,0,0,0.3)` contrast).

**4. `.banner-buy-high-sell-low`**
Theme: The classic mistake — buying at the top, selling at the bottom.
Visual: Left third is GREEN gradient (buy zone), right third is RED gradient (sell zone), middle blends. Over this, draw a CLEAR price chart line using `clip-path`: starts at bottom-left, rises steeply to a peak at ~40% horizontal, then CRASHES down to the bottom-right corner. The line area below should be filled with the gradient. The chart line should pulse/breathe subtly. This must UNMISTAKABLY look like a pump-and-dump chart.

**5. `.banner-green-candles`**
Theme: Bullish candlestick chart — green candles rising.
Visual: Dark background. Draw 8-10 green candlestick shapes using `repeating-linear-gradient` — thin vertical lines (wicks, 1-2px) with thicker bodies (4-6px). Each candle should be a different height, and the overall trend should go UP from left to right (shorter candles on left, taller on right). The candles should slowly drift upward and back down. Add a subtle green glow at the tips of the tallest candles.

**6. `.banner-static-noise`**
Theme: Signal lost — TV static interference.
Visual: Fine-grained horizontal scan lines (1px lines, 3px spacing) that RAPIDLY flicker in opacity (0.2s cycle). A bright white horizontal scan bar (20% height) sweeps continuously from top to bottom. Add a second effect: occasional brief full-banner white flash (use keyframes with 95% transparent, 5% flash). The overall effect should feel like an old CRT TV losing signal.

**7. `.banner-moonrise`**
Theme: Calm night sky — the moon is out, aspirational.
Visual: Navy-to-black gradient. A glowing moon circle (50-60px, `radial-gradient` from bright white center to transparent edge) positioned in the upper-right area. The moon should pulse gently (box-shadow expanding/contracting). Add scattered tiny stars: use `radial-gradient` dots (1px white circles) at various positions via `background-image` with multiple gradient layers. Stars should have a very slow subtle twinkle (opacity oscillation).

---

### UNCOMMON (7 banners) — Noticeably more polished. Two effects layered.

**8. `.banner-stonks`**
Theme: "Stonks only go up" — the unstoppable green arrow meme.
Visual: Dark background. A THICK diagonal green line (8-10px) goes from bottom-left corner to upper-right corner, glowing intensely (`box-shadow: 0 0 15px #22c55e, 0 0 30px #22c55e`). The line pulses brighter. An animated green glow sweeps along the line from bottom-left to upper-right (like an energy pulse traveling up the arrow). The direction must be UNMISTAKABLY upward.

**9. `.banner-aurora-shimmer`**
Theme: Northern lights — ethereal and mesmerizing.
Visual: Dark background. Flowing horizontal bands of color: teal (bottom), green (middle), purple (top) — use a multi-stop linear gradient. The gradient should SLOWLY sway left-right (background-position animation). Apply a significant `filter: blur(15px)` for the ethereal soft glow effect. Colors should be at 0.4-0.6 alpha for visibility. The overall effect should feel like watching the aurora from a distance — gentle, beautiful, and colorful.

**10. `.banner-neon-pulse`**
Theme: Cyberpunk neon — electric nightlife aesthetic.
Visual: Hot pink to electric blue diagonal gradient background (at 0.2 alpha). The banner should have a GLOWING neon border effect — `box-shadow: inset 0 0 20px` in pink and blue alternating. A thin horizontal neon-pink scan line sweeps vertically up and down continuously. The box-shadow should pulse/breathe between subtle and intense.

**11. `.banner-city-skyline`**
Theme: Night city skyline — urban trading floor at night.
Visual: Dark navy gradient (darker at bottom). Along the BOTTOM EDGE, create a detailed city skyline silhouette using `clip-path` with MANY points — at least 15 buildings of varying widths and heights. Some buildings tall and thin (skyscrapers), some short and wide. Behind the black silhouette, place yellow window dots (`radial-gradient(circle, rgba(234,179,8,0.7) 1px, transparent 1px)` with small `background-size`) that flicker (random opacity changes via keyframes). Add a warm amber glow on the horizon line (thin gradient behind the buildings).

**12. `.banner-radar-sweep`**
Theme: Scanning and detection — military/surveillance radar.
Visual: Very dark green-black background (`#05100a`). Concentric circle rings using `repeating-radial-gradient` centered at LEFT SIDE (20% horizontal, 50% vertical). A bright green conic-gradient sweep arm rotates 360 degrees continuously from the center point. The sweep should leave a fading trail (conic gradient from transparent to green, covering about 60-90 degrees). Phosphor green color (`#22c55e`). This should look like an actual radar screen.

**13. `.banner-ticker-tape`**
Theme: Scrolling stock market data tape.
Visual: Dark background. Create MULTIPLE horizontal bands of different shades scrolling at different speeds. Band 1 (top third): thin alternating dark bars scrolling left. Band 2 (middle): a bright green price line with small up/down jags. Band 3 (bottom third): thin alternating bars scrolling right (opposite direction). The middle price line should be clearly visible with a green glow. The overall effect should feel like market data streaming across screens.

**14. `.banner-gradient-wave`**
Theme: Organic flowing color — smooth and ambient.
Visual: Rich multi-color gradient: blue → purple → teal → blue. Use `background-size: 300% 300%` and animate `background-position` for a smooth flowing effect. Add a subtle diagonal shine line (thin bright stripe) that slowly traverses the gradient. The colors should be vivid at 0.7-0.8 alpha. This is meant to be beautiful and calming.

---

### RARE (10 banners) — Impressive. Multiple layered effects with clear visual storytelling.

**15. `.banner-diamond-hands`**
Theme: Unbreakable grip — diamond-strong conviction, never selling.
Visual: Icy blue-white gradient background. Create MULTIPLE diamond shapes using `clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)` at different sizes and positions (use both `::before` and `::after`). The diamonds should have prismatic color — use a rainbow gradient INSIDE the diamond shapes that shifts. A bright white sparkle flash should sweep across the diamonds periodically (diagonal shimmer line). The overall palette should be icy blue, white, and prismatic. This must LOOK like diamonds refracting light.

**16. `.banner-liquidation`**
Theme: Total account wipeout — everything is destroyed.
Visual: Blood-red to black gradient with intense red inner glow (`box-shadow: inset 0 0 40px rgba(239,68,68,0.8)`). A radial "drain" effect: dark circle collapsing inward from edges (radial-gradient animating from transparent center to black edges, with the center growing). Red horizontal glitch lines jittering rapidly. The alarm glow should pulse FAST (1s). The whole thing should feel like watching your portfolio go to zero.

**17. `.banner-dumpster-fire`**
Theme: Everything is on fire — total disaster, chaos.
Visual: Dark red-orange gradient at the bottom rising upward. LAYERED flame shapes: `::before` creates a large jagged flame silhouette along the bottom (clip-path with at least 10 jagged peaks, animate `scaleY` and slight `translateX` for dancing). `::after` creates rising ember particles — small orange/yellow dots (radial-gradient dots) that drift UPWARD continuously. The flames should be bright orange (#f97316) with yellow (#eab308) tips. Add a red inner glow (`box-shadow`) for heat ambiance. This must UNMISTAKABLY look like something burning.

**18. `.banner-bull-run`**
Theme: Unstoppable bullish momentum — golden power, charging forward.
Visual: Rich gold-to-amber gradient (#713f12 to #eab308). Diagonal speed streaks racing LEFT-TO-RIGHT (repeating-linear-gradient at 45deg, animating translateX). A bright horizontal golden lens flare at center that pulses wider and narrower. The streaks should be white at 0.15 alpha for subtlety. The overall feeling should be POWERFUL FORWARD MOMENTUM — gold, energy, speed.

**19. `.banner-bear-market`**
Theme: Bearish downturn — prices crashing, despair.
Visual: Dark blue-gray gradient. Create RED CANDLES going DOWN: use `repeating-linear-gradient` to make 8-10 red vertical bars of decreasing height from left to right (tallest on left, shortest on right — the OPPOSITE of green-candles). The candles should slowly drift DOWNWARD. Add a cold steel-blue glow at the bottom edge. The color is RED (#ef4444) for the candles. A trader should look at this and IMMEDIATELY think "prices are falling." This is the mirror opposite of `banner-green-candles`.

**20. `.banner-matrix-rain`**
Theme: The Matrix digital rain — falling code.
Visual: Pure black background. Multiple vertical green lines of varying lengths falling downward at different speeds. Use `::before` and `::after` with different `background-position` offsets and animation durations (2s and 3s) for parallax depth. Green color: `#22c55e` with bright tips fading to transparent. The rain should feel dense and continuous. Phosphor green glow effect on the brightest elements.

**21. `.banner-inferno`**
Theme: Raging hellfire — extreme heat, volcanic intensity.
Visual: Deep crimson (#991b1b) to black gradient. MULTIPLE layers of flame: `::before` creates large jagged flames along the bottom (clip-path, 15+ peaks, animated scaleY/translateY). `::after` creates a bright orange (#f97316) heat glow at the very bottom with heavy blur (20px). Add `box-shadow: inset 0 0 30px rgba(239,68,68,0.4)` for ambient heat. The flames should be MORE intense than `banner-dumpster-fire` — this is a RARE banner. Taller flames, more peaks, brighter core.

**22. `.banner-trust-process`**
Theme: Patience — loading, waiting for results to come.
Visual: Dark background. A spinning conic-gradient ring (loading spinner) centered in the banner. Below it, a progress bar at the very bottom edge — a thin bright blue line that animates from 0% to 100% width and resets. The spinner should use blue (#3b82f6). The progress bar should have a glow (`box-shadow: 0 0 10px #3b82f6`). The overall feeling: calm, measured, disciplined.

**23. `.banner-candlestick-forest`**
Theme: Dense candlestick chart — a forest of green and red candles.
Visual: Dark background. Many alternating green and red vertical bars (candlesticks) using `repeating-linear-gradient` — green bars (4-6px) and red bars (4-6px) with gaps. The pattern should slowly PAN HORIZONTALLY (background-position animation). Green candles should extend further from the bottom, red candles shorter. The density should be HIGH — lots of candles packed together. This is the "forest" — overwhelming amount of data.

**24. `.banner-circuit-flow`**
Theme: Electronic circuitry — data flowing through circuit paths.
Visual: Dark background. Create a GRID of thin perpendicular lines (right-angle circuit traces) using two overlapping `linear-gradient` backgrounds (horizontal and vertical lines at low alpha). A bright blue energy pulse (small glowing dot or short line) travels along the traces from left to right. The grid should use `#38bdf8` (light blue) at 0.15 alpha, the pulse at full brightness with glow.

---

### EPIC (8 banners) — Stunning. Complex layered effects that demand attention.

**25. `.banner-lightning-storm`**
Theme: Violent electrical storm — raw, terrifying power.
Visual: Dark storm-blue background. A lightning bolt shape (use `clip-path` with zigzag points) that FLASHES briefly: invisible 90% of the time, then suddenly appears for 0.2s with intense white+blue glow. The background should also flash brighter during the strike (`animation` on background-color). Add a secondary subtler bolt at a different position using `::after`. The timing should feel RANDOM — use an asymmetric keyframe (e.g., flash at 10% and 65% of the cycle). This is an EPIC banner — the lightning should be DRAMATIC.

**26. `.banner-hodl-fortress`**
Theme: Impenetrable defense — holding the line, never selling.
Visual: Dark gray stone texture (repeating-linear-gradient creating a brick pattern — horizontal lines every 10px, vertical lines every 20px offset by half for alternating bricks). Along the TOP EDGE, crenellated battlements (clip-path with rectangular merlon/crenel pattern). Add warm orange-yellow inner glow seeping through "arrow slits" — use small bright dots at regular intervals in the brick pattern that pulse with a firelight animation. The banner should feel SOLID, HEAVY, and FORTIFIED.

**27. `.banner-particle-drift`**
Theme: Cosmic particles floating through deep space.
Visual: Deep purple-to-black radial gradient (space). Multiple layers of drifting particles: `::before` has white and indigo dots (1-2px, various positions via `background-image` with multiple radial-gradients) drifting slowly left-to-right. `::after` has purple dots drifting right-to-left (parallax). Different sizes and drift speeds create depth. Stars should TWINKLE (opacity variation). This should feel like floating through a nebula.

**28. `.banner-glitch`**
Theme: Digital corruption — visual distortion, data error.
Visual: Dark background. CHROMATIC ABERRATION effect: `::before` creates a red-shifted horizontal slice (full width, ~10% height) offset to the left. `::after` creates a cyan-shifted slice offset to the right. Both slices JUMP between different vertical positions (animated clip-path). The jumps should be SUDDEN (use `steps()` timing). Occasional full-width flash of distortion. This should look like a broken screen with RGB channel separation.

**29. `.banner-ngmi-wagmi`**
Theme: Duality — "Not Gonna Make It" vs "We're All Gonna Make It."
Visual: Sharp DIAGONAL split from top-right to bottom-left. LEFT HALF: dark red with downward-falling elements (crumbling/descending particle dots, or red candles going down). RIGHT HALF: bright green with upward-rising elements (ascending particle dots, or green candles going up). The split line should be crisp and dramatic. Use `clip-path` on `::before` (red/NGMI side) and `::after` (green/WAGMI side). The contrast between decay and ascension must be STARK.

**30. `.banner-northern-lights`**
Theme: Majestic aurora borealis — grand, breathtaking natural light show.
Visual: Dark background. WIDE flowing curtains of color: teal, green, purple, magenta — using a multi-stop linear-gradient with `background-size: 200% 100%` that pans horizontally. Apply `filter: blur(25px)` for the ethereal curtain effect. Colors at 0.5-0.7 alpha (VISIBLE through the 0.7 opacity). A secondary gradient layer (::after) creating a dark vignette at the bottom (radial-gradient from transparent at top to dark at bottom). This is EPIC tier — must be MORE impressive than the UNCOMMON `aurora-shimmer`. Brighter, more colors, more movement.

**31. `.banner-lava-flow`**
Theme: Molten rock — volcanic lava oozing through cracked ground.
Visual: Very dark red-black base (#2a0a0a). Create bright orange-yellow lava CRACKS: use multiple `radial-gradient` spots (3-4 hot spots at different positions) with orange (#ea580c) and yellow (#eab308) colors, heavy blur for glow. Over the top, a DARK CRACK PATTERN overlay using `repeating-linear-gradient` at 45deg with thick dark lines, creating the appearance of dark rock with bright lava glowing through the cracks. The hot spots should slowly shift position (animating `background-position` or `transform`). The `mix-blend-mode: screen` works well for the glow — keep that approach.

**32. `.banner-cyber-grid`**
Theme: Cyberpunk wireframe landscape — Tron/outrun aesthetic.
Visual: Deep purple gradient. A 3D PERSPECTIVE GRID floor receding into the distance: use `repeating-linear-gradient` at horizontal and vertical intervals, then apply `perspective()` and `rotateX()` transform on the pseudo-element. The grid should SCROLL FORWARD (animate background-position on the Y axis). Colors: neon pink (#ec4899) for horizontal lines, electric blue (#3b82f6) for vertical lines. Add a thin neon glow at the horizon line. This should look like driving through a cyberpunk city at night.

---

### LEGENDARY (4 banners) — The absolute pinnacle. MAXIMUM visual impact. These are the rarest rewards.

**33. `.banner-whale-splash`**
Theme: Massive crypto whale making a huge market move — ocean power.
Visual: Deep ocean gradient (bright blue at top → very dark blue at bottom). A LARGE rounded whale shape (elliptical radial-gradient) rising from the bottom — animate it breaching upward and falling back. When it breaches, white spray particles (radial-gradient dots) EXPLODE upward from the impact point. Add bioluminescent teal glow around the whale body. The whale shape should be at least 60% of the banner width. The spray particles should scatter dramatically. Timing: slow rise (3s), particle burst at peak, slow descent.

**34. `.banner-holographic`**
Theme: Premium holographic/iridescent surface — the most visually rich banner.
Visual: Full prismatic rainbow spectrum gradient (red → orange → yellow → green → cyan → blue → purple → pink → red) with `background-size: 300% 300%` panning diagonally. A bright diagonal SHIMMER LINE sweeps across continuously (white gradient stripe moving via transform). Fine horizontal interference lines overlay (repeating-linear-gradient, 2px transparent/2px white at 0.1 alpha). The colors should be FULL SATURATION. The shimmer should be BRIGHT. This is the premium holographic foil effect — like a rare trading card. Use `@keyframes banner-holo-shift` (NOT `holo-shift`).

**35. `.banner-moon-shot`**
Theme: Rocket launching to the moon — the ultimate successful trade.
Visual: Dark space background with small star dots (tiny radial-gradient circles). A glowing MOON in the upper-right (50px circle, radial-gradient from gold center to transparent, with golden box-shadow). A ROCKET EXHAUST TRAIL from bottom-left angling upward toward the moon — bright gradient line (red → orange → yellow → white) at -30deg angle with intense glow (`box-shadow`). The exhaust should pulse/flicker. Small star particles should dot the space background. This must feel TRIUMPHANT and ENERGETIC.

**36. `.banner-supernova-collapse`**
Theme: Stellar explosion — the biggest event in the cosmos.
Visual: Pure black background. A BLINDING central core (white/blue `radial-gradient`, 80-100px) that pulses between small/bright and large/dim. EXPANDING SHOCKWAVE RINGS radiating outward from the core (use animated `box-shadow` with increasing spread, or `border-radius: 50%` elements growing in size). Multiple ring layers for depth. Colors: white core → blue inner ring → purple outer ring. When the core contracts, the rings expand. When the core expands, new rings begin. This should be the MOST SPECTACULAR banner in the entire collection. A trader who sees this should think "I NEED that."

---

## ANIMATION PERFORMANCE RULES

1. Use `transform` and `opacity` for ALL animations (GPU-accelerated)
2. NEVER animate `width`, `height`, `top`, `left` directly — use `transform: translate()` and `transform: scale()` instead
3. Keep total `@keyframes` under 50 — reuse where possible
4. Use `will-change: transform` only on elements with complex ongoing animations
5. Timing: Common banners = 3-5s cycles. Epic/Legendary = 4-8s cycles (more dramatic pacing)
6. Use `cubic-bezier()` for organic movement, `linear` for mechanical rotation, `steps()` for glitch effects

## FINAL CHECKS BEFORE SUBMITTING

Before you output the CSS, verify:
- [ ] Zero emoji characters anywhere in the output
- [ ] All `content:` properties use only `""` (empty string)
- [ ] Base rule uses `[class*="banner-"]` (contains, NOT starts-with)
- [ ] Base rule has NO `width` or `height` properties
- [ ] Every `::before/::after` has `content: ""; position: absolute; pointer-events: none; z-index: 1;`
- [ ] No pseudo-element uses negative `inset` values
- [ ] `@keyframes holo-shift` is NOT used — holographic uses `banner-holo-shift`
- [ ] Total @keyframes count is under 50
- [ ] All colors use the exact palette values provided above
- [ ] Legendary banners are VISUALLY SUPERIOR to Common banners — the rarity progression is obvious

Provide the complete output inline as a markdown code block.

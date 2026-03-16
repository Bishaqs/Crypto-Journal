# Gemini Fix: Satoshi Theme ₿ Logo Too Visible

## Problem
The central ₿ watermark in `src/components/satoshi-background.tsx` is rendering as a clearly visible brown stamp instead of a barely-perceptible ghost. It should be so subtle that you only notice it after staring at the screen for a few seconds.

## Root Causes (in the current code, lines 528-559)

1. **Double fill** — The logo is drawn twice: once as a "glow layer" at `logoOpacity * 0.5`, then again as the "main logo" at `logoOpacity`. Combined effective opacity is ~1.5x what was intended.

2. **`shadowBlur: 40` with `shadowColor: rgba(247,147,26,0.3)`** — This creates a massive warm halo around every part of the ₿ shape. At 40px blur radius on a ~300px symbol, the glow extends far beyond the letter and makes the entire center of the screen look muddy brown.

3. **logoOpacity range 0.03-0.07** — This would be fine for a small icon, but the logo is 38% of the viewport. At that scale, even 0.03 is clearly visible, and 0.07 is very prominent.

## Current Code (lines 528-559)
```tsx
const breathT = (Math.sin(time * 0.000785) + 1) / 2; // ~8s full cycle
const logoOpacity = 0.03 + breathT * 0.04 + halvingLogoOpInc; // 0.03 to 0.07 + event
const logoScale = 0.97 + breathT * 0.06 + halvingLogoScaleInc; // 0.97 to 1.03 + event

ctx.save();
ctx.translate(centerX, centerY);
ctx.scale(logoScale, logoScale);

const sSize = Math.min(w, h) * 0.38;
const pathGridOffset = -16 * (sSize / 32);
ctx.translate(pathGridOffset, pathGridOffset);

// Glow layer  <-- PROBLEM: fills the shape a second time
ctx.shadowColor = "rgba(247, 147, 26, 0.3)";  // <-- Too opaque
ctx.shadowBlur = 40;  // <-- Too large
ctx.fillStyle = `rgba(247, 147, 26, ${logoOpacity * 0.5})`;
ctx.fill(btcPathRef.current);

// Main logo
ctx.shadowBlur = 0;
ctx.fillStyle = `rgba(247, 147, 26, ${logoOpacity})`;
ctx.fill(btcPathRef.current);

// Circle outline ring
const sHalf = 16 * (sSize / 32);
ctx.beginPath();
ctx.arc(sHalf, sHalf, 15 * (sSize / 32), 0, Math.PI * 2);
ctx.strokeStyle = `rgba(247, 147, 26, ${logoOpacity * 0.3})`;
ctx.lineWidth = 1.5;
ctx.stroke();

ctx.restore();
```

## Required Changes

### 1. Remove the glow fill pass entirely
Delete lines 540-544 (the "Glow layer" block). Only draw the logo once.

### 2. Reduce shadow to a subtle halo
On the single remaining fill call, use:
```tsx
ctx.shadowColor = "rgba(247, 147, 26, 0.06)";  // was 0.3
ctx.shadowBlur = 12;  // was 40
```

### 3. Lower opacity range
Change the logoOpacity calculation:
```tsx
const logoOpacity = 0.015 + breathT * 0.02 + halvingLogoOpInc;
// Range: 0.015 to 0.035 (was 0.03 to 0.07)
```

### 4. Reduce logo size (optional but recommended)
Change the size multiplier:
```tsx
const sSize = Math.min(w, h) * 0.30;  // was 0.38
```
Also update it in the `resize` callback and the `useEffect` that creates the path:
```tsx
const size = Math.min(window.innerWidth, window.innerHeight) * 0.30;
```

### 5. Fix halving event opacity peak
In the halving logo flash section (around line 290), reduce the peak:
```tsx
halvingLogoOpInc = pop * 0.04;  // was 0.08, so peak goes to ~0.075 not 0.15
```

### 6. Make circle outline even more subtle
```tsx
ctx.strokeStyle = `rgba(247, 147, 26, ${logoOpacity * 0.2})`;  // was 0.3
ctx.lineWidth = 1;  // was 1.5
```

## After Fix — Expected Result
The ₿ should be barely visible — like a watermark on a banknote. You should see it when you look for it, but it shouldn't draw attention. The breathing animation makes it slightly come and go, which creates the "alive" feeling without being distracting.

## File to Edit
`src/components/satoshi-background.tsx` — only the central logo rendering section (~lines 528-559) and the size constants (~lines 186, 202).

Please provide the complete updated file with all changes applied. Do not change any other layers (particles, embers, constellation lines, halving burst, etc.) — only fix the central ₿ logo visibility.

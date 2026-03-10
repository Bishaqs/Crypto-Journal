# Gemini Theme Design Brief — Stargate Journal

> **Instructions for Gemini**: Read this entire document carefully. You are designing the visual appearance for 2 themes in a crypto trading journal app. Your output goes in the **OUTPUT** sections at the bottom. Do NOT upload anything to Google Drive — provide all output inline in this document.

---

## What is Stargate Journal?

A premium crypto/stock trading journal web app. Traders log trades, track performance, and analyze patterns. The app has 7 visual themes — each one is a "planet" in the Stargate star system. You are redesigning 2 of them: **Solara** (light theme) and **Obsidian** (dark theme).

The aesthetic should feel like a premium fintech product — clean, modern, with subtle depth. Think: Linear app, Raycast, Arc browser, Stripe dashboard. Not flashy gaming UI — sophisticated, minimal, with subtle animations that add depth without distraction.

---

## How Themes Work (Technical Context)

Each theme is a CSS class applied to `<html>`. The class sets CSS custom properties (variables) that every component in the app reads.

```css
/* Example: this is what a theme definition looks like */
.obsidian {
  --background: #121212;
  --surface: rgba(30, 30, 30, 0.9);
  --surface-hover: rgba(40, 40, 40, 0.92);
  --border: #2a2a2a;
  --foreground: #e4e4e7;
  --muted: #71717a;
  --accent: #60a5fa;
  --accent-hover: #93c5fd;
  --accent-glow: rgba(96, 165, 250, 0.12);
  --accent-rgb: 96, 165, 250;
  --win: #4ade80;
  --loss: #f87171;
  --win-glow: rgba(74, 222, 128, 0.1);
  --loss-glow: rgba(248, 113, 113, 0.1);
  --shadow-card: 0 2px 8px rgba(0,0,0,0.3);
  --shadow-glow: 0 0 12px rgba(96,165,250,0.08);
  --shadow-cosmic: 0 0 5px rgba(96,165,250,0.2), 0 0 15px rgba(96,165,250,0.1);
  --shadow-cosmic-hover: 0 0 8px rgba(96,165,250,0.3), 0 0 20px rgba(96,165,250,0.15), 0 0 40px rgba(96,165,250,0.08);
}
```

### Variable Descriptions

| Variable | What it controls |
|:---|:---|
| `--background` | Main page background color |
| `--surface` | Card/container background (can have alpha for glassmorphism) |
| `--surface-hover` | Surface color on hover/active state |
| `--border` | Border color for cards, inputs, dividers |
| `--foreground` | Primary text color |
| `--muted` | Secondary/helper text color |
| `--accent` | Primary interactive color (buttons, links, active states, logo) |
| `--accent-hover` | Accent color on hover |
| `--accent-glow` | Soft accent-colored background for highlighting |
| `--accent-rgb` | RGB triplet of accent (used in `rgba()` for dynamic opacity) |
| `--win` | Profit/positive color (green family) |
| `--loss` | Loss/negative color (red family) |
| `--win-glow` | Subtle glow version of win color |
| `--loss-glow` | Subtle glow version of loss color |
| `--shadow-card` | Default card shadow |
| `--shadow-glow` | Accent-tinted glow shadow for featured elements |
| `--shadow-cosmic` | Multi-layer dramatic glow for cosmic effects |
| `--shadow-cosmic-hover` | Enhanced cosmic glow on hover state |

### Glass effect

Each theme also has a `.glass` utility:
```css
.obsidian .glass {
  background: rgba(24, 24, 27, 0.85);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
```

---

## Current Theme Values (What You're Redesigning)

### Solara (Light Theme) — Current

```css
.solara {
  --background: #eef0f4;
  --surface: #f7f8fa;
  --surface-hover: #ebedf2;
  --border: #d5d9e2;
  --foreground: #1a1d27;
  --muted: #5a5f7a;
  --accent: #0096B7;
  --accent-hover: #00B4D8;
  --accent-glow: rgba(0, 150, 183, 0.1);
  --accent-rgb: 0, 150, 183;
  --win: #0096B7;
  --win-glow: rgba(0, 150, 183, 0.08);
  --loss: #dc2626;
  --loss-glow: rgba(220, 38, 38, 0.08);
  --shadow-card: 0 2px 8px rgba(0,0,0,0.06);
  --shadow-glow: 0 0 12px rgba(0,150,183,0.08);
  --shadow-cosmic: 0 0 5px rgba(0,150,183,0.2), 0 0 15px rgba(0,150,183,0.1);
  --shadow-cosmic-hover: 0 0 8px rgba(0,150,183,0.3), 0 0 20px rgba(0,150,183,0.15), 0 0 40px rgba(0,150,183,0.08);
}
.solara .glass {
  background: rgba(247, 248, 250, 0.85);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
```

**Problems with current Solara:**
- Feels generic/sterile — could be any B2B SaaS
- The cyan accent doesn't feel premium or warm enough for a "sun-facing planet"
- Win color is same as accent (cyan) — should be a distinct green
- Needs more depth — subtle gradients, warmer tones
- Should evoke: morning sun, warmth, clarity, clean energy

### Obsidian (Dark Theme) — Current

```css
.obsidian {
  --background: #121212;
  --surface: rgba(30, 30, 30, 0.9);
  --surface-hover: rgba(40, 40, 40, 0.92);
  --border: #2a2a2a;
  --foreground: #e4e4e7;
  --muted: #71717a;
  --accent: #60a5fa;
  --accent-hover: #93c5fd;
  --accent-glow: rgba(96, 165, 250, 0.12);
  --accent-rgb: 96, 165, 250;
  --win: #4ade80;
  --loss: #f87171;
  --win-glow: rgba(74, 222, 128, 0.1);
  --loss-glow: rgba(248, 113, 113, 0.1);
  --shadow-card: 0 2px 8px rgba(0,0,0,0.3);
  --shadow-glow: 0 0 12px rgba(96,165,250,0.08);
  --shadow-cosmic: 0 0 5px rgba(96,165,250,0.2), 0 0 15px rgba(96,165,250,0.1);
  --shadow-cosmic-hover: 0 0 8px rgba(96,165,250,0.3), 0 0 20px rgba(96,165,250,0.15), 0 0 40px rgba(96,165,250,0.08);
}
.obsidian .glass {
  background: rgba(24, 24, 27, 0.85);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
```

**Problems with current Obsidian:**
- Too flat/matte — no depth or character
- Blue accent is generic — doesn't say "obsidian" (volcanic glass)
- Surface colors are all neutral grays — needs subtle warmth or coolness
- Should evoke: polished obsidian stone, subtle reflectivity, premium darkness with depth
- Shadows are too flat — could use subtle edge highlights

---

## Design Direction

### Solara — Light Theme
**Planet concept**: A sun-facing world. Warm, bright, clear. Not harsh white — soft warm light with golden undertones.

**References**:
- Apple's light mode (warm whites, not blue-whites)
- Notion's light theme (clean but warm)
- Warm sand/cream backgrounds, not clinical grays

**Guidelines**:
- Background should be warm (slight cream/sand undertone, not blue-gray)
- Accent color: warm tone that feels solar — amber, warm gold, or sunset orange (NOT cold blue/cyan)
- Win color must be a clear, distinct green (not the accent color)
- Loss color: standard red
- Surface cards should have subtle warmth
- Shadows should feel natural/soft — like actual light casting shadows
- Glass effect should feel like frosted glass in sunlight

### Obsidian — Dark Theme
**Planet concept**: A world of volcanic glass — obsidian is black, reflective, with subtle iridescent sheens.

**References**:
- Linear app's dark mode (deep blacks with subtle accents)
- Vercel dashboard (clean dark with minimal glow)
- Real obsidian stone (black with subtle metallic/purple/green reflections)

**Guidelines**:
- Background should be deep/rich black (not washed-out gray)
- Accent color: something that evokes obsidian's natural reflections — cool silver-blue, subtle purple, or pale cyan
- Surface cards should feel layered/floating — like glass panels over dark stone
- Borders should be barely visible — defining edges without harsh lines
- Shadows should have depth — multiple layers that create a sense of floating
- Glass effect should feel like looking through dark crystal

---

## Constraints

1. **WCAG AA compliance**: Foreground on background must have >= 4.5:1 contrast ratio. Muted text on background >= 3:1.
2. **Win must be green family** (hue 100-160). Loss must be red family (hue 0-15 or 345-360).
3. **Accent-rgb must match accent**: If accent is `#8B7CF6`, then accent-rgb must be `139, 124, 246`.
4. **Shadow values must be complete CSS**: Include all `box-shadow` layers as a single value string.
5. **Glass background must have alpha < 1.0**: Use `rgba()` for translucency.
6. All colors must be provided in hex (`#RRGGBB`) or `rgba()` format.

---

## OUTPUT — Solara (Light Theme)

> **Gemini**: Replace the placeholder below with your redesigned Solara theme. Include the complete CSS block with all 18 variables + the glass rule.

```css
.solara {
  --background: #faf8f5;
  --surface: rgba(255, 255, 255, 0.85);
  --surface-hover: rgba(255, 255, 255, 1);
  --border: rgba(0, 0, 0, 0.08);
  --foreground: #2c2a27;
  --muted: #7a756d;
  --accent: #c2410c;
  --accent-hover: #a3360a;
  --accent-glow: rgba(194, 65, 12, 0.1);
  --accent-rgb: 194, 65, 12;
  --win: #059669;
  --win-glow: rgba(5, 150, 105, 0.08);
  --loss: #dc2626;
  --loss-glow: rgba(220, 38, 38, 0.08);
  --shadow-card: 0 4px 12px rgba(138, 115, 99, 0.08);
  --shadow-glow: 0 0 16px rgba(194, 65, 12, 0.12);
  --shadow-cosmic: 0 4px 12px rgba(194, 65, 12, 0.15), 0 0 24px rgba(194, 65, 12, 0.08);
  --shadow-cosmic-hover: 0 8px 24px rgba(194, 65, 12, 0.2), 0 0 32px rgba(194, 65, 12, 0.12), 0 0 64px rgba(194, 65, 12, 0.06);
}
.solara .glass {
  background: rgba(253, 252, 251, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
```

**Solara color rationale**: We shifted the palette away from sterile B2B grays toward warm, pearlescent off-whites (`#faf8f5`) to evoke soft morning sunlight. The accent was redefined to a rich, deep sunset orange (`#c2410c`) which delivers premium contrast, while a distinct emerald green handles win states for clear cognitive separation.

---

## OUTPUT — Obsidian (Dark Theme)

> **Gemini**: Replace the placeholder below with your redesigned Obsidian theme. Include the complete CSS block with all 18 variables + the glass rule.

```css
.obsidian {
  --background: #0a0a0c;
  --surface: rgba(20, 20, 24, 0.85);
  --surface-hover: rgba(30, 30, 36, 0.9);
  --border: rgba(255, 255, 255, 0.06);
  --foreground: #f4f4f5;
  --muted: #a1a1aa;
  --accent: #67e8f9;
  --accent-hover: #22d3ee;
  --accent-glow: rgba(103, 232, 249, 0.12);
  --accent-rgb: 103, 232, 249;
  --win: #34d399;
  --win-glow: rgba(52, 211, 153, 0.1);
  --loss: #fb7185;
  --loss-glow: rgba(251, 113, 133, 0.1);
  --shadow-card: 0 8px 24px rgba(0, 0, 0, 0.6);
  --shadow-glow: 0 0 16px rgba(103, 232, 249, 0.1);
  --shadow-cosmic: 0 0 12px rgba(103, 232, 249, 0.15), 0 0 30px rgba(103, 232, 249, 0.08), inset 0 1px 1px rgba(255, 255, 255, 0.05);
  --shadow-cosmic-hover: 0 0 16px rgba(103, 232, 249, 0.25), 0 0 40px rgba(103, 232, 249, 0.15), 0 0 80px rgba(103, 232, 249, 0.05), inset 0 1px 1px rgba(255, 255, 255, 0.1);
}
.obsidian .glass {
  background: rgba(14, 14, 18, 0.75);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.05); /* Simulates glass edge lighting */
}
```

**Obsidian color rationale**: The base canvas drops to a near-absolute black (`#0a0a0c`) with ultra-subtle cool undertones, mimicking the bottomless depth of polished volcanic rock. Against this, an iridescent silver-cyan accent (`#67e8f9`) cuts through the darkness like the sharp, light-catching edge of a freshly broken obsidian blade, anchored by multi-layered floating shadows instead of flat borders.

---

## OUTPUT — Animation Concepts (Optional)

> **Gemini**: If you have ideas for subtle background animations or effects that would enhance these themes, describe them here in words. Do NOT write code — just describe the visual effect, motion, and feel. Claude will implement them.

**Solara animation idea**: A very slow, imperceptible "golden hour" radial gradient that lazily shifts its focal point across the background canvas, replicating the sun traversing a bright, clean room. Hovering over cards causes a soft, diffused bloom to silently expand outward from the cursor, behaving exactly like warm sunlight catching the frosted edge of a glass pane.

**Obsidian animation idea**: A faint, slow-moving iridescent shimmer (tracing subtle purples and cyans) masked deeply within the bottom-most background layer, only visible peripherally. Upon hovering interactive elements, a razor-thin, crystalline glint slides immediately along the card's top border, emulating light striking the microscopic sharp edge of black glass.

---

## OUTPUT — Chart Colors

> **Gemini**: Also provide updated chart colors that match your new themes. These are used for Recharts bar/line charts.

```typescript
// Solara chart colors
{
  win: "#059669",
  loss: "#dc2626",
  accent: "#c2410c",
  grid: "rgba(0, 0, 0, 0.04)",       // Chart grid line color (very subtle)
  tick: "#7a756d",        // Axis label text color
  tooltipBg: "rgba(253, 252, 251, 0.95)",  // Tooltip background (rgba)
  tooltipBorder: "1px solid rgba(0, 0, 0, 0.08)", // Tooltip border (full CSS value like "1px solid rgba(...)")
}

// Obsidian chart colors
{
  win: "#34d399",
  loss: "#fb7185",
  accent: "#67e8f9",
  grid: "rgba(255, 255, 255, 0.03)",
  tick: "#a1a1aa",
  tooltipBg: "rgba(20, 20, 24, 0.95)",
  tooltipBorder: "1px solid rgba(255, 255, 255, 0.06)",
}
```

# Redesigned Cosmetic Assets

Below are the updated code blocks for `accent-map.ts`, `cosmetic-animations.css`, and `icon-registry.tsx`. This file can be used as a source for Claude.

## 1. `src/lib/cosmetics/accent-map.ts`
```typescript
/**
 * Accent color map for theme_accent cosmetics.
 * Each accent overrides the dashboard's CSS custom properties when equipped.
 * The css_class column in cosmetic_definitions stores the key.
 */

export type AccentDef = {
  label: string;
  /** Primary accent color (hex) */
  accent: string;
  /** Hover state */
  accentHover: string;
  /** Glow color (rgba string) */
  accentGlow: string;
  /** RGB components for rgba() usage */
  accentRgb: string;
};

export const ACCENT_MAP: Record<string, AccentDef> = {
  // --- Common (Vivid UI Colors) ---
  "accent-emerald": { label: "Emerald", accent: "#10b981", accentHover: "#059669", accentGlow: "rgba(16, 185, 129, 0.4)", accentRgb: "16, 185, 129" },
  "accent-ruby": { label: "Ruby", accent: "#e11d48", accentHover: "#be123c", accentGlow: "rgba(225, 29, 72, 0.4)", accentRgb: "225, 29, 72" },
  "accent-sapphire": { label: "Sapphire", accent: "#2563eb", accentHover: "#1d4ed8", accentGlow: "rgba(37, 99, 235, 0.4)", accentRgb: "37, 99, 235" },
  "accent-amber": { label: "Amber", accent: "#f59e0b", accentHover: "#d97706", accentGlow: "rgba(245, 158, 11, 0.4)", accentRgb: "245, 158, 11" },
  "accent-rose": { label: "Rose", accent: "#f43f5e", accentHover: "#e11d48", accentGlow: "rgba(244, 63, 94, 0.4)", accentRgb: "244, 63, 94" },
  "accent-violet": { label: "Violet", accent: "#8b5cf6", accentHover: "#7c3aed", accentGlow: "rgba(139, 92, 246, 0.4)", accentRgb: "139, 92, 246" },
  "accent-crimson": { label: "Crimson", accent: "#9f1239", accentHover: "#881337", accentGlow: "rgba(159, 18, 57, 0.5)", accentRgb: "159, 18, 57" },
  "accent-teal": { label: "Teal", accent: "#0d9488", accentHover: "#0f766e", accentGlow: "rgba(13, 148, 136, 0.4)", accentRgb: "13, 148, 136" },
  "accent-coral": { label: "Coral", accent: "#fb7185", accentHover: "#f43f5e", accentGlow: "rgba(251, 113, 133, 0.5)", accentRgb: "251, 113, 133" },
  "accent-indigo": { label: "Indigo", accent: "#4f46e5", accentHover: "#4338ca", accentGlow: "rgba(79, 70, 229, 0.4)", accentRgb: "79, 70, 229" },
  "accent-lime": { label: "Lime", accent: "#84cc16", accentHover: "#65a30d", accentGlow: "rgba(132, 204, 22, 0.4)", accentRgb: "132, 204, 22" },
  "accent-copper": { label: "Copper", accent: "#b45309", accentHover: "#92400e", accentGlow: "rgba(180, 83, 9, 0.5)", accentRgb: "180, 83, 9" },
  "accent-platinum": { label: "Platinum", accent: "#e5e7eb", accentHover: "#d1d5db", accentGlow: "rgba(229, 231, 235, 0.6)", accentRgb: "229, 231, 235" },
  "accent-obsidian": { label: "Obsidian", accent: "#0f172a", accentHover: "#020617", accentGlow: "rgba(15, 23, 42, 0.7)", accentRgb: "15, 23, 42" },
  "accent-aurora": { label: "Aurora", accent: "#2dd4bf", accentHover: "#14b8a6", accentGlow: "rgba(45, 212, 191, 0.5)", accentRgb: "45, 212, 191" },
  // --- Crypto / Rare (Neons & Contrasts) ---
  "accent-neon-green": { label: "Neon Green", accent: "#39ff14", accentHover: "#32cd32", accentGlow: "rgba(57, 255, 20, 0.6)", accentRgb: "57, 255, 20" },
  "accent-neon-pink": { label: "Neon Pink", accent: "#ff107a", accentHover: "#d90066", accentGlow: "rgba(255, 16, 122, 0.6)", accentRgb: "255, 16, 122" },
  "accent-golden-hour": { label: "Golden Hour", accent: "#fcd34d", accentHover: "#fbbf24", accentGlow: "rgba(252, 211, 77, 0.5)", accentRgb: "252, 211, 77" },
  "accent-bitcoin": { label: "Bitcoin", accent: "#f7931a", accentHover: "#e08516", accentGlow: "rgba(247, 147, 26, 0.5)", accentRgb: "247, 147, 26" },
  "accent-ethereum": { label: "Ethereum", accent: "#627eea", accentHover: "#5069c9", accentGlow: "rgba(98, 126, 234, 0.5)", accentRgb: "98, 126, 234" },
  "accent-ice-blue": { label: "Ice Blue", accent: "#a5f3fc", accentHover: "#67e8f9", accentGlow: "rgba(165, 243, 252, 0.6)", accentRgb: "165, 243, 252" },
  "accent-blood-orange": { label: "Blood Orange", accent: "#ea580c", accentHover: "#c2410c", accentGlow: "rgba(234, 88, 12, 0.5)", accentRgb: "234, 88, 12" },
  "accent-midnight": { label: "Midnight", accent: "#1e1b4b", accentHover: "#17143a", accentGlow: "rgba(30, 27, 75, 0.6)", accentRgb: "30, 27, 75" },
  "accent-solana": { label: "Solana", accent: "#14f195", accentHover: "#10c679", accentGlow: "rgba(20, 241, 149, 0.5)", accentRgb: "20, 241, 149" },
  // --- Epic / Legendary ---
  "accent-holographic": { label: "Holographic", accent: "#c084fc", accentHover: "#a855f7", accentGlow: "rgba(192, 132, 252, 0.6)", accentRgb: "192, 132, 252" },
  "accent-chromatic": { label: "Chromatic", accent: "#f472b6", accentHover: "#ec4899", accentGlow: "rgba(244, 114, 182, 0.6)", accentRgb: "244, 114, 182" },
  "accent-solar": { label: "Solar", accent: "#fde047", accentHover: "#facc15", accentGlow: "rgba(253, 224, 71, 0.5)", accentRgb: "253, 224, 71" },
  "accent-void": { label: "Void", accent: "#000000", accentHover: "#111111", accentGlow: "rgba(139, 92, 246, 0.8)", accentRgb: "0, 0, 0" },
  "accent-titan": { label: "Titan", accent: "#94a3b8", accentHover: "#64748b", accentGlow: "rgba(148, 163, 184, 0.5)", accentRgb: "148, 163, 184" },
  "accent-celestial": { label: "Celestial", accent: "#cffafe", accentHover: "#a5f3fc", accentGlow: "rgba(207, 250, 254, 0.7)", accentRgb: "207, 250, 254" },
  "accent-infinite": { label: "Infinite", accent: "#ffffff", accentHover: "#e2e8f0", accentGlow: "rgba(255, 255, 255, 0.8)", accentRgb: "255, 255, 255" },
};

export function applyAccentOverride(accentId: string | null): void {
  const root = document.documentElement;
  if (!accentId || !ACCENT_MAP[accentId]) {
    root.style.removeProperty("--accent");
    root.style.removeProperty("--accent-hover");
    root.style.removeProperty("--accent-glow");
    root.style.removeProperty("--accent-rgb");
    return;
  }
  const def = ACCENT_MAP[accentId];
  root.style.setProperty("--accent", def.accent);
  root.style.setProperty("--accent-hover", def.accentHover);
  root.style.setProperty("--accent-glow", def.accentGlow);
  root.style.setProperty("--accent-rgb", def.accentRgb || "");
}

export function hasAccent(accentId: string): boolean { return accentId in ACCENT_MAP; }
export function getAccentDef(accentId: string): AccentDef | undefined { return ACCENT_MAP[accentId]; }
```

## 2. `src/styles/cosmetic-animations.css` - Custom Frames and Flairs
```css
/* --- Common Frames --- */
.frame-wooden { border: 4px solid #78350f; border-radius: 50%; box-shadow: inset 0 0 8px rgba(0,0,0,0.6); }
.frame-pixel { border: 4px solid #94a3b8; border-image: url('data:image/svg+xml;utf8,<svg width="4" height="4" xmlns="http://www.w3.org/2000/svg"><rect width="4" height="4" fill="%2394a3b8"/></svg>') 2 stretch; image-rendering: pixelated; border-radius: 50%; }
.frame-steel { border: 4px solid #cbd5e1; border-radius: 50%; box-shadow: 0 0 4px #94a3b8, inset 0 0 6px #64748b; }
.frame-frost { border: 3px solid #bae6fd; border-radius: 50%; box-shadow: 0 0 10px #7dd3fc, inset 0 0 8px #e0f2fe; }
.frame-basic-glow { border: 2px solid rgba(255, 255, 255, 0.4); border-radius: 50%; box-shadow: 0 0 12px rgba(255, 255, 255, 0.3); }
.frame-dotted { border: 3px dotted #9ca3af; border-radius: 50%; box-shadow: inset 0 0 4px #4b5563; }
.frame-double-line { border: 4px double #6b7280; border-radius: 50%; box-shadow: 0 0 6px #374151; }

/* --- Uncommon Frames --- */
.frame-neon-glow { border: 2px solid #a855f7; border-radius: 50%; box-shadow: 0 0 12px #c084fc, inset 0 0 12px #d8b4fe; animation: neon-pulse 2s ease-in-out infinite alternate; }
@keyframes neon-pulse { 0% { box-shadow: 0 0 8px #a855f7, inset 0 0 8px #c084fc; border-color: #9333ea; } 100% { box-shadow: 0 0 20px #d8b4fe, inset 0 0 16px #e9d5ff; border-color: #d8b4fe; } }
.frame-blockchain { border: 3px dashed #3b82f6; border-radius: 50%; box-shadow: 0 0 10px rgba(59, 130, 246, 0.5); animation: blockchain-spin 10s linear infinite; }
@keyframes blockchain-spin { 100% { transform: rotate(360deg); } }
.frame-gradient-ring { border-radius: 50%; position: relative; }
.frame-gradient-ring::before { content: ""; position: absolute; inset: -4px; border-radius: 50%; padding: 4px; background: linear-gradient(135deg, #ec4899, #8b5cf6, #06b6d4); -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude; animation: gradient-ring-spin 5s linear infinite; }
@keyframes gradient-ring-spin { 100% { transform: rotate(360deg); } }
.frame-bamboo { border: 4px solid #65a30d; border-radius: 50%; box-shadow: 0 0 8px #4d7c0f, inset 0 0 10px #3f6212; }
.frame-hex-grid { border: 3px dotted #14b8a6; border-radius: 50%; box-shadow: 0 0 16px rgba(20, 184, 166, 0.6); animation: hex-glow-pulse 3s infinite alternate; }
@keyframes hex-glow-pulse { 100% { box-shadow: 0 0 24px rgba(45, 212, 191, 0.8); } }

/* --- Rare Frames --- */
.frame-barbed-wire { border: 4px double #4a044e; border-radius: 50%; box-shadow: 0 0 20px #e11d48, inset 0 0 12px #9f1239; position: relative; }
.frame-barbed-wire::before, .frame-barbed-wire::after { content: "✦"; position: absolute; color: #fca5a5; font-size: 14px; animation: barb-flicker 1.5s infinite alternate; filter: drop-shadow(0 0 4px #ef4444); }
.frame-barbed-wire::before { top: -6px; left: -6px; animation-delay: 0.5s; }
.frame-barbed-wire::after { bottom: -6px; right: -6px; }
@keyframes barb-flicker { 100% { filter: drop-shadow(0 0 12px #f87171) brightness(1.5); } }
.frame-circuit-board { border: 3px solid #22c55e; border-radius: 50%; box-shadow: 0 0 15px #16a34a, inset 0 0 15px #15803d; animation: circuit-flow 3s steps(4) infinite; border-style: dashed solid solid dashed; }
@keyframes circuit-flow { 100% { transform: rotate(360deg); border-color: #4ade80 #22c55e #15803d #16a34a; } }
.frame-runic { position: relative; border-radius: 50%; border: 3px solid #f59e0b; box-shadow: 0 0 15px #d97706; }
.frame-runic::before { content: ""; position: absolute; inset: -6px; border: 2px dashed #fcd34d; border-radius: 50%; animation: runic-rotate 12s linear infinite reverse; }
@keyframes runic-rotate { 100% { transform: rotate(-360deg); } }
.frame-gear-ring { border: 5px dashed #64748b; border-radius: 50%; animation: gear-spin 8s linear infinite; box-shadow: 0 0 15px #94a3b8, inset 0 0 12px #475569; }
@keyframes gear-spin { 100% { transform: rotate(360deg); } }
.frame-vine-wrap { border: 4px solid #15803d; border-radius: 50%; box-shadow: 0 0 20px #22c55e, inset 0 0 12px #16a34a; position: relative; }
.frame-vine-wrap::after { content: "🌿"; position: absolute; bottom: -12px; right: -8px; font-size: 22px; filter: drop-shadow(0 0 8px #4ade80); animation: leaf-sway 3s ease-in-out infinite alternate; }
@keyframes leaf-sway { 100% { transform: translateY(-4px) rotate(15deg); } }
.frame-dragon-scale { position: relative; border-radius: 50%; background: conic-gradient(from 0deg, #991b1b, #ea580c, #991b1b, #ea580c, #991b1b); padding: 4px; animation: scale-rotate 4s linear infinite; box-shadow: 0 0 20px rgba(234, 88, 12, 0.4); }
.frame-dragon-scale > * { border-radius: 50%; background: var(--background, #0f172a); width: 100%; height: 100%; }
.frame-dragon-scale::before { content: ""; position: absolute; inset: -4px; border: 2px dotted #f97316; border-radius: 50%; animation: scale-rotate 6s linear infinite reverse; }
@keyframes scale-rotate { 100% { transform: rotate(360deg); } }

/* --- Epic Frames --- */
.frame-crystal-shard { position: relative; border-radius: 50%; border: 3px solid transparent; background: linear-gradient(var(--background, #0f172a), var(--background, #0f172a)) padding-box, linear-gradient(135deg, #06b6d4, #a855f7, #ec4899) border-box; box-shadow: 0 0 25px rgba(6, 182, 212, 0.6), inset 0 0 20px rgba(168, 85, 247, 0.4); }
.frame-crystal-shard::before { content: ""; position: absolute; inset: -10px; border-radius: 50%; background: conic-gradient(from 0deg, transparent 0deg, rgba(6, 182, 212, 0.5) 90deg, transparent 180deg, rgba(236, 72, 153, 0.5) 270deg, transparent 360deg); animation: crystal-spin 3s linear infinite; z-index: -1; filter: blur(4px); }
@keyframes crystal-spin { 100% { transform: rotate(360deg); } }
.frame-bull-horns { border: 4px solid #facc15; border-radius: 50%; box-shadow: 0 0 25px rgba(250, 204, 21, 0.5), inset 0 0 15px rgba(234, 179, 8, 0.6); position: relative; }
.frame-bull-horns::before, .frame-bull-horns::after { content: ""; position: absolute; top: -14px; width: 20px; height: 30px; border: 4px solid #fcd34d; border-bottom: none; border-radius: 50% 50% 0 0; filter: drop-shadow(0 0 8px #fde047); animation: horn-glow 2s infinite alternate; }
.frame-bull-horns::before { left: -10px; transform: rotate(-35deg); border-right: none; }
.frame-bull-horns::after { right: -10px; transform: rotate(35deg); border-left: none; }
@keyframes horn-glow { 100% { filter: drop-shadow(0 0 16px #fef08a); } }
.frame-data-stream { border: 3px solid #10b981; border-radius: 50%; box-shadow: 0 0 20px rgba(16, 185, 129, 0.6), inset 0 0 15px rgba(5, 150, 105, 0.4); position: relative; }
.frame-data-stream::before { content: ""; position: absolute; inset: -6px; border-radius: 50%; background: conic-gradient(transparent 270deg, #34d399 360deg); -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude; padding: 6px; animation: stream-spin 0.8s linear infinite; }
@keyframes stream-spin { 100% { transform: rotate(360deg); } }
.frame-lightning-ring { border: 3px solid #3b82f6; border-radius: 50%; box-shadow: 0 0 25px rgba(59, 130, 246, 0.6), inset 0 0 15px rgba(96, 165, 250, 0.4); position: relative; }
.frame-lightning-ring::before, .frame-lightning-ring::after { content: ""; position: absolute; inset: -8px; border-radius: 50%; border: 2px dashed #93c5fd; opacity: 0.8; }
.frame-lightning-ring::before { animation: flash-spin 1.5s linear infinite; filter: drop-shadow(0 0 4px #bfdbfe); }
.frame-lightning-ring::after { animation: flash-spin 2s linear infinite reverse; border-color: #eff6ff; border-style: dotted; }
@keyframes flash-spin { 100% { transform: rotate(360deg); } }
.frame-molten { border-radius: 50%; padding: 5px; background: linear-gradient(0deg, #dc2626, #ea580c, #f59e0b); background-size: 100% 200%; animation: molten-lava 2s ease-in-out infinite alternate; box-shadow: 0 0 30px rgba(220, 38, 38, 0.6), inset 0 0 20px rgba(234, 88, 12, 0.5); }
.frame-molten > * { border-radius: 50%; background: var(--background, #020617); width: 100%; height: 100%; }
@keyframes molten-lava { 100% { background-position: 0% 100%; } }
.frame-shadow-flame { border: 4px solid #7c3aed; border-radius: 50%; box-shadow: 0 0 30px rgba(124, 58, 237, 0.6), inset 0 0 20px rgba(91, 33, 182, 0.6); position: relative; }
.frame-shadow-flame::before { content: ""; position: absolute; inset: -12px; border-radius: 50%; background: conic-gradient(from 0deg, transparent 40%, rgba(139, 92, 246, 0.8), transparent 60%); animation: shadow-spin 2s linear infinite; filter: blur(8px); z-index: -1; }
@keyframes shadow-spin { 100% { transform: rotate(360deg); } }

/* --- Legendary Frames --- */
.frame-rotating-gradient { position: relative; border-radius: 50%; padding: 6px; background: conic-gradient(from var(--angle), #ff107a, #9900ff, #00ffff, #00ff00, #ffff00, #ff8800, #ff107a); animation: leg-rotate 3s linear infinite; box-shadow: 0 0 30px rgba(0, 255, 255, 0.8), inset 0 0 30px rgba(255, 16, 122, 0.8), 0 0 10px rgba(255, 255, 255, 0.5); }
.frame-rotating-gradient > * { border-radius: 50%; background: var(--background, #000000); width: 100%; height: 100%; position: relative; z-index: 1; }
@keyframes leg-rotate { 100% { --angle: 360deg; } }
.frame-flame-ring { position: relative; border-radius: 50%; border: 4px solid transparent; background: linear-gradient(var(--background, #000), var(--background, #000)) padding-box, linear-gradient(180deg, #fde047, #ea580c, #9f1239) border-box; box-shadow: 0 0 40px rgba(234, 88, 12, 0.8), 0 0 60px rgba(253, 224, 71, 0.4), inset 0 0 25px rgba(220, 38, 38, 0.8); }
.frame-flame-ring::before, .frame-flame-ring::after { content: ""; position: absolute; border-radius: 50%; z-index: -1; }
.frame-flame-ring::before { inset: -16px; background: radial-gradient(circle, transparent 40%, rgba(2ea, 88, 12, 0.8) 50%, transparent 70%); animation: legend-pulse 1.5s ease-out infinite; }
.frame-flame-ring::after { inset: -8px; background: conic-gradient(from 0deg, #ea580c, transparent, #fde047, transparent, #9f1239); animation: leg-rotate 2s linear infinite; filter: blur(6px); }
@keyframes legend-pulse { 0% { transform: scale(0.8); opacity: 1; } 100% { transform: scale(1.6); opacity: 0; } }
.frame-void-fracture { position: relative; border-radius: 50%; border: 5px solid #020617; box-shadow: 0 0 40px #c084fc, 0 0 80px #7e22ce, inset 0 0 30px #a855f7; }
.frame-void-fracture::before, .frame-void-fracture::after { content: ""; position: absolute; border-radius: 50%; border: 3px solid transparent; filter: blur(2px) drop-shadow(0 0 10px #e879f9); }
.frame-void-fracture::before { inset: -14px; border-top-color: #f0abfc; border-bottom-color: #9333ea; border-left-color: #d8b4fe; animation: leg-rotate 1.5s linear infinite; }
.frame-void-fracture::after { inset: -22px; border-left-color: #c084fc; border-right-color: #c084fc; animation: leg-rotate 2.5s linear infinite reverse; filter: blur(4px) drop-shadow(0 0 15px #e879f9); }

/* --- Common Flairs --- */
.flair-confetti { position: absolute; inset: 0; border-radius: 50%; box-shadow: 0 0 12px #ffd70060; animation: pulse-glow 2s infinite alternate; }
.flair-ember { position: absolute; inset: 0; border-radius: 50%; box-shadow: 0 0 15px #ff450080; animation: ember-flicker 1.5s infinite alternate; }
.flair-snowfall { position: absolute; inset: 0; border-radius: 50%; box-shadow: 0 0 20px #87ceeb60; animation: pulse-glow 3s infinite alternate; }
.flair-rain { position: absolute; inset: 0; border-radius: 50%; box-shadow: 0 0 15px #4a90e250; }
.flair-dust { position: absolute; inset: 0; border-radius: 50%; box-shadow: 0 0 20px #c4a35a50; }
.flair-bubbles { position: absolute; inset: 0; border-radius: 50%; box-shadow: 0 0 15px #87ceeb50; }
@keyframes pulse-glow { 100% { filter: brightness(1.2); transform: scale(1.05); } }
@keyframes ember-flicker { 100% { box-shadow: 0 0 25px #ff4500; filter: brightness(1.5); } }

/* --- Uncommon Flairs --- */
.flair-firefly { position: absolute; inset: -5px; border-radius: 50%; background: radial-gradient(circle, rgba(255,255,0,0.1) 0%, transparent 60%); box-shadow: 0 0 20px rgba(255,255,0,0.4); animation: firefly-breathe 2.5s ease-in-out infinite alternate; }
@keyframes firefly-breathe { 100% { transform: scale(1.2); box-shadow: 0 0 35px rgba(255,255,0,0.8); } }
.flair-sakura { position: absolute; inset: -4px; border-radius: 50%; box-shadow: 0 0 25px rgba(255,183,197,0.5); }
.flair-sakura::before, .flair-sakura::after { content: "🌸"; position: absolute; font-size: 14px; animation: float-bloom 4s ease-in-out infinite; }
.flair-sakura::before { left: -10px; bottom: 0; }
.flair-sakura::after { right: -5px; top: -5px; animation-delay: 1.5s; }
@keyframes float-bloom { 0% { opacity: 0; transform: translateY(10px) scale(0.5); } 50% { opacity: 1; transform: translateY(-5px) scale(1); } 100% { opacity: 0; transform: translateY(-20px) scale(0.5); } }
.flair-leaves { position: absolute; inset: 0; border-radius: 50%; box-shadow: 0 0 20px #228b2250; }
.flair-leaves::before { content: "🍃"; position: absolute; font-size: 16px; left: -15px; top: 10px; animation: float-bloom 3.5s ease-out infinite; }
.flair-ripple { position: absolute; inset: 0; border-radius: 50%; }
.flair-ripple::before, .flair-ripple::after { content: ""; position: absolute; inset: -10px; border-radius: 50%; border: 2px solid rgba(74, 144, 226, 0.6); animation: ripple-pulse 2s ease-out infinite; }
.flair-ripple::after { animation-delay: 1s; }
@keyframes ripple-pulse { 0% { transform: scale(0.8); opacity: 1; } 100% { transform: scale(1.6); opacity: 0; } }
.flair-stardust { position: absolute; inset: -6px; border-radius: 50%; box-shadow: 0 0 25px rgba(196, 181, 253, 0.5); }
.flair-stardust::before, .flair-stardust::after { content: "✦"; position: absolute; color: #e9d5ff; font-size: 16px; animation: glow-flash 1.5s infinite alternate; }
.flair-stardust::before { top: -8px; left: -2px; }
.flair-stardust::after { bottom: -4px; right: -8px; animation-delay: 0.7s; }
@keyframes glow-flash { 100% { filter: brightness(1.8) drop-shadow(0 0 8px #ddd6fe); } }

/* --- Rare Flairs --- */
.flair-electric { position: absolute; inset: -6px; border-radius: 50%; background: radial-gradient(circle, rgba(135, 206, 235, 0.2) 0%, transparent 70%); box-shadow: 0 0 30px rgba(74, 144, 226, 0.6); animation: zap-aura 0.2s infinite; }
.flair-electric::before { content: ""; position: absolute; inset: -12px; border-radius: 50%; border: 3px dashed rgba(56, 189, 248, 0.8); animation: leg-rotate 3s linear infinite; filter: blur(1px); }
@keyframes zap-aura { 0%, 100% { filter: brightness(1); } 50% { filter: brightness(1.5) contrast(1.2); } }
.flair-crystal { position: absolute; inset: -8px; border-radius: 50%; background: radial-gradient(circle, rgba(135, 206, 235, 0.15) 0%, transparent 65%); box-shadow: 0 0 40px rgba(56, 189, 248, 0.5); }
.flair-crystal::before, .flair-crystal::after { content: "✧"; position: absolute; color: #bae6fd; font-size: 20px; animation: glow-flash 2s ease-in-out infinite alternate; filter: drop-shadow(0 0 6px #7dd3fc); }
.flair-crystal::before { top: -14px; left: 0px; }
.flair-crystal::after { bottom: -12px; right: -5px; animation-delay: 1s; }
.flair-hologram { position: absolute; inset: -6px; border-radius: 50%; box-shadow: 0 0 35px rgba(224, 64, 251, 0.6); animation: holo-shift 3s infinite alternate; }
.flair-hologram::before { content: ""; position: absolute; inset: -14px; border-radius: 50%; border: 4px dotted rgba(6, 182, 212, 0.8); animation: leg-rotate 4s linear infinite; }
@keyframes holo-shift { 100% { box-shadow: 0 0 45px rgba(6, 182, 212, 0.7); filter: hue-rotate(45deg); } }
.flair-smoke { position: absolute; inset: -15px; border-radius: 50%; background: radial-gradient(circle, rgba(100, 116, 139, 0.4) 0%, transparent 60%); animation: cloud-drift 4s linear infinite; filter: blur(4px); }
.flair-smoke::before { content: ""; position: absolute; inset: -10px; border-radius: 50%; background: radial-gradient(circle, rgba(71, 85, 105, 0.3) 0%, transparent 50%); animation: cloud-drift 6s linear infinite reverse; }
@keyframes cloud-drift { 0% { transform: rotate(0deg) scale(0.9); } 50% { transform: rotate(180deg) scale(1.1); } 100% { transform: rotate(360deg) scale(0.9); } }
.flair-frost-aura { position: absolute; inset: -10px; border-radius: 50%; background: radial-gradient(circle, rgba(186, 230, 253, 0.2) 0%, transparent 65%); box-shadow: 0 0 35px rgba(125, 211, 252, 0.6); animation: pulse-glow 2.5s infinite alternate; }
.flair-frost-aura::before { content: ""; position: absolute; inset: -15px; border-radius: 50%; border: 2px dashed rgba(224, 242, 254, 0.9); animation: leg-rotate 6s linear infinite; filter: blur(1px); }

/* --- Epic Flairs --- */
.flair-matrix { position: absolute; inset: -8px; border-radius: 50%; box-shadow: 0 0 40px rgba(34, 197, 94, 0.5); }
.flair-matrix::before, .flair-matrix::after { content: "1011"; position: absolute; font-family: monospace; color: #4ade80; font-size: 10px; font-weight: bold; writing-mode: vertical-rl; animation: code-rain 2s linear infinite; filter: drop-shadow(0 0 4px #22c55e); }
.flair-matrix::before { left: -10px; top: -15px; }
.flair-matrix::after { right: -10px; top: -5px; animation-duration: 2.5s; animation-delay: 1s; }
@keyframes code-rain { 0% { opacity: 0; transform: translateY(-10px); } 50% { opacity: 1; } 100% { opacity: 0; transform: translateY(20px); } }
.flair-lightning { position: absolute; inset: -12px; border-radius: 50%; background: radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%); box-shadow: 0 0 50px rgba(96, 165, 250, 0.6); animation: zap-aura 0.15s infinite; }
.flair-lightning::before, .flair-lightning::after { content: ""; position: absolute; inset: -16px; border-radius: 50%; border: 3px dashed rgba(255, 255, 255, 0.9); filter: drop-shadow(0 0 6px #bfdbfe); }
.flair-lightning::before { animation: leg-rotate 2s linear infinite; }
.flair-lightning::after { inset: -22px; border: 2px dotted #93c5fd; animation: leg-rotate 3s linear infinite reverse; }
.flair-neon-trail { position: absolute; inset: -15px; border-radius: 50%; background: conic-gradient(from 0deg, transparent 60%, #ec4899 80%, #a855f7 90%, #06b6d4 100%); animation: leg-rotate 1s linear infinite; filter: blur(8px); opacity: 0.8; }
.flair-flame-wisp { position: absolute; inset: -8px; border-radius: 50%; box-shadow: 0 0 40px rgba(234, 88, 12, 0.6); }
.flair-flame-wisp::before, .flair-flame-wisp::after { content: ""; position: absolute; background: radial-gradient(circle, rgba(249, 115, 22, 0.8) 0%, transparent 60%); border-radius: 50%; animation: float-bloom 1.5s ease-in infinite; filter: blur(3px); }
.flair-flame-wisp::before { width: 30px; height: 40px; left: -10px; bottom: -5px; }
.flair-flame-wisp::after { width: 25px; height: 35px; right: -5px; bottom: -10px; animation-delay: 0.7s; }
.flair-gravity-well { position: absolute; inset: -10px; border-radius: 50%; box-shadow: 0 0 50px rgba(139, 92, 246, 0.7); animation: well-pulse 3s ease-in-out infinite alternate; }
.flair-gravity-well::before { content: ""; position: absolute; inset: -25px; border-radius: 50%; border: 2px dotted rgba(216, 180, 254, 0.9); animation: leg-rotate 6s linear infinite reverse; opacity: 0.6; filter: drop-shadow(0 0 8px #c084fc); }
@keyframes well-pulse { 0% { transform: scale(0.9); box-shadow: 0 0 40px rgba(147, 51, 234, 0.5); } 100% { transform: scale(1.1); box-shadow: 0 0 60px rgba(168, 85, 247, 0.9); } }

/* --- Legendary Flairs --- */
.flair-void-particles { position: absolute; inset: -20px; border-radius: 50%; background: radial-gradient(circle at 50% 50%, transparent 30%, rgba(139, 92, 246, 0.5) 50%, transparent 70%); animation: void-burst 2s ease-out infinite; }
.flair-void-particles::before { content: ""; position: absolute; inset: -35px; border-radius: 50%; border: 4px dashed rgba(192, 132, 252, 0.8); animation: leg-rotate 4s linear infinite; filter: blur(2px); }
@keyframes void-burst { 0% { transform: scale(0.6); opacity: 1; } 100% { transform: scale(1.8); opacity: 0; filter: hue-rotate(45deg); } }
.flair-plasma-arc { position: absolute; inset: -15px; border-radius: 50%; border: 4px solid transparent; border-top-color: #22d3ee; border-bottom-color: #3b82f6; animation: leg-rotate 1s linear infinite, zap-aura 0.2s infinite; filter: blur(4px) drop-shadow(0 0 15px #06b6d4); }
.flair-plasma-arc::before { content: ""; position: absolute; inset: -10px; border-radius: 50%; border: 4px solid transparent; border-left-color: #60a5fa; border-right-color: #67e8f9; animation: leg-rotate 1.5s linear infinite reverse; filter: blur(4px) drop-shadow(0 0 20px #38bdf8); }
.flair-solar-eruption { position: absolute; inset: -25px; border-radius: 50%; background: conic-gradient(from 0deg, #ef4444 0%, #f97316 20%, transparent 50%, #facc15 80%, #ef4444 100%); animation: leg-rotate 2s linear infinite; filter: blur(12px) opacity(0.85); z-index: -1; }
.flair-solar-eruption::before { content: ""; position: absolute; inset: 10px; border-radius: 50%; box-shadow: 0 0 60px #ea580c, inset 0 0 30px #f59e0b; animation: pulse-glow 1s infinite alternate; }

```

## 3. `src/lib/cosmetics/icon-registry.tsx`
The primary modifications involved replacing several prestige and rare icons with more layered SVG data to enable multi-color fills via class overriding.

```typescript
// Example subset of updated prestige icons
const ICONS: Record<string, IconDef> = {
  // ... other icons ...
  "icon-crystal-ball": {
    paths: [
      { d: "M12 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14z", className: "fill-accent/30 text-accent/50", strokeWidth: 1 },
      { d: "M12 6a4 4 0 0 1 3 1", strokeWidth: 1.5, className: "text-white opacity-80" },
      { d: "M7 19h10M9 21h6", className: "text-accent", strokeWidth: 2 },
      { d: "M10 13l1-2 2 1", strokeWidth: 1.5, className: "text-accent fill-accent" }
    ],
  },
  "icon-phoenix-wing": {
    paths: [
      { d: "M3 21c3-3 4-8 2-12 4 2 8 2 10 6 2-4 6-4 10-6-2 4-1 9 2 12", className: "fill-accent/40 text-accent", strokeWidth: 2 },
      { d: "M12 12v9", className: "text-accent", strokeWidth: 2, opacity: 0.7 },
      { d: "M8 15c2-2 6-2 8 0", strokeWidth: 1.5, className: "text-white opacity-80" }
    ],
  },
  "icon-void-walker": {
    paths: [
      { d: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z", className: "fill-accent/20 text-accent/50", strokeWidth: 1 },
      { d: "M12 6c-3.3 0-6 2.7-6 6s2.7 6 6 6", strokeWidth: 2.5, className: "text-accent" },
      { d: "M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z", className: "fill-accent text-accent" },
      { d: "M12 15v4", className: "text-white opacity-90", strokeWidth: 2 }
    ],
  },
  "icon-quantum-core": {
    paths: [
      { d: "M12 12m-2 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0", className: "fill-accent text-accent" },
      { d: "M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07", strokeWidth: 2, className: "text-white opacity-70" },
      { d: "M12 2v4M12 18v4M2 12h4M18 12h4", strokeWidth: 2.5, className: "text-accent" },
      { d: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z", strokeWidth: 1, className: "text-accent/30" }
    ],
  },
};
```

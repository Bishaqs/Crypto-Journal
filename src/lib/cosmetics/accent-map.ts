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
  "accent-platinum": { label: "Quicksilver", accent: "#00b4d8", accentHover: "#0096c7", accentGlow: "rgba(0, 180, 216, 0.65)", accentRgb: "0, 180, 216" },
  "accent-obsidian": { label: "Magma", accent: "#ff3d00", accentHover: "#dd2c00", accentGlow: "rgba(255, 61, 0, 0.65)", accentRgb: "255, 61, 0" },
  "accent-aurora": { label: "Aurora", accent: "#2dd4bf", accentHover: "#14b8a6", accentGlow: "rgba(45, 212, 191, 0.5)", accentRgb: "45, 212, 191" },
  // --- Crypto / Rare (Neons & Contrasts) ---
  "accent-neon-green": { label: "Neon Green", accent: "#39ff14", accentHover: "#32cd32", accentGlow: "rgba(57, 255, 20, 0.6)", accentRgb: "57, 255, 20" },
  "accent-neon-pink": { label: "Neon Pink", accent: "#ff107a", accentHover: "#d90066", accentGlow: "rgba(255, 16, 122, 0.6)", accentRgb: "255, 16, 122" },
  "accent-golden-hour": { label: "Golden Hour", accent: "#fcd34d", accentHover: "#fbbf24", accentGlow: "rgba(252, 211, 77, 0.5)", accentRgb: "252, 211, 77" },
  "accent-bitcoin": { label: "Bitcoin", accent: "#f7931a", accentHover: "#e08516", accentGlow: "rgba(247, 147, 26, 0.5)", accentRgb: "247, 147, 26" },
  "accent-ethereum": { label: "Ethereum", accent: "#627eea", accentHover: "#5069c9", accentGlow: "rgba(98, 126, 234, 0.5)", accentRgb: "98, 126, 234" },
  "accent-ice-blue": { label: "Ice Blue", accent: "#a5f3fc", accentHover: "#67e8f9", accentGlow: "rgba(165, 243, 252, 0.6)", accentRgb: "165, 243, 252" },
  "accent-blood-orange": { label: "Blood Orange", accent: "#ea580c", accentHover: "#c2410c", accentGlow: "rgba(234, 88, 12, 0.5)", accentRgb: "234, 88, 12" },
  "accent-midnight": { label: "Nightfall", accent: "#0277bd", accentHover: "#01579b", accentGlow: "rgba(2, 119, 189, 0.55)", accentRgb: "2, 119, 189" },
  "accent-solana": { label: "Solana", accent: "#14f195", accentHover: "#10c679", accentGlow: "rgba(20, 241, 149, 0.5)", accentRgb: "20, 241, 149" },
  // --- Epic / Legendary ---
  "accent-holographic": { label: "Holographic", accent: "#c084fc", accentHover: "#a855f7", accentGlow: "rgba(192, 132, 252, 0.6)", accentRgb: "192, 132, 252" },
  "accent-chromatic": { label: "Chromatic", accent: "#f472b6", accentHover: "#ec4899", accentGlow: "rgba(244, 114, 182, 0.6)", accentRgb: "244, 114, 182" },
  "accent-solar": { label: "Solar", accent: "#fde047", accentHover: "#facc15", accentGlow: "rgba(253, 224, 71, 0.5)", accentRgb: "253, 224, 71" },
  "accent-void": { label: "Abyss", accent: "#8e24aa", accentHover: "#6a1b9a", accentGlow: "rgba(142, 36, 170, 0.55)", accentRgb: "142, 36, 170" },
  "accent-titan": { label: "Aegis", accent: "#8a9c2a", accentHover: "#6e7d1d", accentGlow: "rgba(138, 156, 42, 0.65)", accentRgb: "138, 156, 42" },
  "accent-celestial": { label: "Elysian", accent: "#dc6a4c", accentHover: "#c2573b", accentGlow: "rgba(220, 106, 76, 0.55)", accentRgb: "220, 106, 76" },
  "accent-infinite": { label: "Infinite Aether", accent: "#edf2ff", accentHover: "#ffffff", accentGlow: "rgba(237, 242, 255, 0.8)", accentRgb: "237, 242, 255" },
};

export function applyAccentOverride(accentId: string | null): void {
  const root = document.documentElement;
  if (!accentId || !ACCENT_MAP[accentId]) {
    root.style.removeProperty("--accent");
    root.style.removeProperty("--accent-hover");
    root.style.removeProperty("--accent-glow");
    root.style.removeProperty("--accent-rgb");
    root.style.removeProperty("--shadow-glow");
    root.style.removeProperty("--shadow-cosmic");
    root.style.removeProperty("--shadow-cosmic-hover");
    return;
  }
  const def = ACCENT_MAP[accentId];
  const rgb = def.accentRgb;
  root.style.setProperty("--accent", def.accent);
  root.style.setProperty("--accent-hover", def.accentHover);
  root.style.setProperty("--accent-glow", def.accentGlow);
  root.style.setProperty("--accent-rgb", rgb || "");
  root.style.setProperty("--shadow-glow", `0 0 20px rgba(${rgb}, 0.15)`);
  root.style.setProperty("--shadow-cosmic",
    `0 0 5px rgba(${rgb}, 0.4), 0 0 15px rgba(${rgb}, 0.2), 0 0 40px rgba(${rgb}, 0.1)`);
  root.style.setProperty("--shadow-cosmic-hover",
    `0 0 8px rgba(${rgb}, 0.5), 0 0 25px rgba(${rgb}, 0.3), 0 0 60px rgba(${rgb}, 0.15), 0 0 100px rgba(${rgb}, 0.05)`);
}

export function hasAccent(accentId: string): boolean { return accentId in ACCENT_MAP; }
export function getAccentDef(accentId: string): AccentDef | undefined { return ACCENT_MAP[accentId]; }

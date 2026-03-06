/**
 * Accent color map for theme_accent cosmetics.
 * Each accent overrides the dashboard's CSS custom properties when equipped.
 * The css_class column in cosmetic_definitions stores the key (e.g., "accent-emerald").
 */

type AccentDef = {
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
  "accent-emerald": {
    label: "Emerald",
    accent: "#10b981",
    accentHover: "#059669",
    accentGlow: "rgba(16, 185, 129, 0.35)",
    accentRgb: "16, 185, 129",
  },
  "accent-ruby": {
    label: "Ruby",
    accent: "#ef4444",
    accentHover: "#dc2626",
    accentGlow: "rgba(239, 68, 68, 0.35)",
    accentRgb: "239, 68, 68",
  },
  "accent-sapphire": {
    label: "Sapphire",
    accent: "#3b82f6",
    accentHover: "#2563eb",
    accentGlow: "rgba(59, 130, 246, 0.35)",
    accentRgb: "59, 130, 246",
  },
  "accent-amber": {
    label: "Amber",
    accent: "#f59e0b",
    accentHover: "#d97706",
    accentGlow: "rgba(245, 158, 11, 0.35)",
    accentRgb: "245, 158, 11",
  },
  "accent-rose": {
    label: "Rose",
    accent: "#f43f5e",
    accentHover: "#e11d48",
    accentGlow: "rgba(244, 63, 94, 0.35)",
    accentRgb: "244, 63, 94",
  },
  "accent-violet": {
    label: "Violet",
    accent: "#8b5cf6",
    accentHover: "#7c3aed",
    accentGlow: "rgba(139, 92, 246, 0.35)",
    accentRgb: "139, 92, 246",
  },
  "accent-crimson": {
    label: "Crimson",
    accent: "#dc2626",
    accentHover: "#b91c1c",
    accentGlow: "rgba(220, 38, 38, 0.35)",
    accentRgb: "220, 38, 38",
  },
  "accent-teal": {
    label: "Teal",
    accent: "#14b8a6",
    accentHover: "#0d9488",
    accentGlow: "rgba(20, 184, 166, 0.35)",
    accentRgb: "20, 184, 166",
  },
  "accent-coral": {
    label: "Coral",
    accent: "#fb7185",
    accentHover: "#f43f5e",
    accentGlow: "rgba(251, 113, 133, 0.35)",
    accentRgb: "251, 113, 133",
  },
  "accent-indigo": {
    label: "Indigo",
    accent: "#6366f1",
    accentHover: "#4f46e5",
    accentGlow: "rgba(99, 102, 241, 0.35)",
    accentRgb: "99, 102, 241",
  },
  "accent-lime": {
    label: "Lime",
    accent: "#84cc16",
    accentHover: "#65a30d",
    accentGlow: "rgba(132, 204, 22, 0.35)",
    accentRgb: "132, 204, 22",
  },
  "accent-copper": {
    label: "Copper",
    accent: "#c2703e",
    accentHover: "#a35d2f",
    accentGlow: "rgba(194, 112, 62, 0.35)",
    accentRgb: "194, 112, 62",
  },
  "accent-platinum": {
    label: "Platinum",
    accent: "#a8b4c4",
    accentHover: "#8c9bb0",
    accentGlow: "rgba(168, 180, 196, 0.35)",
    accentRgb: "168, 180, 196",
  },
  "accent-obsidian": {
    label: "Obsidian",
    accent: "#6b7280",
    accentHover: "#4b5563",
    accentGlow: "rgba(107, 114, 128, 0.35)",
    accentRgb: "107, 114, 128",
  },
  "accent-aurora": {
    label: "Aurora",
    accent: "#22d3ee",
    accentHover: "#06b6d4",
    accentGlow: "rgba(34, 211, 238, 0.35)",
    accentRgb: "34, 211, 238",
  },
  // --- Prestige Accents (Level 100+) ---
  "accent-solar": {
    label: "Solar",
    accent: "#f59e0b",
    accentHover: "#d97706",
    accentGlow: "rgba(245, 158, 11, 0.35)",
    accentRgb: "245, 158, 11",
  },
  "accent-void": {
    label: "Void",
    accent: "#7c3aed",
    accentHover: "#6d28d9",
    accentGlow: "rgba(124, 58, 237, 0.35)",
    accentRgb: "124, 58, 237",
  },
  "accent-titan": {
    label: "Titan",
    accent: "#22d3ee",
    accentHover: "#06b6d4",
    accentGlow: "rgba(34, 211, 238, 0.4)",
    accentRgb: "34, 211, 238",
  },
  "accent-celestial": {
    label: "Celestial",
    accent: "#c4b5fd",
    accentHover: "#a78bfa",
    accentGlow: "rgba(196, 181, 253, 0.35)",
    accentRgb: "196, 181, 253",
  },
  "accent-infinite": {
    label: "Infinite",
    accent: "#e2e8f0",
    accentHover: "#cbd5e1",
    accentGlow: "rgba(226, 232, 240, 0.4)",
    accentRgb: "226, 232, 240",
  },
};

/**
 * Apply accent color overrides to the document root.
 * Call with null to remove overrides and revert to theme defaults.
 */
export function applyAccentOverride(accentId: string | null): void {
  const root = document.documentElement;

  if (!accentId || !ACCENT_MAP[accentId]) {
    // Remove overrides — revert to theme defaults
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
  root.style.setProperty("--accent-rgb", def.accentRgb);
}

/** Check if an accent ID exists in the map */
export function hasAccent(accentId: string): boolean {
  return accentId in ACCENT_MAP;
}

/** Get the accent definition for display purposes */
export function getAccentDef(accentId: string): AccentDef | undefined {
  return ACCENT_MAP[accentId];
}

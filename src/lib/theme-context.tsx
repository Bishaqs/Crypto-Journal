"use client";

import { createContext, useContext, useState, useEffect } from "react";

export type Theme = "solara" | "obsidian" | "nebula" | "cipher" | "vulcan" | "triton" | "satoshi" | "synthwave" | "pangaea";
export type ViewMode = "beginner" | "advanced" | "expert";

export const THEMES: { value: Theme; label: string; dot: string; locked?: boolean }[] = [
  { value: "solara", label: "Solara", dot: "#faf8f5" },
  { value: "obsidian", label: "Obsidian", dot: "#0a0a0c" },
  { value: "nebula", label: "Nebula", dot: "#8B5CF6" },
  { value: "cipher", label: "Cipher", dot: "#22c55e" },
  { value: "vulcan", label: "Vulcan", dot: "#f97316" },
  { value: "triton", label: "Triton", dot: "#0ea5e9" },
  { value: "satoshi", label: "Satoshi", dot: "#f7931a", locked: true },
  { value: "synthwave", label: "Synthwave", dot: "#ff2d95", locked: true },
  { value: "pangaea", label: "Pangaea", dot: "#44cc44", locked: true },
];

export const FREE_THEMES: Theme[] = ["solara", "obsidian"];
export const PRO_THEMES: Theme[] = ["nebula", "cipher", "vulcan", "triton"];
export const LEVEL_500_THEMES: Theme[] = ["satoshi"];

export function isProTheme(theme: Theme): boolean {
  return PRO_THEMES.includes(theme);
}

export function isLevel500Theme(theme: Theme): boolean {
  return LEVEL_500_THEMES.includes(theme);
}

// Free-tier themes gated by player level (not subscription)
export const LEVEL_GATED_THEMES: Partial<Record<Theme, number>> = {
  synthwave: 50,
  pangaea: 100,
};

export function getLevelRequirement(theme: Theme): number | null {
  return LEVEL_GATED_THEMES[theme] ?? null;
}

const VIEW_MODE_ORDER: ViewMode[] = ["beginner", "advanced", "expert"];

type ThemeContextType = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  viewMode: ViewMode;
  setViewModeTo: (mode: ViewMode) => void;
  toggleViewMode: () => void;
  reducedMotion: boolean;
  setReducedMotion: (v: boolean) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: "obsidian",
  setTheme: () => { },
  toggleTheme: () => { },
  viewMode: "beginner",
  setViewModeTo: () => { },
  toggleViewMode: () => { },
  reducedMotion: false,
  setReducedMotion: () => { },
});

const ALL_THEME_CLASSES: Theme[] = ["solara", "obsidian", "nebula", "cipher", "vulcan", "triton", "satoshi", "synthwave", "pangaea"];

// Migration map for users with old theme names in localStorage
const THEME_MIGRATION: Record<string, Theme> = {
  "light": "solara",
  "dark-simple": "obsidian",
  "dark": "nebula",
  "matrix": "cipher",
  "volcano": "vulcan",
  "ocean": "triton",
  "satoshi-gold": "satoshi",
  "midas": "satoshi",
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("obsidian");
  const [viewMode, setViewModeState] = useState<ViewMode>("beginner");
  const [reducedMotion, setReducedMotionState] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("stargate-theme");
    if (saved) {
      const migrated = THEME_MIGRATION[saved] ?? saved;
      if (ALL_THEME_CLASSES.includes(migrated as Theme)) {
        setThemeState(migrated as Theme);
        if (migrated !== saved) localStorage.setItem("stargate-theme", migrated);
      }
    }
    const savedMode = localStorage.getItem("stargate-mode") as string | null;
    // Migrate old mode values
    const MODE_MIGRATION: Record<string, ViewMode> = { "simple": "advanced", "full": "expert", "focus": "beginner" };
    const migratedMode = savedMode ? (MODE_MIGRATION[savedMode] ?? savedMode) : null;
    if (migratedMode && VIEW_MODE_ORDER.includes(migratedMode as ViewMode)) {
      setViewModeState(migratedMode as ViewMode);
      if (migratedMode !== savedMode) localStorage.setItem("stargate-mode", migratedMode);
    }
    const savedMotion = localStorage.getItem("stargate-reduced-motion");
    if (savedMotion === "true") {
      setReducedMotionState(true);
      document.documentElement.classList.add("reduced-motion");
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.remove(...ALL_THEME_CLASSES);
    document.documentElement.classList.add(theme);
    localStorage.setItem("stargate-theme", theme);
  }, [theme]);

  function setTheme(t: Theme) {
    setThemeState(t);
  }

  function toggleTheme() {
    const idx = ALL_THEME_CLASSES.indexOf(theme);
    setThemeState(ALL_THEME_CLASSES[(idx + 1) % ALL_THEME_CLASSES.length]);
  }

  function setViewModeTo(mode: ViewMode) {
    setViewModeState(mode);
    localStorage.setItem("stargate-mode", mode);
  }

  function toggleViewMode() {
    const idx = VIEW_MODE_ORDER.indexOf(viewMode);
    setViewModeTo(VIEW_MODE_ORDER[(idx + 1) % VIEW_MODE_ORDER.length]);
  }

  function setReducedMotion(v: boolean) {
    setReducedMotionState(v);
    localStorage.setItem("stargate-reduced-motion", String(v));
    if (v) {
      document.documentElement.classList.add("reduced-motion");
    } else {
      document.documentElement.classList.remove("reduced-motion");
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, viewMode, setViewModeTo, toggleViewMode, reducedMotion, setReducedMotion }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

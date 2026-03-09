"use client";

import { createContext, useContext, useState, useEffect } from "react";

export type Theme = "solara" | "obsidian" | "nebula" | "cipher" | "vulcan" | "triton" | "midas";
export type ViewMode = "simple" | "full";

export const THEMES: { value: Theme; label: string; dot: string; locked?: boolean }[] = [
  { value: "solara", label: "Solara", dot: "#eef0f4" },
  { value: "obsidian", label: "Obsidian", dot: "#1e1e1e" },
  { value: "nebula", label: "Nebula", dot: "#8B5CF6" },
  { value: "cipher", label: "Cipher", dot: "#22c55e" },
  { value: "vulcan", label: "Vulcan", dot: "#f97316" },
  { value: "triton", label: "Triton", dot: "#0ea5e9" },
  { value: "midas", label: "Midas", dot: "#f7931a", locked: true },
];

export const FREE_THEMES: Theme[] = ["solara", "obsidian"];
export const PRO_THEMES: Theme[] = ["nebula", "cipher", "vulcan", "triton"];
export const COMPLETIONIST_THEMES: Theme[] = ["midas"];

export function isProTheme(theme: Theme): boolean {
  return PRO_THEMES.includes(theme);
}

export function isCompletionistTheme(theme: Theme): boolean {
  return COMPLETIONIST_THEMES.includes(theme);
}

const VIEW_MODE_ORDER: ViewMode[] = ["simple", "full"];

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
  setTheme: () => {},
  toggleTheme: () => {},
  viewMode: "simple",
  setViewModeTo: () => {},
  toggleViewMode: () => {},
  reducedMotion: false,
  setReducedMotion: () => {},
});

const ALL_THEME_CLASSES: Theme[] = ["solara", "obsidian", "nebula", "cipher", "vulcan", "triton", "midas"];

// Migration map for users with old theme names in localStorage
const THEME_MIGRATION: Record<string, Theme> = {
  "light": "solara",
  "dark-simple": "obsidian",
  "dark": "nebula",
  "matrix": "cipher",
  "volcano": "vulcan",
  "ocean": "triton",
  "satoshi-gold": "midas",
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("obsidian");
  const [viewMode, setViewModeState] = useState<ViewMode>("simple");
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
    if (savedMode === "advanced" || savedMode === "expert") {
      setViewModeState("full");
      localStorage.setItem("stargate-mode", "full");
    } else if (savedMode && VIEW_MODE_ORDER.includes(savedMode as ViewMode)) {
      setViewModeState(savedMode as ViewMode);
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

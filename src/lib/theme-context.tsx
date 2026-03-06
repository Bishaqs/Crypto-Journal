"use client";

import { createContext, useContext, useState, useEffect } from "react";

export type Theme = "dark" | "light" | "dark-simple" | "matrix" | "volcano" | "ocean" | "satoshi-gold";
export type ViewMode = "simple" | "full";

export const THEMES: { value: Theme; label: string; dot: string; locked?: boolean }[] = [
  { value: "light", label: "Light", dot: "#eef0f4" },
  { value: "dark-simple", label: "Dark", dot: "#1e1e1e" },
  { value: "dark", label: "Space Purple", dot: "#8B5CF6" },
  { value: "matrix", label: "Matrix", dot: "#22c55e" },
  { value: "volcano", label: "Volcano", dot: "#f97316" },
  { value: "ocean", label: "Deep Ocean", dot: "#0ea5e9" },
  { value: "satoshi-gold", label: "Satoshi Gold", dot: "#f7931a", locked: true },
];

export const FREE_THEMES: Theme[] = ["light", "dark-simple"];
export const PRO_THEMES: Theme[] = ["dark", "matrix", "volcano", "ocean"];
export const COMPLETIONIST_THEMES: Theme[] = ["satoshi-gold"];

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
  theme: "dark",
  setTheme: () => {},
  toggleTheme: () => {},
  viewMode: "simple",
  setViewModeTo: () => {},
  toggleViewMode: () => {},
  reducedMotion: false,
  setReducedMotion: () => {},
});

const ALL_THEME_CLASSES: Theme[] = ["dark", "light", "dark-simple", "matrix", "volcano", "ocean", "satoshi-gold"];

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [viewMode, setViewModeState] = useState<ViewMode>("simple");
  const [reducedMotion, setReducedMotionState] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("stargate-theme") as Theme | null;
    if (saved && ALL_THEME_CLASSES.includes(saved)) setThemeState(saved);
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

"use client";

import { createContext, useContext, useState, useEffect } from "react";

export type Theme = "dark" | "light" | "dark-simple" | "matrix" | "volcano" | "ocean";
export type ViewMode = "simple" | "advanced" | "expert";

export const THEMES: { value: Theme; label: string; dot: string }[] = [
  { value: "light", label: "Light", dot: "#eef0f4" },
  { value: "dark-simple", label: "Dark", dot: "#1e1e1e" },
  { value: "dark", label: "Space Purple", dot: "#8B5CF6" },
  { value: "matrix", label: "Matrix", dot: "#22c55e" },
  { value: "volcano", label: "Volcano", dot: "#f97316" },
  { value: "ocean", label: "Deep Ocean", dot: "#0ea5e9" },
];

export const FREE_THEMES: Theme[] = ["light", "dark-simple"];
export const PRO_THEMES: Theme[] = ["dark", "matrix", "volcano", "ocean"];

export function isProTheme(theme: Theme): boolean {
  return PRO_THEMES.includes(theme);
}

const VIEW_MODE_ORDER: ViewMode[] = ["simple", "advanced", "expert"];

type ThemeContextType = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  viewMode: ViewMode;
  setViewModeTo: (mode: ViewMode) => void;
  toggleViewMode: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  setTheme: () => {},
  toggleTheme: () => {},
  viewMode: "simple",
  setViewModeTo: () => {},
  toggleViewMode: () => {},
});

const ALL_THEME_CLASSES: Theme[] = ["dark", "light", "dark-simple", "matrix", "volcano", "ocean"];

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [viewMode, setViewModeState] = useState<ViewMode>("simple");

  useEffect(() => {
    const saved = localStorage.getItem("stargate-theme") as Theme | null;
    if (saved && ALL_THEME_CLASSES.includes(saved)) setThemeState(saved);
    const savedMode = localStorage.getItem("stargate-mode") as string | null;
    if (savedMode && VIEW_MODE_ORDER.includes(savedMode as ViewMode)) {
      setViewModeState(savedMode as ViewMode);
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

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, viewMode, setViewModeTo, toggleViewMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

"use client";

import { createContext, useContext, useState, useEffect } from "react";

export type Theme = "dark" | "light" | "dark-simple" | "matrix" | "volcano" | "ocean";
type ViewMode = "simple" | "advanced";

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

type ThemeContextType = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  viewMode: ViewMode;
  toggleViewMode: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  setTheme: () => {},
  toggleTheme: () => {},
  viewMode: "simple",
  toggleViewMode: () => {},
});

const ALL_THEME_CLASSES: Theme[] = ["dark", "light", "dark-simple", "matrix", "volcano", "ocean"];

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [viewMode, setViewMode] = useState<ViewMode>("simple");

  useEffect(() => {
    const saved = localStorage.getItem("stargate-theme") as Theme | null;
    if (saved && ALL_THEME_CLASSES.includes(saved)) setThemeState(saved);
    const savedMode = localStorage.getItem("stargate-mode") as ViewMode | null;
    if (savedMode) setViewMode(savedMode);
  }, []);

  useEffect(() => {
    document.documentElement.classList.remove(...ALL_THEME_CLASSES);
    document.documentElement.classList.add(theme);
    localStorage.setItem("stargate-theme", theme);
  }, [theme]);

  function setTheme(t: Theme) {
    // Gate pro themes — Free users can only use light + dark-simple
    if (isProTheme(t)) {
      try {
        const raw = localStorage.getItem("stargate-subscription-cache");
        const isDemoUser = document.cookie.includes("stargate-demo=true");
        if (!isDemoUser && raw) {
          const cache = JSON.parse(raw);
          const tier = cache.data?.tier ?? "free";
          if (tier === "free") return;
        } else if (!isDemoUser && !raw) {
          return; // no subscription data = free user
        }
      } catch {}
    }
    setThemeState(t);
  }

  function toggleTheme() {
    const idx = ALL_THEME_CLASSES.indexOf(theme);
    setThemeState(ALL_THEME_CLASSES[(idx + 1) % ALL_THEME_CLASSES.length]);
  }

  function toggleViewMode() {
    const next = viewMode === "simple" ? "advanced" : "simple";
    setViewMode(next);
    localStorage.setItem("stargate-mode", next);
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, viewMode, toggleViewMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

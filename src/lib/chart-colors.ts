import { type Theme } from "./theme-context";

type ChartColors = {
  win: string;
  loss: string;
  accent: string;
  grid: string;
  tick: string;
  tooltipBg: string;
  tooltipBorder: string;
};

const CHART_COLORS: Record<Theme, ChartColors> = {
  dark: {
    win: "#A78BFA", loss: "#ef4444", accent: "#8B5CF6",
    grid: "#1f2435", tick: "#8888bb",
    tooltipBg: "rgba(20, 23, 32, 0.9)", tooltipBorder: "1px solid rgba(31, 36, 53, 0.5)",
  },
  light: {
    win: "#0096B7", loss: "#dc2626", accent: "#0096B7",
    grid: "#d5d9e2", tick: "#5a5f7a",
    tooltipBg: "rgba(247, 248, 250, 0.95)", tooltipBorder: "1px solid rgba(213, 217, 226, 0.5)",
  },
  "dark-simple": {
    win: "#4ade80", loss: "#f87171", accent: "#60a5fa",
    grid: "#2a2a2a", tick: "#a1a1aa",
    tooltipBg: "rgba(24, 24, 27, 0.95)", tooltipBorder: "1px solid rgba(63, 63, 70, 0.5)",
  },
  matrix: {
    win: "#86efac", loss: "#ef4444", accent: "#22c55e",
    grid: "#0a3018", tick: "#7acc8a",
    tooltipBg: "rgba(0, 5, 0, 0.9)", tooltipBorder: "1px solid rgba(34, 197, 94, 0.2)",
  },
  volcano: {
    win: "#fbbf24", loss: "#ef4444", accent: "#f97316",
    grid: "#2d1810", tick: "#b08070",
    tooltipBg: "rgba(10, 5, 4, 0.9)", tooltipBorder: "1px solid rgba(249, 115, 22, 0.2)",
  },
  ocean: {
    win: "#7dd3fc", loss: "#ef4444", accent: "#0ea5e9",
    grid: "#0f2040", tick: "#6ab0cc",
    tooltipBg: "rgba(2, 8, 23, 0.9)", tooltipBorder: "1px solid rgba(14, 165, 233, 0.2)",
  },
};

export function getChartColors(theme: Theme) {
  return CHART_COLORS[theme] ?? CHART_COLORS.dark;
}

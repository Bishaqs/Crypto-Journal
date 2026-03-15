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
  nebula: {
    win: "#A78BFA", loss: "#ef4444", accent: "#8B5CF6",
    grid: "#1f2435", tick: "#8888bb",
    tooltipBg: "rgba(20, 23, 32, 0.9)", tooltipBorder: "1px solid rgba(31, 36, 53, 0.5)",
  },
  solara: {
    win: "#059669", loss: "#dc2626", accent: "#c2410c",
    grid: "rgba(0, 0, 0, 0.04)", tick: "#7a756d",
    tooltipBg: "rgba(253, 252, 251, 0.95)", tooltipBorder: "1px solid rgba(0, 0, 0, 0.08)",
  },
  obsidian: {
    win: "#34d399", loss: "#fb7185", accent: "#67e8f9",
    grid: "rgba(255, 255, 255, 0.03)", tick: "#a1a1aa",
    tooltipBg: "rgba(20, 20, 24, 0.95)", tooltipBorder: "1px solid rgba(255, 255, 255, 0.06)",
  },
  cipher: {
    win: "#86efac", loss: "#ef4444", accent: "#22c55e",
    grid: "#0a3018", tick: "#7acc8a",
    tooltipBg: "rgba(0, 5, 0, 0.9)", tooltipBorder: "1px solid rgba(34, 197, 94, 0.2)",
  },
  vulcan: {
    win: "#fbbf24", loss: "#ef4444", accent: "#f97316",
    grid: "#2d1810", tick: "#b08070",
    tooltipBg: "rgba(10, 5, 4, 0.9)", tooltipBorder: "1px solid rgba(249, 115, 22, 0.2)",
  },
  triton: {
    win: "#7dd3fc", loss: "#ef4444", accent: "#0ea5e9",
    grid: "#0f2040", tick: "#6ab0cc",
    tooltipBg: "rgba(2, 8, 23, 0.9)", tooltipBorder: "1px solid rgba(14, 165, 233, 0.2)",
  },
  satoshi: {
    win: "#ffd700", loss: "#ef4444", accent: "#f7931a",
    grid: "#3d2e12", tick: "#b8965a",
    tooltipBg: "rgba(10, 8, 6, 0.9)", tooltipBorder: "1px solid rgba(247, 147, 26, 0.2)",
  },
  synthwave: {
    win: "#00ffcc", loss: "#ff3366", accent: "#ff2d95",
    grid: "rgba(255, 45, 149, 0.08)", tick: "#b8a0d4",
    tooltipBg: "rgba(15, 5, 30, 0.9)", tooltipBorder: "1px solid rgba(255, 45, 149, 0.2)",
  },
  pangaea: {
    win: "#34d399", loss: "#ef4444", accent: "#10b981",
    grid: "#1a2e1a", tick: "#7acc8a",
    tooltipBg: "rgba(10, 20, 10, 0.9)", tooltipBorder: "1px solid rgba(16, 185, 129, 0.2)",
  },
};

export function getChartColors(theme: Theme) {
  return CHART_COLORS[theme] ?? CHART_COLORS.nebula;
}

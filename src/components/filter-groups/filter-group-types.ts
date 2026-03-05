import type { Trade, DashboardStats } from "@/lib/types";

export interface FilterGroupConfig {
  id: string;
  name: string;
  color: string; // hex
  symbols: string[]; // empty = all
  tags: string[]; // empty = all
  sectors: string[]; // empty = all
  assetTypes: ("cex" | "dex")[]; // empty = all
  position: "both" | "long" | "short";
  duration: "both" | "intraday" | "multiday";
  result: "both" | "win" | "loss";
  pnlType: "gross" | "net";
  dateRange: { start: string; end: string } | null; // null = all time
  pnlRange: { min: number | null; max: number | null } | null; // null = no limit
}

export interface FilterGroupResult {
  config: FilterGroupConfig;
  trades: Trade[];
  stats: DashboardStats;
}

export const DEFAULT_COLORS = ["#22d3ee", "#a78bfa", "#f97316", "#34d399"];

export const MAX_GROUPS = 4;

export function createDefaultGroup(index: number): FilterGroupConfig {
  return {
    id: `group-${Date.now()}-${index}`,
    name: `Group ${index + 1}`,
    color: DEFAULT_COLORS[index % DEFAULT_COLORS.length],
    symbols: [],
    tags: [],
    sectors: [],
    assetTypes: [],
    position: "both",
    duration: "both",
    result: "both",
    pnlType: "net",
    dateRange: null,
    pnlRange: null,
  };
}

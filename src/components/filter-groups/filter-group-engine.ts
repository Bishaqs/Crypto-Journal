import type { Trade } from "@/lib/types";
import { calculateTradePnl, calculateStats } from "@/lib/calculations";
import type { FilterGroupConfig, FilterGroupResult } from "./filter-group-types";

function getPnl(trade: Trade, pnlType: "gross" | "net"): number {
  const netPnl = trade.pnl ?? calculateTradePnl(trade) ?? 0;
  if (pnlType === "net") return netPnl;
  // Gross = net P&L + fees (add fees back)
  return netPnl + trade.fees;
}

export function applyFilters(allTrades: Trade[], config: FilterGroupConfig): Trade[] {
  return allTrades.filter((trade) => {
    // Must be closed
    if (!trade.close_timestamp || trade.exit_price === null) return false;

    // Symbol filter (case-insensitive)
    if (config.symbols.length > 0) {
      const upper = config.symbols.map((s) => s.toUpperCase());
      if (!upper.includes(trade.symbol.toUpperCase())) return false;
    }

    // Tags filter (trade must have at least one matching tag)
    if (config.tags.length > 0) {
      const lower = config.tags.map((t) => t.toLowerCase());
      if (!trade.tags?.some((t) => lower.includes(t.toLowerCase()))) return false;
    }

    // Sector filter
    if (config.sectors.length > 0) {
      if (!trade.sector || !config.sectors.includes(trade.sector)) return false;
    }

    // Asset type (trade_source) filter
    if (config.assetTypes.length > 0) {
      if (!config.assetTypes.includes(trade.trade_source)) return false;
    }

    // Position filter
    if (config.position !== "both" && trade.position !== config.position) return false;

    // Duration filter (intraday = opened+closed same calendar day)
    if (config.duration !== "both") {
      const openDay = trade.open_timestamp.split("T")[0];
      const closeDay = trade.close_timestamp.split("T")[0];
      const isIntraday = openDay === closeDay;
      if (config.duration === "intraday" && !isIntraday) return false;
      if (config.duration === "multiday" && isIntraday) return false;
    }

    // Result filter
    if (config.result !== "both") {
      const pnl = getPnl(trade, config.pnlType);
      if (config.result === "win" && pnl <= 0) return false;
      if (config.result === "loss" && pnl >= 0) return false;
    }

    // Date range filter
    if (config.dateRange) {
      const tradeDate = trade.open_timestamp.split("T")[0];
      if (tradeDate < config.dateRange.start || tradeDate > config.dateRange.end) return false;
    }

    // PnL range filter
    if (config.pnlRange) {
      const pnl = getPnl(trade, config.pnlType);
      if (config.pnlRange.min !== null && pnl < config.pnlRange.min) return false;
      if (config.pnlRange.max !== null && pnl > config.pnlRange.max) return false;
    }

    return true;
  });
}

export function computeGroupResults(
  allTrades: Trade[],
  configs: FilterGroupConfig[],
): FilterGroupResult[] {
  return configs.map((config) => {
    const trades = applyFilters(allTrades, config);
    const stats = calculateStats(trades);
    return { config, trades, stats };
  });
}

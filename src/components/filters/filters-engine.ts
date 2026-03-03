import type { Trade } from "@/lib/types";
import { calculateTradePnl, calculateDailyPnl } from "@/lib/calculations";
import type { TradeFilterConfig } from "./filters-types";

/**
 * Format seconds into human-readable duration: "3D 4H 5M 30S"
 */
export function formatDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) return "0S";
  const d = Math.floor(totalSeconds / 86400);
  const h = Math.floor((totalSeconds % 86400) / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  const parts: string[] = [];
  if (d > 0) parts.push(`${d}D`);
  if (h > 0) parts.push(`${h}H`);
  if (m > 0) parts.push(`${m}M`);
  if (s > 0) parts.push(`${s}S`);
  return parts.join(" ");
}

/**
 * Parse a duration string like "3D 4H 5M 30S" into total seconds.
 * Handles partial inputs like "4H", "30M", "1D 12H".
 */
export function parseDuration(input: string): number {
  const trimmed = input.trim().toUpperCase();
  if (!trimmed) return 0;
  let total = 0;
  const dayMatch = trimmed.match(/(\d+)\s*D/);
  const hourMatch = trimmed.match(/(\d+)\s*H/);
  const minMatch = trimmed.match(/(\d+)\s*M/);
  const secMatch = trimmed.match(/(\d+)\s*S/);
  if (dayMatch) total += parseInt(dayMatch[1]) * 86400;
  if (hourMatch) total += parseInt(hourMatch[1]) * 3600;
  if (minMatch) total += parseInt(minMatch[1]) * 60;
  if (secMatch) total += parseInt(secMatch[1]);
  return total;
}

/**
 * Compute hold time in seconds for a trade.
 */
function getHoldTimeSeconds(trade: Trade): number {
  if (!trade.close_timestamp) return 0;
  return (
    (new Date(trade.close_timestamp).getTime() -
      new Date(trade.open_timestamp).getTime()) /
    1000
  );
}

/**
 * Apply all filter criteria to a list of trades.
 * Returns only closed trades that match every active filter.
 */
export function applyTradeFilters(
  allTrades: Trade[],
  config: TradeFilterConfig
): Trade[] {
  // Pre-filter to closed trades
  let trades = allTrades.filter(
    (t) => t.close_timestamp !== null && t.exit_price !== null
  );

  // Day Result: need daily P&L map to determine if a trading day was win/loss
  if (config.dayResult !== "both") {
    const dailyPnl = calculateDailyPnl(trades);
    const winDays = new Set<string>();
    const lossDays = new Set<string>();
    for (const d of dailyPnl) {
      if (d.pnl > 0) winDays.add(d.date);
      else if (d.pnl < 0) lossDays.add(d.date);
    }
    trades = trades.filter((t) => {
      const day = t.close_timestamp!.split("T")[0];
      if (config.dayResult === "win") return winDays.has(day);
      return lossDays.has(day);
    });
  }

  // Date Range
  if (config.dateRange) {
    trades = trades.filter((t) => {
      const d = t.close_timestamp!.split("T")[0];
      return d >= config.dateRange!.start && d <= config.dateRange!.end;
    });
  }

  // PnL Range
  if (config.pnlRange) {
    trades = trades.filter((t) => {
      const pnl = t.pnl ?? calculateTradePnl(t) ?? 0;
      if (config.pnlRange!.min !== null && pnl < config.pnlRange!.min)
        return false;
      if (config.pnlRange!.max !== null && pnl > config.pnlRange!.max)
        return false;
      return true;
    });
  }

  // Price Range (entry price)
  if (config.priceRange) {
    trades = trades.filter((t) => {
      if (
        config.priceRange!.min !== null &&
        t.entry_price < config.priceRange!.min
      )
        return false;
      if (
        config.priceRange!.max !== null &&
        t.entry_price > config.priceRange!.max
      )
        return false;
      return true;
    });
  }

  // Volume Range (notional = quantity * entry_price)
  if (config.volumeRange) {
    trades = trades.filter((t) => {
      const notional = t.quantity * t.entry_price;
      if (config.volumeRange!.min !== null && notional < config.volumeRange!.min)
        return false;
      if (config.volumeRange!.max !== null && notional > config.volumeRange!.max)
        return false;
      return true;
    });
  }

  // Duration Range
  if (config.durationRange) {
    trades = trades.filter((t) => {
      const holdSec = getHoldTimeSeconds(t);
      if (
        config.durationRange!.minSeconds !== null &&
        holdSec < config.durationRange!.minSeconds
      )
        return false;
      if (
        config.durationRange!.maxSeconds !== null &&
        holdSec > config.durationRange!.maxSeconds
      )
        return false;
      return true;
    });
  }

  // Year filter
  if (config.years.length > 0) {
    trades = trades.filter((t) => {
      const year = new Date(t.close_timestamp!).getFullYear();
      return config.years.includes(year);
    });
  }

  // Month filter
  if (config.months.length > 0) {
    trades = trades.filter((t) => {
      const month = new Date(t.close_timestamp!).getMonth();
      return config.months.includes(month);
    });
  }

  // Day of Week filter
  if (config.daysOfWeek.length > 0) {
    trades = trades.filter((t) => {
      const dow = new Date(t.close_timestamp!).getDay();
      return config.daysOfWeek.includes(dow);
    });
  }

  // Day of Month range
  if (config.dayOfMonthRange) {
    trades = trades.filter((t) => {
      const dom = new Date(t.close_timestamp!).getDate();
      return (
        dom >= config.dayOfMonthRange!.min &&
        dom <= config.dayOfMonthRange!.max
      );
    });
  }

  // Time of Day range (based on open_timestamp)
  if (config.timeOfDayRange) {
    trades = trades.filter((t) => {
      const d = new Date(t.open_timestamp);
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      const time = `${hh}:${mm}`;
      return (
        time >= config.timeOfDayRange!.start &&
        time <= config.timeOfDayRange!.end
      );
    });
  }

  return trades;
}

import { Trade } from "./types";
import { calculateTradePnl } from "./calculations";

/* ────────────────────────────────────────────────────────────────── */
/*  Types                                                             */
/* ────────────────────────────────────────────────────────────────── */

export interface TradeExitAnalysis {
  id: string;
  symbol: string;
  position: "long" | "short";
  pnl: number;
  holdHours: number;
  pnlPerHour: number;
  priceMovePct: number; // % move from entry to exit
  exitHour: number; // 0-23 hour of day the trade was closed
  exitDayOfWeek: number; // 0=Sun, 6=Sat
  isWin: boolean;
  closedSameDay: boolean;
}

export interface HoldDurationBucket {
  label: string;
  minHours: number;
  maxHours: number;
  count: number;
  wins: number;
  totalPnl: number;
  avgPnl: number;
  winRate: number;
}

export interface ExitTimeSlot {
  hour: number;
  count: number;
  wins: number;
  totalPnl: number;
  avgPnl: number;
  winRate: number;
}

export interface ExitDaySummary {
  day: string;
  dayIndex: number;
  count: number;
  wins: number;
  totalPnl: number;
  avgPnl: number;
  winRate: number;
}

export interface EfficiencyBucket {
  label: string;
  count: number;
  avgPnl: number;
  avgHoldHours: number;
  avgPnlPerHour: number;
}

/* ────────────────────────────────────────────────────────────────── */
/*  Core analysis                                                     */
/* ────────────────────────────────────────────────────────────────── */

export function analyzeExits(trades: Trade[]): TradeExitAnalysis[] {
  return trades
    .filter(t => t.exit_price !== null && t.close_timestamp !== null)
    .map(t => {
      const pnl = t.pnl ?? calculateTradePnl(t) ?? 0;
      const openMs = new Date(t.open_timestamp).getTime();
      const closeMs = new Date(t.close_timestamp!).getTime();
      const holdHours = Math.max((closeMs - openMs) / (1000 * 60 * 60), 0.01);
      const closeDate = new Date(t.close_timestamp!);
      const openDate = new Date(t.open_timestamp);
      const direction = t.position === "long" ? 1 : -1;
      const priceMovePct = ((t.exit_price! - t.entry_price) / t.entry_price) * 100 * direction;

      return {
        id: t.id,
        symbol: t.symbol,
        position: t.position,
        pnl,
        holdHours,
        pnlPerHour: pnl / holdHours,
        priceMovePct,
        exitHour: closeDate.getHours(),
        exitDayOfWeek: closeDate.getDay(),
        isWin: pnl > 0,
        closedSameDay: openDate.toDateString() === closeDate.toDateString(),
      };
    })
    .sort((a, b) => b.pnl - a.pnl);
}

/* ────────────────────────────────────────────────────────────────── */
/*  Best Exit: PnL distribution                                       */
/* ────────────────────────────────────────────────────────────────── */

export function bestExitPnlChart(exits: TradeExitAnalysis[]) {
  // Top 20 trades by |PnL| for the "left on table" chart
  const sorted = [...exits].sort((a, b) => Math.abs(b.pnl) - Math.abs(a.pnl)).slice(0, 20);
  return sorted.map(e => ({
    symbol: e.symbol,
    pnl: e.pnl,
    movePct: e.priceMovePct,
    holdHours: e.holdHours,
  }));
}

/* ────────────────────────────────────────────────────────────────── */
/*  Best Exit: Efficiency (PnL per hour)                              */
/* ────────────────────────────────────────────────────────────────── */

export function exitEfficiencyDistribution(exits: TradeExitAnalysis[]): EfficiencyBucket[] {
  const buckets: { label: string; filter: (e: TradeExitAnalysis) => boolean }[] = [
    { label: "Very Efficient", filter: e => e.pnlPerHour > 0 && e.holdHours < 1 },
    { label: "Efficient", filter: e => e.pnlPerHour > 0 && e.holdHours >= 1 && e.holdHours < 4 },
    { label: "Moderate", filter: e => e.pnlPerHour > 0 && e.holdHours >= 4 },
    { label: "Break-Even", filter: e => Math.abs(e.pnlPerHour) < 0.01 },
    { label: "Inefficient", filter: e => e.pnlPerHour < 0 && e.holdHours < 4 },
    { label: "Very Inefficient", filter: e => e.pnlPerHour < 0 && e.holdHours >= 4 },
  ];

  return buckets.map(b => {
    const matching = exits.filter(b.filter);
    const count = matching.length;
    if (count === 0) return { label: b.label, count: 0, avgPnl: 0, avgHoldHours: 0, avgPnlPerHour: 0 };
    return {
      label: b.label,
      count,
      avgPnl: matching.reduce((s, e) => s + e.pnl, 0) / count,
      avgHoldHours: matching.reduce((s, e) => s + e.holdHours, 0) / count,
      avgPnlPerHour: matching.reduce((s, e) => s + e.pnlPerHour, 0) / count,
    };
  }).filter(b => b.count > 0);
}

/* ────────────────────────────────────────────────────────────────── */
/*  Best Exit: Time analysis                                          */
/* ────────────────────────────────────────────────────────────────── */

export function exitTimeAnalysis(exits: TradeExitAnalysis[]): ExitTimeSlot[] {
  const hourMap = new Map<number, { count: number; wins: number; pnl: number }>();
  for (const e of exits) {
    const existing = hourMap.get(e.exitHour) ?? { count: 0, wins: 0, pnl: 0 };
    hourMap.set(e.exitHour, {
      count: existing.count + 1,
      wins: existing.wins + (e.isWin ? 1 : 0),
      pnl: existing.pnl + e.pnl,
    });
  }
  return Array.from(hourMap.entries())
    .map(([hour, d]) => ({
      hour,
      count: d.count,
      wins: d.wins,
      totalPnl: d.pnl,
      avgPnl: d.pnl / d.count,
      winRate: (d.wins / d.count) * 100,
    }))
    .sort((a, b) => a.hour - b.hour);
}

/* ────────────────────────────────────────────────────────────────── */
/*  EOD Exit: Same-day vs overnight comparison                        */
/* ────────────────────────────────────────────────────────────────── */

export function eodExitComparison(exits: TradeExitAnalysis[]) {
  const sameDay = exits.filter(e => e.closedSameDay);
  const overnight = exits.filter(e => !e.closedSameDay);

  function summarize(list: TradeExitAnalysis[]) {
    if (list.length === 0) return { count: 0, winRate: 0, avgPnl: 0, totalPnl: 0, avgHoldHours: 0 };
    const wins = list.filter(e => e.isWin).length;
    const totalPnl = list.reduce((s, e) => s + e.pnl, 0);
    return {
      count: list.length,
      winRate: (wins / list.length) * 100,
      avgPnl: totalPnl / list.length,
      totalPnl,
      avgHoldHours: list.reduce((s, e) => s + e.holdHours, 0) / list.length,
    };
  }

  return {
    sameDay: summarize(sameDay),
    overnight: summarize(overnight),
    sameDayTrades: sameDay,
    overnightTrades: overnight,
  };
}

/* ────────────────────────────────────────────────────────────────── */
/*  EOD Exit: Efficiency by exit day of week                          */
/* ────────────────────────────────────────────────────────────────── */

export function exitByDayOfWeek(exits: TradeExitAnalysis[]): ExitDaySummary[] {
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayMap = new Map<number, { count: number; wins: number; pnl: number }>();
  for (const e of exits) {
    const existing = dayMap.get(e.exitDayOfWeek) ?? { count: 0, wins: 0, pnl: 0 };
    dayMap.set(e.exitDayOfWeek, {
      count: existing.count + 1,
      wins: existing.wins + (e.isWin ? 1 : 0),
      pnl: existing.pnl + e.pnl,
    });
  }
  return dayNames.map((day, i) => {
    const d = dayMap.get(i);
    if (!d || d.count === 0) return { day, dayIndex: i, count: 0, wins: 0, totalPnl: 0, avgPnl: 0, winRate: 0 };
    return {
      day,
      dayIndex: i,
      count: d.count,
      wins: d.wins,
      totalPnl: d.pnl,
      avgPnl: d.pnl / d.count,
      winRate: (d.wins / d.count) * 100,
    };
  }).filter(d => d.count > 0);
}

/* ────────────────────────────────────────────────────────────────── */
/*  Multi-Timeframe: Hold duration buckets                            */
/* ────────────────────────────────────────────────────────────────── */

export function holdDurationAnalysis(exits: TradeExitAnalysis[]): HoldDurationBucket[] {
  const buckets: { label: string; min: number; max: number }[] = [
    { label: "< 15m", min: 0, max: 0.25 },
    { label: "15m-1h", min: 0.25, max: 1 },
    { label: "1h-4h", min: 1, max: 4 },
    { label: "4h-12h", min: 4, max: 12 },
    { label: "12h-24h", min: 12, max: 24 },
    { label: "1-3 days", min: 24, max: 72 },
    { label: "3-7 days", min: 72, max: 168 },
    { label: "1-4 weeks", min: 168, max: 672 },
    { label: "1+ month", min: 672, max: Infinity },
  ];

  return buckets.map(b => {
    const matching = exits.filter(e => e.holdHours >= b.min && e.holdHours < b.max);
    const count = matching.length;
    if (count === 0) return { label: b.label, minHours: b.min, maxHours: b.max, count: 0, wins: 0, totalPnl: 0, avgPnl: 0, winRate: 0 };
    const wins = matching.filter(e => e.isWin).length;
    const totalPnl = matching.reduce((s, e) => s + e.pnl, 0);
    return {
      label: b.label,
      minHours: b.min,
      maxHours: b.max,
      count,
      wins,
      totalPnl,
      avgPnl: totalPnl / count,
      winRate: (wins / count) * 100,
    };
  }).filter(b => b.count > 0);
}

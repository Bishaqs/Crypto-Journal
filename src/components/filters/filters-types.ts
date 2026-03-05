export interface TradeFilterConfig {
  dayResult: "both" | "win" | "loss";
  dateRange: { start: string; end: string } | null;
  pnlRange: { min: number | null; max: number | null } | null;
  priceRange: { min: number | null; max: number | null } | null;
  volumeRange: { min: number | null; max: number | null } | null;
  durationRange: { minSeconds: number | null; maxSeconds: number | null } | null;
  years: number[];
  months: number[]; // 0-11
  daysOfWeek: number[]; // 0=Sun ... 6=Sat
  dayOfMonthRange: { min: number; max: number } | null;
  timeOfDayRange: { start: string; end: string } | null; // "HH:MM"
}

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const DAY_NAMES = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

export function createDefaultFilter(): TradeFilterConfig {
  return {
    dayResult: "both",
    dateRange: null,
    pnlRange: null,
    priceRange: null,
    volumeRange: null,
    durationRange: null,
    years: [],
    months: [],
    daysOfWeek: [],
    dayOfMonthRange: null,
    timeOfDayRange: null,
  };
}

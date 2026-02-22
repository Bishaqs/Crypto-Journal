// These are the TypeScript types that define the shape of your data.
// Think of them as contracts — every trade, note, and snapshot MUST match these shapes.

export type Trade = {
  id: string;
  user_id: string;
  symbol: string;
  position: "long" | "short";
  entry_price: number;
  exit_price: number | null;
  quantity: number;
  fees: number;
  open_timestamp: string;
  close_timestamp: string | null;
  notes: string | null;
  tags: string[];
  pnl: number | null;
  // Psychology fields
  emotion: string | null;
  confidence: number | null;
  setup_type: string | null;
  process_score: number | null;
  checklist: Record<string, boolean> | null;
  review: Record<string, string> | null;
  created_at: string;
};

export type JournalNote = {
  id: string;
  user_id: string;
  title: string | null;
  content: string;
  tags: string[];
  trade_id: string | null;
  created_at: string;
  updated_at: string;
};

export type AccountSnapshot = {
  id: string;
  user_id: string;
  date: string;
  balance: number;
  realized_pnl: number;
  unrealized_pnl: number;
  created_at: string;
};

export type DailyCheckin = {
  id: string;
  user_id: string;
  date: string;
  mood: number;
  energy: number | null;
  focus: string | null;
  traffic_light: "green" | "yellow" | "red";
  created_at: string;
};

export type UserStreak = {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
  grace_days_used: number;
  updated_at: string;
};

export type BehavioralLog = {
  id: string;
  user_id: string;
  emotion: string;
  intensity: number; // 1-5
  trigger: string | null;
  trigger_detail: string | null;
  physical_state: string[];
  biases: string[];
  traffic_light: "green" | "yellow" | "red";
  note: string | null;
  created_at: string;
};

// Stats derived from trades — these are calculated, not stored
export type DashboardStats = {
  totalTrades: number;
  wins: number;
  losses: number;
  breakeven: number;
  winRate: number;
  avgTradePnl: number;
  profitFactor: number;
  closedPnl: number;
  unrealizedPnl: number;
  totalRealizedPnl: number;
};

// For the P&L calendar and charts
export type DailyPnl = {
  date: string;
  pnl: number;
  tradeCount: number;
};

// Advanced statistics for the full statistics page
export type AdvancedStats = {
  // Core (already on DashboardStats, but recalculated here for consistency)
  totalTrades: number;
  winRate: number;
  profitFactor: number;
  closedPnl: number;
  // Size metrics
  avgWinner: number;
  avgLoser: number;
  largestWin: number;
  largestLoss: number;
  // Risk metrics
  maxDrawdown: number;
  maxDrawdownPct: number;
  maxDrawdownDuration: number; // days
  sharpeRatio: number;
  expectancy: number; // avg R-multiple
  // Timing
  avgHoldTimeWinners: number; // hours
  avgHoldTimeLosers: number; // hours
  // Streaks
  bestWinStreak: number;
  worstLoseStreak: number;
  currentStreak: { type: "win" | "loss" | "none"; count: number };
  // By day of week
  pnlByDayOfWeek: { day: string; pnl: number; count: number; winRate: number }[];
  // By hour
  pnlByHour: { hour: number; pnl: number; count: number; winRate: number }[];
};

// Behavioral insight for the correlation dashboard
export type BehavioralInsight = {
  label: string;
  description: string;
  value: string;
  sentiment: "positive" | "negative" | "neutral";
};

// Weekly report data (generated from trades, not stored)
export type WeeklyReport = {
  weekStart: string; // ISO date string (Monday)
  weekEnd: string; // ISO date string (Sunday)
  totalPnl: number;
  tradeCount: number;
  winRate: number;
  wins: number;
  losses: number;
  bestTrade: { symbol: string; pnl: number; processScore: number | null; date: string } | null;
  worstTrade: { symbol: string; pnl: number; processScore: number | null; date: string } | null;
  bestProcessTrade: { symbol: string; pnl: number; processScore: number; date: string } | null;
  worstProcessTrade: { symbol: string; pnl: number; processScore: number; date: string } | null;
  avgProcessScore: number | null;
  emotionBreakdown: { emotion: string; count: number; pnl: number }[];
  ruleCompliance: number | null; // percentage of trades where checklist was all true
  greenDays: number;
  redDays: number;
  tradingDays: number;
};

// Daily plan for pre-market + EOD review
export type DailyPlan = {
  id: string;
  user_id: string;
  date: string;
  watchlist: string[];
  max_trades: number | null;
  max_loss: number | null;
  session_goal: string | null;
  notes: string | null;
  eod_review: string | null;
  created_at: string;
};

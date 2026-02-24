export type EventType = "FOMC" | "CPI" | "NFP" | "PPI" | "GDP" | "PCE" | "UNEMP";

export interface MacroEvent {
  date: string; // YYYY-MM-DD
  name: string;
  type: EventType;
  impact: "high" | "medium";
  description: string;
  previous?: string;
  forecast?: string;
}

export interface EventMeta {
  relevantSymbol: string;
  chartExplanation: string;
  whatItMeasures: string;
  whyItMatters: string;
  keyLevels: string[];
}

export const EVENT_META: Record<EventType, EventMeta> = {
  FOMC: {
    relevantSymbol: "PEPPERSTONE:USDX",
    chartExplanation: "Dollar Index reacts directly to Fed rate decisions and forward guidance.",
    whatItMeasures: "The target range for the federal funds rate, set by the Federal Reserve 8 times per year.",
    whyItMatters: "Rate decisions directly move bonds, USD, and equities. The dot plot and Powell's press conference drive volatility for days.",
    keyLevels: [
      "Rate hold = priced in, watch forward guidance",
      "Hawkish surprise (higher dots) = USD up, stocks down",
      "Dovish surprise (rate cut signal) = USD down, stocks up",
      "Watch the dot plot median for 2026 rate path",
    ],
  },
  CPI: {
    relevantSymbol: "AMEX:TLT",
    chartExplanation: "Treasury bond prices (TLT) move inversely to yields — hot CPI drops bonds, cool CPI rallies them.",
    whatItMeasures: "Monthly change in prices paid by consumers for goods and services. Core CPI excludes volatile food & energy.",
    whyItMatters: "Hottest single-day volatility catalyst. Above-consensus = rate hike fears, below = rate cut hopes. Core CPI matters more than headline.",
    keyLevels: [
      "Above 3.0% YoY = persistent inflation, hawkish Fed",
      "2.0-3.0% YoY = disinflation trend, market-friendly",
      "Below 2.0% YoY = deflation risk, strong rate cut signal",
      "MoM > 0.3% = re-acceleration warning",
    ],
  },
  NFP: {
    relevantSymbol: "AMEX:SPY",
    chartExplanation: "S&P 500 swings on jobs data — strong jobs = hawkish Fed pressure on stocks.",
    whatItMeasures: "Total non-farm jobs added or lost in the US economy during the prior month. Gold standard for labor market health.",
    whyItMatters: "Strong jobs = strong economy but keeps Fed hawkish. Weak jobs = recession fear but opens door to rate cuts. Revisions to prior months move markets too.",
    keyLevels: [
      "Above 200K = robust hiring, hawkish signal",
      "100-200K = healthy, sustainable pace",
      "Below 100K = slowdown concerns, dovish signal",
      "Negative = recession alarm, emergency cut territory",
    ],
  },
  PPI: {
    relevantSymbol: "PEPPERSTONE:USDX",
    chartExplanation: "Dollar strengthens on hot PPI as it signals future consumer inflation.",
    whatItMeasures: "Wholesale prices that producers pay — a leading indicator of future consumer inflation (CPI).",
    whyItMatters: "PPI rises hit corporate margins first, then get passed to consumers. It previews CPI direction 1-2 months ahead.",
    keyLevels: [
      "PPI rising + CPI flat = margin squeeze incoming",
      "PPI falling = disinflation pipeline building",
      "Core PPI > 3% YoY = inflationary pressure",
      "Watch PPI-CPI spread for margin pressure signals",
    ],
  },
  GDP: {
    relevantSymbol: "AMEX:SPY",
    chartExplanation: "Stock market prices in economic growth expectations 6-12 months ahead.",
    whatItMeasures: "Total value of goods and services produced in the US. Advance estimate (1st of 3 readings) moves markets most.",
    whyItMatters: "The broadest measure of economic health. Two consecutive negative quarters = technical recession. Markets price growth expectations 6-12 months forward.",
    keyLevels: [
      "Above 3.0% = strong expansion",
      "1.5-3.0% = trend growth, Goldilocks",
      "0-1.5% = below trend, slowdown risk",
      "Negative = contraction, recession probability rising",
    ],
  },
  PCE: {
    relevantSymbol: "AMEX:TLT",
    chartExplanation: "Treasury bond prices (TLT) react to PCE — the Fed's actual 2% inflation target drives rate decisions.",
    whatItMeasures: "The Fed's preferred inflation gauge. Core PCE strips food & energy. This is THE number the Fed targets at 2.0%.",
    whyItMatters: "More important than CPI for policy decisions. The Fed explicitly targets Core PCE at 2%. Deviation from 2% directly shifts rate expectations.",
    keyLevels: [
      "Above 2.8% = too hot, rate cuts delayed",
      "2.0-2.5% = Fed comfort zone, cuts on table",
      "Below 2.0% = mission accomplished, aggressive cuts possible",
      "MoM > 0.3% = re-acceleration risk",
    ],
  },
  UNEMP: {
    relevantSymbol: "AMEX:SPY",
    chartExplanation: "Stocks react to labor market signals — rising unemployment = recession risk.",
    whatItMeasures: "Percentage of the labor force actively seeking but unable to find work. Released alongside NFP.",
    whyItMatters: "The Sahm Rule: unemployment rising 0.5% from its 12-month low has predicted every recession since 1970. Fed watches this for dual mandate.",
    keyLevels: [
      "Below 4.0% = tight labor market, wage pressure",
      "4.0-4.5% = healthy equilibrium range",
      "Above 4.5% = labor market weakening",
      "Sahm Rule trigger (0.5% rise from low) = recession signal",
    ],
  },
};

const DESC: Record<EventType, string> = {
  FOMC: "The Federal Open Market Committee sets the federal funds rate. Rate hikes strengthen USD and pressure equities; cuts do the opposite. Markets move on the dot plot and Powell's press conference.",
  CPI: "Consumer Price Index measures inflation at the consumer level. Higher-than-expected CPI signals persistent inflation, raising odds of rate hikes. Core CPI (excluding food & energy) is watched most closely.",
  NFP: "Non-Farm Payrolls measure monthly job creation. Strong jobs data = strong economy but may push the Fed to stay hawkish. Weak data = recession fears but potential for rate cuts.",
  PPI: "Producer Price Index tracks wholesale inflation before it reaches consumers. Rising PPI often leads CPI higher. It's an early signal of future consumer inflation pressure.",
  GDP: "Gross Domestic Product measures total economic output. Advance estimate moves markets most. Two consecutive negative quarters = technical recession.",
  PCE: "Personal Consumption Expenditures is the Fed's preferred inflation gauge. Core PCE (excluding food & energy) is what the Fed targets at 2%. Often more important than CPI for policy decisions.",
  UNEMP: "The unemployment rate shows the percentage of the labor force without jobs. Released alongside NFP. Rising unemployment signals economic weakness; falling unemployment signals strength.",
};

// Source: Federal Reserve, BLS, BEA — publicly announced schedules
const MACRO_EVENTS: MacroEvent[] = [
  // ─── 2025 FOMC ───
  { date: "2025-01-29", name: "FOMC Rate Decision", type: "FOMC", impact: "high", description: DESC.FOMC },
  { date: "2025-03-19", name: "FOMC Rate Decision", type: "FOMC", impact: "high", description: DESC.FOMC },
  { date: "2025-05-07", name: "FOMC Rate Decision", type: "FOMC", impact: "high", description: DESC.FOMC },
  { date: "2025-06-18", name: "FOMC Rate Decision", type: "FOMC", impact: "high", description: DESC.FOMC },
  { date: "2025-07-30", name: "FOMC Rate Decision", type: "FOMC", impact: "high", description: DESC.FOMC },
  { date: "2025-09-17", name: "FOMC Rate Decision", type: "FOMC", impact: "high", description: DESC.FOMC },
  { date: "2025-10-29", name: "FOMC Rate Decision", type: "FOMC", impact: "high", description: DESC.FOMC },
  { date: "2025-12-17", name: "FOMC Rate Decision", type: "FOMC", impact: "high", description: DESC.FOMC },
  // 2026 FOMC
  { date: "2026-01-28", name: "FOMC Rate Decision", type: "FOMC", impact: "high", description: DESC.FOMC },
  { date: "2026-03-18", name: "FOMC Rate Decision", type: "FOMC", impact: "high", description: DESC.FOMC, previous: "4.25-4.50%" },
  { date: "2026-05-06", name: "FOMC Rate Decision", type: "FOMC", impact: "high", description: DESC.FOMC },
  { date: "2026-06-17", name: "FOMC Rate Decision", type: "FOMC", impact: "high", description: DESC.FOMC },
  { date: "2026-07-29", name: "FOMC Rate Decision", type: "FOMC", impact: "high", description: DESC.FOMC },
  { date: "2026-09-16", name: "FOMC Rate Decision", type: "FOMC", impact: "high", description: DESC.FOMC },
  { date: "2026-10-28", name: "FOMC Rate Decision", type: "FOMC", impact: "high", description: DESC.FOMC },
  { date: "2026-12-16", name: "FOMC Rate Decision", type: "FOMC", impact: "high", description: DESC.FOMC },

  // ─── 2025 CPI ───
  { date: "2025-01-15", name: "CPI (Dec)", type: "CPI", impact: "high", description: DESC.CPI },
  { date: "2025-02-12", name: "CPI (Jan)", type: "CPI", impact: "high", description: DESC.CPI, previous: "2.9% YoY", forecast: "2.9% YoY" },
  { date: "2025-03-12", name: "CPI (Feb)", type: "CPI", impact: "high", description: DESC.CPI, previous: "3.0% YoY" },
  { date: "2025-04-10", name: "CPI (Mar)", type: "CPI", impact: "high", description: DESC.CPI },
  { date: "2025-05-13", name: "CPI (Apr)", type: "CPI", impact: "high", description: DESC.CPI },
  { date: "2025-06-11", name: "CPI (May)", type: "CPI", impact: "high", description: DESC.CPI },
  { date: "2025-07-11", name: "CPI (Jun)", type: "CPI", impact: "high", description: DESC.CPI },
  { date: "2025-08-12", name: "CPI (Jul)", type: "CPI", impact: "high", description: DESC.CPI },
  { date: "2025-09-10", name: "CPI (Aug)", type: "CPI", impact: "high", description: DESC.CPI },
  { date: "2025-10-14", name: "CPI (Sep)", type: "CPI", impact: "high", description: DESC.CPI },
  { date: "2025-11-12", name: "CPI (Oct)", type: "CPI", impact: "high", description: DESC.CPI },
  { date: "2025-12-10", name: "CPI (Nov)", type: "CPI", impact: "high", description: DESC.CPI },
  // 2026 CPI
  { date: "2026-01-14", name: "CPI (Dec)", type: "CPI", impact: "high", description: DESC.CPI },
  { date: "2026-02-11", name: "CPI (Jan)", type: "CPI", impact: "high", description: DESC.CPI, previous: "2.7% YoY" },
  { date: "2026-03-11", name: "CPI (Feb)", type: "CPI", impact: "high", description: DESC.CPI, previous: "2.6% YoY" },
  { date: "2026-04-14", name: "CPI (Mar)", type: "CPI", impact: "high", description: DESC.CPI },
  { date: "2026-05-12", name: "CPI (Apr)", type: "CPI", impact: "high", description: DESC.CPI },
  { date: "2026-06-10", name: "CPI (May)", type: "CPI", impact: "high", description: DESC.CPI },
  { date: "2026-07-14", name: "CPI (Jun)", type: "CPI", impact: "high", description: DESC.CPI },
  { date: "2026-08-12", name: "CPI (Jul)", type: "CPI", impact: "high", description: DESC.CPI },
  { date: "2026-09-15", name: "CPI (Aug)", type: "CPI", impact: "high", description: DESC.CPI },
  { date: "2026-10-13", name: "CPI (Sep)", type: "CPI", impact: "high", description: DESC.CPI },
  { date: "2026-11-10", name: "CPI (Oct)", type: "CPI", impact: "high", description: DESC.CPI },
  { date: "2026-12-10", name: "CPI (Nov)", type: "CPI", impact: "high", description: DESC.CPI },

  // ─── 2025 NFP + Unemployment (same release day) ───
  { date: "2025-01-10", name: "Non-Farm Payrolls (Dec)", type: "NFP", impact: "high", description: DESC.NFP },
  { date: "2025-01-10", name: "Unemployment Rate (Dec)", type: "UNEMP", impact: "high", description: DESC.UNEMP },
  { date: "2025-02-07", name: "Non-Farm Payrolls (Jan)", type: "NFP", impact: "high", description: DESC.NFP, previous: "256K", forecast: "170K" },
  { date: "2025-02-07", name: "Unemployment Rate (Jan)", type: "UNEMP", impact: "high", description: DESC.UNEMP, previous: "4.1%", forecast: "4.1%" },
  { date: "2025-03-07", name: "Non-Farm Payrolls (Feb)", type: "NFP", impact: "high", description: DESC.NFP, previous: "143K" },
  { date: "2025-03-07", name: "Unemployment Rate (Feb)", type: "UNEMP", impact: "high", description: DESC.UNEMP, previous: "4.0%" },
  { date: "2025-04-04", name: "Non-Farm Payrolls (Mar)", type: "NFP", impact: "high", description: DESC.NFP },
  { date: "2025-05-02", name: "Non-Farm Payrolls (Apr)", type: "NFP", impact: "high", description: DESC.NFP },
  { date: "2025-06-06", name: "Non-Farm Payrolls (May)", type: "NFP", impact: "high", description: DESC.NFP },
  { date: "2025-07-03", name: "Non-Farm Payrolls (Jun)", type: "NFP", impact: "high", description: DESC.NFP },
  { date: "2025-08-01", name: "Non-Farm Payrolls (Jul)", type: "NFP", impact: "high", description: DESC.NFP },
  { date: "2025-09-05", name: "Non-Farm Payrolls (Aug)", type: "NFP", impact: "high", description: DESC.NFP },
  { date: "2025-10-03", name: "Non-Farm Payrolls (Sep)", type: "NFP", impact: "high", description: DESC.NFP },
  { date: "2025-11-07", name: "Non-Farm Payrolls (Oct)", type: "NFP", impact: "high", description: DESC.NFP },
  { date: "2025-12-05", name: "Non-Farm Payrolls (Nov)", type: "NFP", impact: "high", description: DESC.NFP },
  // 2026 NFP
  { date: "2026-01-09", name: "Non-Farm Payrolls (Dec)", type: "NFP", impact: "high", description: DESC.NFP },
  { date: "2026-02-06", name: "Non-Farm Payrolls (Jan)", type: "NFP", impact: "high", description: DESC.NFP, previous: "180K", forecast: "165K" },
  { date: "2026-03-06", name: "Non-Farm Payrolls (Feb)", type: "NFP", impact: "high", description: DESC.NFP, previous: "175K" },
  { date: "2026-04-03", name: "Non-Farm Payrolls (Mar)", type: "NFP", impact: "high", description: DESC.NFP },
  { date: "2026-05-01", name: "Non-Farm Payrolls (Apr)", type: "NFP", impact: "high", description: DESC.NFP },
  { date: "2026-06-05", name: "Non-Farm Payrolls (May)", type: "NFP", impact: "high", description: DESC.NFP },
  { date: "2026-07-02", name: "Non-Farm Payrolls (Jun)", type: "NFP", impact: "high", description: DESC.NFP },
  { date: "2026-08-07", name: "Non-Farm Payrolls (Jul)", type: "NFP", impact: "high", description: DESC.NFP },
  { date: "2026-09-04", name: "Non-Farm Payrolls (Aug)", type: "NFP", impact: "high", description: DESC.NFP },
  { date: "2026-10-02", name: "Non-Farm Payrolls (Sep)", type: "NFP", impact: "high", description: DESC.NFP },
  { date: "2026-11-06", name: "Non-Farm Payrolls (Oct)", type: "NFP", impact: "high", description: DESC.NFP },
  { date: "2026-12-04", name: "Non-Farm Payrolls (Nov)", type: "NFP", impact: "high", description: DESC.NFP },

  // ─── 2025 PPI (typically day after or same week as CPI) ───
  { date: "2025-01-14", name: "PPI (Dec)", type: "PPI", impact: "medium", description: DESC.PPI },
  { date: "2025-02-13", name: "PPI (Jan)", type: "PPI", impact: "medium", description: DESC.PPI, previous: "3.3% YoY", forecast: "3.2% YoY" },
  { date: "2025-03-13", name: "PPI (Feb)", type: "PPI", impact: "medium", description: DESC.PPI, previous: "3.5% YoY" },
  { date: "2025-04-11", name: "PPI (Mar)", type: "PPI", impact: "medium", description: DESC.PPI },
  { date: "2025-05-15", name: "PPI (Apr)", type: "PPI", impact: "medium", description: DESC.PPI },
  { date: "2025-06-12", name: "PPI (May)", type: "PPI", impact: "medium", description: DESC.PPI },
  { date: "2025-07-15", name: "PPI (Jun)", type: "PPI", impact: "medium", description: DESC.PPI },
  { date: "2025-08-14", name: "PPI (Jul)", type: "PPI", impact: "medium", description: DESC.PPI },
  { date: "2025-09-11", name: "PPI (Aug)", type: "PPI", impact: "medium", description: DESC.PPI },
  { date: "2025-10-15", name: "PPI (Sep)", type: "PPI", impact: "medium", description: DESC.PPI },
  { date: "2025-11-13", name: "PPI (Oct)", type: "PPI", impact: "medium", description: DESC.PPI },
  { date: "2025-12-11", name: "PPI (Nov)", type: "PPI", impact: "medium", description: DESC.PPI },
  // 2026 PPI
  { date: "2026-01-15", name: "PPI (Dec)", type: "PPI", impact: "medium", description: DESC.PPI },
  { date: "2026-02-12", name: "PPI (Jan)", type: "PPI", impact: "medium", description: DESC.PPI, previous: "2.8% YoY" },
  { date: "2026-03-12", name: "PPI (Feb)", type: "PPI", impact: "medium", description: DESC.PPI, previous: "2.7% YoY" },
  { date: "2026-04-15", name: "PPI (Mar)", type: "PPI", impact: "medium", description: DESC.PPI },
  { date: "2026-05-14", name: "PPI (Apr)", type: "PPI", impact: "medium", description: DESC.PPI },
  { date: "2026-06-11", name: "PPI (May)", type: "PPI", impact: "medium", description: DESC.PPI },
  { date: "2026-07-16", name: "PPI (Jun)", type: "PPI", impact: "medium", description: DESC.PPI },
  { date: "2026-08-13", name: "PPI (Jul)", type: "PPI", impact: "medium", description: DESC.PPI },
  { date: "2026-09-16", name: "PPI (Aug)", type: "PPI", impact: "medium", description: DESC.PPI },
  { date: "2026-10-15", name: "PPI (Sep)", type: "PPI", impact: "medium", description: DESC.PPI },
  { date: "2026-11-12", name: "PPI (Oct)", type: "PPI", impact: "medium", description: DESC.PPI },
  { date: "2026-12-11", name: "PPI (Nov)", type: "PPI", impact: "medium", description: DESC.PPI },

  // ─── 2025 PCE (last week of month, ~1 month lag) ───
  { date: "2025-01-31", name: "Core PCE (Dec)", type: "PCE", impact: "high", description: DESC.PCE },
  { date: "2025-02-28", name: "Core PCE (Jan)", type: "PCE", impact: "high", description: DESC.PCE, previous: "2.8% YoY", forecast: "2.6% YoY" },
  { date: "2025-03-28", name: "Core PCE (Feb)", type: "PCE", impact: "high", description: DESC.PCE, previous: "2.6% YoY" },
  { date: "2025-04-30", name: "Core PCE (Mar)", type: "PCE", impact: "high", description: DESC.PCE },
  { date: "2025-05-30", name: "Core PCE (Apr)", type: "PCE", impact: "high", description: DESC.PCE },
  { date: "2025-06-27", name: "Core PCE (May)", type: "PCE", impact: "high", description: DESC.PCE },
  { date: "2025-07-31", name: "Core PCE (Jun)", type: "PCE", impact: "high", description: DESC.PCE },
  { date: "2025-08-29", name: "Core PCE (Jul)", type: "PCE", impact: "high", description: DESC.PCE },
  { date: "2025-09-26", name: "Core PCE (Aug)", type: "PCE", impact: "high", description: DESC.PCE },
  { date: "2025-10-31", name: "Core PCE (Sep)", type: "PCE", impact: "high", description: DESC.PCE },
  { date: "2025-11-26", name: "Core PCE (Oct)", type: "PCE", impact: "high", description: DESC.PCE },
  { date: "2025-12-23", name: "Core PCE (Nov)", type: "PCE", impact: "high", description: DESC.PCE },
  // 2026 PCE
  { date: "2026-01-30", name: "Core PCE (Dec)", type: "PCE", impact: "high", description: DESC.PCE },
  { date: "2026-02-27", name: "Core PCE (Jan)", type: "PCE", impact: "high", description: DESC.PCE, previous: "2.4% YoY", forecast: "2.3% YoY" },
  { date: "2026-03-27", name: "Core PCE (Feb)", type: "PCE", impact: "high", description: DESC.PCE, previous: "2.3% YoY" },
  { date: "2026-04-30", name: "Core PCE (Mar)", type: "PCE", impact: "high", description: DESC.PCE },
  { date: "2026-05-29", name: "Core PCE (Apr)", type: "PCE", impact: "high", description: DESC.PCE },
  { date: "2026-06-26", name: "Core PCE (May)", type: "PCE", impact: "high", description: DESC.PCE },
  { date: "2026-07-31", name: "Core PCE (Jun)", type: "PCE", impact: "high", description: DESC.PCE },
  { date: "2026-08-28", name: "Core PCE (Jul)", type: "PCE", impact: "high", description: DESC.PCE },
  { date: "2026-09-25", name: "Core PCE (Aug)", type: "PCE", impact: "high", description: DESC.PCE },
  { date: "2026-10-30", name: "Core PCE (Sep)", type: "PCE", impact: "high", description: DESC.PCE },
  { date: "2026-11-25", name: "Core PCE (Oct)", type: "PCE", impact: "high", description: DESC.PCE },
  { date: "2026-12-23", name: "Core PCE (Nov)", type: "PCE", impact: "high", description: DESC.PCE },

  // ─── 2025 GDP (advance estimates — quarterly) ───
  { date: "2025-01-30", name: "GDP Q4 2024 (Advance)", type: "GDP", impact: "medium", description: DESC.GDP },
  { date: "2025-04-30", name: "GDP Q1 2025 (Advance)", type: "GDP", impact: "medium", description: DESC.GDP },
  { date: "2025-07-30", name: "GDP Q2 2025 (Advance)", type: "GDP", impact: "medium", description: DESC.GDP },
  { date: "2025-10-30", name: "GDP Q3 2025 (Advance)", type: "GDP", impact: "medium", description: DESC.GDP },
  // 2026 GDP
  { date: "2026-01-29", name: "GDP Q4 2025 (Advance)", type: "GDP", impact: "medium", description: DESC.GDP },
  { date: "2026-04-29", name: "GDP Q1 2026 (Advance)", type: "GDP", impact: "medium", description: DESC.GDP },
  { date: "2026-07-30", name: "GDP Q2 2026 (Advance)", type: "GDP", impact: "medium", description: DESC.GDP },
  { date: "2026-10-29", name: "GDP Q3 2026 (Advance)", type: "GDP", impact: "medium", description: DESC.GDP },
];

export function getUpcomingEvents(count: number = 10): MacroEvent[] {
  const today = new Date().toISOString().split("T")[0];
  return MACRO_EVENTS
    .filter((e) => e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, count);
}

export function getRecentAndUpcoming(count: number = 12): (MacroEvent & { isPast: boolean })[] {
  const today = new Date().toISOString().split("T")[0];
  const past = MACRO_EVENTS
    .filter((e) => e.date < today)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3)
    .map((e) => ({ ...e, isPast: true }));
  const upcoming = MACRO_EVENTS
    .filter((e) => e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, count)
    .map((e) => ({ ...e, isPast: false }));
  return [...past.reverse(), ...upcoming];
}

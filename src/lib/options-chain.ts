import {
  blackScholes,
  calculateGreeks,
  type OptionType,
  type Greeks,
} from "./options-math";

// ── Types ───────────────────────────────────────────

export interface ChainStrike {
  strike: number;
  callBid: number;
  callAsk: number;
  callMid: number;
  callGreeks: Greeks;
  callVol: number;
  callOI: number;
  callIV: number;
  putBid: number;
  putAsk: number;
  putMid: number;
  putGreeks: Greeks;
  putVol: number;
  putOI: number;
  putIV: number;
}

export type OrderSide = "buy" | "sell";
export type OrderStatus = "staged" | "submitted" | "filled" | "cancelled";

export interface ChainOrder {
  id: string;
  expiry: string;
  strike: number;
  optionType: OptionType;
  price: number;
  quantity: number;
  side: OrderSide;
  status: OrderStatus;
  fillDate: string | null;
  fillPrice: number | null;
  orderType: "market" | "limit";
  limitPrice: number | null;
}

// ── Synthetic symbols ───────────────────────────────

export const OPTION_SYMBOLS = [
  { value: "AAPL", label: "Apple Inc.", spot: 175 },
  { value: "TSLA", label: "Tesla Inc.", spot: 245 },
  { value: "MSFT", label: "Microsoft", spot: 420 },
  { value: "GOOGL", label: "Alphabet", spot: 175 },
  { value: "AMZN", label: "Amazon", spot: 185 },
  { value: "META", label: "Meta Platforms", spot: 500 },
  { value: "NVDA", label: "NVIDIA", spot: 130 },
  { value: "AMD", label: "AMD", spot: 160 },
  { value: "NFLX", label: "Netflix", spot: 620 },
  { value: "SPY", label: "S&P 500 ETF", spot: 530 },
  { value: "QQQ", label: "Nasdaq 100 ETF", spot: 460 },
  { value: "IWM", label: "Russell 2000 ETF", spot: 210 },
  { value: "BA", label: "Boeing", spot: 185 },
  { value: "DIS", label: "Walt Disney", spot: 110 },
  { value: "JPM", label: "JPMorgan Chase", spot: 200 },
  { value: "V", label: "Visa Inc.", spot: 280 },
  { value: "COIN", label: "Coinbase", spot: 230 },
  { value: "PLTR", label: "Palantir", spot: 25 },
  { value: "SHOP", label: "Shopify", spot: 75 },
  { value: "UBER", label: "Uber", spot: 70 },
  { value: "CRM", label: "Salesforce", spot: 275 },
  { value: "AVGO", label: "Broadcom", spot: 170 },
  { value: "SMCI", label: "Super Micro", spot: 50 },
  { value: "ARM", label: "Arm Holdings", spot: 155 },
  { value: "COST", label: "Costco", spot: 740 },
  { value: "UNH", label: "UnitedHealth", spot: 520 },
  { value: "HD", label: "Home Depot", spot: 370 },
  { value: "XOM", label: "Exxon Mobil", spot: 115 },
  { value: "BAC", label: "Bank of America", spot: 40 },
  { value: "GS", label: "Goldman Sachs", spot: 470 },
] as const;

export type OptionSymbol = (typeof OPTION_SYMBOLS)[number]["value"];

// ── Chain generation ────────────────────────────────

function strikeInterval(spot: number): number {
  if (spot < 50) return 1;
  if (spot < 200) return 2.5;
  if (spot < 500) return 5;
  return 10;
}

function simulateVolOI(spot: number, strike: number, base: number): { vol: number; oi: number } {
  // ATM strikes have highest volume/OI, decays with distance
  const distance = Math.abs(strike - spot) / spot;
  const factor = Math.max(0.05, 1 - distance * 5);
  const seed = Math.sin(strike * 1000 + base) * 0.5 + 0.5; // deterministic pseudo-random
  return {
    vol: Math.round(base * factor * (0.5 + seed)),
    oi: Math.round(base * 3 * factor * (0.3 + seed * 0.7)),
  };
}

export function generateChain(
  spot: number,
  iv: number,
  daysToExpiry: number,
  riskFreeRate: number = 0.05
): ChainStrike[] {
  const interval = strikeInterval(spot);
  const T = daysToExpiry / 365;
  const atmStrike = Math.round(spot / interval) * interval;

  const strikes: ChainStrike[] = [];
  const numStrikes = 10; // ±10 strikes from ATM

  for (let i = -numStrikes; i <= numStrikes; i++) {
    const strike = atmStrike + i * interval;
    if (strike <= 0) continue;

    // IV skew: OTM puts have higher IV, OTM calls slightly lower
    const moneyness = (strike - spot) / spot;
    const callIV = iv * (1 - moneyness * 0.1);
    const putIV = iv * (1 + moneyness * 0.1);

    const callPrice = blackScholes("call", spot, strike, T, riskFreeRate, callIV);
    const putPrice = blackScholes("put", spot, strike, T, riskFreeRate, putIV);
    const callGreeks = calculateGreeks("call", spot, strike, T, riskFreeRate, callIV);
    const putGreeks = calculateGreeks("put", spot, strike, T, riskFreeRate, putIV);

    // Bid/ask spread: tighter for ATM, wider for OTM
    const spreadFactor = 0.02 + Math.abs(moneyness) * 0.05;
    const callBid = Math.max(0.01, callPrice * (1 - spreadFactor));
    const callAsk = callPrice * (1 + spreadFactor);
    const putBid = Math.max(0.01, putPrice * (1 - spreadFactor));
    const putAsk = putPrice * (1 + spreadFactor);

    const callVolOI = simulateVolOI(spot, strike, 500);
    const putVolOI = simulateVolOI(spot, strike, 400);

    strikes.push({
      strike,
      callBid: round2(callBid),
      callAsk: round2(callAsk),
      callMid: round2(callPrice),
      callGreeks,
      callVol: callVolOI.vol,
      callOI: callVolOI.oi,
      callIV: round4(callIV),
      putBid: round2(putBid),
      putAsk: round2(putAsk),
      putMid: round2(putPrice),
      putGreeks,
      putVol: putVolOI.vol,
      putOI: putVolOI.oi,
      putIV: round4(putIV),
    });
  }

  return strikes;
}

// ── Helpers ─────────────────────────────────────────

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

let idCounter = 0;
export function genOrderId(): string {
  idCounter++;
  return `ord-${Date.now()}-${idCounter}`;
}

export function formatExpiry(daysToExpiry: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysToExpiry);
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

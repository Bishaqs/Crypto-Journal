// Black-Scholes pricing and Greeks for options calculations
// Shared by: Options Payoff, Options Simulator, Options Backtest

/** Cumulative standard normal distribution */
function cdf(x: number): number {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.SQRT2;
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return 0.5 * (1.0 + sign * y);
}

export type OptionType = "call" | "put";

export interface OptionLeg {
  type: OptionType;
  strike: number;
  premium: number;
  quantity: number; // positive = long, negative = short
  expDays?: number;
  iv?: number; // implied volatility as decimal (e.g. 0.30 for 30%)
}

export interface Greeks {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
}

export interface PayoffPoint {
  price: number;
  pnl: number;
}

/** Black-Scholes option price */
export function blackScholes(
  type: OptionType,
  S: number,   // spot price
  K: number,   // strike
  T: number,   // time to expiry in years
  r: number,   // risk-free rate
  sigma: number // volatility
): number {
  if (T <= 0) return type === "call" ? Math.max(S - K, 0) : Math.max(K - S, 0);
  const d1 = (Math.log(S / K) + (r + sigma * sigma / 2) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);
  if (type === "call") {
    return S * cdf(d1) - K * Math.exp(-r * T) * cdf(d2);
  }
  return K * Math.exp(-r * T) * cdf(-d2) - S * cdf(-d1);
}

/** Greeks calculation */
export function calculateGreeks(
  type: OptionType,
  S: number, K: number, T: number, r: number, sigma: number
): Greeks {
  if (T <= 0) {
    const itm = type === "call" ? S > K : S < K;
    return { delta: itm ? (type === "call" ? 1 : -1) : 0, gamma: 0, theta: 0, vega: 0, rho: 0 };
  }
  const sqrtT = Math.sqrt(T);
  const d1 = (Math.log(S / K) + (r + sigma * sigma / 2) * T) / (sigma * sqrtT);
  const d2 = d1 - sigma * sqrtT;
  const nd1 = Math.exp(-d1 * d1 / 2) / Math.sqrt(2 * Math.PI); // standard normal pdf

  const delta = type === "call" ? cdf(d1) : cdf(d1) - 1;
  const gamma = nd1 / (S * sigma * sqrtT);
  const theta = type === "call"
    ? (-S * nd1 * sigma / (2 * sqrtT) - r * K * Math.exp(-r * T) * cdf(d2)) / 365
    : (-S * nd1 * sigma / (2 * sqrtT) + r * K * Math.exp(-r * T) * cdf(-d2)) / 365;
  const vega = S * nd1 * sqrtT / 100; // per 1% change in IV
  const rho = type === "call"
    ? K * T * Math.exp(-r * T) * cdf(d2) / 100
    : -K * T * Math.exp(-r * T) * cdf(-d2) / 100;

  return { delta, gamma, theta, vega, rho };
}

/** Calculate P&L at expiration for a set of option legs at a given underlying price */
export function calculatePayoff(legs: OptionLeg[], underlyingPrice: number): number {
  return legs.reduce((total, leg) => {
    const intrinsic = leg.type === "call"
      ? Math.max(underlyingPrice - leg.strike, 0)
      : Math.max(leg.strike - underlyingPrice, 0);
    const pnl = (intrinsic - leg.premium) * leg.quantity * 100; // 100 shares per contract
    return total + pnl;
  }, 0);
}

/** Generate payoff curve data points */
export function generatePayoffCurve(legs: OptionLeg[], spotPrice: number, numPoints: number = 100): PayoffPoint[] {
  const strikes = legs.map(l => l.strike);
  const minStrike = Math.min(...strikes);
  const maxStrike = Math.max(...strikes);
  const range = maxStrike - minStrike || spotPrice * 0.2;
  const low = Math.max(0, minStrike - range * 0.5);
  const high = maxStrike + range * 0.5;
  const step = (high - low) / numPoints;

  return Array.from({ length: numPoints + 1 }, (_, i) => {
    const price = low + i * step;
    return { price: Math.round(price * 100) / 100, pnl: calculatePayoff(legs, price) };
  });
}

/** Calculate break-even prices for a set of legs */
export function findBreakEvens(legs: OptionLeg[], spotPrice: number): number[] {
  const curve = generatePayoffCurve(legs, spotPrice, 1000);
  const breakEvens: number[] = [];
  for (let i = 1; i < curve.length; i++) {
    if ((curve[i - 1].pnl <= 0 && curve[i].pnl > 0) || (curve[i - 1].pnl >= 0 && curve[i].pnl < 0)) {
      // Linear interpolation
      const ratio = Math.abs(curve[i - 1].pnl) / (Math.abs(curve[i - 1].pnl) + Math.abs(curve[i].pnl));
      breakEvens.push(Math.round((curve[i - 1].price + ratio * (curve[i].price - curve[i - 1].price)) * 100) / 100);
    }
  }
  return breakEvens;
}

/** Common strategy presets */
export const STRATEGY_PRESETS: { name: string; legs: (spot: number) => OptionLeg[] }[] = [
  {
    name: "Long Call",
    legs: (s) => [{ type: "call", strike: Math.round(s), premium: s * 0.05, quantity: 1 }],
  },
  {
    name: "Long Put",
    legs: (s) => [{ type: "put", strike: Math.round(s), premium: s * 0.05, quantity: -1 }],
  },
  {
    name: "Covered Call",
    legs: (s) => [
      { type: "call", strike: Math.round(s * 1.05), premium: s * 0.03, quantity: -1 },
    ],
  },
  {
    name: "Bull Call Spread",
    legs: (s) => [
      { type: "call", strike: Math.round(s * 0.97), premium: s * 0.06, quantity: 1 },
      { type: "call", strike: Math.round(s * 1.03), premium: s * 0.02, quantity: -1 },
    ],
  },
  {
    name: "Iron Condor",
    legs: (s) => [
      { type: "put", strike: Math.round(s * 0.93), premium: s * 0.01, quantity: 1 },
      { type: "put", strike: Math.round(s * 0.96), premium: s * 0.025, quantity: -1 },
      { type: "call", strike: Math.round(s * 1.04), premium: s * 0.025, quantity: -1 },
      { type: "call", strike: Math.round(s * 1.07), premium: s * 0.01, quantity: 1 },
    ],
  },
  {
    name: "Straddle",
    legs: (s) => [
      { type: "call", strike: Math.round(s), premium: s * 0.04, quantity: 1 },
      { type: "put", strike: Math.round(s), premium: s * 0.04, quantity: 1 },
    ],
  },
];

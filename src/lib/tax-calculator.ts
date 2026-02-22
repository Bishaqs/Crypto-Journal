import { Trade } from "./types";

// ── EU Multi-Country Tax Jurisdictions ──────────────────────────────────

export type TaxJurisdiction = "us" | "de" | "fr" | "es" | "uk" | "nl" | "it" | "at" | "pt" | "other";

export type JurisdictionInfo = {
  code: TaxJurisdiction;
  name: string;
  flag: string;
  rates: string;
  holdingExemption: string | null;
  method: string;
  notes: string;
};

export const TAX_JURISDICTIONS: JurisdictionInfo[] = [
  { code: "us", name: "United States", flag: "\u{1F1FA}\u{1F1F8}", rates: "Short: 10-37%, Long: 0-20%", holdingExemption: ">1 year = long-term rates", method: "FIFO / LIFO / HIFO", notes: "Report on IRS Form 8949 + Schedule D" },
  { code: "de", name: "Germany", flag: "\u{1F1E9}\u{1F1EA}", rates: "Income tax rate (up to ~45%)", holdingExemption: ">1 year = TAX FREE", method: "FIFO", notes: "Crypto held >1 year is completely tax-exempt. \u20AC600 annual exemption for short-term." },
  { code: "fr", name: "France", flag: "\u{1F1EB}\u{1F1F7}", rates: "31.4% flat (PFU)", holdingExemption: null, method: "Weighted average", notes: "Flat tax (pr\u00E9l\u00E8vement forfaitaire unique) applies to all crypto gains regardless of holding period." },
  { code: "es", name: "Spain", flag: "\u{1F1EA}\u{1F1F8}", rates: "19-28% sliding scale", holdingExemption: null, method: "FIFO", notes: "19% up to \u20AC6,000, 21% \u20AC6K-50K, 23% \u20AC50K-200K, 27% \u20AC200K-300K, 28% above \u20AC300K." },
  { code: "uk", name: "United Kingdom", flag: "\u{1F1EC}\u{1F1E7}", rates: "18% / 24%", holdingExemption: "\u00A33,000 annual allowance", method: "Pooling (Section 104)", notes: "18% for basic rate, 24% for higher rate taxpayers. \u00A33,000 capital gains allowance." },
  { code: "nl", name: "Netherlands", flag: "\u{1F1F3}\u{1F1F1}", rates: "36% Box 3 (wealth tax)", holdingExemption: null, method: "N/A (wealth-based)", notes: "Netherlands taxes crypto as wealth (Box 3) \u2014 not per-trade. Tax on deemed return of net assets." },
  { code: "it", name: "Italy", flag: "\u{1F1EE}\u{1F1F9}", rates: "33% (2026+)", holdingExemption: null, method: "FIFO", notes: "Rate increased from 26% to 33% starting 2026. \u20AC2,000 annual exemption removed." },
  { code: "at", name: "Austria", flag: "\u{1F1E6}\u{1F1F9}", rates: "27.5% flat", holdingExemption: null, method: "FIFO", notes: "Flat 27.5% on all crypto gains regardless of holding period (since March 2022)." },
  { code: "pt", name: "Portugal", flag: "\u{1F1F5}\u{1F1F9}", rates: "28% (<1 year)", holdingExemption: ">365 days = TAX FREE", method: "FIFO", notes: "Crypto held >365 days is tax-exempt. Short-term taxed at 28% flat." },
];

// ── Tax Report with Jurisdiction Support ────────────────────────────────

export type TaxCategory = "short-term" | "long-term" | "exempt" | "wealth-based";

export type JurisdictionTaxSummary = TaxSummary & {
  jurisdiction: TaxJurisdiction;
  jurisdictionInfo: JurisdictionInfo;
  exempt: { gains: number; count: number };
  isWealthBased: boolean;
  effectiveRateNote: string;
};

export function calculateTaxReportForJurisdiction(
  trades: Trade[],
  year: number | undefined,
  jurisdiction: TaxJurisdiction,
  costBasisMethod: CostBasisMethod = "fifo"
): JurisdictionTaxSummary {
  const baseSummary = calculateTaxReport(trades, year, costBasisMethod);
  const info = TAX_JURISDICTIONS.find((j) => j.code === jurisdiction) ?? TAX_JURISDICTIONS[0];

  let exempt = { gains: 0, count: 0 };
  const isWealthBased = jurisdiction === "nl";
  let effectiveRateNote = "";

  switch (jurisdiction) {
    case "de": {
      // Germany: >1 year holding = completely tax-free
      let exemptGains = 0;
      let exemptCount = 0;
      let taxableShortNet = 0;
      let taxableShortCount = 0;
      for (const t of baseSummary.trades) {
        if (t.holdingPeriodDays >= 365) {
          exemptGains += t.gainLoss;
          exemptCount++;
        } else {
          taxableShortCount++;
          taxableShortNet += t.gainLoss;
        }
      }
      exempt = { gains: exemptGains, count: exemptCount };
      baseSummary.longTerm = { gains: 0, losses: 0, net: 0, count: 0 };
      baseSummary.shortTerm = {
        gains: taxableShortNet > 0 ? taxableShortNet : 0,
        losses: taxableShortNet < 0 ? taxableShortNet : 0,
        net: taxableShortNet,
        count: taxableShortCount,
      };
      effectiveRateNote = `${exemptCount} trade(s) held >1 year are tax-exempt. Short-term gains under \u20AC600 are also exempt.`;
      break;
    }
    case "pt": {
      // Portugal: >365 days = tax-free, short-term at 28%
      let exemptGains = 0;
      let exemptCount = 0;
      let taxableShortNet = 0;
      let taxableShortCount = 0;
      for (const t of baseSummary.trades) {
        if (t.holdingPeriodDays > 365) {
          exemptGains += t.gainLoss;
          exemptCount++;
        } else {
          taxableShortCount++;
          taxableShortNet += t.gainLoss;
        }
      }
      exempt = { gains: exemptGains, count: exemptCount };
      baseSummary.longTerm = { gains: 0, losses: 0, net: 0, count: 0 };
      baseSummary.shortTerm = {
        gains: taxableShortNet > 0 ? taxableShortNet : 0,
        losses: taxableShortNet < 0 ? taxableShortNet : 0,
        net: taxableShortNet,
        count: taxableShortCount,
      };
      effectiveRateNote = `${exemptCount} trade(s) held >365 days are tax-exempt. Short-term taxed at flat 28%.`;
      break;
    }
    case "fr":
      effectiveRateNote = "All crypto gains taxed at flat 31.4% (PFU) regardless of holding period.";
      break;
    case "nl":
      effectiveRateNote = "The Netherlands taxes crypto as wealth (Box 3), not per-trade. Your total crypto holdings at year-end are subject to deemed return taxation at 36%.";
      break;
    case "es":
      effectiveRateNote = "Sliding scale: 19% up to \u20AC6K, 21% to \u20AC50K, 23% to \u20AC200K, 27% to \u20AC300K, 28% above.";
      break;
    case "uk":
      effectiveRateNote = "\u00A33,000 annual capital gains allowance. 18% basic rate / 24% higher rate. Uses Section 104 pooling method.";
      break;
    case "it":
      effectiveRateNote = "Flat 33% on all crypto gains (increased from 26% in 2026). \u20AC2,000 annual exemption was removed.";
      break;
    case "at":
      effectiveRateNote = "Flat 27.5% on all crypto gains regardless of holding period (since March 2022).";
      break;
    case "us":
    default:
      effectiveRateNote = "Short-term: ordinary income rates (10-37%). Long-term (>1yr): 0%, 15%, or 20%.";
      break;
  }

  return {
    ...baseSummary,
    jurisdiction,
    jurisdictionInfo: info,
    exempt,
    isWealthBased,
    effectiveRateNote,
  };
}

// ── Core Types ──────────────────────────────────────────────────────────

export type TaxableTrade = {
  id: string;
  symbol: string;
  position: "long" | "short";
  entryDate: string;
  exitDate: string;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  proceeds: number;
  costBasis: number;
  gainLoss: number;
  holdingPeriodDays: number;
  term: "short-term" | "long-term";
  fees: number;
};

export type TaxSummary = {
  netGainLoss: number;
  totalFees: number;
  totalProceeds: number;
  totalCostBasis: number;
  shortTerm: { gains: number; losses: number; net: number; count: number };
  longTerm: { gains: number; losses: number; net: number; count: number };
  trades: TaxableTrade[];
};

function tradesToTaxable(trade: Trade): TaxableTrade | null {
  if (!trade.close_timestamp || trade.exit_price === null) return null;

  const entryDate = trade.open_timestamp;
  const exitDate = trade.close_timestamp;
  const holdingMs =
    new Date(exitDate).getTime() - new Date(entryDate).getTime();
  const holdingPeriodDays = Math.max(0, Math.floor(holdingMs / 86400000));
  const term = holdingPeriodDays >= 365 ? "long-term" : "short-term";

  const proceeds = trade.exit_price * trade.quantity;
  const costBasis = trade.entry_price * trade.quantity;
  const fees = trade.fees || 0;

  const gainLoss =
    trade.position === "long"
      ? proceeds - costBasis - fees
      : costBasis - proceeds - fees;

  return {
    id: trade.id,
    symbol: trade.symbol,
    position: trade.position,
    entryDate,
    exitDate,
    entryPrice: trade.entry_price,
    exitPrice: trade.exit_price,
    quantity: trade.quantity,
    proceeds,
    costBasis,
    gainLoss,
    holdingPeriodDays,
    term,
    fees,
  };
}

export type CostBasisMethod = "fifo" | "lifo" | "hifo";

export function calculateTaxReport(
  trades: Trade[],
  taxYear?: number,
  _costBasisMethod: CostBasisMethod = "fifo"
): TaxSummary {
  const taxable: TaxableTrade[] = [];

  for (const trade of trades) {
    const t = tradesToTaxable(trade);
    if (!t) continue;

    if (taxYear) {
      const exitYear = new Date(t.exitDate).getFullYear();
      if (exitYear !== taxYear) continue;
    }

    taxable.push(t);
  }

  // Sort by exit date
  taxable.sort(
    (a, b) => new Date(a.exitDate).getTime() - new Date(b.exitDate).getTime()
  );

  const shortTerm = { gains: 0, losses: 0, net: 0, count: 0 };
  const longTerm = { gains: 0, losses: 0, net: 0, count: 0 };
  let totalFees = 0;
  let totalProceeds = 0;
  let totalCostBasis = 0;

  for (const t of taxable) {
    const bucket = t.term === "short-term" ? shortTerm : longTerm;
    bucket.count++;
    if (t.gainLoss >= 0) {
      bucket.gains += t.gainLoss;
    } else {
      bucket.losses += t.gainLoss;
    }
    bucket.net += t.gainLoss;
    totalFees += t.fees;
    totalProceeds += t.proceeds;
    totalCostBasis += t.costBasis;
  }

  return {
    netGainLoss: shortTerm.net + longTerm.net,
    totalFees,
    totalProceeds,
    totalCostBasis,
    shortTerm,
    longTerm,
    trades: taxable,
  };
}

export function getAvailableTaxYears(trades: Trade[]): number[] {
  const years = new Set<number>();
  for (const trade of trades) {
    if (trade.close_timestamp) {
      years.add(new Date(trade.close_timestamp).getFullYear());
    }
  }
  return Array.from(years).sort((a, b) => b - a);
}

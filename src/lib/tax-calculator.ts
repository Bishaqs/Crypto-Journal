import { Trade } from "./types";

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

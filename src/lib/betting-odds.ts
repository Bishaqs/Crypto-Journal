// Odds / probability conversions for the Prediction Markets betting features.
// Decimal odds <-> implied probability (%), plus combined values for parlays/combos.
// All pure, all guard against 0 / NaN / non-finite input.

export type CombineLeg = { odds?: number | null };

/** Decimal odds -> implied probability in percent (0-100). e.g. 1.85 -> 54.05 */
export function impliedProbFromOdds(odds: number | null | undefined): number | null {
  if (odds == null || !Number.isFinite(odds) || odds <= 0) return null;
  return 100 / odds;
}

/** Implied probability in percent (0-100) -> decimal odds. e.g. 54 -> 1.852 */
export function oddsFromImpliedProb(pct: number | null | undefined): number | null {
  if (pct == null || !Number.isFinite(pct) || pct <= 0 || pct > 100) return null;
  return 100 / pct;
}

/** Combined decimal odds for a parlay = product of each leg's decimal odds. */
export function combinedOdds(legs: CombineLeg[]): number | null {
  const valid = legs
    .map((l) => l.odds)
    .filter((o): o is number => o != null && Number.isFinite(o) && o > 0);
  if (valid.length === 0) return null;
  return valid.reduce((acc, o) => acc * o, 1);
}

/** Combined implied probability (%) for a parlay, derived from combined odds. */
export function combinedImpliedProb(legs: CombineLeg[]): number | null {
  return impliedProbFromOdds(combinedOdds(legs));
}

/** Profit (in units) for a resolved bet. won -> stake*(odds-1); lost -> -stake; void -> 0. */
export function realizedUnits(
  outcome: "pending" | "won" | "lost" | "void",
  stakeUnits: number | null | undefined,
  odds: number | null | undefined
): number | null {
  if (stakeUnits == null || !Number.isFinite(stakeUnits)) return null;
  if (outcome === "void" || outcome === "pending") return outcome === "void" ? 0 : null;
  if (outcome === "lost") return -stakeUnits;
  // won
  if (odds == null || !Number.isFinite(odds) || odds <= 0) return null;
  return stakeUnits * (odds - 1);
}

/** Round odds to a tidy 2 decimals for display/storage without float noise. */
export function roundOdds(odds: number): number {
  return Math.round(odds * 100) / 100;
}

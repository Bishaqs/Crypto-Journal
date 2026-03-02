import type { SimPosition, SimSide, SimTrade } from "./types";

export function createFlatPosition(): SimPosition {
  return { side: "flat", quantity: 0, avgEntryPrice: 0, unrealizedPnl: 0, realizedPnl: 0 };
}

export function calculateUnrealizedPnl(position: SimPosition, currentPrice: number): number {
  if (position.side === "flat") return 0;
  if (position.side === "long") {
    return (currentPrice - position.avgEntryPrice) * position.quantity;
  }
  return (position.avgEntryPrice - currentPrice) * position.quantity;
}

type FillResult = {
  position: SimPosition;
  realizedPnl: number;
};

/**
 * Apply a fill to the current position and return the new position + any realized PnL.
 * Handles same-direction adds, partial closes, full closes, and flips.
 */
export function applyFill(
  pos: SimPosition,
  side: SimSide,
  fillPrice: number,
  fillQty: number
): FillResult {
  // Flat -> enter new position
  if (pos.side === "flat") {
    return {
      position: {
        side: side === "buy" ? "long" : "short",
        quantity: fillQty,
        avgEntryPrice: fillPrice,
        unrealizedPnl: 0,
        realizedPnl: pos.realizedPnl,
      },
      realizedPnl: 0,
    };
  }

  const isAdding =
    (pos.side === "long" && side === "buy") ||
    (pos.side === "short" && side === "sell");

  if (isAdding) {
    // Adding to position — average in
    const totalCost = pos.avgEntryPrice * pos.quantity + fillPrice * fillQty;
    const totalQty = pos.quantity + fillQty;
    return {
      position: {
        ...pos,
        quantity: totalQty,
        avgEntryPrice: totalCost / totalQty,
      },
      realizedPnl: 0,
    };
  }

  // Reducing or flipping
  const closingQty = Math.min(fillQty, pos.quantity);
  const pnlPerUnit =
    pos.side === "long"
      ? fillPrice - pos.avgEntryPrice
      : pos.avgEntryPrice - fillPrice;
  const realized = pnlPerUnit * closingQty;
  const remainingQty = pos.quantity - closingQty;
  const excessQty = fillQty - closingQty;

  if (remainingQty > 0) {
    // Partial close
    return {
      position: {
        ...pos,
        quantity: remainingQty,
        realizedPnl: pos.realizedPnl + realized,
      },
      realizedPnl: realized,
    };
  }

  if (excessQty > 0) {
    // Flip to opposite side
    return {
      position: {
        side: side === "buy" ? "long" : "short",
        quantity: excessQty,
        avgEntryPrice: fillPrice,
        unrealizedPnl: 0,
        realizedPnl: pos.realizedPnl + realized,
      },
      realizedPnl: realized,
    };
  }

  // Exact close -> flat
  return {
    position: {
      ...createFlatPosition(),
      realizedPnl: pos.realizedPnl + realized,
    },
    realizedPnl: realized,
  };
}

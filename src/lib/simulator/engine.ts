import type { BinanceKline, SimOrder, SimSide } from "./types";

type FilledOrder = {
  order: SimOrder;
  fillPrice: number;
};

/**
 * Check pending orders against a candle's price range.
 * Returns filled orders with their fill prices.
 */
export function matchOrders(
  candle: BinanceKline,
  pendingOrders: SimOrder[]
): FilledOrder[] {
  const filled: FilledOrder[] = [];

  for (const order of pendingOrders) {
    if (order.status !== "pending") continue;

    if (order.type === "limit" || order.bracketRole === "take-profit") {
      // Buy limit fills when price dips to or below the limit price
      if (order.side === "buy" && candle.low <= order.price) {
        filled.push({ order, fillPrice: order.price });
      }
      // Sell limit fills when price rises to or above the limit price
      if (order.side === "sell" && candle.high >= order.price) {
        filled.push({ order, fillPrice: order.price });
      }
    } else if (order.type === "stop" || order.bracketRole === "stop-loss") {
      // Buy stop triggers when price rises to or above the stop price (breakout buy)
      if (order.side === "buy" && candle.high >= order.price) {
        filled.push({ order, fillPrice: order.price });
      }
      // Sell stop triggers when price drops to or below the stop price (stop loss)
      if (order.side === "sell" && candle.low <= order.price) {
        filled.push({ order, fillPrice: order.price });
      }
    }
  }

  return filled;
}

/**
 * Match orders with OCO (One-Cancels-Other) logic for bracket orders.
 * When a bracket TP or SL fills, the sibling is cancelled.
 * Returns { filled, cancelledIds }.
 */
export function matchOrdersWithOCO(
  candle: BinanceKline,
  pendingOrders: SimOrder[]
): { filled: FilledOrder[]; cancelledIds: Set<string> } {
  const filled = matchOrders(candle, pendingOrders);
  const cancelledIds = new Set<string>();

  // Collect bracket group IDs of filled orders
  const filledGroupIds = new Set<string>();
  for (const { order } of filled) {
    if (order.bracketGroupId) {
      filledGroupIds.add(order.bracketGroupId);
    }
  }

  // Cancel unfilled siblings in the same bracket group
  if (filledGroupIds.size > 0) {
    const filledOrderIds = new Set(filled.map((f) => f.order.id));
    for (const order of pendingOrders) {
      if (
        order.bracketGroupId &&
        filledGroupIds.has(order.bracketGroupId) &&
        !filledOrderIds.has(order.id) &&
        order.status === "pending"
      ) {
        cancelledIds.add(order.id);
      }
    }
  }

  return { filled, cancelledIds };
}

/**
 * Create bracket TP + SL orders as an OCO pair.
 * Call after the entry order fills.
 */
export function createBracketOrders(
  entrySide: SimSide,
  quantity: number,
  tpPrice: number,
  slPrice: number,
  timestamp: number
): SimOrder[] {
  const groupId = genId();
  const exitSide: SimSide = entrySide === "buy" ? "sell" : "buy";

  return [
    {
      id: genId(),
      type: "bracket",
      side: exitSide,
      price: tpPrice,
      quantity,
      timestamp,
      status: "pending",
      bracketGroupId: groupId,
      bracketRole: "take-profit",
    },
    {
      id: genId(),
      type: "bracket",
      side: exitSide,
      price: slPrice,
      quantity,
      timestamp,
      status: "pending",
      bracketGroupId: groupId,
      bracketRole: "stop-loss",
    },
  ];
}

/** Generate a unique ID */
export function genId(): string {
  return Math.random().toString(36).slice(2, 10);
}

/** Create a market order that fills immediately */
export function createMarketOrder(
  side: SimSide,
  quantity: number,
  currentPrice: number,
  timestamp: number
): SimOrder {
  return {
    id: genId(),
    type: "market",
    side,
    price: currentPrice,
    quantity,
    timestamp,
    status: "filled",
  };
}

/** Create a limit order that goes into pending */
export function createLimitOrder(
  side: SimSide,
  quantity: number,
  price: number,
  timestamp: number
): SimOrder {
  return {
    id: genId(),
    type: "limit",
    side,
    price,
    quantity,
    timestamp,
    status: "pending",
  };
}

/** Minimal shape needed to determine open/closed status. */
interface TradeStatusFields {
  close_timestamp: string | null;
  exit_price: number | null;
  pnl: number | null;
}

/** A trade is closed if it has a close timestamp, exit price, or realized PnL. */
export function isTradeClosed(t: TradeStatusFields): boolean {
  return t.close_timestamp !== null || t.exit_price !== null || t.pnl !== null;
}

export function isTradeOpen(t: TradeStatusFields): boolean {
  return !isTradeClosed(t);
}

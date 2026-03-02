export type SimOrderType = "market" | "limit" | "stop" | "bracket";
export type SimSide = "buy" | "sell";

export type SimOrder = {
  id: string;
  type: SimOrderType;
  side: SimSide;
  price: number;
  quantity: number;
  timestamp: number;
  status: "pending" | "filled" | "cancelled";
  bracketGroupId?: string;
  bracketRole?: "entry" | "take-profit" | "stop-loss";
};

export type SimTrade = {
  id: string;
  side: SimSide;
  price: number;
  quantity: number;
  timestamp: number;
  orderId: string;
  pnl: number | null;
};

export type SimPosition = {
  side: "long" | "short" | "flat";
  quantity: number;
  avgEntryPrice: number;
  unrealizedPnl: number;
  realizedPnl: number;
};

export type SimAccount = {
  startingBalance: number;
  balance: number;
  position: SimPosition;
  trades: SimTrade[];
  pendingOrders: SimOrder[];
};

export type BinanceKline = {
  time: number; // Unix seconds (for lightweight-charts)
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type PlaybackSpeed = 1 | 2 | 5 | 10 | 25;

export type PlaybackState = {
  candles: BinanceKline[];
  currentIndex: number;
  isPlaying: boolean;
  speed: PlaybackSpeed;
};

export type SimInterval = "1m" | "5m";

export const SUPPORTED_SYMBOLS = [
  { value: "BTCUSDT", label: "BTC / USDT" },
  { value: "ETHUSDT", label: "ETH / USDT" },
  { value: "SOLUSDT", label: "SOL / USDT" },
  { value: "BNBUSDT", label: "BNB / USDT" },
  { value: "XRPUSDT", label: "XRP / USDT" },
] as const;

export type SupportedSymbol = (typeof SUPPORTED_SYMBOLS)[number]["value"];

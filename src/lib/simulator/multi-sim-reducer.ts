import type {
  BinanceKline,
  SimAccount,
  SimTrade,
  SimOrder,
  SimSide,
  SimOrderType,
  SimInterval,
  SupportedSymbol,
  PlaybackSpeed,
} from "./types";
import { matchOrdersWithOCO, createMarketOrder, createBracketOrders, genId } from "./engine";
import { createFlatPosition, applyFill, calculateUnrealizedPnl } from "./position-tracker";

// ── Panel State ─────────────────────────────────────

export type PanelState = {
  allCandles: BinanceKline[];
  loading: boolean;
  error: string | null;
  symbol: SupportedSymbol;
  account: SimAccount;
  orderQuantity: string;
  collapsed: boolean;
};

// ── Multi-Sim State ─────────────────────────────────

export type MultiSimState = {
  date: string;
  interval: SimInterval;
  currentIndex: number;
  isPlaying: boolean;
  speed: PlaybackSpeed;
  panels: [PanelState, PanelState, PanelState, PanelState];
  activePanelId: number | null;
};

// ── Actions ─────────────────────────────────────────

export type MultiSimAction =
  // Shared playback
  | { type: "STEP_FORWARD" }
  | { type: "STEP_BACK" }
  | { type: "JUMP_START" }
  | { type: "JUMP_END" }
  | { type: "SEEK"; index: number }
  | { type: "SET_PLAYING"; isPlaying: boolean }
  | { type: "SET_SPEED"; speed: PlaybackSpeed }
  | { type: "SET_DATE"; date: string }
  | { type: "SET_INTERVAL"; interval: SimInterval }
  // Per-panel data
  | { type: "SET_PANEL_LOADING"; panelId: number }
  | { type: "SET_PANEL_CANDLES"; panelId: number; candles: BinanceKline[] }
  | { type: "SET_PANEL_ERROR"; panelId: number; error: string }
  // Per-panel trading
  | { type: "SET_PANEL_SYMBOL"; panelId: number; symbol: SupportedSymbol }
  | { type: "PLACE_ORDER"; panelId: number; side: SimSide; orderType: SimOrderType; quantity: number; price: number }
  | { type: "PLACE_BRACKET"; panelId: number; side: SimSide; quantity: number; tpPrice: number; slPrice: number }
  | { type: "FLATTEN"; panelId: number }
  | { type: "REVERSE"; panelId: number }
  | { type: "CANCEL_ORDER"; panelId: number; orderId: string }
  | { type: "SET_ORDER_QUANTITY"; panelId: number; quantity: string }
  | { type: "TOGGLE_PANEL_COLLAPSE"; panelId: number }
  | { type: "SET_ACTIVE_PANEL"; panelId: number | null }
  // Global
  | { type: "RESET_ALL" };

// ── Constants ───────────────────────────────────────

const STARTING_BALANCE = 10000;

const DEFAULT_SYMBOLS: SupportedSymbol[] = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT"];

// ── Helpers ─────────────────────────────────────────

function createInitialAccount(): SimAccount {
  return {
    startingBalance: STARTING_BALANCE,
    balance: STARTING_BALANCE,
    position: createFlatPosition(),
    trades: [],
    pendingOrders: [],
  };
}

function createPanel(symbol: SupportedSymbol): PanelState {
  return {
    allCandles: [],
    loading: true,
    error: null,
    symbol,
    account: createInitialAccount(),
    orderQuantity: "0.1",
    collapsed: true,
  };
}

function getYesterday(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function createInitialMultiSimState(): MultiSimState {
  return {
    date: getYesterday(),
    interval: "1m",
    currentIndex: 0,
    isPlaying: false,
    speed: 1,
    panels: DEFAULT_SYMBOLS.map(createPanel) as [PanelState, PanelState, PanelState, PanelState],
    activePanelId: 0,
  };
}

// ── Process Step (per-panel) ────────────────────────

function processPanelStep(panel: PanelState, nextIndex: number): PanelState {
  if (nextIndex >= panel.allCandles.length) return panel;

  const candle = panel.allCandles[nextIndex];
  let account = { ...panel.account };

  const { filled, cancelledIds } = matchOrdersWithOCO(candle, account.pendingOrders);

  for (const { order, fillPrice } of filled) {
    const result = applyFill(account.position, order.side, fillPrice, order.quantity);
    const trade: SimTrade = {
      id: genId(),
      side: order.side,
      price: fillPrice,
      quantity: order.quantity,
      timestamp: candle.time,
      orderId: order.id,
      pnl: result.realizedPnl !== 0 ? result.realizedPnl : null,
    };

    account = {
      ...account,
      position: result.position,
      balance: account.balance + result.realizedPnl,
      trades: [...account.trades, trade],
      pendingOrders: account.pendingOrders.map((o) =>
        o.id === order.id ? { ...o, status: "filled" as const } : o
      ),
    };
  }

  // Remove filled and OCO-cancelled orders
  account = {
    ...account,
    pendingOrders: account.pendingOrders.filter(
      (o) => o.status === "pending" && !cancelledIds.has(o.id)
    ),
  };

  // Update unrealized PnL
  account = {
    ...account,
    position: {
      ...account.position,
      unrealizedPnl: calculateUnrealizedPnl(account.position, candle.close),
    },
  };

  return { ...panel, account };
}

// ── Panel-scoped order placement ────────────────────

function placePanelOrder(
  panel: PanelState,
  currentIndex: number,
  side: SimSide,
  orderType: SimOrderType,
  quantity: number,
  price: number
): PanelState {
  const candle = panel.allCandles[currentIndex];
  if (!candle) return panel;

  if (orderType === "market") {
    const order = createMarketOrder(side, quantity, candle.close, candle.time);
    const result = applyFill(panel.account.position, side, candle.close, quantity);
    const trade: SimTrade = {
      id: genId(),
      side,
      price: candle.close,
      quantity,
      timestamp: candle.time,
      orderId: order.id,
      pnl: result.realizedPnl !== 0 ? result.realizedPnl : null,
    };

    return {
      ...panel,
      account: {
        ...panel.account,
        position: {
          ...result.position,
          unrealizedPnl: calculateUnrealizedPnl(result.position, candle.close),
        },
        balance: panel.account.balance + result.realizedPnl,
        trades: [...panel.account.trades, trade],
      },
    };
  }

  // Limit, stop, or bracket entry -> pending
  const pendingOrder: SimOrder = {
    id: genId(),
    type: orderType === "bracket" ? "limit" : orderType,
    side,
    price,
    quantity,
    timestamp: candle.time,
    status: "pending",
  };

  return {
    ...panel,
    account: {
      ...panel.account,
      pendingOrders: [...panel.account.pendingOrders, pendingOrder],
    },
  };
}

function placePanelBracket(
  panel: PanelState,
  currentIndex: number,
  side: SimSide,
  quantity: number,
  tpPrice: number,
  slPrice: number
): PanelState {
  const candle = panel.allCandles[currentIndex];
  if (!candle) return panel;

  // Market entry
  const order = createMarketOrder(side, quantity, candle.close, candle.time);
  const result = applyFill(panel.account.position, side, candle.close, quantity);
  const trade: SimTrade = {
    id: genId(),
    side,
    price: candle.close,
    quantity,
    timestamp: candle.time,
    orderId: order.id,
    pnl: result.realizedPnl !== 0 ? result.realizedPnl : null,
  };

  // Create TP + SL OCO pair
  const bracketOrders = createBracketOrders(side, quantity, tpPrice, slPrice, candle.time);

  return {
    ...panel,
    account: {
      ...panel.account,
      position: {
        ...result.position,
        unrealizedPnl: calculateUnrealizedPnl(result.position, candle.close),
      },
      balance: panel.account.balance + result.realizedPnl,
      trades: [...panel.account.trades, trade],
      pendingOrders: [...panel.account.pendingOrders, ...bracketOrders],
    },
  };
}

function flattenPanel(panel: PanelState, currentIndex: number): PanelState {
  const pos = panel.account.position;
  if (pos.side === "flat") return panel;
  const candle = panel.allCandles[currentIndex];
  if (!candle) return panel;

  const closeSide: SimSide = pos.side === "long" ? "sell" : "buy";
  const result = applyFill(pos, closeSide, candle.close, pos.quantity);
  const trade: SimTrade = {
    id: genId(),
    side: closeSide,
    price: candle.close,
    quantity: pos.quantity,
    timestamp: candle.time,
    orderId: "flatten",
    pnl: result.realizedPnl,
  };

  return {
    ...panel,
    account: {
      ...panel.account,
      position: result.position,
      balance: panel.account.balance + result.realizedPnl,
      trades: [...panel.account.trades, trade],
    },
  };
}

function reversePanel(panel: PanelState, currentIndex: number): PanelState {
  const pos = panel.account.position;
  if (pos.side === "flat") return panel;
  const candle = panel.allCandles[currentIndex];
  if (!candle) return panel;

  const closeSide: SimSide = pos.side === "long" ? "sell" : "buy";
  const closeResult = applyFill(pos, closeSide, candle.close, pos.quantity);
  const closeTrade: SimTrade = {
    id: genId(),
    side: closeSide,
    price: candle.close,
    quantity: pos.quantity,
    timestamp: candle.time,
    orderId: "reverse-close",
    pnl: closeResult.realizedPnl,
  };

  const reverseSide = closeSide;
  const reverseResult = applyFill(closeResult.position, reverseSide, candle.close, pos.quantity);
  const openTrade: SimTrade = {
    id: genId(),
    side: reverseSide,
    price: candle.close,
    quantity: pos.quantity,
    timestamp: candle.time,
    orderId: "reverse-open",
    pnl: null,
  };

  return {
    ...panel,
    account: {
      ...panel.account,
      position: { ...reverseResult.position, unrealizedPnl: 0 },
      balance: panel.account.balance + closeResult.realizedPnl,
      trades: [...panel.account.trades, closeTrade, openTrade],
    },
  };
}

// ── Update a single panel in the array ──────────────

function updatePanel(
  panels: MultiSimState["panels"],
  panelId: number,
  updater: (p: PanelState) => PanelState
): MultiSimState["panels"] {
  return panels.map((p, i) => (i === panelId ? updater(p) : p)) as MultiSimState["panels"];
}

// ── Reducer ─────────────────────────────────────────

export function multiSimReducer(state: MultiSimState, action: MultiSimAction): MultiSimState {
  switch (action.type) {
    // ── Shared playback ──

    case "STEP_FORWARD": {
      const maxCandles = Math.max(...state.panels.map((p) => p.allCandles.length));
      if (state.currentIndex >= maxCandles - 1) {
        return { ...state, isPlaying: false };
      }
      const nextIndex = state.currentIndex + 1;
      return {
        ...state,
        currentIndex: nextIndex,
        panels: state.panels.map((panel) =>
          processPanelStep(panel, nextIndex)
        ) as MultiSimState["panels"],
      };
    }

    case "STEP_BACK":
      if (state.currentIndex <= 0) return state;
      return { ...state, currentIndex: state.currentIndex - 1 };

    case "JUMP_START":
      return { ...state, currentIndex: 0, isPlaying: false };

    case "JUMP_END": {
      const maxCandles = Math.max(...state.panels.map((p) => p.allCandles.length));
      return { ...state, currentIndex: Math.max(0, maxCandles - 1), isPlaying: false };
    }

    case "SEEK": {
      const maxCandles = Math.max(...state.panels.map((p) => p.allCandles.length));
      const targetIndex = Math.max(0, Math.min(action.index, maxCandles - 1));
      // Update unrealized PnL for all panels at the new index
      const seekPanels = state.panels.map((panel) => {
        const candle = panel.allCandles[Math.min(targetIndex, panel.allCandles.length - 1)];
        if (!candle) return panel;
        return {
          ...panel,
          account: {
            ...panel.account,
            position: {
              ...panel.account.position,
              unrealizedPnl: calculateUnrealizedPnl(panel.account.position, candle.close),
            },
          },
        };
      }) as MultiSimState["panels"];
      return { ...state, currentIndex: targetIndex, isPlaying: false, panels: seekPanels };
    }

    case "SET_PLAYING":
      return { ...state, isPlaying: action.isPlaying };

    case "SET_SPEED":
      return { ...state, speed: action.speed };

    case "SET_DATE":
      return { ...state, date: action.date, isPlaying: false, currentIndex: 0 };

    case "SET_INTERVAL":
      return { ...state, interval: action.interval, isPlaying: false, currentIndex: 0 };

    // ── Per-panel data ──

    case "SET_PANEL_LOADING":
      return {
        ...state,
        panels: updatePanel(state.panels, action.panelId, (p) => ({
          ...p,
          loading: true,
          error: null,
        })),
      };

    case "SET_PANEL_CANDLES":
      return {
        ...state,
        panels: updatePanel(state.panels, action.panelId, (p) => ({
          ...p,
          allCandles: action.candles,
          loading: false,
          account: createInitialAccount(),
        })),
        currentIndex: Math.min(100, action.candles.length - 1),
        isPlaying: false,
      };

    case "SET_PANEL_ERROR":
      return {
        ...state,
        panels: updatePanel(state.panels, action.panelId, (p) => ({
          ...p,
          error: action.error,
          loading: false,
        })),
      };

    case "SET_PANEL_SYMBOL":
      return {
        ...state,
        panels: updatePanel(state.panels, action.panelId, (p) => ({
          ...p,
          symbol: action.symbol,
        })),
        isPlaying: false,
      };

    // ── Per-panel trading ──

    case "PLACE_ORDER":
      return {
        ...state,
        panels: updatePanel(state.panels, action.panelId, (p) =>
          placePanelOrder(p, state.currentIndex, action.side, action.orderType, action.quantity, action.price)
        ),
      };

    case "PLACE_BRACKET":
      return {
        ...state,
        panels: updatePanel(state.panels, action.panelId, (p) =>
          placePanelBracket(p, state.currentIndex, action.side, action.quantity, action.tpPrice, action.slPrice)
        ),
      };

    case "FLATTEN":
      return {
        ...state,
        panels: updatePanel(state.panels, action.panelId, (p) =>
          flattenPanel(p, state.currentIndex)
        ),
      };

    case "REVERSE":
      return {
        ...state,
        panels: updatePanel(state.panels, action.panelId, (p) =>
          reversePanel(p, state.currentIndex)
        ),
      };

    case "CANCEL_ORDER":
      return {
        ...state,
        panels: updatePanel(state.panels, action.panelId, (p) => ({
          ...p,
          account: {
            ...p.account,
            pendingOrders: p.account.pendingOrders.filter((o) => o.id !== action.orderId),
          },
        })),
      };

    case "SET_ORDER_QUANTITY":
      return {
        ...state,
        panels: updatePanel(state.panels, action.panelId, (p) => ({
          ...p,
          orderQuantity: action.quantity,
        })),
      };

    case "TOGGLE_PANEL_COLLAPSE":
      return {
        ...state,
        panels: updatePanel(state.panels, action.panelId, (p) => ({
          ...p,
          collapsed: !p.collapsed,
        })),
      };

    case "SET_ACTIVE_PANEL":
      return { ...state, activePanelId: action.panelId };

    // ── Global ──

    case "RESET_ALL":
      return {
        ...state,
        currentIndex: 0,
        isPlaying: false,
        panels: state.panels.map((p) => ({
          ...p,
          account: createInitialAccount(),
        })) as MultiSimState["panels"],
      };

    default:
      return state;
  }
}

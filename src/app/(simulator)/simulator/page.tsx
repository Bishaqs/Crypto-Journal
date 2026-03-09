"use client";

import { useReducer, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw, Maximize2, PanelRight } from "lucide-react";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { FeatureInfoBox } from "@/components/ui/feature-info-box";
import { FEATURE_INFO } from "@/lib/feature-info-content";
import ChartContainer from "@/components/simulator/chart-container";
import PlaybackControls from "@/components/simulator/playback-controls";
import OrderPanel from "@/components/simulator/order-panel";
import TradeLog from "@/components/simulator/trade-log";
import PendingOrders from "@/components/simulator/pending-orders";
import SessionStats from "@/components/simulator/session-stats";
import SymbolSelector from "@/components/simulator/symbol-selector";
import { fetchKlines, getDayRange } from "@/lib/simulator/binance-klines";
import { matchOrders, createMarketOrder, genId } from "@/lib/simulator/engine";
import {
  createFlatPosition,
  applyFill,
  calculateUnrealizedPnl,
} from "@/lib/simulator/position-tracker";
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
} from "@/lib/simulator/types";

// ── State ──────────────────────────────────────────────

type State = {
  // Data
  allCandles: BinanceKline[];
  loading: boolean;
  error: string | null;

  // Settings
  symbol: SupportedSymbol;
  interval: SimInterval;
  date: string;

  // Playback
  currentIndex: number;
  isPlaying: boolean;
  speed: PlaybackSpeed;

  // Account
  account: SimAccount;

  // UI
  orderQuantity: string;
  chartExpanded: boolean;
};

type Action =
  | { type: "SET_LOADING" }
  | { type: "SET_CANDLES"; candles: BinanceKline[] }
  | { type: "SET_ERROR"; error: string }
  | { type: "SET_SYMBOL"; symbol: SupportedSymbol }
  | { type: "SET_INTERVAL"; interval: SimInterval }
  | { type: "SET_DATE"; date: string }
  | { type: "STEP_FORWARD" }
  | { type: "STEP_BACK" }
  | { type: "JUMP_START" }
  | { type: "JUMP_END" }
  | { type: "SET_PLAYING"; isPlaying: boolean }
  | { type: "SET_SPEED"; speed: PlaybackSpeed }
  | { type: "PLACE_ORDER"; side: SimSide; orderType: SimOrderType; quantity: number; price: number }
  | { type: "FLATTEN" }
  | { type: "REVERSE" }
  | { type: "RESET_ACCOUNT" }
  | { type: "SEEK"; index: number }
  | { type: "CANCEL_ORDER"; orderId: string }
  | { type: "SET_ORDER_QUANTITY"; quantity: string }
  | { type: "TOGGLE_CHART_EXPAND" };

const STARTING_BALANCE = 10000;

function getYesterday(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

function createInitialAccount(): SimAccount {
  return {
    startingBalance: STARTING_BALANCE,
    balance: STARTING_BALANCE,
    position: createFlatPosition(),
    trades: [],
    pendingOrders: [],
  };
}

function initialState(): State {
  return {
    allCandles: [],
    loading: true,
    error: null,
    symbol: "BTCUSDT",
    interval: "1m",
    date: getYesterday(),
    currentIndex: 0,
    isPlaying: false,
    speed: 1,
    account: createInitialAccount(),
    orderQuantity: "0.1",
    chartExpanded: false,
  };
}

function processStep(state: State): State {
  if (state.currentIndex >= state.allCandles.length - 1) {
    return { ...state, isPlaying: false };
  }

  const nextIndex = state.currentIndex + 1;
  const candle = state.allCandles[nextIndex];
  let account = { ...state.account };

  // Match pending orders against the new candle
  const fills = matchOrders(candle, account.pendingOrders);

  for (const { order, fillPrice } of fills) {
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

  // Remove filled orders from pending
  account = {
    ...account,
    pendingOrders: account.pendingOrders.filter((o) => o.status === "pending"),
  };

  // Update unrealized PnL
  account = {
    ...account,
    position: {
      ...account.position,
      unrealizedPnl: calculateUnrealizedPnl(account.position, candle.close),
    },
  };

  return { ...state, currentIndex: nextIndex, account };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: true, error: null };

    case "SET_CANDLES":
      return {
        ...state,
        allCandles: action.candles,
        currentIndex: Math.min(100, action.candles.length - 1),
        isPlaying: false,
        loading: false,
        account: createInitialAccount(),
      };

    case "SET_ERROR":
      return { ...state, error: action.error, loading: false };

    case "SET_SYMBOL":
      return { ...state, symbol: action.symbol, isPlaying: false };

    case "SET_INTERVAL":
      return { ...state, interval: action.interval, isPlaying: false };

    case "SET_DATE":
      return { ...state, date: action.date, isPlaying: false };

    case "STEP_FORWARD":
      return processStep(state);

    case "STEP_BACK":
      if (state.currentIndex <= 0) return state;
      return { ...state, currentIndex: state.currentIndex - 1 };

    case "JUMP_START":
      return { ...state, currentIndex: 0, isPlaying: false };

    case "JUMP_END":
      return {
        ...state,
        currentIndex: Math.max(0, state.allCandles.length - 1),
        isPlaying: false,
      };

    case "SET_PLAYING":
      return { ...state, isPlaying: action.isPlaying };

    case "SET_SPEED":
      return { ...state, speed: action.speed };

    case "PLACE_ORDER": {
      const candle = state.allCandles[state.currentIndex];
      if (!candle) return state;

      if (action.orderType === "market") {
        const order = createMarketOrder(action.side, action.quantity, candle.close, candle.time);
        const result = applyFill(state.account.position, action.side, candle.close, action.quantity);
        const trade: SimTrade = {
          id: genId(),
          side: action.side,
          price: candle.close,
          quantity: action.quantity,
          timestamp: candle.time,
          orderId: order.id,
          pnl: result.realizedPnl !== 0 ? result.realizedPnl : null,
        };

        return {
          ...state,
          account: {
            ...state.account,
            position: {
              ...result.position,
              unrealizedPnl: calculateUnrealizedPnl(result.position, candle.close),
            },
            balance: state.account.balance + result.realizedPnl,
            trades: [...state.account.trades, trade],
          },
        };
      }

      // Limit or stop order -> add to pending
      const pendingOrder: SimOrder = {
        id: genId(),
        type: action.orderType,
        side: action.side,
        price: action.price,
        quantity: action.quantity,
        timestamp: candle.time,
        status: "pending",
      };

      return {
        ...state,
        account: {
          ...state.account,
          pendingOrders: [...state.account.pendingOrders, pendingOrder],
        },
      };
    }

    case "FLATTEN": {
      const pos = state.account.position;
      if (pos.side === "flat") return state;
      const candle = state.allCandles[state.currentIndex];
      if (!candle) return state;

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
        ...state,
        account: {
          ...state.account,
          position: result.position,
          balance: state.account.balance + result.realizedPnl,
          trades: [...state.account.trades, trade],
        },
      };
    }

    case "REVERSE": {
      const pos = state.account.position;
      if (pos.side === "flat") return state;
      const candle = state.allCandles[state.currentIndex];
      if (!candle) return state;

      // Close current position
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

      // Enter opposite with same size
      const openResult = applyFill(closeResult.position, closeSide === "buy" ? "buy" : "sell" , candle.close, pos.quantity);

      // Actually open the reverse: if we closed a long (sold), we now buy to go long again? No—
      // We closed a long by selling, and reverse means go short. So open side = sell.
      // closeSide = "sell" (closed long) -> open side should be "sell" (short)
      // closeSide = "buy" (closed short) -> open side should be "buy" (long)
      // Wait, that would re-enter same direction. Let me reconsider.
      // If pos.side=long, closeSide=sell (flatten), then to reverse we enter SHORT = sell again.
      // But after flatten we're flat, so selling goes short. closeSide is already correct for reverse.
      const reverseSide = closeSide; // sell if was long, buy if was short
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
        ...state,
        account: {
          ...state.account,
          position: {
            ...reverseResult.position,
            unrealizedPnl: 0,
          },
          balance: state.account.balance + closeResult.realizedPnl,
          trades: [...state.account.trades, closeTrade, openTrade],
        },
      };
    }

    case "RESET_ACCOUNT":
      return {
        ...state,
        currentIndex: 0,
        isPlaying: false,
        account: createInitialAccount(),
      };

    case "CANCEL_ORDER":
      return {
        ...state,
        account: {
          ...state.account,
          pendingOrders: state.account.pendingOrders.filter((o) => o.id !== action.orderId),
        },
      };

    case "SET_ORDER_QUANTITY":
      return { ...state, orderQuantity: action.quantity };

    case "TOGGLE_CHART_EXPAND":
      return { ...state, chartExpanded: !state.chartExpanded };

    case "SEEK": {
      const targetIndex = Math.max(0, Math.min(action.index, state.allCandles.length - 1));
      const candle = state.allCandles[targetIndex];
      let account = state.account;
      if (candle) {
        account = {
          ...account,
          position: {
            ...account.position,
            unrealizedPnl: calculateUnrealizedPnl(account.position, candle.close),
          },
        };
      }
      return { ...state, currentIndex: targetIndex, isPlaying: false, account };
    }

    default:
      return state;
  }
}

// ── Component ──────────────────────────────────────────

export default function PaperTradingPage() {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const intervalIdRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load candles when symbol/date/interval changes
  const loadCandles = useCallback(async () => {
    dispatch({ type: "SET_LOADING" });
    try {
      const { startTime, endTime } = getDayRange(state.date);
      const candles = await fetchKlines(state.symbol, state.interval, startTime, endTime);
      if (candles.length === 0) {
        dispatch({ type: "SET_ERROR", error: "No data available for this date/symbol" });
        return;
      }
      dispatch({ type: "SET_CANDLES", candles });
    } catch (err) {
      dispatch({ type: "SET_ERROR", error: err instanceof Error ? err.message : "Failed to load data" });
    }
  }, [state.symbol, state.date, state.interval]);

  // Auto-load on settings change
  useEffect(() => {
    loadCandles();
  }, [loadCandles]);

  // Playback timer
  useEffect(() => {
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }

    if (state.isPlaying) {
      const ms = Math.max(50, 1000 / state.speed);
      intervalIdRef.current = setInterval(() => {
        dispatch({ type: "STEP_FORWARD" });
      }, ms);
    }

    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    };
  }, [state.isPlaying, state.speed]);

  // Stop playing when reaching the end
  useEffect(() => {
    if (state.currentIndex >= state.allCandles.length - 1 && state.isPlaying) {
      dispatch({ type: "SET_PLAYING", isPlaying: false });
    }
  }, [state.currentIndex, state.allCandles.length, state.isPlaying]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;

      switch (e.key) {
        case " ":
          e.preventDefault();
          dispatch({ type: "SET_PLAYING", isPlaying: !state.isPlaying });
          break;
        case "ArrowRight":
          if (!state.isPlaying) dispatch({ type: "STEP_FORWARD" });
          break;
        case "ArrowLeft":
          if (!state.isPlaying) dispatch({ type: "STEP_BACK" });
          break;
        case "b":
        case "B": {
          const qty = parseFloat(state.orderQuantity);
          if (qty > 0 && currentPrice > 0) {
            dispatch({ type: "PLACE_ORDER", side: "buy", orderType: "market", quantity: qty, price: currentPrice });
          }
          break;
        }
        case "s":
        case "S": {
          const qty = parseFloat(state.orderQuantity);
          if (qty > 0 && currentPrice > 0) {
            dispatch({ type: "PLACE_ORDER", side: "sell", orderType: "market", quantity: qty, price: currentPrice });
          }
          break;
        }
        case "f":
        case "F":
          dispatch({ type: "FLATTEN" });
          break;
        case "r":
        case "R":
          dispatch({ type: "REVERSE" });
          break;
        case "e":
        case "E":
          dispatch({ type: "TOGGLE_CHART_EXPAND" });
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state.isPlaying, state.orderQuantity, state.currentIndex, state.allCandles]);

  // Visible candles (up to current index)
  const visibleCandles = state.allCandles.slice(0, state.currentIndex + 1);
  const currentCandle = state.allCandles[state.currentIndex];
  const currentPrice = currentCandle?.close ?? 0;

  // Build chart markers from trades
  const markers = state.account.trades.map((t) => ({
    time: t.timestamp,
    side: t.side,
    price: t.price,
  }));

  // Current time string
  const currentTime = currentCandle
    ? new Date(currentCandle.time * 1000).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : "--";

  return (
    <>
      {/* Top Bar */}
      <div className="flex items-center gap-4 px-4 py-2.5 bg-[#111118] border-b border-white/5 shrink-0">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </Link>

        <h1 className="text-sm font-semibold text-white flex items-center gap-1.5">Paper Trading <InfoTooltip text="Practice trading with simulated money on real historical price data. Place market, limit, stop, and bracket orders to sharpen your execution." size={14} position="below" /></h1>

        <div className="ml-4">
          <SymbolSelector
            symbol={state.symbol}
            interval={state.interval}
            date={state.date}
            onSymbolChange={(s) => dispatch({ type: "SET_SYMBOL", symbol: s })}
            onIntervalChange={(i) => dispatch({ type: "SET_INTERVAL", interval: i })}
            onDateChange={(d) => dispatch({ type: "SET_DATE", date: d })}
            loading={state.loading}
          />
        </div>

        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={() => dispatch({ type: "TOGGLE_CHART_EXPAND" })}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors"
            title={state.chartExpanded ? "Show order panel (E)" : "Expand chart (E)"}
          >
            {state.chartExpanded ? <PanelRight size={14} /> : <Maximize2 size={14} />}
            {state.chartExpanded ? "Panel" : "Expand"}
          </button>
          <button
            onClick={() => dispatch({ type: "RESET_ACCOUNT" })}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors"
            title="Reset simulation"
          >
            <RotateCcw size={14} />
            Reset
          </button>
        </div>
      </div>

      <FeatureInfoBox variant="simulator" {...FEATURE_INFO["paper-trading"]} />

      {/* Main Content */}
      <div className="flex flex-1 min-h-0">
        {/* Chart Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {state.error ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-red-400 text-sm mb-2">{state.error}</p>
                <button
                  onClick={loadCandles}
                  className="text-xs text-gray-400 hover:text-white underline"
                >
                  Try again
                </button>
              </div>
            </div>
          ) : state.loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-500">Loading candles...</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 min-h-0">
              <ChartContainer candles={visibleCandles} markers={markers} />
            </div>
          )}

          {/* Playback Controls */}
          <PlaybackControls
            isPlaying={state.isPlaying}
            speed={state.speed}
            currentIndex={state.currentIndex}
            totalCandles={state.allCandles.length}
            currentTime={currentTime}
            onPlay={() => dispatch({ type: "SET_PLAYING", isPlaying: true })}
            onPause={() => dispatch({ type: "SET_PLAYING", isPlaying: false })}
            onStepForward={() => dispatch({ type: "STEP_FORWARD" })}
            onStepBack={() => dispatch({ type: "STEP_BACK" })}
            onJumpStart={() => dispatch({ type: "JUMP_START" })}
            onJumpEnd={() => dispatch({ type: "JUMP_END" })}
            onSpeedChange={(s) => dispatch({ type: "SET_SPEED", speed: s })}
            onSeek={(index) => dispatch({ type: "SEEK", index })}
          />

          {/* Trade Log */}
          <TradeLog trades={state.account.trades} />

          {/* Session Stats */}
          <SessionStats
            trades={state.account.trades}
            balance={state.account.balance}
            startingBalance={state.account.startingBalance}
          />
        </div>

        {/* Order Panel + Pending Orders */}
        {!state.chartExpanded && <div className="w-64 flex flex-col bg-[#111118] border-l border-white/5">
          <div className="flex-1 overflow-y-auto">
            <OrderPanel
              position={state.account.position}
              currentPrice={currentPrice}
              currentVolume={currentCandle?.volume ?? 0}
              balance={state.account.balance}
              startingBalance={state.account.startingBalance}
              trades={state.account.trades}
              quantity={state.orderQuantity}
              onQuantityChange={(q) => dispatch({ type: "SET_ORDER_QUANTITY", quantity: q })}
              onPlaceOrder={(side, orderType, quantity, price) =>
                dispatch({ type: "PLACE_ORDER", side, orderType, quantity, price })
              }
              onFlatten={() => dispatch({ type: "FLATTEN" })}
              onReverse={() => dispatch({ type: "REVERSE" })}
            />
          </div>
          <PendingOrders
            orders={state.account.pendingOrders}
            currentPrice={currentPrice}
            onCancel={(id) => dispatch({ type: "CANCEL_ORDER", orderId: id })}
          />
        </div>}
      </div>
    </>
  );
}

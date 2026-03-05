"use client";

import { memo, useMemo } from "react";
import ChartContainer from "./chart-container";
import PanelHeader from "./panel-header";
import CompactOrderPanel from "./compact-order-panel";
import type { PanelState, MultiSimAction } from "@/lib/simulator/multi-sim-reducer";

interface SimulatorPanelProps {
  panelId: number;
  panel: PanelState;
  isActive: boolean;
  currentIndex: number;
  dispatch: React.Dispatch<MultiSimAction>;
}

function SimulatorPanelInner({
  panelId,
  panel,
  isActive,
  currentIndex,
  dispatch,
}: SimulatorPanelProps) {
  const clampedIndex = Math.min(currentIndex, panel.allCandles.length - 1);
  const visibleCandles = panel.allCandles.slice(0, clampedIndex + 1);
  const currentCandle = panel.allCandles[clampedIndex];
  const currentPrice = currentCandle?.close ?? 0;

  const markers = useMemo(
    () =>
      panel.account.trades.map((t) => ({
        time: t.timestamp,
        side: t.side,
        price: t.price,
      })),
    [panel.account.trades]
  );

  return (
    <div
      className={`flex flex-col min-h-0 border ${
        isActive ? "border-blue-500/30" : "border-white/5"
      } bg-[#0a0a0f]`}
      onClick={() => dispatch({ type: "SET_ACTIVE_PANEL", panelId })}
    >
      <PanelHeader
        panelId={panelId}
        symbol={panel.symbol}
        isActive={isActive}
        isCollapsed={panel.collapsed}
        currentPrice={currentPrice}
        unrealizedPnl={panel.account.position.unrealizedPnl}
        lastVolume={currentCandle?.volume ?? 0}
        remainingQty={panel.account.position.quantity}
        positionSide={panel.account.position.side}
        loading={panel.loading}
        onSymbolChange={(s) =>
          dispatch({ type: "SET_PANEL_SYMBOL", panelId, symbol: s })
        }
        onToggleCollapse={() =>
          dispatch({ type: "TOGGLE_PANEL_COLLAPSE", panelId })
        }
        onActivate={() => dispatch({ type: "SET_ACTIVE_PANEL", panelId })}
      />

      {/* Chart area */}
      <div className="flex-1 min-h-0">
        {panel.error ? (
          <div className="flex-1 h-full flex items-center justify-center">
            <p className="text-red-400 text-[10px]">{panel.error}</p>
          </div>
        ) : panel.loading ? (
          <div className="flex-1 h-full flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        ) : (
          <ChartContainer candles={visibleCandles} markers={markers} />
        )}
      </div>

      {/* Collapsible order panel */}
      {!panel.collapsed && (
        <CompactOrderPanel
          position={panel.account.position}
          currentPrice={currentPrice}
          balance={panel.account.balance}
          quantity={panel.orderQuantity}
          onQuantityChange={(q) =>
            dispatch({ type: "SET_ORDER_QUANTITY", panelId, quantity: q })
          }
          onPlaceOrder={(side, orderType, quantity, price) =>
            dispatch({ type: "PLACE_ORDER", panelId, side, orderType, quantity, price })
          }
          onPlaceBracket={(side, quantity, tpPrice, slPrice) =>
            dispatch({ type: "PLACE_BRACKET", panelId, side, quantity, tpPrice, slPrice })
          }
          onFlatten={() => dispatch({ type: "FLATTEN", panelId })}
          onReverse={() => dispatch({ type: "REVERSE", panelId })}
          pendingOrders={panel.account.pendingOrders}
          onCancelOrder={(orderId) =>
            dispatch({ type: "CANCEL_ORDER", panelId, orderId })
          }
        />
      )}
    </div>
  );
}

const SimulatorPanel = memo(SimulatorPanelInner);
export default SimulatorPanel;

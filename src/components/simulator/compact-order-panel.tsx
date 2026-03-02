"use client";

import { useState } from "react";
import type { SimSide, SimOrderType, SimPosition, SimOrder } from "@/lib/simulator/types";

interface CompactOrderPanelProps {
  position: SimPosition;
  currentPrice: number;
  balance: number;
  quantity: string;
  onQuantityChange: (qty: string) => void;
  onPlaceOrder: (side: SimSide, type: SimOrderType, quantity: number, price: number) => void;
  onPlaceBracket: (side: SimSide, quantity: number, tpPrice: number, slPrice: number) => void;
  onFlatten: () => void;
  onReverse: () => void;
  pendingOrders: SimOrder[];
  onCancelOrder: (orderId: string) => void;
}

type OrderMode = "market" | "limit" | "stop" | "bracket";

export default function CompactOrderPanel({
  position,
  currentPrice,
  balance,
  quantity,
  onQuantityChange,
  onPlaceOrder,
  onPlaceBracket,
  onFlatten,
  onReverse,
  pendingOrders,
  onCancelOrder,
}: CompactOrderPanelProps) {
  const [orderMode, setOrderMode] = useState<OrderMode>("market");
  const [limitPrice, setLimitPrice] = useState("");
  const [tpPrice, setTpPrice] = useState("");
  const [slPrice, setSlPrice] = useState("");

  const qty = parseFloat(quantity);
  const isValidQty = !isNaN(qty) && qty > 0;

  function handleOrder(side: SimSide) {
    if (!isValidQty) return;

    if (orderMode === "bracket") {
      const tp = parseFloat(tpPrice);
      const sl = parseFloat(slPrice);
      if (isNaN(tp) || tp <= 0 || isNaN(sl) || sl <= 0) return;
      onPlaceBracket(side, qty, tp, sl);
      return;
    }

    const price = orderMode === "market" ? currentPrice : parseFloat(limitPrice);
    if (orderMode !== "market" && (isNaN(price) || price <= 0)) return;
    onPlaceOrder(side, orderMode, qty, price);
  }

  const MODES: OrderMode[] = ["market", "limit", "stop", "bracket"];

  return (
    <div className="px-2 py-1.5 bg-[#0e0e14] border-t border-white/5 space-y-1.5">
      {/* Order type tabs */}
      <div className="flex items-center gap-1">
        {MODES.map((m) => (
          <button
            key={m}
            onClick={() => setOrderMode(m)}
            className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
              orderMode === m
                ? "bg-white/15 text-white"
                : "text-gray-600 hover:text-gray-400 hover:bg-white/5"
            }`}
          >
            {m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}

        {/* Qty input */}
        <input
          type="number"
          value={quantity}
          onChange={(e) => onQuantityChange(e.target.value)}
          className="ml-auto w-16 px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[10px] text-white font-mono outline-none focus:border-white/20"
          step="any"
          min="0"
          placeholder="Qty"
        />
      </div>

      {/* Price inputs for limit/stop */}
      {(orderMode === "limit" || orderMode === "stop") && (
        <input
          type="number"
          value={limitPrice}
          onChange={(e) => setLimitPrice(e.target.value)}
          placeholder={`${orderMode === "limit" ? "Limit" : "Stop"} price (${currentPrice.toFixed(2)})`}
          className="w-full px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[10px] text-white font-mono outline-none focus:border-white/20"
          step="any"
        />
      )}

      {/* Bracket TP/SL inputs */}
      {orderMode === "bracket" && (
        <div className="flex gap-1">
          <input
            type="number"
            value={tpPrice}
            onChange={(e) => setTpPrice(e.target.value)}
            placeholder="Take Profit"
            className="flex-1 px-1.5 py-0.5 bg-white/5 border border-emerald-500/20 rounded text-[10px] text-white font-mono outline-none focus:border-emerald-500/40"
            step="any"
          />
          <input
            type="number"
            value={slPrice}
            onChange={(e) => setSlPrice(e.target.value)}
            placeholder="Stop Loss"
            className="flex-1 px-1.5 py-0.5 bg-white/5 border border-red-500/20 rounded text-[10px] text-white font-mono outline-none focus:border-red-500/40"
            step="any"
          />
        </div>
      )}

      {/* Buy/Sell + Flatten/Reverse */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => handleOrder("buy")}
          disabled={!isValidQty}
          className="flex-1 py-1 rounded text-[10px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-30"
        >
          Buy
        </button>
        <button
          onClick={() => handleOrder("sell")}
          disabled={!isValidQty}
          className="flex-1 py-1 rounded text-[10px] font-bold bg-red-600 hover:bg-red-500 text-white transition-colors disabled:opacity-30"
        >
          Sell
        </button>
        {position.side !== "flat" && (
          <>
            <button
              onClick={onFlatten}
              className="px-2 py-1 rounded text-[10px] font-medium bg-blue-600/80 hover:bg-blue-500 text-white transition-colors"
            >
              Flat
            </button>
            <button
              onClick={onReverse}
              className="px-2 py-1 rounded text-[10px] font-medium bg-purple-600/80 hover:bg-purple-500 text-white transition-colors"
            >
              Rev
            </button>
          </>
        )}
      </div>

      {/* Pending orders (compact) */}
      {pendingOrders.length > 0 && (
        <div className="space-y-0.5">
          {pendingOrders.map((o) => (
            <div key={o.id} className="flex items-center gap-1 text-[9px]">
              <span className={`font-mono ${o.bracketRole === "take-profit" ? "text-emerald-400" : o.bracketRole === "stop-loss" ? "text-red-400" : o.side === "buy" ? "text-emerald-400" : "text-red-400"}`}>
                {o.bracketRole ? (o.bracketRole === "take-profit" ? "TP" : "SL") : o.type.toUpperCase()}
              </span>
              <span className="text-gray-500">
                {o.side === "buy" ? "B" : "S"} @ {o.price.toFixed(2)}
              </span>
              <span className="text-gray-600">×{o.quantity}</span>
              <button
                onClick={() => onCancelOrder(o.id)}
                className="ml-auto text-gray-600 hover:text-red-400 transition-colors"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

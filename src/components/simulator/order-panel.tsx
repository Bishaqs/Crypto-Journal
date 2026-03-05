"use client";

import { useState } from "react";
import type { SimPosition, SimOrderType, SimSide, SimTrade } from "@/lib/simulator/types";

interface OrderPanelProps {
  position: SimPosition;
  currentPrice: number;
  currentVolume: number;
  balance: number;
  startingBalance: number;
  trades: SimTrade[];
  quantity: string;
  onQuantityChange: (qty: string) => void;
  onPlaceOrder: (side: SimSide, type: SimOrderType, quantity: number, price: number) => void;
  onFlatten: () => void;
  onReverse: () => void;
}

function formatPrice(price: number): string {
  if (price >= 1000) return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 1) return price.toFixed(4);
  return price.toFixed(6);
}

function formatPnl(pnl: number): string {
  const sign = pnl >= 0 ? "+" : "";
  return `${sign}$${pnl.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function OrderPanel({
  position,
  currentPrice,
  currentVolume,
  balance,
  startingBalance,
  trades,
  quantity,
  onQuantityChange,
  onPlaceOrder,
  onFlatten,
  onReverse,
}: OrderPanelProps) {
  const [orderType, setOrderType] = useState<SimOrderType>("market");
  const [limitPrice, setLimitPrice] = useState("");
  const [qtyMode, setQtyMode] = useState<"fixed" | "percent">("fixed");

  const setQuantity = onQuantityChange;

  const handleOrder = (side: SimSide) => {
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) return;

    const price = orderType === "market" ? currentPrice : parseFloat(limitPrice);
    if (orderType !== "market" && (isNaN(price) || price <= 0)) return;

    onPlaceOrder(side, orderType, qty, price);
  };

  const hasPosition = position.side !== "flat";

  return (
    <div className="flex flex-col">
      {/* Order Type Toggle */}
      <div className="p-3 border-b border-white/5">
        <div className="flex rounded-lg bg-white/5 p-0.5">
          {(["market", "limit", "stop"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setOrderType(t)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${
                orderType === t
                  ? "bg-white/10 text-white"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Price Input (limit & stop) */}
      {(orderType === "limit" || orderType === "stop") && (
        <div className="px-3 pt-3">
          <label className="text-xs text-gray-500 mb-1 block">
            {orderType === "limit" ? "Limit Price" : "Stop Price"}
          </label>
          <input
            type="number"
            value={limitPrice}
            onChange={(e) => setLimitPrice(e.target.value)}
            placeholder={formatPrice(currentPrice)}
            step="any"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-white/20"
          />
        </div>
      )}

      {/* Quantity Input */}
      <div className="px-3 pt-3">
        <label className="text-xs text-gray-500 mb-1 block">Quantity</label>
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          step="any"
          min="0"
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/20"
        />
        {/* Qty mode toggle */}
        <div className="flex rounded-md bg-white/5 p-0.5 mt-2 mb-1">
          <button
            onClick={() => setQtyMode("fixed")}
            className={`flex-1 py-1 text-[10px] font-medium rounded ${
              qtyMode === "fixed" ? "bg-white/10 text-white" : "text-gray-500"
            }`}
          >
            Fixed
          </button>
          <button
            onClick={() => setQtyMode("percent")}
            className={`flex-1 py-1 text-[10px] font-medium rounded ${
              qtyMode === "percent" ? "bg-white/10 text-white" : "text-gray-500"
            }`}
          >
            % Balance
          </button>
        </div>
        {/* Quick qty buttons */}
        {qtyMode === "fixed" ? (
          <div className="flex gap-1">
            {["0.01", "0.1", "0.5", "1"].map((q) => (
              <button
                key={q}
                onClick={() => setQuantity(q)}
                className={`flex-1 py-1 text-xs rounded transition-colors ${
                  quantity === q
                    ? "bg-white/15 text-white"
                    : "bg-white/5 text-gray-500 hover:text-gray-300"
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex gap-1">
            {[10, 25, 50, 75, 100].map((pct) => {
              const qty = currentPrice > 0 ? (balance * pct / 100) / currentPrice : 0;
              return (
                <button
                  key={pct}
                  onClick={() => setQuantity(qty.toFixed(6))}
                  className="flex-1 py-1 text-xs rounded bg-white/5 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {pct}%
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Buy / Sell Buttons */}
      <div className="p-3 pb-1 flex gap-2">
        <button
          onClick={() => handleOrder("buy")}
          className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors"
        >
          Buy
        </button>
        <button
          onClick={() => handleOrder("sell")}
          className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors"
        >
          Sell
        </button>
      </div>

      {/* Quick Buy/Sell % Shortcuts */}
      <div className="px-3 pb-3 space-y-1">
        <div className="flex gap-1">
          {[10, 25, 100].map((pct) => {
            const qty = currentPrice > 0 ? parseFloat(((balance * pct / 100) / currentPrice).toFixed(6)) : 0;
            return (
              <button
                key={`buy-${pct}`}
                onClick={() => qty > 0 && onPlaceOrder("buy", "market", qty, currentPrice)}
                disabled={qty <= 0}
                className="flex-1 py-1.5 text-[10px] font-medium rounded bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 transition-colors disabled:opacity-30"
              >
                Buy {pct}%
              </button>
            );
          })}
        </div>
        <div className="flex gap-1">
          {[10, 25, 100].map((pct) => {
            const qty = currentPrice > 0 ? parseFloat(((balance * pct / 100) / currentPrice).toFixed(6)) : 0;
            return (
              <button
                key={`sell-${pct}`}
                onClick={() => qty > 0 && onPlaceOrder("sell", "market", qty, currentPrice)}
                disabled={qty <= 0}
                className="flex-1 py-1.5 text-[10px] font-medium rounded bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors disabled:opacity-30"
              >
                Sell {pct}%
              </button>
            );
          })}
        </div>
      </div>

      {/* Position Info */}
      <div className="flex-1 px-3 pt-2 border-t border-white/5">
        <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-2">Position</h3>

        {hasPosition ? (
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Side</span>
              <span className={position.side === "long" ? "text-emerald-400" : "text-red-400"}>
                {position.side.toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Qty</span>
              <span className="text-white">{position.quantity}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Avg Entry</span>
              <span className="text-white font-mono">${formatPrice(position.avgEntryPrice)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Unrealized</span>
              <span
                className={`font-mono ${
                  position.unrealizedPnl >= 0 ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {formatPnl(position.unrealizedPnl)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Realized</span>
              <span
                className={`font-mono ${
                  position.realizedPnl >= 0 ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {formatPnl(position.realizedPnl)}
              </span>
            </div>
            {(() => {
              const totalPnl = position.realizedPnl + position.unrealizedPnl;
              return (
                <div className="flex justify-between text-sm pt-1 border-t border-white/5">
                  <span className="text-gray-400 font-medium">Total PnL</span>
                  <span className={`font-mono font-medium ${totalPnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {formatPnl(totalPnl)}
                  </span>
                </div>
              );
            })()}
          </div>
        ) : (
          <p className="text-sm text-gray-600">No open position</p>
        )}
      </div>

      {/* Market Info */}
      <div className="px-3 py-2 border-t border-white/5">
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
          <div className="flex justify-between">
            <span className="text-gray-500">Last</span>
            <span className="text-white font-mono">${formatPrice(currentPrice)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Vol</span>
            <span className="text-white font-mono">
              {currentVolume >= 1000 ? `${(currentVolume / 1000).toFixed(1)}K` : currentVolume.toFixed(1)}
            </span>
          </div>
          {(() => {
            const buyTrades = trades.filter((t) => t.side === "buy" && t.pnl === null);
            const sellTrades = trades.filter((t) => t.side === "sell" && t.pnl === null);
            const buyAvg = buyTrades.length > 0
              ? buyTrades.reduce((s, t) => s + t.price * t.quantity, 0) / buyTrades.reduce((s, t) => s + t.quantity, 0)
              : 0;
            const sellAvg = sellTrades.length > 0
              ? sellTrades.reduce((s, t) => s + t.price * t.quantity, 0) / sellTrades.reduce((s, t) => s + t.quantity, 0)
              : 0;
            return (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-500">Buy Avg</span>
                  <span className="text-emerald-400/70 font-mono">
                    {buyAvg > 0 ? `$${formatPrice(buyAvg)}` : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Sell Avg</span>
                  <span className="text-red-400/70 font-mono">
                    {sellAvg > 0 ? `$${formatPrice(sellAvg)}` : "N/A"}
                  </span>
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* Flatten / Reverse */}
      {hasPosition && (
        <div className="p-3 flex gap-2 border-t border-white/5">
          <button
            onClick={onFlatten}
            className="flex-1 py-2 rounded-lg bg-amber-600/20 text-amber-400 hover:bg-amber-600/30 text-xs font-medium transition-colors"
          >
            Flatten
          </button>
          <button
            onClick={onReverse}
            className="flex-1 py-2 rounded-lg bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 text-xs font-medium transition-colors"
          >
            Reverse
          </button>
        </div>
      )}

      {/* Account Balance */}
      <div className="p-3 border-t border-white/5 mt-auto">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Balance</span>
          <span className="text-white font-mono">
            ${balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        {(() => {
          const equityPct = ((balance + position.unrealizedPnl - startingBalance) / startingBalance) * 100;
          return (
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-500">Equity</span>
              <span className={`font-mono ${equityPct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {equityPct >= 0 ? "+" : ""}{equityPct.toFixed(2)}%
              </span>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

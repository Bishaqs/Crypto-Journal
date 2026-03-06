"use client";

import { useState, useMemo, useCallback } from "react";
import { Header } from "@/components/header";
import { useTheme } from "@/lib/theme-context";
import { useSubscription } from "@/lib/use-subscription";
import { UpgradePrompt } from "@/components/upgrade-prompt";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import ChainGrid from "@/components/options/chain-grid";
import OrderList from "@/components/options/order-list";
import PositionSummary from "@/components/options/position-summary";
import {
  generateChain,
  OPTION_SYMBOLS,
  genOrderId,
  formatExpiry,
  type OptionSymbol,
  type ChainOrder,
  type OrderStatus,
} from "@/lib/options-chain";
import type { OptionType } from "@/lib/options-math";
import SymbolSearch from "@/components/ui/symbol-search";

const DTE_OPTIONS = [7, 14, 30, 45, 60, 90];
const RISK_FREE_RATE = 0.05;

export default function OptionsSimulatorPage() {
  const { theme } = useTheme();
  const { hasAccess } = useSubscription();

  // Settings
  const [symbol, setSymbol] = useState<OptionSymbol>("AAPL");
  const [iv, setIV] = useState(0.3);
  const [dte, setDTE] = useState(30);
  const [orderQty, setOrderQty] = useState(1);
  const [orderType, setOrderType] = useState<"market" | "limit">("market");

  // Orders
  const [orders, setOrders] = useState<ChainOrder[]>([]);

  // Derived spot price
  const spotPrice = OPTION_SYMBOLS.find((s) => s.value === symbol)?.spot ?? 175;
  const expiry = formatExpiry(dte);

  // Generate chain
  const chain = useMemo(
    () => generateChain(spotPrice, iv, dte, RISK_FREE_RATE),
    [spotPrice, iv, dte]
  );

  // Click a bid/ask cell -> stage an order
  const handleCellClick = useCallback(
    (strike: number, optionType: OptionType, side: "buy" | "sell", price: number) => {
      const newOrder: ChainOrder = {
        id: genOrderId(),
        expiry,
        strike,
        optionType,
        price,
        quantity: orderQty,
        side,
        status: "staged",
        fillDate: null,
        fillPrice: null,
        orderType,
        limitPrice: orderType === "limit" ? price : null,
      };
      setOrders((prev) => [...prev, newOrder]);
    },
    [expiry, orderQty, orderType]
  );

  // Order actions
  const handleDelete = useCallback((id: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== id));
  }, []);

  const handleCancel = useCallback((id: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: "cancelled" as OrderStatus } : o))
    );
  }, []);

  const handleSubmitOne = useCallback((id: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== id || o.status !== "staged") return o;
        if (o.orderType === "market") {
          return {
            ...o,
            status: "filled" as OrderStatus,
            fillDate: new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            }),
            fillPrice: o.price,
          };
        }
        return { ...o, status: "submitted" as OrderStatus };
      })
    );
  }, []);

  const handleSubmitAll = useCallback(() => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.status !== "staged") return o;
        if (o.orderType === "market") {
          return {
            ...o,
            status: "filled" as OrderStatus,
            fillDate: new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            }),
            fillPrice: o.price,
          };
        }
        return { ...o, status: "submitted" as OrderStatus };
      })
    );
  }, []);

  const handleClearAll = useCallback(() => {
    setOrders([]);
  }, []);

  if (!hasAccess("options-simulator")) {
    return (
      <>
        <Header />
        <UpgradePrompt feature="Options Chain Simulator" requiredTier="max" />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Top controls */}
        <div className="flex items-center gap-4 px-4 py-2.5 border-b border-white/5 bg-[#111118] shrink-0 flex-wrap">
          {/* Symbol */}
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-gray-500">Symbol</label>
            <SymbolSearch
              mode="stock"
              value={symbol}
              onSelect={(sym) => setSymbol(sym as OptionSymbol)}
              compact
              placeholder="Search stock..."
              className="w-[160px]"
            />
          </div>

          {/* Spot price display */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-gray-500">Spot</span>
            <span className="text-xs font-mono text-white font-medium">${spotPrice}</span>
          </div>

          {/* DTE */}
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-gray-500">DTE</label>
            <div className="flex gap-0.5">
              {DTE_OPTIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => setDTE(d)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
                    dte === d
                      ? "bg-white/15 text-white"
                      : "text-gray-600 hover:text-gray-400 hover:bg-white/5"
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>

          {/* IV slider */}
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-gray-500">IV</label>
            <input
              type="range"
              min={10}
              max={80}
              value={iv * 100}
              onChange={(e) => setIV(parseInt(e.target.value) / 100)}
              className="w-20 h-1 accent-white/60"
            />
            <span className="text-[10px] font-mono text-white">{(iv * 100).toFixed(0)}%</span>
          </div>

          {/* Order type toggle */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-[10px] text-gray-500">Order Type:</span>
            {(["market", "limit"] as const).map((t) => (
              <label key={t} className="flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  name="orderType"
                  value={t}
                  checked={orderType === t}
                  onChange={() => setOrderType(t)}
                  className="accent-blue-500"
                />
                <span className={`text-[10px] ${orderType === t ? "text-white" : "text-gray-500"}`}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </span>
              </label>
            ))}
          </div>

          {/* Qty */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-gray-500">Qty</span>
            <input
              type="number"
              min={1}
              max={100}
              value={orderQty}
              onChange={(e) => setOrderQty(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-12 px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-xs text-white font-mono outline-none text-center"
            />
          </div>

          <InfoTooltip text="Build and manage options positions using a simulated order book. Practice calls, puts, and spreads risk-free." size={14} />
        </div>

        {/* Chain header labels */}
        <div className="flex items-center px-4 py-1 bg-[#0e0e14] border-b border-white/5 shrink-0">
          <div className="flex-1 text-center">
            <span className="text-[10px] font-bold text-emerald-400/60 tracking-wider uppercase">
              Calls
            </span>
          </div>
          <div className="w-[60px] text-center">
            <span className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">
              Strike
            </span>
          </div>
          <div className="flex-1 text-center">
            <span className="text-[10px] font-bold text-red-400/60 tracking-wider uppercase">
              Puts
            </span>
          </div>
        </div>

        {/* Chain grid */}
        <ChainGrid
          chain={chain}
          spotPrice={spotPrice}
          onClickCell={handleCellClick}
        />

        {/* Order list */}
        <OrderList
          orders={orders}
          onDelete={handleDelete}
          onCancel={handleCancel}
          onSubmit={handleSubmitOne}
          onClearAll={handleClearAll}
          onSubmitAll={handleSubmitAll}
        />

        {/* Position summary */}
        <PositionSummary
          orders={orders}
          chain={chain}
          spotPrice={spotPrice}
          daysToExpiry={dte}
          riskFreeRate={RISK_FREE_RATE}
        />
      </main>
    </>
  );
}

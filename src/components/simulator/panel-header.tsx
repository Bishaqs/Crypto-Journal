"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import type { SupportedSymbol } from "@/lib/simulator/types";
import SymbolSearch from "@/components/ui/symbol-search";

interface PanelHeaderProps {
  panelId: number;
  symbol: SupportedSymbol;
  isActive: boolean;
  isCollapsed: boolean;
  currentPrice: number;
  unrealizedPnl: number;
  lastVolume: number;
  remainingQty: number;
  positionSide: "long" | "short" | "flat";
  loading: boolean;
  onSymbolChange: (symbol: SupportedSymbol) => void;
  onToggleCollapse: () => void;
  onActivate: () => void;
}

function formatPrice(price: number): string {
  if (price >= 1000) return price.toFixed(2);
  if (price >= 1) return price.toFixed(4);
  return price.toFixed(6);
}

function formatVolume(vol: number): string {
  if (vol >= 1_000_000) return (vol / 1_000_000).toFixed(1) + "M";
  if (vol >= 1_000) return (vol / 1_000).toFixed(1) + "K";
  return vol.toFixed(0);
}

export default function PanelHeader({
  panelId,
  symbol,
  isActive,
  isCollapsed,
  currentPrice,
  unrealizedPnl,
  lastVolume,
  remainingQty,
  positionSide,
  loading,
  onSymbolChange,
  onToggleCollapse,
  onActivate,
}: PanelHeaderProps) {
  return (
    <div
      className={`flex items-center gap-2 px-2 py-1.5 bg-[#111118] border-b shrink-0 cursor-pointer ${
        isActive ? "border-blue-500/40" : "border-white/5"
      }`}
      onClick={onActivate}
    >
      {/* Panel number badge */}
      <span
        className={`text-[10px] font-bold w-4 h-4 rounded flex items-center justify-center ${
          isActive ? "bg-blue-500/30 text-blue-300" : "bg-white/5 text-gray-600"
        }`}
      >
        {panelId + 1}
      </span>

      {/* Symbol selector */}
      <div onClick={(e) => e.stopPropagation()}>
        <SymbolSearch
          mode="binance"
          value={symbol}
          onSelect={(sym) => onSymbolChange(sym as SupportedSymbol)}
          compact
          placeholder="Search..."
          className="w-[130px]"
        />
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 ml-auto text-[10px]">
        <div className="flex items-center gap-1">
          <span className="text-gray-600">Last</span>
          <span className="text-white font-mono">
            {loading ? "—" : formatPrice(currentPrice)}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-gray-600">PnL</span>
          <span
            className={`font-mono ${
              unrealizedPnl > 0
                ? "text-emerald-400"
                : unrealizedPnl < 0
                ? "text-red-400"
                : "text-gray-500"
            }`}
          >
            {loading ? "—" : `${unrealizedPnl >= 0 ? "+" : ""}$${unrealizedPnl.toFixed(2)}`}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-gray-600">Vol</span>
          <span className="text-white font-mono">
            {loading ? "—" : formatVolume(lastVolume)}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-gray-600">Qty</span>
          <span
            className={`font-mono ${
              positionSide === "long"
                ? "text-emerald-400"
                : positionSide === "short"
                ? "text-red-400"
                : "text-gray-500"
            }`}
          >
            {positionSide === "flat" ? "—" : remainingQty.toFixed(4)}
          </span>
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleCollapse();
        }}
        className="p-0.5 text-gray-500 hover:text-white transition-colors"
      >
        {isCollapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
      </button>
    </div>
  );
}

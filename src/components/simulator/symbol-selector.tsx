"use client";

import type { SimInterval, SupportedSymbol } from "@/lib/simulator/types";
import SymbolSearch from "@/components/ui/symbol-search";

interface SymbolSelectorProps {
  symbol: SupportedSymbol;
  interval: SimInterval;
  date: string;
  onSymbolChange: (symbol: SupportedSymbol) => void;
  onIntervalChange: (interval: SimInterval) => void;
  onDateChange: (date: string) => void;
  loading: boolean;
}

export default function SymbolSelector({
  symbol,
  interval,
  date,
  onSymbolChange,
  onIntervalChange,
  onDateChange,
  loading,
}: SymbolSelectorProps) {
  // Max date = yesterday (UTC)
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const maxDate = yesterday.toISOString().slice(0, 10);

  return (
    <div className="flex items-center gap-3">
      {/* Symbol */}
      <SymbolSearch
        mode="binance"
        value={symbol}
        onSelect={(sym) => onSymbolChange(sym as SupportedSymbol)}
        compact
        placeholder="Search pair..."
        className="w-[160px]"
      />

      {/* Date */}
      <input
        type="date"
        value={date}
        onChange={(e) => onDateChange(e.target.value)}
        max={maxDate}
        disabled={loading}
        className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-white/20 disabled:opacity-50 [color-scheme:dark]"
      />

      {/* Interval */}
      <div className="flex rounded-lg bg-white/5 p-0.5">
        {(["1m", "5m"] as const).map((i) => (
          <button
            key={i}
            onClick={() => onIntervalChange(i)}
            disabled={loading}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              interval === i
                ? "bg-white/10 text-white"
                : "text-gray-500 hover:text-gray-300"
            } disabled:opacity-50`}
          >
            {i}
          </button>
        ))}
      </div>

      {loading && (
        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      )}
    </div>
  );
}

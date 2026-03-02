"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import type { SimTrade } from "@/lib/simulator/types";

interface TradeLogProps {
  trades: SimTrade[];
}

function formatTime(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function formatPrice(price: number): string {
  if (price >= 1000) return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 1) return price.toFixed(4);
  return price.toFixed(6);
}

export default function TradeLog({ trades }: TradeLogProps) {
  const [expanded, setExpanded] = useState(false);

  const totalPnl = trades.reduce((sum, t) => sum + (t.pnl ?? 0), 0);

  return (
    <div
      className={`bg-[#111118] border-t border-white/5 transition-all ${
        expanded ? "h-52" : "h-10"
      }`}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full h-10 flex items-center justify-between px-4 text-xs text-gray-400 hover:text-white transition-colors"
      >
        <span>
          Trade Log ({trades.length} trade{trades.length !== 1 ? "s" : ""})
        </span>
        <div className="flex items-center gap-3">
          {trades.length > 0 && (
            <span
              className={`font-mono ${totalPnl >= 0 ? "text-emerald-400" : "text-red-400"}`}
            >
              Total: {totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(2)}
            </span>
          )}
          {expanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </div>
      </button>

      {/* Table */}
      {expanded && (
        <div className="overflow-auto h-[calc(100%-2.5rem)]">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500 border-b border-white/5">
                <th className="text-left py-1.5 px-4 font-medium">Time</th>
                <th className="text-left py-1.5 px-2 font-medium">Side</th>
                <th className="text-left py-1.5 px-2 font-medium">Type</th>
                <th className="text-right py-1.5 px-2 font-medium">Price</th>
                <th className="text-right py-1.5 px-2 font-medium">Qty</th>
                <th className="text-right py-1.5 px-4 font-medium">PnL</th>
              </tr>
            </thead>
            <tbody>
              {[...trades].reverse().map((trade) => (
                <tr key={trade.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                  <td className="py-1.5 px-4 font-mono text-gray-400">
                    {formatTime(trade.timestamp)}
                  </td>
                  <td className="py-1.5 px-2">
                    <span
                      className={`font-medium ${
                        trade.side === "buy" ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {trade.side.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-1.5 px-2 text-gray-400 capitalize">market</td>
                  <td className="py-1.5 px-2 text-right font-mono text-white">
                    ${formatPrice(trade.price)}
                  </td>
                  <td className="py-1.5 px-2 text-right text-gray-300">{trade.quantity}</td>
                  <td className="py-1.5 px-4 text-right font-mono">
                    {trade.pnl != null ? (
                      <span className={trade.pnl >= 0 ? "text-emerald-400" : "text-red-400"}>
                        {trade.pnl >= 0 ? "+" : ""}${trade.pnl.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-gray-600">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

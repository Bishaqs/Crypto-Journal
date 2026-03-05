"use client";

import { useMemo } from "react";
import type { ChainOrder, ChainStrike } from "@/lib/options-chain";
import { calculateGreeks } from "@/lib/options-math";

interface PositionSummaryProps {
  orders: ChainOrder[];
  chain: ChainStrike[];
  spotPrice: number;
  daysToExpiry: number;
  riskFreeRate: number;
}

export default function PositionSummary({
  orders,
  chain,
  spotPrice,
  daysToExpiry,
  riskFreeRate,
}: PositionSummaryProps) {
  const stats = useMemo(() => {
    const filledOrders = orders.filter((o) => o.status === "filled" || o.status === "submitted");
    if (filledOrders.length === 0) return null;

    let totalDelta = 0;
    let totalGamma = 0;
    let totalTheta = 0;
    let totalVega = 0;
    let netPremium = 0;
    let contracts = 0;

    const T = daysToExpiry / 365;

    for (const order of filledOrders) {
      const chainRow = chain.find((c) => c.strike === order.strike);
      const iv = chainRow
        ? order.optionType === "call"
          ? chainRow.callIV
          : chainRow.putIV
        : 0.3;

      const greeks = calculateGreeks(
        order.optionType,
        spotPrice,
        order.strike,
        T,
        riskFreeRate,
        iv
      );

      const sign = order.side === "buy" ? 1 : -1;
      const qty = order.quantity * sign;

      totalDelta += greeks.delta * qty * 100;
      totalGamma += greeks.gamma * qty * 100;
      totalTheta += greeks.theta * qty * 100;
      totalVega += greeks.vega * qty * 100;

      const price = order.fillPrice ?? order.price;
      netPremium += price * order.quantity * 100 * (order.side === "sell" ? 1 : -1);
      contracts += order.quantity;
    }

    return { totalDelta, totalGamma, totalTheta, totalVega, netPremium, contracts };
  }, [orders, chain, spotPrice, daysToExpiry, riskFreeRate]);

  if (!stats) return null;

  return (
    <div className="flex items-center gap-5 px-4 py-2 bg-[#111118] border-t border-white/5 text-[11px]">
      <span className="text-gray-500 font-medium">Position</span>

      <div className="flex items-center gap-1">
        <span className="text-gray-600">Δ</span>
        <span className={`font-mono ${stats.totalDelta >= 0 ? "text-emerald-400" : "text-red-400"}`}>
          {stats.totalDelta.toFixed(1)}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <span className="text-gray-600">Γ</span>
        <span className="font-mono text-gray-300">{stats.totalGamma.toFixed(2)}</span>
      </div>

      <div className="flex items-center gap-1">
        <span className="text-gray-600">Θ</span>
        <span className={`font-mono ${stats.totalTheta >= 0 ? "text-emerald-400" : "text-red-400"}`}>
          {stats.totalTheta.toFixed(2)}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <span className="text-gray-600">V</span>
        <span className="font-mono text-gray-300">{stats.totalVega.toFixed(2)}</span>
      </div>

      <div className="ml-auto flex items-center gap-4">
        <div className="flex items-center gap-1">
          <span className="text-gray-600">Contracts</span>
          <span className="font-mono text-white">{stats.contracts}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-gray-600">Net Premium</span>
          <span className={`font-mono font-medium ${stats.netPremium >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {stats.netPremium >= 0 ? "+" : ""}${stats.netPremium.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}

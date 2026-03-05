"use client";

import type { ChainStrike } from "@/lib/options-chain";
import type { OptionType } from "@/lib/options-math";

interface ChainGridProps {
  chain: ChainStrike[];
  spotPrice: number;
  onClickCell: (strike: number, optionType: OptionType, side: "buy" | "sell", price: number) => void;
}

export default function ChainGrid({ chain, spotPrice, onClickCell }: ChainGridProps) {
  return (
    <div className="overflow-auto flex-1 min-h-0">
      <table className="w-full text-[11px] border-collapse">
        <thead className="sticky top-0 z-10 bg-[#111118]">
          <tr className="border-b border-white/10">
            {/* Call columns */}
            <th className="px-2 py-1.5 text-right text-emerald-400/70 font-medium">OI</th>
            <th className="px-2 py-1.5 text-right text-emerald-400/70 font-medium">Vol</th>
            <th className="px-2 py-1.5 text-right text-emerald-400/70 font-medium">IV</th>
            <th className="px-2 py-1.5 text-right text-emerald-400/70 font-medium">Δ</th>
            <th className="px-2 py-1.5 text-right text-emerald-400/70 font-medium cursor-pointer hover:text-emerald-300" title="Click to sell">Bid</th>
            <th className="px-2 py-1.5 text-right text-emerald-400/70 font-medium cursor-pointer hover:text-emerald-300" title="Click to buy">Ask</th>
            {/* Strike */}
            <th className="px-3 py-1.5 text-center text-white font-bold bg-white/5">Strike</th>
            {/* Put columns */}
            <th className="px-2 py-1.5 text-left text-red-400/70 font-medium cursor-pointer hover:text-red-300" title="Click to buy">Ask</th>
            <th className="px-2 py-1.5 text-left text-red-400/70 font-medium cursor-pointer hover:text-red-300" title="Click to sell">Bid</th>
            <th className="px-2 py-1.5 text-left text-red-400/70 font-medium">Δ</th>
            <th className="px-2 py-1.5 text-left text-red-400/70 font-medium">IV</th>
            <th className="px-2 py-1.5 text-left text-red-400/70 font-medium">Vol</th>
            <th className="px-2 py-1.5 text-left text-red-400/70 font-medium">OI</th>
          </tr>
        </thead>
        <tbody>
          {chain.map((row) => {
            const isATM = Math.abs(row.strike - spotPrice) < (chain[1]?.strike - chain[0]?.strike) / 2;
            const isITMCall = row.strike < spotPrice;
            const isITMPut = row.strike > spotPrice;

            return (
              <tr
                key={row.strike}
                className={`border-b border-white/5 hover:bg-white/[0.02] ${
                  isATM ? "bg-blue-500/10" : ""
                }`}
              >
                {/* CALLS */}
                <td className={`px-2 py-1 text-right font-mono ${isITMCall ? "text-gray-400" : "text-gray-600"}`}>
                  {row.callOI}
                </td>
                <td className={`px-2 py-1 text-right font-mono ${row.callVol > 200 ? "text-emerald-400 font-bold" : isITMCall ? "text-gray-400" : "text-gray-600"}`}>
                  {row.callVol}
                </td>
                <td className="px-2 py-1 text-right font-mono text-gray-500">
                  {(row.callIV * 100).toFixed(0)}%
                </td>
                <td className="px-2 py-1 text-right font-mono text-gray-500">
                  {row.callGreeks.delta.toFixed(2)}
                </td>
                <td
                  className="px-2 py-1 text-right font-mono text-red-400 cursor-pointer hover:bg-red-500/20 hover:text-red-300 rounded transition-colors"
                  onClick={() => onClickCell(row.strike, "call", "sell", row.callBid)}
                  title={`Sell Call @ ${row.callBid}`}
                >
                  {row.callBid.toFixed(2)}
                </td>
                <td
                  className="px-2 py-1 text-right font-mono text-emerald-400 cursor-pointer hover:bg-emerald-500/20 hover:text-emerald-300 rounded transition-colors"
                  onClick={() => onClickCell(row.strike, "call", "buy", row.callAsk)}
                  title={`Buy Call @ ${row.callAsk}`}
                >
                  {row.callAsk.toFixed(2)}
                </td>

                {/* STRIKE */}
                <td className={`px-3 py-1 text-center font-mono font-bold ${
                  isATM ? "text-blue-400 bg-blue-500/20" : "text-white bg-white/5"
                }`}>
                  {row.strike}
                </td>

                {/* PUTS */}
                <td
                  className="px-2 py-1 text-left font-mono text-emerald-400 cursor-pointer hover:bg-emerald-500/20 hover:text-emerald-300 rounded transition-colors"
                  onClick={() => onClickCell(row.strike, "put", "buy", row.putAsk)}
                  title={`Buy Put @ ${row.putAsk}`}
                >
                  {row.putAsk.toFixed(2)}
                </td>
                <td
                  className="px-2 py-1 text-left font-mono text-red-400 cursor-pointer hover:bg-red-500/20 hover:text-red-300 rounded transition-colors"
                  onClick={() => onClickCell(row.strike, "put", "sell", row.putBid)}
                  title={`Sell Put @ ${row.putBid}`}
                >
                  {row.putBid.toFixed(2)}
                </td>
                <td className="px-2 py-1 text-left font-mono text-gray-500">
                  {row.putGreeks.delta.toFixed(2)}
                </td>
                <td className="px-2 py-1 text-left font-mono text-gray-500">
                  {(row.putIV * 100).toFixed(0)}%
                </td>
                <td className={`px-2 py-1 text-left font-mono ${row.putVol > 200 ? "text-red-400 font-bold" : isITMPut ? "text-gray-400" : "text-gray-600"}`}>
                  {row.putVol}
                </td>
                <td className={`px-2 py-1 text-left font-mono ${isITMPut ? "text-gray-400" : "text-gray-600"}`}>
                  {row.putOI}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

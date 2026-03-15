"use client";

import { Trade } from "@/lib/types";

type ExecutionsTableProps = {
  trade: Trade;
};

export function ExecutionsTable({ trade }: ExecutionsTableProps) {
  // For manually entered trades, show a single execution row
  // For broker-synced trades, this could be expanded to show multiple fills
  const executions = [
    {
      symbol: trade.symbol,
      date: trade.open_timestamp,
      side: "buy" as const,
      price: trade.entry_price,
      quantity: trade.quantity,
      rPnl: 0,
      commission: 0,
      fees: trade.fees,
      openPosition: trade.quantity,
    },
    ...(trade.exit_price !== null && trade.close_timestamp
      ? [
          {
            symbol: trade.symbol,
            date: trade.close_timestamp,
            side: "sell" as const,
            price: trade.exit_price,
            quantity: trade.quantity,
            rPnl: trade.pnl ?? 0,
            commission: 0,
            fees: 0,
            openPosition: 0,
          },
        ]
      : []),
  ];

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-border/50">
            <th className="text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold px-3 py-2">Symbol</th>
            <th className="text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold px-3 py-2">Date</th>
            <th className="text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold px-3 py-2">Side</th>
            <th className="text-right text-[10px] uppercase tracking-wider text-muted/60 font-semibold px-3 py-2">Price</th>
            <th className="text-right text-[10px] uppercase tracking-wider text-muted/60 font-semibold px-3 py-2">Quantity</th>
            <th className="text-right text-[10px] uppercase tracking-wider text-muted/60 font-semibold px-3 py-2">R. PnL</th>
            <th className="text-right text-[10px] uppercase tracking-wider text-muted/60 font-semibold px-3 py-2">Fees</th>
            <th className="text-right text-[10px] uppercase tracking-wider text-muted/60 font-semibold px-3 py-2">Open Position</th>
          </tr>
        </thead>
        <tbody>
          {executions.map((exec, i) => (
            <tr key={i} className="border-b border-border/30">
              <td className="px-3 py-2 font-medium text-foreground">{exec.symbol}</td>
              <td className="px-3 py-2 text-muted whitespace-nowrap">
                {new Date(exec.date).toLocaleString("en-US", {
                  year: "numeric", month: "2-digit", day: "2-digit",
                  hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
                })}
              </td>
              <td className="px-3 py-2">
                <span className={`text-xs font-medium ${exec.side === "buy" ? "text-win" : "text-loss"}`}>
                  {exec.side}
                </span>
              </td>
              <td className="px-3 py-2 text-right tabular-nums text-muted">${exec.price.toFixed(4)}</td>
              <td className="px-3 py-2 text-right tabular-nums text-muted">{exec.quantity}</td>
              <td className={`px-3 py-2 text-right tabular-nums font-medium ${exec.rPnl >= 0 ? "text-win" : "text-loss"}`}>
                {exec.rPnl !== 0 ? `$${exec.rPnl.toFixed(2)}` : "—"}
              </td>
              <td className="px-3 py-2 text-right tabular-nums text-muted">${exec.fees.toFixed(4)}</td>
              <td className="px-3 py-2 text-right tabular-nums text-muted">{exec.openPosition}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

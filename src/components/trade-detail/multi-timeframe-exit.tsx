"use client";

import { Trade } from "@/lib/types";

type MultiTimeframeExitProps = {
  trade: Trade;
};

const TIMEFRAMES = [
  "+5 min", "+1 Hr", "+2 Hr", "EOD", "EOD +1", "SOD +1",
  "EOD +2", "SOD +2", "EOD +3", "SOD +3", "EOD +4", "SOD +4",
];

export function MultiTimeframeExit({ trade }: MultiTimeframeExitProps) {
  const actualPnl = trade.pnl ?? 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 text-xs">
        <span className="text-muted uppercase tracking-wider font-semibold">Actual PnL:</span>
        <span className={`font-bold ${actualPnl >= 0 ? "text-win" : "text-loss"}`}>
          {trade.exit_price !== null ? `$${actualPnl.toFixed(2)}` : "Open"}
        </span>
      </div>
      <div className="grid grid-cols-6 gap-px bg-border/30 rounded-lg overflow-hidden">
        {TIMEFRAMES.map((tf) => (
          <div key={tf} className="bg-surface p-3 text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted font-semibold mb-1">{tf}</p>
            <p className="text-xs text-muted/40">N/A</p>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-muted/40 italic">
        Multi-timeframe exit analysis requires historical candle data. Connect a market data API to populate these values.
      </p>
    </div>
  );
}

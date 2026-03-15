"use client";

import { useRouter } from "next/navigation";
import { Trade } from "@/lib/types";
import { calculateTradePnl, calculateRMultiple, formatRMultiple } from "@/lib/calculations";
import { Users } from "lucide-react";

type SimilarTradesTableProps = {
  trades: Trade[];
  currentTradeId: string;
  symbol: string;
};

export function SimilarTradesTable({ trades, currentTradeId, symbol }: SimilarTradesTableProps) {
  const router = useRouter();

  const similar = trades.filter((t) => t.id !== currentTradeId);

  if (similar.length === 0) return null;

  return (
    <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
      <h3 className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5 mb-4">
        <Users size={14} className="text-accent" /> Similar Trades ({symbol})
      </h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold px-3 py-2">Date</th>
              <th className="text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold px-3 py-2">Side</th>
              <th className="text-right text-[10px] uppercase tracking-wider text-muted/60 font-semibold px-3 py-2">Entry</th>
              <th className="text-right text-[10px] uppercase tracking-wider text-muted/60 font-semibold px-3 py-2">Exit</th>
              <th className="text-right text-[10px] uppercase tracking-wider text-muted/60 font-semibold px-3 py-2">PnL</th>
              <th className="text-right text-[10px] uppercase tracking-wider text-muted/60 font-semibold px-3 py-2">R</th>
            </tr>
          </thead>
          <tbody>
            {similar.map((t) => {
              const pnl = t.pnl ?? calculateTradePnl(t) ?? 0;
              const r = calculateRMultiple(t);
              return (
                <tr
                  key={t.id}
                  onClick={() => router.push(`/dashboard/trades/${t.id}`)}
                  className="border-b border-border/30 cursor-pointer hover:bg-surface-hover transition-colors"
                >
                  <td className="px-3 py-2 whitespace-nowrap text-muted">
                    {new Date(t.open_timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${
                      t.position === "long" ? "bg-win/10 text-win" : "bg-loss/10 text-loss"
                    }`}>
                      {t.position.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-muted">${t.entry_price.toFixed(2)}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-muted">
                    {t.exit_price !== null ? `$${t.exit_price.toFixed(2)}` : "—"}
                  </td>
                  <td className={`px-3 py-2 text-right tabular-nums font-medium ${pnl >= 0 ? "text-win" : "text-loss"}`}>
                    {t.exit_price !== null ? `$${pnl.toFixed(2)}` : "Open"}
                  </td>
                  <td className={`px-3 py-2 text-right tabular-nums font-medium ${r !== null ? (r >= 0 ? "text-win" : "text-loss") : "text-muted"}`}>
                    {formatRMultiple(r) ?? "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

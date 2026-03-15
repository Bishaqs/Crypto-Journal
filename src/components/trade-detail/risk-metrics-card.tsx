"use client";

import { Trade } from "@/lib/types";
import { Shield } from "lucide-react";
import {
  calculateRMultiple, formatRMultiple,
  calculateTradeMAE, calculateTradeMFE,
  getMfeMaeRatio, calculateBestExitPnl,
  calculateExitEfficiency, calculateBestExitR,
  formatDurationMs, getTimeTillMfe, getTimeTillMae,
  getTimeAfterMfe, getTimeAfterMae,
  getPriceMfePct, getPriceMaePct,
} from "@/lib/calculations";

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted font-semibold">{label}</p>
      <p className={`text-sm font-bold ${color ?? "text-foreground"}`}>{value}</p>
    </div>
  );
}

export function RiskMetricsCard({ trade }: { trade: Trade }) {
  const rMultiple = calculateRMultiple(trade);
  const mae = calculateTradeMAE(trade);
  const mfe = calculateTradeMFE(trade);
  const mfeMaeRatio = getMfeMaeRatio(trade);
  const bestExitPnl = calculateBestExitPnl(trade);
  const exitEfficiency = calculateExitEfficiency(trade);
  const bestExitR = calculateBestExitR(trade);
  const mfePct = getPriceMfePct(trade);
  const maePct = getPriceMaePct(trade);
  const timeTillMfe = getTimeTillMfe(trade);
  const timeTillMae = getTimeTillMae(trade);
  const timeAfterMfe = getTimeAfterMfe(trade);
  const timeAfterMae = getTimeAfterMae(trade);

  return (
    <div className="glass rounded-2xl border border-border/50 p-5 space-y-4" style={{ boxShadow: "var(--shadow-card)" }}>
      <h3 className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5">
        <Shield size={14} className="text-accent" /> Risk Metrics
      </h3>

      {/* Primary metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Stat
          label="R-Multiple"
          value={formatRMultiple(rMultiple) ?? "—"}
          color={rMultiple !== null ? (rMultiple >= 0 ? "text-win" : "text-loss") : undefined}
        />
        <Stat label="Stop Loss" value={trade.stop_loss ? `$${trade.stop_loss.toLocaleString()}` : "—"} />
        <Stat label="Profit Target" value={trade.profit_target ? `$${trade.profit_target.toLocaleString()}` : "—"} />
        <Stat
          label="Exit Efficiency"
          value={exitEfficiency !== null ? `${exitEfficiency.toFixed(0)}%` : "—"}
          color={exitEfficiency !== null ? (exitEfficiency >= 80 ? "text-win" : exitEfficiency >= 50 ? "text-foreground" : "text-loss") : undefined}
        />
        <Stat
          label="Best Exit PnL"
          value={bestExitPnl !== null ? `$${bestExitPnl.toFixed(2)}` : "—"}
          color="text-win"
        />
        <Stat label="Best Exit R" value={bestExitR !== null ? formatRMultiple(bestExitR) ?? "—" : "—"} />
      </div>

      {/* MFE / MAE section */}
      {(mfe !== null || mae !== null) && (
        <div className="pt-3 border-t border-border/30">
          <p className="text-[10px] uppercase tracking-wider text-muted font-semibold mb-3">Maximum Excursion</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat
              label="MFE"
              value={mfe !== null ? `$${mfe.toFixed(2)}${mfePct !== null ? ` (${mfePct.toFixed(1)}%)` : ""}` : "—"}
              color="text-win"
            />
            <Stat
              label="MAE"
              value={mae !== null ? `$${mae.toFixed(2)}${maePct !== null ? ` (${maePct.toFixed(1)}%)` : ""}` : "—"}
              color="text-loss"
            />
            <Stat label="MFE/MAE Ratio" value={mfeMaeRatio !== null ? mfeMaeRatio.toFixed(2) : "—"} />
            <Stat
              label="Time to MFE"
              value={timeTillMfe !== null ? formatDurationMs(timeTillMfe) : "—"}
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
            <Stat
              label="Time to MAE"
              value={timeTillMae !== null ? formatDurationMs(timeTillMae) : "—"}
            />
            <Stat
              label="Time after MFE"
              value={timeAfterMfe !== null ? formatDurationMs(timeAfterMfe) : "—"}
            />
            <Stat
              label="Time after MAE"
              value={timeAfterMae !== null ? formatDurationMs(timeAfterMae) : "—"}
            />
          </div>
        </div>
      )}
    </div>
  );
}

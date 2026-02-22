"use client";

import { TiltSignal } from "@/lib/calculations";
import { AlertTriangle, ShieldAlert } from "lucide-react";

export function TiltWarnings({ signals }: { signals: TiltSignal[] }) {
  if (signals.length === 0) return null;

  return (
    <div className="space-y-2">
      {signals.map((signal, i) => (
        <div
          key={`${signal.type}-${i}`}
          className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${
            signal.severity === "danger"
              ? "bg-loss/5 border-loss/20"
              : "bg-yellow-500/5 border-yellow-500/20"
          }`}
        >
          {signal.severity === "danger" ? (
            <ShieldAlert size={16} className="text-loss shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle size={16} className="text-yellow-400 shrink-0 mt-0.5" />
          )}
          <div>
            <p className={`text-xs font-medium ${
              signal.severity === "danger" ? "text-loss" : "text-yellow-400"
            }`}>
              {signal.type === "rapid_fire" && "Rapid Fire Detected"}
              {signal.type === "size_spike" && "Position Size Spike"}
              {signal.type === "revenge_reentry" && "Revenge Re-Entry"}
            </p>
            <p className="text-xs text-muted mt-0.5">{signal.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

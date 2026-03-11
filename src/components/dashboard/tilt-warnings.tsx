"use client";

import { useMemo } from "react";
import { TiltSignal } from "@/lib/calculations";
import { AlertTriangle, ShieldAlert, X, ChevronDown, ChevronRight, CheckCheck } from "lucide-react";
import { useDismissedTilt } from "@/lib/use-dismissed-tilt";
import { useState } from "react";

export function TiltWarnings({ signals }: { signals: TiltSignal[] }) {
  const { isDismissed, dismiss, dismissAll } = useDismissedTilt();
  const [expanded, setExpanded] = useState(false);

  const visible = useMemo(
    () => signals.filter((s) => !isDismissed(s.type)),
    [signals, isDismissed],
  );

  if (visible.length === 0) return null;

  const dangerCount = visible.filter((s) => s.severity === "danger").length;
  const warningCount = visible.filter((s) => s.severity === "warning").length;

  return (
    <div className="space-y-2">
      {/* Collapsed summary header */}
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-border/50 bg-surface">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 flex-1 text-left"
        >
          {expanded ? (
            <ChevronDown size={14} className="text-muted" />
          ) : (
            <ChevronRight size={14} className="text-muted" />
          )}
          <ShieldAlert size={14} className="text-loss" />
          <span className="text-xs font-medium text-foreground">
            {visible.length} behavioral alert{visible.length !== 1 ? "s" : ""}
          </span>
          {dangerCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-loss/10 text-loss font-semibold">
              {dangerCount} danger
            </span>
          )}
          {warningCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-400 font-semibold">
              {warningCount} warning
            </span>
          )}
        </button>
        <button
          onClick={() => dismissAll(visible.map((s) => s.type))}
          className="flex items-center gap-1.5 text-[10px] text-muted hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-white/5"
        >
          <CheckCheck size={12} />
          Acknowledge All
        </button>
      </div>

      {/* Expanded individual alerts */}
      {expanded &&
        visible.map((signal, i) => (
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
            <div className="flex-1">
              <p
                className={`text-xs font-medium ${
                  signal.severity === "danger" ? "text-loss" : "text-yellow-400"
                }`}
              >
                {signal.type === "rapid_fire" && "Rapid Fire Detected"}
                {signal.type === "size_spike" && "Position Size Spike"}
                {signal.type === "revenge_reentry" && "Revenge Re-Entry"}
              </p>
              <p className="text-xs text-muted mt-0.5">{signal.message}</p>
            </div>
            <button
              onClick={() => dismiss(signal.type)}
              className="p-1 text-muted hover:text-foreground transition-colors shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        ))}
    </div>
  );
}

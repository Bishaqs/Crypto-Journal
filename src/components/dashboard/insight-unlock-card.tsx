"use client";

import { Lock } from "lucide-react";

interface InsightUnlockCardProps {
  title: string;
  description: string;
  current: number;
  required: number;
  unit?: string;
}

export function InsightUnlockCard({ title, description, current, required, unit = "closed trades" }: InsightUnlockCardProps) {
  const progress = Math.min(current / required, 1);
  const remaining = Math.max(required - current, 0);

  return (
    <div className="glass rounded-2xl border border-border/30 p-5 opacity-75">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
          <Lock size={14} className="text-accent/60" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-foreground/80 mb-0.5">{title}</h4>
          <p className="text-[11px] text-muted leading-relaxed mb-3">{description}</p>

          {/* Progress bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
              <div
                className="h-full rounded-full bg-accent/60 transition-all duration-500"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-muted font-medium whitespace-nowrap">
              {current}/{required}
            </span>
          </div>

          <p className="text-[10px] text-accent/70 mt-1.5 font-medium">
            {remaining === 0
              ? "Unlocking..."
              : `${remaining} more ${unit} to unlock`}
          </p>
        </div>
      </div>
    </div>
  );
}

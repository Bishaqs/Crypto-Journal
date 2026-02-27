"use client";

import { InfoTooltip } from "@/components/ui/info-tooltip";

export function StatBlock({
  label,
  value,
  sub,
  icon: Icon,
  color = "text-foreground",
  tooltip,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  color?: string;
  tooltip?: string;
}) {
  return (
    <div
      className="glass rounded-2xl border border-border/50 p-5 group hover:border-accent/20 transition-all duration-300"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-muted font-semibold uppercase tracking-widest flex items-center gap-1">
          {label}{tooltip && <InfoTooltip text={tooltip} size={12} />}
        </span>
        <div className="p-1.5 rounded-lg bg-accent/8">
          <Icon size={14} className="text-accent" />
        </div>
      </div>
      <p className={`text-2xl font-bold tracking-tight ${color}`}>{value}</p>
      {sub && <p className="text-[11px] text-muted mt-1">{sub}</p>}
    </div>
  );
}

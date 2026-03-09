"use client";

import type { TargetTable } from "@/lib/import-export-types";
import { Coins, TrendingUp, Flame, Globe } from "lucide-react";

const TABLE_OPTIONS: { id: TargetTable; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { id: "trades", label: "Crypto", icon: Coins },
  { id: "stock_trades", label: "Stocks", icon: TrendingUp },
  { id: "commodity_trades", label: "Commodities", icon: Flame },
  { id: "forex_trades", label: "Forex", icon: Globe },
];

export function TargetTableSelector({
  value,
  onChange,
  label = "Import to",
}: {
  value: TargetTable;
  onChange: (table: TargetTable) => void;
  label?: string;
}) {
  return (
    <div>
      <p className="text-[10px] text-muted uppercase tracking-wider font-semibold mb-2">{label}</p>
      <div className="flex gap-1.5">
        {TABLE_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isActive = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? "bg-accent/15 text-accent border border-accent/20"
                  : "text-muted hover:text-foreground border border-border hover:border-border"
              }`}
            >
              <Icon size={14} />
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

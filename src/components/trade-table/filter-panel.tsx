"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import type { FilterDef } from "./types";

type Props<T> = {
  filters: FilterDef<T>[];
  values: Record<string, unknown>;
  onSetFilter: (id: string, value: unknown) => void;
  onClearAll: () => void;
};

export function FilterPanel<T>({ filters, values, onSetFilter, onClearAll }: Props<T>) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const activeCount = Object.values(values).filter((v) => v !== undefined && v !== null && v !== "" && v !== "All").length;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        {filters.map((f) => {
          const isExpanded = expanded.has(f.id);
          const val = values[f.id];
          const hasValue = val !== undefined && val !== null && val !== "" && val !== "All";

          return (
            <div key={f.id} className="border-b border-border/50 last:border-0">
              <button
                onClick={() => toggle(f.id)}
                className="flex items-center justify-between w-full px-3 py-2.5 text-xs text-foreground hover:bg-border/20 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <ChevronRight
                    size={12}
                    className={`text-muted transition-transform ${isExpanded ? "rotate-90" : ""}`}
                  />
                  <span className="font-medium">{f.label}</span>
                  {hasValue && <span className="w-1.5 h-1.5 rounded-full bg-accent" />}
                </div>
              </button>

              {isExpanded && (
                <div className="px-3 pb-3 pl-7">
                  {f.type === "select" && f.options && (
                    <select
                      value={(val as string) ?? "All"}
                      onChange={(e) => onSetFilter(f.id, e.target.value)}
                      className="w-full bg-background border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent/30"
                    >
                      {f.options.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  )}

                  {f.type === "text" && (
                    <input
                      type="text"
                      value={(val as string) ?? ""}
                      onChange={(e) => onSetFilter(f.id, e.target.value)}
                      placeholder={`Filter by ${f.label.toLowerCase()}...`}
                      className="w-full bg-background border border-border rounded-lg px-2 py-1.5 text-xs text-foreground placeholder:text-muted/40 focus:outline-none focus:ring-1 focus:ring-accent/30"
                    />
                  )}

                  {f.type === "range" && (
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="any"
                        placeholder="Min"
                        value={(val as { min?: string; max?: string })?.min ?? ""}
                        onChange={(e) => onSetFilter(f.id, { ...(val as object ?? {}), min: e.target.value })}
                        className="w-1/2 bg-background border border-border rounded-lg px-2 py-1.5 text-xs text-foreground placeholder:text-muted/40 focus:outline-none focus:ring-1 focus:ring-accent/30"
                      />
                      <input
                        type="number"
                        step="any"
                        placeholder="Max"
                        value={(val as { min?: string; max?: string })?.max ?? ""}
                        onChange={(e) => onSetFilter(f.id, { ...(val as object ?? {}), max: e.target.value })}
                        className="w-1/2 bg-background border border-border rounded-lg px-2 py-1.5 text-xs text-foreground placeholder:text-muted/40 focus:outline-none focus:ring-1 focus:ring-accent/30"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {activeCount > 0 && (
        <div className="px-3 py-2 border-t border-border">
          <button onClick={onClearAll} className="w-full text-[10px] font-medium text-loss hover:text-loss/80 transition-colors">
            Clear All Filters ({activeCount})
          </button>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import type { TradeTableColumn } from "./types";

type Props<T> = {
  columns: TradeTableColumn<T>[];
  visibleColumnIds: Set<string>;
  onToggleColumn: (id: string) => void;
  onShowAll: () => void;
  onHideAll: () => void;
};

export function ColumnPanel<T>({ columns, visibleColumnIds, onToggleColumn, onShowAll, onHideAll }: Props<T>) {
  const [search, setSearch] = useState("");

  const q = search.toLowerCase();
  const filtered = q ? columns.filter((c) => c.label.toLowerCase().includes(q)) : columns;

  // Group columns
  const groups = new Map<string, TradeTableColumn<T>[]>();
  for (const col of filtered) {
    const g = col.group ?? "Other";
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g)!.push(col);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="relative px-3 pt-3 pb-2">
        <Search size={12} className="absolute left-5 top-1/2 mt-0.5 -translate-y-1/2 text-muted/40" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          className="w-full bg-background border border-border rounded-lg pl-7 pr-7 py-1.5 text-xs text-foreground placeholder:text-muted/40 focus:outline-none focus:ring-1 focus:ring-accent/30"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-5 top-1/2 mt-0.5 -translate-y-1/2 text-muted hover:text-foreground">
            <X size={12} />
          </button>
        )}
      </div>

      {/* Column list */}
      <div className="flex-1 overflow-y-auto px-3 pb-2">
        {[...groups.entries()].map(([group, cols]) => (
          <div key={group} className="mb-3">
            <div className="text-[10px] uppercase tracking-wider text-muted/60 font-semibold mb-1.5 px-1">{group}</div>
            {cols.map((col) => (
              <label
                key={col.id}
                className="flex items-center gap-2 px-1 py-1 rounded-md hover:bg-border/20 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={visibleColumnIds.has(col.id)}
                  onChange={() => onToggleColumn(col.id)}
                  className="w-3.5 h-3.5 rounded border-border text-accent focus:ring-accent/30 focus:ring-1 bg-background"
                />
                <span className="text-xs text-foreground truncate">{col.label}</span>
              </label>
            ))}
          </div>
        ))}
      </div>

      {/* Show/Hide all */}
      <div className="flex gap-2 px-3 py-2 border-t border-border">
        <button onClick={onShowAll} className="flex-1 text-[10px] font-medium text-accent hover:text-accent/80 transition-colors">Show All</button>
        <button onClick={onHideAll} className="flex-1 text-[10px] font-medium text-muted hover:text-foreground transition-colors">Hide All</button>
      </div>
    </div>
  );
}

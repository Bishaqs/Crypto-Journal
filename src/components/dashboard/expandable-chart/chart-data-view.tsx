"use client";

import type { DataColumn } from "./types";

export function ChartDataView({
  data,
  columns,
}: {
  data: Record<string, unknown>[];
  columns: DataColumn[];
}) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted text-sm">
        No data available
      </div>
    );
  }

  return (
    <div className="glass rounded-xl border border-border/50 overflow-auto max-h-[60vh]">
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-surface border-b border-border/50">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="text-left px-4 py-2.5 text-[10px] text-muted/60 uppercase tracking-wider font-semibold"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={i}
              className="border-b border-border/20 hover:bg-surface-hover/50 transition-colors"
            >
              {columns.map((col) => {
                const raw = row[col.key];
                const display = col.format ? col.format(raw) : String(raw ?? "");
                return (
                  <td key={col.key} className="px-4 py-2 text-foreground font-mono">
                    {display}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

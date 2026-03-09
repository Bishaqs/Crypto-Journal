import type { ExportOptions, TargetTable } from "./import-export-types";

const TABLE_LABELS: Record<TargetTable, string> = {
  trades: "crypto_trades",
  stock_trades: "stock_trades",
  commodity_trades: "commodity_trades",
  forex_trades: "forex_trades",
};

export function exportToCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  for (const row of rows) {
    const values = headers.map((h) => {
      const val = row[h];
      if (val === null || val === undefined) return "";
      const str = String(val);
      // Escape commas, quotes, newlines
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    });
    lines.push(values.join(","));
  }
  return lines.join("\n");
}

export function exportToJSON(rows: Record<string, unknown>[]): string {
  return JSON.stringify(rows, null, 2);
}

export function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function getExportFilename(table: TargetTable, format: "csv" | "json"): string {
  const date = new Date().toISOString().split("T")[0];
  return `${TABLE_LABELS[table]}_${date}.${format}`;
}

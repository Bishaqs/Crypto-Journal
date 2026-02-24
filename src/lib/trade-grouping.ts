import { Trade } from "./types";
import { calculateTradePnl } from "./calculations";

export type GroupSummary = {
  key: string;
  label: string;
  trades: Trade[];
  totalPnl: number;
  winRate: number;
  tradeCount: number;
  avgPnl: number;
};

function buildGroup(key: string, label: string, trades: Trade[]): GroupSummary {
  const closed = trades.filter((t) => t.close_timestamp !== null);
  const pnls = closed.map((t) => t.pnl ?? calculateTradePnl(t) ?? 0);
  const wins = pnls.filter((p) => p > 0).length;
  const totalPnl = pnls.reduce((s, p) => s + p, 0);
  return {
    key,
    label,
    trades,
    totalPnl,
    winRate: closed.length > 0 ? (wins / closed.length) * 100 : 0,
    tradeCount: trades.length,
    avgPnl: closed.length > 0 ? totalPnl / closed.length : 0,
  };
}

export function groupTradesBySymbol(trades: Trade[]): GroupSummary[] {
  const map = new Map<string, Trade[]>();
  for (const t of trades) {
    const arr = map.get(t.symbol) ?? [];
    arr.push(t);
    map.set(t.symbol, arr);
  }
  return Array.from(map.entries())
    .map(([sym, arr]) => buildGroup(sym, sym, arr))
    .sort((a, b) => b.totalPnl - a.totalPnl);
}

export function groupTradesByTag(trades: Trade[]): GroupSummary[] {
  const map = new Map<string, Trade[]>();
  for (const t of trades) {
    const tags = t.tags?.length ? t.tags : ["untagged"];
    for (const tag of tags) {
      const arr = map.get(tag) ?? [];
      arr.push(t);
      map.set(tag, arr);
    }
  }
  return Array.from(map.entries())
    .map(([tag, arr]) => buildGroup(tag, tag, arr))
    .sort((a, b) => b.totalPnl - a.totalPnl);
}

export function groupTradesByDay(trades: Trade[]): GroupSummary[] {
  const map = new Map<string, Trade[]>();
  for (const t of trades) {
    const day = t.open_timestamp.split("T")[0];
    const arr = map.get(day) ?? [];
    arr.push(t);
    map.set(day, arr);
  }
  return Array.from(map.entries())
    .map(([day, arr]) => {
      const d = new Date(day + "T12:00:00");
      const label = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
      return buildGroup(day, label, arr);
    })
    .sort((a, b) => b.key.localeCompare(a.key));
}

export function groupTradesByField(
  trades: Trade[],
  field: keyof Trade | ((t: Trade) => string),
): GroupSummary[] {
  const map = new Map<string, Trade[]>();
  for (const t of trades) {
    const val = typeof field === "function" ? field(t) : String(t[field] ?? "Unknown");
    const arr = map.get(val) ?? [];
    arr.push(t);
    map.set(val, arr);
  }
  return Array.from(map.entries())
    .map(([key, arr]) => buildGroup(key, key, arr))
    .sort((a, b) => b.totalPnl - a.totalPnl);
}

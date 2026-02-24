"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTrades } from "@/hooks/use-trades";
import { calculateTradePnl } from "@/lib/calculations";
import { CHAINS } from "@/lib/types";
import { DemoBanner } from "@/components/demo-banner";
import { Header } from "@/components/header";
import {
  List,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Search,
  X,
} from "lucide-react";

type SortKey =
  | "date"
  | "symbol"
  | "pnl"
  | "quantity"
  | "fees"
  | "emotion"
  | "process_score"
  | "confidence";
type SortDir = "asc" | "desc";

const COLUMNS: { key: SortKey | null; label: string; className: string }[] = [
  { key: "date", label: "Date", className: "min-w-[100px]" },
  { key: "symbol", label: "Symbol", className: "min-w-[100px]" },
  { key: null, label: "Side", className: "min-w-[60px]" },
  { key: null, label: "Entry", className: "min-w-[90px] text-right" },
  { key: null, label: "Exit", className: "min-w-[90px] text-right" },
  { key: "quantity", label: "Qty", className: "min-w-[70px] text-right" },
  { key: "fees", label: "Fees", className: "min-w-[70px] text-right" },
  { key: "pnl", label: "P&L", className: "min-w-[90px] text-right" },
  { key: "emotion", label: "Emotion", className: "min-w-[80px]" },
  { key: "confidence", label: "Conf.", className: "min-w-[50px] text-right" },
  { key: "process_score", label: "Process", className: "min-w-[60px] text-right" },
  { key: null, label: "Setup", className: "min-w-[90px]" },
  { key: null, label: "Tags", className: "min-w-[100px]" },
  { key: null, label: "Source", className: "min-w-[60px]" },
];

export default function ExecutionsPage() {
  const router = useRouter();
  const { trades, loading, usingDemo } = useTrades();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const filtered = useMemo(() => {
    let result = trades;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.symbol.toLowerCase().includes(q) ||
          t.tags?.some((tag) => tag.toLowerCase().includes(q)) ||
          t.notes?.toLowerCase().includes(q) ||
          t.setup_type?.toLowerCase().includes(q) ||
          t.emotion?.toLowerCase().includes(q),
      );
    }
    return [...result].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      switch (sortKey) {
        case "date":
          return dir * a.open_timestamp.localeCompare(b.open_timestamp);
        case "symbol":
          return dir * a.symbol.localeCompare(b.symbol);
        case "pnl":
          return dir * ((a.pnl ?? 0) - (b.pnl ?? 0));
        case "quantity":
          return dir * (a.quantity - b.quantity);
        case "fees":
          return dir * (a.fees - b.fees);
        case "emotion":
          return dir * (a.emotion ?? "").localeCompare(b.emotion ?? "");
        case "process_score":
          return dir * ((a.process_score ?? 0) - (b.process_score ?? 0));
        case "confidence":
          return dir * ((a.confidence ?? 0) - (b.confidence ?? 0));
        default:
          return 0;
      }
    });
  }, [trades, search, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ArrowUpDown size={10} className="text-muted/30" />;
    return sortDir === "asc" ? (
      <ChevronUp size={10} className="text-accent" />
    ) : (
      <ChevronDown size={10} className="text-accent" />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-accent">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header />
      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <List size={24} className="text-accent" />
          Executions
        </h2>
        <p className="text-sm text-muted mt-0.5">
          {usingDemo ? "Sample data" : `${filtered.length} of ${trades.length} trades`}
        </p>
      </div>
      {usingDemo && <DemoBanner feature="executions" />}

      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/40" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search symbol, tag, emotion..."
          className="w-full bg-surface border border-border rounded-xl pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div
        className="bg-surface rounded-2xl border border-border overflow-hidden"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                {COLUMNS.map((col) => (
                  <th
                    key={col.label}
                    className={`text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold px-3 py-2.5 ${col.className} ${col.key ? "cursor-pointer hover:text-muted select-none" : ""}`}
                    onClick={() => col.key && toggleSort(col.key)}
                  >
                    <span className="flex items-center gap-1">
                      {col.label}
                      {col.key && <SortIcon col={col.key} />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((trade) => {
                const pnl = trade.pnl ?? calculateTradePnl(trade) ?? 0;
                return (
                  <tr
                    key={trade.id}
                    onClick={() => router.push(`/dashboard/trades/${trade.id}`)}
                    className="border-b border-border/30 hover:bg-surface-hover cursor-pointer transition-colors"
                  >
                    <td className="px-3 py-2 text-muted whitespace-nowrap">
                      {new Date(trade.open_timestamp).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-3 py-2 font-semibold text-foreground">
                      <span className="flex items-center gap-1">
                        {trade.symbol}
                        {trade.trade_source === "dex" && trade.chain && (
                          <span className="text-[9px] px-1 py-0.5 rounded bg-accent/10 text-accent">
                            {CHAINS.find((c) => c.id === trade.chain)?.label ?? trade.chain}
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${trade.position === "long" ? "bg-win/10 text-win" : "bg-loss/10 text-loss"}`}
                      >
                        {trade.position.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right text-muted tabular-nums">
                      ${trade.entry_price.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right text-muted tabular-nums">
                      {trade.exit_price !== null ? `$${trade.exit_price.toFixed(2)}` : "—"}
                    </td>
                    <td className="px-3 py-2 text-right text-muted tabular-nums">
                      {trade.quantity}
                    </td>
                    <td className="px-3 py-2 text-right text-muted tabular-nums">
                      ${trade.fees.toFixed(2)}
                    </td>
                    <td
                      className={`px-3 py-2 text-right font-semibold tabular-nums ${pnl >= 0 ? "text-win" : "text-loss"}`}
                    >
                      {trade.exit_price !== null ? `$${pnl.toFixed(2)}` : "Open"}
                    </td>
                    <td className="px-3 py-2">
                      {trade.emotion ? (
                        <span className="px-1.5 py-0.5 rounded-md bg-accent/10 text-accent text-[10px]">
                          {trade.emotion}
                        </span>
                      ) : (
                        <span className="text-muted/30">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right text-muted tabular-nums">
                      {trade.confidence !== null ? `${trade.confidence}` : "—"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {trade.process_score !== null ? (
                        <span
                          className={`font-semibold ${trade.process_score >= 7 ? "text-win" : trade.process_score >= 4 ? "text-amber-400" : "text-loss"}`}
                        >
                          {trade.process_score}/10
                        </span>
                      ) : (
                        <span className="text-muted/30">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-muted">{trade.setup_type ?? "—"}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1 flex-wrap">
                        {trade.tags?.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="text-[9px] px-1 py-0.5 rounded bg-border/50 text-muted"
                          >
                            {tag}
                          </span>
                        ))}
                        {(trade.tags?.length ?? 0) > 2 && (
                          <span className="text-[9px] text-muted/40">
                            +{trade.tags!.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-muted uppercase text-[10px]">
                      {trade.trade_source}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={14} className="px-3 py-12 text-center text-muted">
                    No trades match your search
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

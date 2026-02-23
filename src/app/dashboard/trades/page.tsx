"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Trade } from "@/lib/types";
import { DEMO_TRADES } from "@/lib/demo-data";
import { DemoBanner } from "@/components/demo-banner";
import { calculateTradePnl } from "@/lib/calculations";
import { CHAINS } from "@/lib/types";
import {
  Table2,
  Search,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Sparkles,
  X,
  ExternalLink,
  Fuel,
} from "lucide-react";
import { Header } from "@/components/header";
import { InfoTooltip } from "@/components/ui/info-tooltip";

type SortKey = "date" | "symbol" | "pnl" | "emotion" | "process_score";
type SortDir = "asc" | "desc";

const EMOTION_OPTIONS = ["All", "Calm", "Confident", "Excited", "Anxious", "FOMO", "Frustrated", "Revenge", "Bored"];

export default function TradesPage() {
  const router = useRouter();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingDemo, setUsingDemo] = useState(false);
  const [search, setSearch] = useState("");
  const [emotionFilter, setEmotionFilter] = useState("All");
  const [sourceFilter, setSourceFilter] = useState<"All" | "cex" | "dex">("All");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const supabase = createClient();

  const fetchTrades = useCallback(async () => {
    const { data } = await supabase
      .from("trades")
      .select("*")
      .order("open_timestamp", { ascending: false });
    const dbTrades = (data as Trade[]) ?? [];
    if (dbTrades.length === 0) {
      setTrades(DEMO_TRADES);
      setUsingDemo(true);
    } else {
      setTrades(dbTrades);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  const filtered = useMemo(() => {
    let result = trades;

    // Search filter
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.symbol.toLowerCase().includes(q) ||
          t.tags?.some((tag) => tag.toLowerCase().includes(q)) ||
          t.notes?.toLowerCase().includes(q) ||
          t.setup_type?.toLowerCase().includes(q)
      );
    }

    // Emotion filter
    if (emotionFilter !== "All") {
      result = result.filter((t) => t.emotion === emotionFilter);
    }

    // Source filter (CEX/DEX)
    if (sourceFilter !== "All") {
      result = result.filter((t) => t.trade_source === sourceFilter);
    }

    // Sort
    result = [...result].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      switch (sortKey) {
        case "date":
          return dir * (a.open_timestamp.localeCompare(b.open_timestamp));
        case "symbol":
          return dir * a.symbol.localeCompare(b.symbol);
        case "pnl":
          return dir * ((a.pnl ?? 0) - (b.pnl ?? 0));
        case "emotion":
          return dir * ((a.emotion ?? "").localeCompare(b.emotion ?? ""));
        case "process_score":
          return dir * ((a.process_score ?? 0) - (b.process_score ?? 0));
        default:
          return 0;
      }
    });

    return result;
  }, [trades, search, emotionFilter, sourceFilter, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ArrowUpDown size={12} className="text-muted/40" />;
    return sortDir === "asc" ? <ChevronUp size={12} className="text-accent" /> : <ChevronDown size={12} className="text-accent" />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-accent">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 mx-auto max-w-[1600px]">
      <Header />
      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <Table2 size={24} className="text-accent" />
          Trade Log <InfoTooltip text="All your trades in one place — filter, sort, and review" />
        </h2>
        <p className="text-sm text-muted mt-0.5">
          {usingDemo ? "Sample data" : `${filtered.length} of ${trades.length} trades`}
        </p>
      </div>
      {usingDemo && <DemoBanner feature="trade log" />}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search symbol, tag, notes..."
            className="w-full bg-surface border border-border rounded-xl pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground">
              <X size={14} />
            </button>
          )}
        </div>
        <select
          value={emotionFilter}
          onChange={(e) => setEmotionFilter(e.target.value)}
          className="bg-surface border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30"
        >
          {EMOTION_OPTIONS.map((e) => (
            <option key={e} value={e}>{e === "All" ? "All Emotions" : e}</option>
          ))}
        </select>
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value as "All" | "cex" | "dex")}
          className="bg-surface border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30"
        >
          <option value="All">All Sources</option>
          <option value="cex">CEX</option>
          <option value="dex">DEX</option>
        </select>
      </div>

      {/* Mobile card layout */}
      <div className="md:hidden space-y-3">
        {filtered.map((trade) => {
          const pnl = trade.pnl ?? calculateTradePnl(trade) ?? 0;
          return (
            <div
              key={trade.id}
              className="glass rounded-xl border border-border/50 p-4"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{trade.symbol}</span>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${
                    trade.position === "long" ? "bg-win/10 text-win" : "bg-loss/10 text-loss"
                  }`}>
                    {trade.position.toUpperCase()}
                  </span>
                  {trade.trade_source === "dex" && trade.chain && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-accent/10 text-accent">
                      {CHAINS.find((c) => c.id === trade.chain)?.label ?? trade.chain}
                    </span>
                  )}
                </div>
                <span className={`text-sm font-bold ${pnl >= 0 ? "text-win" : "text-loss"}`}>
                  {trade.exit_price !== null ? `$${pnl.toFixed(2)}` : "Open"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted">
                <span>{new Date(trade.open_timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                <div className="flex items-center gap-2">
                  {trade.emotion && (
                    <span className="px-1.5 py-0.5 rounded-md bg-accent/10 text-accent text-[10px]">{trade.emotion}</span>
                  )}
                  {trade.process_score !== null && (
                    <span className={`text-[10px] font-semibold ${trade.process_score >= 7 ? "text-win" : trade.process_score >= 4 ? "text-amber-400" : "text-loss"}`}>
                      {trade.process_score}/10
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted">No trades match your filters</div>
        )}
      </div>

      {/* Desktop table */}
      <div
        className="hidden md:block bg-surface rounded-2xl border border-border overflow-hidden"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {[
                  { key: "date" as SortKey, label: "Date" },
                  { key: "symbol" as SortKey, label: "Symbol" },
                  { key: null, label: "Side" },
                  { key: null, label: "Entry" },
                  { key: null, label: "Exit" },
                  { key: "pnl" as SortKey, label: "P&L" },
                  { key: "emotion" as SortKey, label: "Emotion" },
                  { key: "process_score" as SortKey, label: "Process" },
                  { key: null, label: "Tags" },
                ].map((col) => (
                  <th
                    key={col.label}
                    className={`text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold px-4 py-3 ${col.key ? "cursor-pointer hover:text-muted select-none" : ""}`}
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
                const isExpanded = expandedId === trade.id;
                return (
                  <tr key={trade.id} className="group">
                    <td colSpan={9} className="p-0">
                      <div
                        className="grid cursor-pointer hover:bg-surface-hover transition-colors"
                        style={{ gridTemplateColumns: "repeat(9, auto)" }}
                        onClick={() => router.push(`/dashboard/trades/${trade.id}`)}
                      >
                        <div className="px-4 py-3 text-muted whitespace-nowrap border-b border-border/50">
                          {new Date(trade.open_timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </div>
                        <div className="px-4 py-3 font-semibold text-foreground border-b border-border/50">
                          <div className="flex items-center gap-1.5">
                            {trade.symbol}
                            {trade.trade_source === "dex" && trade.chain && (
                              <span className="text-[9px] font-medium px-1 py-0.5 rounded bg-accent/10 text-accent">
                                {CHAINS.find((c) => c.id === trade.chain)?.label ?? trade.chain}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="px-4 py-3 border-b border-border/50">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${
                            trade.position === "long" ? "bg-win/10 text-win" : "bg-loss/10 text-loss"
                          }`}>
                            {trade.position.toUpperCase()}
                          </span>
                        </div>
                        <div className="px-4 py-3 text-muted tabular-nums border-b border-border/50">
                          ${trade.entry_price.toFixed(2)}
                        </div>
                        <div className="px-4 py-3 text-muted tabular-nums border-b border-border/50">
                          {trade.exit_price !== null ? `$${trade.exit_price.toFixed(2)}` : "—"}
                        </div>
                        <div className={`px-4 py-3 font-semibold tabular-nums border-b border-border/50 ${pnl >= 0 ? "text-win" : "text-loss"}`}>
                          {trade.exit_price !== null ? `$${pnl.toFixed(2)}` : "Open"}
                        </div>
                        <div className="px-4 py-3 border-b border-border/50">
                          {trade.emotion ? (
                            <span className="text-xs px-2 py-0.5 rounded-md bg-accent/10 text-accent">
                              {trade.emotion}
                            </span>
                          ) : (
                            <span className="text-muted/30">—</span>
                          )}
                        </div>
                        <div className="px-4 py-3 border-b border-border/50">
                          {trade.process_score !== null ? (
                            <span className={`text-xs font-semibold ${trade.process_score >= 7 ? "text-win" : trade.process_score >= 4 ? "text-amber-400" : "text-loss"}`}>
                              {trade.process_score}/10
                            </span>
                          ) : (
                            <span className="text-muted/30">—</span>
                          )}
                        </div>
                        <div className="px-4 py-3 border-b border-border/50">
                          <div className="flex gap-1 flex-wrap">
                            {trade.tags?.slice(0, 3).map((tag) => (
                              <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-border/50 text-muted">
                                {tag}
                              </span>
                            ))}
                            {(trade.tags?.length ?? 0) > 3 && (
                              <span className="text-[10px] text-muted/40">+{trade.tags!.length - 3}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expanded details */}
                      {isExpanded && (
                        <div className="px-4 py-4 bg-background/50 border-b border-border/50 space-y-3">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                            <div>
                              <span className="text-muted/60 uppercase tracking-wider text-[10px]">Quantity</span>
                              <p className="text-foreground font-medium mt-0.5">{trade.quantity}</p>
                            </div>
                            <div>
                              <span className="text-muted/60 uppercase tracking-wider text-[10px]">Fees</span>
                              <p className="text-foreground font-medium mt-0.5">${trade.fees.toFixed(2)}</p>
                            </div>
                            <div>
                              <span className="text-muted/60 uppercase tracking-wider text-[10px]">Confidence</span>
                              <p className="text-foreground font-medium mt-0.5">{trade.confidence !== null ? `${trade.confidence}/10` : "—"}</p>
                            </div>
                            <div>
                              <span className="text-muted/60 uppercase tracking-wider text-[10px]">Setup</span>
                              <p className="text-foreground font-medium mt-0.5">{trade.setup_type ?? "—"}</p>
                            </div>
                          </div>

                          {/* DEX details */}
                          {trade.trade_source === "dex" && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                              <div>
                                <span className="text-muted/60 uppercase tracking-wider text-[10px]">Chain</span>
                                <p className="text-foreground font-medium mt-0.5">
                                  {CHAINS.find((c) => c.id === trade.chain)?.label ?? trade.chain ?? "—"}
                                </p>
                              </div>
                              <div>
                                <span className="text-muted/60 uppercase tracking-wider text-[10px]">Protocol</span>
                                <p className="text-foreground font-medium mt-0.5">{trade.dex_protocol ?? "—"}</p>
                              </div>
                              <div>
                                <span className="text-muted/60 uppercase tracking-wider text-[10px]">Gas Fee</span>
                                <p className="text-foreground font-medium mt-0.5 flex items-center gap-1">
                                  <Fuel size={10} className="text-muted/60" />
                                  ${(trade.gas_fee ?? 0).toFixed(2)}
                                </p>
                              </div>
                              <div>
                                <span className="text-muted/60 uppercase tracking-wider text-[10px]">Tx Hash</span>
                                {trade.tx_hash ? (() => {
                                  const explorer = CHAINS.find((c) => c.id === trade.chain)?.explorer ?? "";
                                  return (
                                    <a
                                      href={`${explorer}${trade.tx_hash}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-accent hover:text-accent-hover font-medium mt-0.5 flex items-center gap-1 transition-colors"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {trade.tx_hash.slice(0, 8)}...{trade.tx_hash.slice(-6)}
                                      <ExternalLink size={10} />
                                    </a>
                                  );
                                })() : (
                                  <p className="text-foreground font-medium mt-0.5">—</p>
                                )}
                              </div>
                            </div>
                          )}

                          {trade.notes && (
                            <div>
                              <span className="text-muted/60 uppercase tracking-wider text-[10px]">Notes</span>
                              <p className="text-xs text-muted mt-0.5 leading-relaxed">{trade.notes}</p>
                            </div>
                          )}

                          {trade.checklist && Object.keys(trade.checklist).length > 0 && (
                            <div>
                              <span className="text-muted/60 uppercase tracking-wider text-[10px]">Checklist</span>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {Object.entries(trade.checklist).map(([key, val]) => (
                                  <span key={key} className={`text-[10px] px-2 py-0.5 rounded-md ${val ? "bg-win/10 text-win" : "bg-loss/10 text-loss"}`}>
                                    {val ? "✓" : "✗"} {key.replace(/_/g, " ")}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {trade.review && Object.keys(trade.review).length > 0 && (
                            <div>
                              <span className="text-muted/60 uppercase tracking-wider text-[10px]">Post-Trade Review</span>
                              <div className="mt-1 space-y-1">
                                {Object.entries(trade.review).map(([key, val]) => (
                                  <div key={key} className="text-xs">
                                    <span className="text-muted">{key.replace(/_/g, " ")}: </span>
                                    <span className="text-foreground">{val}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-muted">
                    No trades match your filters
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

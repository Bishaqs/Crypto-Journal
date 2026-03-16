"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X, TrendingUp, TrendingDown, Lock } from "lucide-react";
import { Trade } from "@/lib/types";

interface TradeLinkerProps {
  trades: Trade[];
  selectedTradeIds: string[];
  onSelect: (tradeIds: string[]) => void;
  autoLinkOnImport: boolean;
  onAutoLinkChange: (checked: boolean) => void;
  hasAutoLinkAccess?: boolean;
}

function formatPnl(pnl: number | null): string {
  if (pnl === null) return "Open";
  return pnl >= 0 ? `+$${pnl.toFixed(2)}` : `-$${Math.abs(pnl).toFixed(2)}`;
}

function formatDate(ts: string): string {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function TradeLinker({ trades, selectedTradeIds, onSelect, autoLinkOnImport, onAutoLinkChange, hasAutoLinkAccess = true }: TradeLinkerProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedSet = new Set(selectedTradeIds);
  const selectedTrades = trades.filter((t) => selectedSet.has(t.id));

  const filtered = trades.filter((t) => {
    if (selectedSet.has(t.id)) return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      t.symbol.toLowerCase().includes(q) ||
      t.open_timestamp.includes(q) ||
      t.position.includes(q)
    );
  }).slice(0, 8);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function removeTrade(tradeId: string) {
    onSelect(selectedTradeIds.filter((id) => id !== tradeId));
  }

  function addTrade(tradeId: string) {
    onSelect([...selectedTradeIds, tradeId]);
    setQuery("");
  }

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted">Link to Trades</label>

      {/* Selected trade chips */}
      {selectedTrades.length > 0 && (
        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
          {selectedTrades.map((trade) => (
            <span
              key={trade.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent/10 border border-accent/20 text-xs"
            >
              {trade.pnl !== null && trade.pnl >= 0 ? (
                <TrendingUp size={11} className="text-win shrink-0" />
              ) : (
                <TrendingDown size={11} className="text-loss shrink-0" />
              )}
              <span className="text-foreground font-medium">{trade.symbol}</span>
              <span className="text-muted capitalize">{trade.position}</span>
              <span className="text-muted">{formatDate(trade.open_timestamp)}</span>
              <span className={`font-medium ${trade.pnl !== null && trade.pnl >= 0 ? "text-win" : "text-loss"}`}>
                {formatPnl(trade.pnl)}
              </span>
              <button
                type="button"
                onClick={() => removeTrade(trade.id)}
                className="p-0.5 rounded text-muted hover:text-foreground transition-colors"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      <div ref={containerRef} className="relative">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={selectedTrades.length > 0 ? "Link another trade..." : "Search by symbol or date..."}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50 transition-all placeholder-muted/50"
          />
        </div>

        {open && filtered.length > 0 && (
          <div className="absolute z-20 mt-1 w-full bg-surface border border-border rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto">
            {filtered.map((trade) => (
              <button
                key={trade.id}
                type="button"
                onClick={() => addTrade(trade.id)}
                className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-accent/10 transition-colors"
              >
                {trade.pnl !== null && trade.pnl >= 0 ? (
                  <TrendingUp size={12} className="text-win shrink-0" />
                ) : (
                  <TrendingDown size={12} className="text-loss shrink-0" />
                )}
                <span className="text-sm font-medium text-foreground">{trade.symbol}</span>
                <span className="text-xs text-muted capitalize">{trade.position}</span>
                <span className="text-xs text-muted">{formatDate(trade.open_timestamp)}</span>
                <span className={`text-xs font-medium ml-auto ${trade.pnl !== null && trade.pnl >= 0 ? "text-win" : "text-loss"}`}>
                  {formatPnl(trade.pnl)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {hasAutoLinkAccess ? (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={autoLinkOnImport}
            onChange={(e) => onAutoLinkChange(e.target.checked)}
            className="w-4 h-4 rounded border-border bg-background accent-accent"
          />
          <span className="text-xs text-muted">Link this note to the closest trade on next import</span>
        </label>
      ) : (
        <div className="flex items-center gap-2 opacity-50">
          <Lock size={12} className="text-muted" />
          <span className="text-xs text-muted">Auto-link on import</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent font-medium">Max</span>
        </div>
      )}
    </div>
  );
}

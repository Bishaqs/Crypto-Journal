"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X, TrendingUp, TrendingDown, Lock } from "lucide-react";
import { Trade } from "@/lib/types";

interface TradeLinkerProps {
  trades: Trade[];
  selectedTradeId: string | null;
  onSelect: (tradeId: string | null) => void;
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

export function TradeLinker({ trades, selectedTradeId, onSelect, autoLinkOnImport, onAutoLinkChange, hasAutoLinkAccess = true }: TradeLinkerProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedTrade = selectedTradeId ? trades.find((t) => t.id === selectedTradeId) : null;

  const filtered = trades.filter((t) => {
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

  if (selectedTrade) {
    return (
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted">Linked Trade</label>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-accent/10 border border-accent/20">
          {selectedTrade.pnl !== null && selectedTrade.pnl >= 0 ? (
            <TrendingUp size={14} className="text-win shrink-0" />
          ) : (
            <TrendingDown size={14} className="text-loss shrink-0" />
          )}
          <span className="text-sm text-foreground font-medium">{selectedTrade.symbol}</span>
          <span className="text-xs text-muted capitalize">{selectedTrade.position}</span>
          <span className="text-xs text-muted">{formatDate(selectedTrade.open_timestamp)}</span>
          <span className={`text-xs font-medium ml-auto ${selectedTrade.pnl !== null && selectedTrade.pnl >= 0 ? "text-win" : "text-loss"}`}>
            {formatPnl(selectedTrade.pnl)}
          </span>
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="p-0.5 rounded text-muted hover:text-foreground transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted">Link to Trade</label>
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
            placeholder="Search by symbol or date..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50 transition-all placeholder-muted/50"
          />
        </div>

        {open && filtered.length > 0 && (
          <div className="absolute z-20 mt-1 w-full bg-surface border border-border rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto">
            {filtered.map((trade) => (
              <button
                key={trade.id}
                type="button"
                onClick={() => {
                  onSelect(trade.id);
                  setQuery("");
                  setOpen(false);
                }}
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

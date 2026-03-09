"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import {
  CRYPTO_SYMBOL_GROUPS,
  COIN_TO_COINGECKO_ID,
  VIRTUAL_DISPLAY_NAMES,
} from "@/lib/coin-registry";

interface CoinSelectorProps {
  value: string;
  onSelect: (symbol: string) => void;
}

// Build display name for a ticker
function coinDisplayName(ticker: string): string {
  const cgId = COIN_TO_COINGECKO_ID[ticker.toUpperCase()];
  if (!cgId) return ticker;
  if (VIRTUAL_DISPLAY_NAMES[cgId]) return VIRTUAL_DISPLAY_NAMES[cgId];
  return cgId
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// Groups to show (exclude Market — those are in MarketOverview)
const COIN_GROUPS = Object.entries(CRYPTO_SYMBOL_GROUPS).filter(
  ([key]) => key !== "Market",
);

export default function CoinSelector({ value, onSelect }: CoinSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Focus search when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  // Filter groups by search query
  const filteredGroups = useMemo(() => {
    if (!query.trim()) return COIN_GROUPS;
    const q = query.toUpperCase();
    const qLower = query.toLowerCase();
    return COIN_GROUPS.map(([group, symbols]) => {
      const filtered = symbols.filter(
        (s) =>
          s.includes(q) ||
          coinDisplayName(s).toLowerCase().includes(qLower),
      );
      return [group, filtered] as [string, string[]];
    }).filter(([, symbols]) => symbols.length > 0);
  }, [query]);

  function handleSelect(sym: string) {
    onSelect(sym);
    setIsOpen(false);
  }

  const displayName = coinDisplayName(value);

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface border border-border/50 hover:border-accent/30 transition-all"
      >
        <span className="text-sm font-bold text-accent">{value}</span>
        <span className="text-xs text-muted hidden sm:inline">
          {displayName}
        </span>
        <ChevronDown
          size={14}
          className={`text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div
          className="absolute z-50 top-full mt-2 left-0 w-[340px] sm:w-[420px] max-h-[420px] overflow-y-auto rounded-2xl bg-surface border border-border/80 shadow-lg glass"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          {/* Search input */}
          <div className="sticky top-0 bg-surface/95 backdrop-blur-sm p-3 border-b border-border/30">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/40 pointer-events-none"
              />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setIsOpen(false);
                }}
                placeholder="Search coins..."
                className="w-full bg-surface border border-border/50 rounded-lg pl-9 pr-8 py-2 text-xs text-foreground placeholder:text-muted/30 focus:outline-none focus:border-accent/50 uppercase font-semibold"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted/40 hover:text-foreground"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Grouped coin list */}
          <div className="p-3 space-y-4">
            {filteredGroups.length === 0 && (
              <p className="text-xs text-muted text-center py-4">
                No coins found
              </p>
            )}
            {filteredGroups.map(([group, symbols]) => (
              <div key={group}>
                <p className="text-[9px] uppercase tracking-wider text-muted/50 font-semibold mb-1.5">
                  {group}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {symbols.map((sym) => (
                    <button
                      key={sym}
                      onClick={() => handleSelect(sym)}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                        value === sym
                          ? "bg-accent/15 text-accent border border-accent/30"
                          : "bg-surface-hover border border-border/30 text-muted hover:text-foreground hover:border-accent/20"
                      }`}
                    >
                      {sym}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

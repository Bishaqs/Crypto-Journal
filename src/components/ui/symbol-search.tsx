"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Search, X } from "lucide-react";
import { searchStocks, resolveStockName, POPULAR_STOCKS } from "@/lib/stock-registry";
import { COIN_TO_COINGECKO_ID, SUPPORTED_BINANCE_SYMBOLS, VIRTUAL_DISPLAY_NAMES } from "@/lib/coin-registry";

interface SymbolSearchProps {
  mode: "stock" | "crypto" | "binance";
  value: string;
  onSelect: (symbol: string) => void;
  /** Context key for popular picks (e.g. "options-flow", "fundamentals") */
  popularKey?: string;
  placeholder?: string;
  className?: string;
  /** Compact mode — no badge, no popular row. For tight spaces like simulator panels. */
  compact?: boolean;
}

interface SearchResult {
  ticker: string;
  name: string;
}

// Build flat crypto search list once
const CRYPTO_LIST: SearchResult[] = Object.entries(COIN_TO_COINGECKO_ID).map(
  ([ticker, id]) => ({
    ticker,
    name: VIRTUAL_DISPLAY_NAMES[id] ??
      id.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
  }),
);

// Build Binance search list once
const BINANCE_LIST: SearchResult[] = SUPPORTED_BINANCE_SYMBOLS.map((s) => ({
  ticker: s.value,
  name: s.label,
}));

function searchCrypto(query: string, limit = 12): SearchResult[] {
  if (!query) return [];
  const q = query.toUpperCase();
  const results: SearchResult[] = [];
  const seen = new Set<string>();

  for (const entry of CRYPTO_LIST) {
    if (entry.ticker === q) { results.push(entry); seen.add(entry.ticker); break; }
  }
  for (const entry of CRYPTO_LIST) {
    if (results.length >= limit) break;
    if (!seen.has(entry.ticker) && entry.ticker.startsWith(q)) { results.push(entry); seen.add(entry.ticker); }
  }
  const qLower = query.toLowerCase();
  for (const entry of CRYPTO_LIST) {
    if (results.length >= limit) break;
    if (!seen.has(entry.ticker) && entry.name.toLowerCase().includes(qLower)) { results.push(entry); seen.add(entry.ticker); }
  }
  return results;
}

function searchBinance(query: string, limit = 12): SearchResult[] {
  if (!query) return [];
  const q = query.toUpperCase();
  const results: SearchResult[] = [];
  const seen = new Set<string>();

  // exact match
  for (const entry of BINANCE_LIST) {
    if (entry.ticker === q) { results.push(entry); seen.add(entry.ticker); break; }
  }
  // prefix match (on pair like BTCUSDT or label like BTC)
  for (const entry of BINANCE_LIST) {
    if (results.length >= limit) break;
    if (!seen.has(entry.ticker) && (entry.ticker.startsWith(q) || entry.name.toUpperCase().startsWith(q))) {
      results.push(entry); seen.add(entry.ticker);
    }
  }
  // substring match on label
  const qLower = query.toLowerCase();
  for (const entry of BINANCE_LIST) {
    if (results.length >= limit) break;
    if (!seen.has(entry.ticker) && entry.name.toLowerCase().includes(qLower)) {
      results.push(entry); seen.add(entry.ticker);
    }
  }
  return results;
}

const POPULAR_CRYPTO = ["BTC", "ETH", "SOL", "DOGE", "AVAX", "LINK", "ARB", "PEPE", "SUI"];
const POPULAR_BINANCE = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "DOGEUSDT", "AVAXUSDT", "LINKUSDT"];

export default function SymbolSearch({
  mode,
  value,
  onSelect,
  popularKey,
  placeholder,
  className = "",
  compact = false,
}: SymbolSearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    if (mode === "stock") return searchStocks(query, 10);
    if (mode === "binance") return searchBinance(query, 10);
    return searchCrypto(query, 10);
  }, [query, mode]);

  const popular = useMemo(() => {
    if (mode === "stock") {
      return POPULAR_STOCKS[popularKey ?? ""] ?? POPULAR_STOCKS["options-flow"];
    }
    if (mode === "binance") return POPULAR_BINANCE;
    return POPULAR_CRYPTO;
  }, [mode, popularKey]);

  // Label for active symbol
  const activeLabel = useMemo(() => {
    if (mode === "stock") return resolveStockName(value);
    if (mode === "binance") {
      const entry = SUPPORTED_BINANCE_SYMBOLS.find((s) => s.value === value);
      return entry?.label;
    }
    const cgId = COIN_TO_COINGECKO_ID[value.toUpperCase()];
    if (cgId) {
      return VIRTUAL_DISPLAY_NAMES[cgId] ??
        cgId.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    }
    return undefined;
  }, [mode, value]);

  const selectSymbol = useCallback(
    (sym: string) => {
      onSelect(mode === "binance" ? sym : sym.toUpperCase());
      setQuery("");
      setIsOpen(false);
      setHighlightIndex(0);
    },
    [onSelect, mode],
  );

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Keyboard nav
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results.length > 0 && highlightIndex < results.length) {
        selectSymbol(results[highlightIndex].ticker);
      } else if (query.trim()) {
        selectSymbol(query.trim());
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  }

  const defaultPlaceholder = mode === "stock"
    ? "Search any stock..."
    : mode === "binance"
      ? "Search pair..."
      : "Search any crypto...";

  // ── Compact mode (simulator panels) ──
  if (compact) {
    return (
      <div className={`relative ${className}`} ref={containerRef}>
        <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none z-10" />
        <input
          ref={inputRef}
          type="text"
          value={query || value}
          onChange={(e) => {
            setQuery(e.target.value.toUpperCase());
            setIsOpen(true);
            setHighlightIndex(0);
          }}
          onFocus={() => {
            setQuery("");
            setIsOpen(true);
          }}
          onBlur={() => {
            // delay to allow click on dropdown
            setTimeout(() => setIsOpen(false), 150);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? defaultPlaceholder}
          className="w-full bg-white/5 border border-white/10 rounded-lg pl-7 pr-2 py-1.5 text-xs text-white font-semibold focus:outline-none focus:border-white/20 transition-all uppercase"
        />
        {isOpen && results.length > 0 && (
          <div className="absolute z-50 top-full mt-1 left-0 w-[220px] max-h-[200px] overflow-y-auto rounded-lg bg-[#111118] border border-white/10 shadow-lg">
            {results.map((r, i) => (
              <button
                key={r.ticker}
                onMouseDown={() => selectSymbol(r.ticker)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 text-left transition-colors text-xs ${
                  i === highlightIndex ? "bg-white/10 text-white" : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className="font-bold w-16 shrink-0">{r.ticker}</span>
                <span className="text-[10px] text-gray-500 truncate">{r.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Full mode (dashboard pages) ──
  return (
    <div className={`space-y-2 ${className}`} ref={containerRef}>
      {/* Search input + active badge */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Active symbol badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/25">
          <span className="text-xs font-bold text-accent">{value}</span>
          {activeLabel && (
            <span className="text-[10px] text-muted/60 hidden sm:inline">{activeLabel}</span>
          )}
        </div>

        {/* Search input */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/40 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              const v = e.target.value.toUpperCase();
              setQuery(v);
              setIsOpen(true);
              setHighlightIndex(0);
            }}
            onFocus={() => {
              if (query.trim()) setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder ?? defaultPlaceholder}
            className="w-[220px] bg-surface border border-border rounded-xl pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted/30 focus:outline-none focus:border-accent/50 transition-all uppercase font-semibold"
          />
          {query && (
            <button
              onClick={() => {
                setQuery("");
                setIsOpen(false);
                inputRef.current?.focus();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted/40 hover:text-foreground"
            >
              <X size={12} />
            </button>
          )}

          {/* Dropdown */}
          {isOpen && results.length > 0 && (
            <div className="absolute z-50 top-full mt-1 left-0 w-[280px] max-h-[280px] overflow-y-auto rounded-xl bg-surface border border-border/80 shadow-lg">
              {results.map((r, i) => (
                <button
                  key={r.ticker}
                  onClick={() => selectSymbol(r.ticker)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                    i === highlightIndex
                      ? "bg-accent/10 text-accent"
                      : "hover:bg-surface-hover text-foreground"
                  }`}
                >
                  <span className="text-xs font-bold w-14 shrink-0">{r.ticker}</span>
                  <span className="text-[11px] text-muted truncate">{r.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Popular picks */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[9px] text-muted/40 uppercase tracking-wider font-semibold mr-0.5">
          Popular
        </span>
        {popular.map((sym) => (
          <button
            key={sym}
            onClick={() => selectSymbol(sym)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${
              value === sym
                ? "bg-accent/15 text-accent border border-accent/30"
                : "bg-surface border border-border/50 text-muted hover:text-foreground hover:border-accent/20"
            }`}
          >
            {sym}
          </button>
        ))}
      </div>
    </div>
  );
}

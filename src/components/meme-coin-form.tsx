"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, Search, Loader2, Eye, EyeOff, Droplet, AlertTriangle } from "lucide-react";
import type { MemeCoin } from "@/lib/schemas/meme-coin";

type MemeCoinFormProps = {
  editCoin?: MemeCoin | null;
  onClose: () => void;
  onSaved: () => void;
};

// A normalized candidate returned by the DexScreener proxy.
type Candidate = {
  tokenAddress: string;
  chain: string;
  pairAddress: string | null;
  symbol: string | null;
  name: string | null;
  priceUsd: number | null;
  marketCap: number | null;
  fdv: number | null;
  liquidityUsd: number | null;
  priceChange24h: number | null;
  url: string | null;
};

// Compact USD: $1.2M, $850K, $1.4B
function formatCompactUsd(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(1)}K`;
  return `${sign}$${abs.toFixed(0)}`;
}

const DEBOUNCE_MS = 400;

export function MemeCoinForm({ editCoin, onClose, onSaved }: MemeCoinFormProps) {
  const isEdit = !!editCoin;

  // Selected token identity (prefilled from a candidate or from editCoin).
  const [chain, setChain] = useState(editCoin?.chain ?? "");
  const [contractAddress, setContractAddress] = useState(editCoin?.contract_address ?? "");
  const [pairAddress, setPairAddress] = useState<string | null>(editCoin?.pair_address ?? null);
  const [symbol, setSymbol] = useState(editCoin?.symbol ?? "");
  const [name, setName] = useState(editCoin?.name ?? "");

  const [isWatchlist, setIsWatchlist] = useState(editCoin?.is_watchlist ?? false);
  const [entryMarketCap, setEntryMarketCap] = useState<string>(
    editCoin?.entry_market_cap != null ? String(editCoin.entry_market_cap) : ""
  );
  const [positionSize, setPositionSize] = useState<string>(
    editCoin?.position_size != null ? String(editCoin.position_size) : ""
  );

  // Search state.
  const [query, setQuery] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchTouched, setSearchTouched] = useState(false);
  const [selected, setSelected] = useState(isEdit);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const runSearch = useCallback(async (q: string) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setSearching(true);
    setSearchTouched(true);
    try {
      const res = await fetch(`/api/market/dexscreener?q=${encodeURIComponent(q)}`, {
        signal: controller.signal,
      });
      if (!res.ok) {
        setCandidates([]);
        return;
      }
      const data = await res.json();
      setCandidates((data.tokens ?? []) as Candidate[]);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setCandidates([]);
    } finally {
      setSearching(false);
    }
  }, []);

  // Debounced search on query change.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setCandidates([]);
      setSearchTouched(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      runSearch(trimmed);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, runSearch]);

  // Cleanup any in-flight request on unmount.
  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  function pickCandidate(c: Candidate) {
    setChain(c.chain);
    setContractAddress(c.tokenAddress);
    setPairAddress(c.pairAddress);
    setSymbol(c.symbol ?? "");
    setName(c.name ?? "");
    if (c.marketCap != null) setEntryMarketCap(String(Math.round(c.marketCap)));
    setSelected(true);
    setCandidates([]);
    setSearchTouched(false);
    setQuery("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!chain.trim() || !contractAddress.trim()) {
      setError("Pick a token from the search results first.");
      return;
    }

    setSaving(true);
    try {
      const entryMcapNum = entryMarketCap.trim() ? Number(entryMarketCap) : null;
      const positionSizeNum = positionSize.trim() ? Number(positionSize) : null;

      if (entryMcapNum != null && (!Number.isFinite(entryMcapNum) || entryMcapNum < 0)) {
        setError("Entry market cap must be a positive number.");
        return;
      }
      if (positionSizeNum != null && (!Number.isFinite(positionSizeNum) || positionSizeNum < 0)) {
        setError("Position size must be a positive number.");
        return;
      }

      const payload = {
        chain: chain.trim(),
        contract_address: contractAddress.trim(),
        pair_address: pairAddress,
        symbol: symbol.trim() || null,
        name: name.trim() || null,
        is_watchlist: isWatchlist,
        // Watchlist entries carry no position fields.
        entry_market_cap: isWatchlist ? null : entryMcapNum,
        position_size: isWatchlist ? null : positionSizeNum,
      };

      const url = isEdit ? `/api/meme-coins/${editCoin.id}` : "/api/meme-coins";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save coin");
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="text-lg font-bold text-foreground">
            {isEdit ? "Edit Coin" : "Add Meme Coin"}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-surface-hover transition-colors"
          >
            <X size={18} className="text-muted" />
          </button>
        </div>

        {error && (
          <div className="mx-5 mt-4 px-4 py-2.5 rounded-xl bg-loss/10 border border-loss/20 text-loss text-sm flex items-center gap-2">
            <AlertTriangle size={14} className="shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Token search (hidden once selected, unless re-searching) */}
          {!isEdit && (
            <div>
              <label className="block text-xs text-muted mb-1.5">
                Search by contract address or symbol <span className="text-loss">*</span>
              </label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/60" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. WIF, BONK, or 0x... / Solana address"
                  className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50 transition-all placeholder-muted/50"
                  autoFocus
                />
                {searching && (
                  <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-accent animate-spin" />
                )}
              </div>

              {/* Candidate list */}
              {candidates.length > 0 && (
                <div className="mt-2 space-y-1.5 max-h-64 overflow-y-auto">
                  {candidates.map((c) => (
                    <button
                      key={`${c.chain}-${c.pairAddress ?? c.tokenAddress}`}
                      type="button"
                      onClick={() => pickCandidate(c)}
                      className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-background border border-border text-left hover:border-accent/40 hover:bg-surface-hover/50 transition-all"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-foreground truncate">
                            {c.symbol ?? "???"}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-accent/8 text-accent font-medium capitalize shrink-0">
                            {c.chain}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted truncate">{c.name ?? c.tokenAddress}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 text-right">
                        <div>
                          <p className="text-[10px] text-muted/60 uppercase tracking-wider">MCap</p>
                          <p className="text-xs font-semibold text-foreground">{formatCompactUsd(c.marketCap)}</p>
                        </div>
                        <div className="flex items-center gap-1 text-muted">
                          <Droplet size={11} className="text-accent" />
                          <span className="text-xs">{formatCompactUsd(c.liquidityUsd)}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Graceful "no liquid pair found" */}
              {!searching && searchTouched && candidates.length === 0 && query.trim().length >= 2 && (
                <p className="mt-2 text-xs text-muted px-1">
                  No liquid pair found for &ldquo;{query.trim()}&rdquo;. Try the full contract address.
                </p>
              )}
            </div>
          )}

          {/* Selected token summary */}
          {selected && (chain || contractAddress) && (
            <div className="rounded-xl bg-background border border-border p-3.5">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground">{symbol || "Unknown"}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-accent/8 text-accent font-medium capitalize">
                    {chain || "—"}
                  </span>
                </div>
                {name && <span className="text-xs text-muted truncate max-w-[200px]">{name}</span>}
              </div>
              <p className="text-[11px] text-muted/70 font-mono break-all">{contractAddress}</p>
            </div>
          )}

          {/* Watchlist-only toggle */}
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2">
              {isWatchlist ? (
                <Eye size={16} className="text-accent" />
              ) : (
                <EyeOff size={16} className="text-muted" />
              )}
              <div>
                <p className="text-sm text-foreground font-medium">Watchlist only</p>
                <p className="text-xs text-muted">No position — just track this coin</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsWatchlist((v) => !v)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                isWatchlist ? "bg-accent" : "bg-border"
              }`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  isWatchlist ? "translate-x-[22px]" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          {/* Position fields (hidden for watchlist) */}
          {!isWatchlist && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-muted mb-1.5">Entry Market Cap ($)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={entryMarketCap}
                  onChange={(e) => setEntryMarketCap(e.target.value)}
                  placeholder="e.g. 1200000"
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50 transition-all placeholder-muted/50"
                />
                {entryMarketCap.trim() && (
                  <p className="mt-1 text-[11px] text-muted">{formatCompactUsd(Number(entryMarketCap))}</p>
                )}
              </div>
              <div>
                <label className="block text-xs text-muted mb-1.5">Position Size ($)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={positionSize}
                  onChange={(e) => setPositionSize(e.target.value)}
                  placeholder="e.g. 250"
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50 transition-all placeholder-muted/50"
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-muted hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !chain.trim() || !contractAddress.trim()}
              className="px-6 py-2.5 rounded-xl bg-accent text-background font-semibold text-sm hover:bg-accent-hover hover:shadow-[0_0_20px_rgba(0,180,216,0.3)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : isEdit ? "Save Changes" : "Add Coin"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

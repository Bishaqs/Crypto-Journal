"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Rocket,
  Plus,
  ChevronDown,
  ChevronUp,
  Eye,
  Pencil,
  Trash2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Trophy,
  Skull,
  DollarSign,
  Percent,
  ExternalLink,
  Loader2,
  StickyNote,
  Send,
} from "lucide-react";
import { Header } from "@/components/header";
import { MemeCoinForm } from "@/components/meme-coin-form";
import {
  useMemeCoinStats,
  realizedMultiple,
  unrealizedMultiple,
} from "@/lib/use-meme-coin-stats";
import type { MemeCoin, MemeCoinNote } from "@/lib/schemas/meme-coin";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function formatMultiple(m: number | null | undefined): string {
  if (m == null || !Number.isFinite(m)) return "—";
  return `${m.toFixed(m >= 10 ? 0 : m >= 1 ? 1 : 2)}x`;
}

// Live market data merged onto a coin, keyed by token address.
type LiveData = {
  marketCap: number | null;
  priceUsd: number | null;
  priceChange24h: number | null;
};

type LiveToken = {
  tokenAddress: string;
  marketCap: number | null;
  priceUsd: number | null;
  priceChange24h: number | null;
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function MemeCoinsPage() {
  const [coins, setCoins] = useState<MemeCoin[]>([]);
  const [live, setLive] = useState<Map<string, LiveData>>(new Map());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCoin, setEditingCoin] = useState<MemeCoin | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const stats = useMemeCoinStats(coins);

  // --- Live refresh: group by chain, one proxy call per chain ---------------
  const refreshLive = useCallback(async (list: MemeCoin[]) => {
    const byChain = new Map<string, Set<string>>();
    for (const c of list) {
      if (!c.chain || !c.contract_address) continue;
      const set = byChain.get(c.chain) ?? new Set<string>();
      set.add(c.contract_address);
      byChain.set(c.chain, set);
    }
    if (byChain.size === 0) return;

    setRefreshing(true);
    try {
      const results = await Promise.allSettled(
        Array.from(byChain.entries()).map(async ([chain, addrs]) => {
          const addresses = Array.from(addrs).join(",");
          const res = await fetch(
            `/api/market/dexscreener?chain=${encodeURIComponent(chain)}&addresses=${encodeURIComponent(addresses)}`
          );
          if (!res.ok) return [] as LiveToken[];
          const data = await res.json();
          return (data.tokens ?? []) as LiveToken[];
        })
      );

      const merged = new Map<string, LiveData>();
      for (const r of results) {
        if (r.status !== "fulfilled") continue;
        for (const t of r.value) {
          if (!t.tokenAddress) continue;
          merged.set(t.tokenAddress.toLowerCase(), {
            marketCap: t.marketCap,
            priceUsd: t.priceUsd,
            priceChange24h: t.priceChange24h,
          });
        }
      }
      setLive(merged);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const fetchCoins = useCallback(async () => {
    try {
      const res = await fetch("/api/meme-coins");
      if (res.ok) {
        const data = await res.json();
        const list = (data.coins ?? []) as MemeCoin[];
        setCoins(list);
        refreshLive(list);
      } else {
        setFetchError("Failed to load coins. Please refresh the page.");
      }
    } catch (err) {
      console.error("Failed to load meme coins:", err);
      setFetchError("Failed to load coins. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  }, [refreshLive]);

  useEffect(() => {
    fetchCoins();
  }, [fetchCoins]);

  function liveFor(coin: MemeCoin): LiveData | undefined {
    return live.get(coin.contract_address.toLowerCase());
  }

  // --- Actions --------------------------------------------------------------
  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      const res = await fetch(`/api/meme-coins/${id}`, { method: "DELETE" });
      if (res.ok) {
        setCoins((prev) => prev.filter((c) => c.id !== id));
        if (expandedId === id) setExpandedId(null);
      }
    } finally {
      setDeleting(null);
    }
  }

  async function updateCoin(id: string, patch: Partial<MemeCoin>) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/meme-coins/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (res.ok) {
        const data = await res.json();
        setCoins((prev) => prev.map((c) => (c.id === id ? (data.coin as MemeCoin) : c)));
      }
    } finally {
      setBusyId(null);
    }
  }

  async function handleSell(coin: MemeCoin) {
    const liveMcap = liveFor(coin)?.marketCap ?? null;
    const exit =
      liveMcap != null
        ? liveMcap
        : coin.entry_market_cap != null
          ? coin.entry_market_cap
          : 0;
    let realized: number | null = null;
    if (
      coin.position_size != null &&
      coin.entry_market_cap != null &&
      coin.entry_market_cap > 0
    ) {
      realized = coin.position_size * (exit / coin.entry_market_cap - 1);
    }
    await updateCoin(coin.id, {
      status: "sold",
      exit_market_cap: exit,
      realized_pnl: realized,
    });
  }

  async function handleRugged(coin: MemeCoin) {
    await updateCoin(coin.id, {
      status: "rugged",
      exit_market_cap: 0,
      realized_pnl: coin.position_size != null ? -coin.position_size : null,
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-accent">Loading...</div>
      </div>
    );
  }

  const watchlist = coins.filter((c) => c.is_watchlist);
  const positions = coins.filter((c) => !c.is_watchlist);
  const hasCoins = coins.length > 0;

  return (
    <div className="space-y-6 mx-auto max-w-[1600px]">
      <Header />
      {fetchError && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-loss/10 border border-loss/30 text-loss text-sm">
          <AlertTriangle size={14} />
          {fetchError}
        </div>
      )}

      {/* Title row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Rocket size={24} className="text-accent" />
            Meme Coins
            {refreshing && <Loader2 size={16} className="text-accent animate-spin" />}
          </h2>
          <p className="text-sm text-muted mt-0.5">
            Track your meme-coin watchlist and positions with live DexScreener data
          </p>
        </div>
        <button
          onClick={() => {
            setEditingCoin(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-background font-semibold text-sm hover:bg-accent-hover hover:shadow-[0_0_20px_rgba(0,180,216,0.3)] transition-all duration-300"
        >
          <Plus size={18} />
          Add Coin
        </button>
      </div>

      {/* Stats header */}
      {stats.closedCount > 0 && (
        <div className="glass rounded-2xl border border-border/50 p-4" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <StatCell label="Closed" value={String(stats.closedCount)} />
            <StatCell label="Holding" value={String(stats.holdingCount)} />
            <StatCell label="Watching" value={String(stats.watchlistCount)} />
            <StatCell
              label="Win Rate"
              value={`${stats.winRate.toFixed(0)}%`}
              color={stats.winRate >= 50 ? "text-win" : "text-loss"}
              icon={<Percent size={12} className="text-accent" />}
            />
            <StatCell
              label="Avg Multiple"
              value={formatMultiple(stats.avgMultiple)}
              color={stats.avgMultiple >= 1 ? "text-win" : "text-loss"}
            />
            <StatCell
              label="Realized P&L"
              value={`${stats.realizedPnl >= 0 ? "" : "-"}$${Math.abs(stats.realizedPnl).toFixed(0)}`}
              color={stats.realizedPnl >= 0 ? "text-win" : "text-loss"}
              icon={<DollarSign size={12} className="text-accent" />}
            />
            <StatCell
              label="Best / Worst"
              value={
                stats.best
                  ? `${stats.best.symbol} ${formatMultiple(stats.best.multiple)}`
                  : "—"
              }
              sub={stats.worst ? `${stats.worst.symbol} ${formatMultiple(stats.worst.multiple)}` : undefined}
              color="text-foreground"
            />
          </div>
        </div>
      )}

      {/* Empty state */}
      {!hasCoins && (
        <div className="glass rounded-2xl border border-border/50 p-12" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
              <Rocket size={28} className="text-accent" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">Track Your First Meme Coin</h3>
            <p className="text-sm text-muted mb-6 max-w-md">
              Add coins to your watchlist or log positions. Live market cap, price, and 24h change
              are pulled straight from DexScreener.
            </p>
            <button
              onClick={() => {
                setEditingCoin(null);
                setShowForm(true);
              }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-background font-semibold text-sm hover:bg-accent-hover hover:shadow-[0_0_20px_rgba(0,180,216,0.3)] transition-all duration-300"
            >
              <Plus size={18} />
              Add Your First Coin
            </button>
          </div>
        </div>
      )}

      {/* Positions */}
      {positions.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
            <TrendingUp size={14} className="text-accent" />
            Positions
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-accent/8 text-accent font-medium">
              {positions.length}
            </span>
          </h3>
          <div className="space-y-3">
            {positions.map((coin) => (
              <CoinCard
                key={coin.id}
                coin={coin}
                liveData={liveFor(coin)}
                isExpanded={expandedId === coin.id}
                onToggleExpand={() => setExpandedId(expandedId === coin.id ? null : coin.id)}
                onEdit={() => {
                  setEditingCoin(coin);
                  setShowForm(true);
                }}
                onDelete={() => handleDelete(coin.id)}
                onSell={() => handleSell(coin)}
                onRugged={() => handleRugged(coin)}
                deleting={deleting === coin.id}
                busy={busyId === coin.id}
              />
            ))}
          </div>
        </section>
      )}

      {/* Watchlist */}
      {watchlist.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
            <Eye size={14} className="text-accent" />
            Watchlist
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-accent/8 text-accent font-medium">
              {watchlist.length}
            </span>
          </h3>
          <div className="space-y-3">
            {watchlist.map((coin) => (
              <CoinCard
                key={coin.id}
                coin={coin}
                liveData={liveFor(coin)}
                isExpanded={expandedId === coin.id}
                onToggleExpand={() => setExpandedId(expandedId === coin.id ? null : coin.id)}
                onEdit={() => {
                  setEditingCoin(coin);
                  setShowForm(true);
                }}
                onDelete={() => handleDelete(coin.id)}
                onSell={() => handleSell(coin)}
                onRugged={() => handleRugged(coin)}
                deleting={deleting === coin.id}
                busy={busyId === coin.id}
              />
            ))}
          </div>
        </section>
      )}

      {/* Form modal */}
      {showForm && (
        <MemeCoinForm
          editCoin={editingCoin}
          onClose={() => {
            setShowForm(false);
            setEditingCoin(null);
          }}
          onSaved={fetchCoins}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat cell
// ---------------------------------------------------------------------------

function StatCell({
  label,
  value,
  sub,
  color,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[10px] text-muted/60 uppercase tracking-wider flex items-center gap-1">
        {icon}
        {label}
      </p>
      <p className={`text-sm font-bold ${color ?? "text-foreground"}`}>{value}</p>
      {sub && <p className="text-[11px] text-loss font-medium">{sub}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Coin card
// ---------------------------------------------------------------------------

function CoinCard({
  coin,
  liveData,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onSell,
  onRugged,
  deleting,
  busy,
}: {
  coin: MemeCoin;
  liveData: LiveData | undefined;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onSell: () => void;
  onRugged: () => void;
  deleting: boolean;
  busy: boolean;
}) {
  const isClosed = coin.status === "sold" || coin.status === "rugged";
  const liveMcap = liveData?.marketCap ?? null;
  const change24h = liveData?.priceChange24h ?? null;

  // Open holding metrics.
  const unrealMult = !coin.is_watchlist && coin.status === "holding"
    ? unrealizedMultiple(liveMcap, coin.entry_market_cap)
    : null;
  const unrealPnl =
    unrealMult != null && coin.position_size != null
      ? coin.position_size * (unrealMult - 1)
      : null;

  // Closed metrics.
  const realMult = isClosed ? realizedMultiple(coin) : null;

  return (
    <div
      className={`glass rounded-2xl border overflow-hidden transition-opacity ${
        coin.status === "rugged" ? "border-loss/30 opacity-70" : "border-border/50"
      }`}
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div
        className="p-5 cursor-pointer hover:bg-surface-hover/50 transition-all"
        onClick={onToggleExpand}
      >
        <div className="flex items-start justify-between gap-4">
          {/* Identity */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 mb-1 flex-wrap">
              <h3 className="text-base font-bold text-foreground">{coin.symbol ?? "Unknown"}</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-accent/8 text-accent font-medium capitalize">
                {coin.chain}
              </span>
              <StatusBadge status={coin.status} isWatchlist={coin.is_watchlist} />
            </div>
            {coin.name && <p className="text-sm text-muted truncate">{coin.name}</p>}
          </div>

          {/* Live + position metrics */}
          <div className="flex items-center gap-4 ml-2 shrink-0">
            <div className="hidden sm:flex gap-4 text-xs text-right">
              <div>
                <p className="text-muted/60 uppercase tracking-wider text-[10px]">Live MCap</p>
                <p className="font-bold text-foreground">{formatCompactUsd(liveMcap)}</p>
              </div>
              {change24h != null && (
                <div>
                  <p className="text-muted/60 uppercase tracking-wider text-[10px]">24h</p>
                  <p className={`font-bold ${change24h >= 0 ? "text-win" : "text-loss"}`}>
                    {change24h >= 0 ? "+" : ""}
                    {change24h.toFixed(1)}%
                  </p>
                </div>
              )}
              {!coin.is_watchlist && coin.status === "holding" && unrealMult != null && (
                <div>
                  <p className="text-muted/60 uppercase tracking-wider text-[10px]">Multiple</p>
                  <p className={`font-bold ${unrealMult >= 1 ? "text-win" : "text-loss"}`}>
                    {formatMultiple(unrealMult)}
                  </p>
                </div>
              )}
              {isClosed && realMult != null && (
                <div>
                  <p className="text-muted/60 uppercase tracking-wider text-[10px]">Realized</p>
                  <p className={`font-bold ${realMult >= 1 ? "text-win" : "text-loss"}`}>
                    {formatMultiple(realMult)}
                  </p>
                </div>
              )}
            </div>
            {isExpanded ? (
              <ChevronUp size={16} className="text-muted" />
            ) : (
              <ChevronDown size={16} className="text-muted" />
            )}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-5 pb-5 pt-0 border-t border-border/50 space-y-4">
          {/* Metrics grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            <Metric label="Entry MCap" value={formatCompactUsd(coin.entry_market_cap)} />
            <Metric label="Live MCap" value={formatCompactUsd(liveMcap)} />
            {!coin.is_watchlist && (
              <Metric label="Position Size" value={formatCompactUsd(coin.position_size)} />
            )}
            {coin.status === "holding" && !coin.is_watchlist && (
              <>
                <Metric
                  label="Current Multiple"
                  value={formatMultiple(unrealMult)}
                  color={unrealMult != null && unrealMult >= 1 ? "text-win" : unrealMult != null ? "text-loss" : undefined}
                />
                <Metric
                  label="Unrealized P&L"
                  value={
                    unrealPnl != null
                      ? `${unrealPnl >= 0 ? "" : "-"}$${Math.abs(unrealPnl).toFixed(0)}`
                      : "—"
                  }
                  color={unrealPnl != null ? (unrealPnl >= 0 ? "text-win" : "text-loss") : undefined}
                />
              </>
            )}
            {isClosed && (
              <>
                <Metric label="Exit MCap" value={formatCompactUsd(coin.exit_market_cap)} />
                <Metric
                  label="Realized Multiple"
                  value={formatMultiple(realMult)}
                  color={realMult != null && realMult >= 1 ? "text-win" : "text-loss"}
                />
                <Metric
                  label="Realized P&L"
                  value={
                    coin.realized_pnl != null
                      ? `${coin.realized_pnl >= 0 ? "" : "-"}$${Math.abs(coin.realized_pnl).toFixed(0)}`
                      : "—"
                  }
                  color={
                    coin.realized_pnl != null
                      ? coin.realized_pnl >= 0
                        ? "text-win"
                        : "text-loss"
                      : undefined
                  }
                />
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-muted hover:text-foreground hover:border-accent/30 transition-all"
            >
              <Pencil size={12} />
              Edit
            </button>

            {!coin.is_watchlist && coin.status === "holding" && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSell();
                  }}
                  disabled={busy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-win/30 text-win hover:bg-win/10 transition-all disabled:opacity-50"
                >
                  <Trophy size={12} />
                  {busy ? "..." : "Sell / Close"}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Mark this coin as rugged? Realized P&L will equal your full position loss.")) {
                      onRugged();
                    }
                  }}
                  disabled={busy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-loss/30 text-loss hover:bg-loss/10 transition-all disabled:opacity-50"
                >
                  <Skull size={12} />
                  Mark Rugged
                </button>
              </>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm("Delete this coin? This cannot be undone.")) onDelete();
              }}
              disabled={deleting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-muted hover:text-loss hover:border-loss/30 transition-all disabled:opacity-50"
            >
              <Trash2 size={12} />
              {deleting ? "Deleting..." : "Delete"}
            </button>

            {liveData && (
              <a
                href={`https://dexscreener.com/${coin.chain}/${coin.pair_address ?? coin.contract_address}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-muted hover:text-foreground hover:border-accent/30 transition-all ml-auto"
              >
                <ExternalLink size={12} />
                DexScreener
              </a>
            )}
          </div>

          {/* Notes */}
          <NotesPanel coinId={coin.id} />
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status, isWatchlist }: { status: MemeCoin["status"]; isWatchlist: boolean }) {
  if (isWatchlist) {
    return (
      <span className="text-[10px] px-2 py-0.5 rounded-md bg-accent/8 text-accent font-medium flex items-center gap-1">
        <Eye size={10} />
        Watching
      </span>
    );
  }
  if (status === "holding") {
    return (
      <span className="text-[10px] px-2 py-0.5 rounded-md bg-win/10 text-win font-medium flex items-center gap-1">
        <TrendingUp size={10} />
        Holding
      </span>
    );
  }
  if (status === "sold") {
    return (
      <span className="text-[10px] px-2 py-0.5 rounded-md bg-muted/10 text-muted font-medium">
        Sold
      </span>
    );
  }
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-md bg-loss/10 text-loss font-medium flex items-center gap-1">
      <TrendingDown size={10} />
      Rugged
    </span>
  );
}

function Metric({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-background rounded-xl p-3">
      <p className="text-[10px] text-muted/60 uppercase tracking-wider">{label}</p>
      <p className={`text-sm font-bold mt-0.5 ${color ?? "text-foreground"}`}>{value}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Notes panel (scoped per coin)
// ---------------------------------------------------------------------------

function NotesPanel({ coinId }: { coinId: string }) {
  const [notes, setNotes] = useState<MemeCoinNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingNote, setDeletingNote] = useState<string | null>(null);

  const fetchNotes = useCallback(async () => {
    try {
      const res = await fetch(`/api/meme-coin-notes?coin_id=${encodeURIComponent(coinId)}`);
      if (res.ok) {
        const data = await res.json();
        setNotes((data.notes ?? []) as MemeCoinNote[]);
      }
    } catch (err) {
      console.error("Failed to load notes:", err);
    } finally {
      setLoading(false);
    }
  }, [coinId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  async function addNote() {
    const content = draft.trim();
    if (!content || saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/meme-coin-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coin_id: coinId, content }),
      });
      if (res.ok) {
        const data = await res.json();
        setNotes((prev) => [data.note as MemeCoinNote, ...prev]);
        setDraft("");
      }
    } finally {
      setSaving(false);
    }
  }

  async function deleteNote(id: string) {
    setDeletingNote(id);
    try {
      const res = await fetch(`/api/meme-coin-notes/${id}`, { method: "DELETE" });
      if (res.ok) {
        setNotes((prev) => prev.filter((n) => n.id !== id));
      }
    } finally {
      setDeletingNote(null);
    }
  }

  return (
    <div className="bg-background rounded-xl p-4">
      <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
        <StickyNote size={14} className="text-accent" />
        Notes
      </h4>

      {/* Composer */}
      <div className="flex items-start gap-2 mb-3">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              addNote();
            }
          }}
          placeholder="Add a note (thesis, exit plan, news)... ⌘/Ctrl+Enter to save"
          rows={2}
          className="flex-1 px-3 py-2 rounded-lg bg-surface border border-border text-foreground text-sm focus:outline-none focus:border-accent/50 transition-all placeholder-muted/50 resize-none"
        />
        <button
          type="button"
          onClick={addNote}
          disabled={saving || !draft.trim()}
          className="p-2.5 rounded-lg bg-accent text-background hover:bg-accent-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          aria-label="Add note"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </div>

      {/* List */}
      {loading ? (
        <p className="text-xs text-muted">Loading notes...</p>
      ) : notes.length === 0 ? (
        <p className="text-xs text-muted/70">No notes yet.</p>
      ) : (
        <div className="space-y-2">
          {notes.map((note) => (
            <div
              key={note.id}
              className="flex items-start justify-between gap-3 px-3 py-2 rounded-lg bg-surface border border-border/50"
            >
              <div className="min-w-0">
                <p className="text-sm text-foreground whitespace-pre-wrap break-words">{note.content}</p>
                <p className="text-[10px] text-muted/60 mt-1">{note.note_date}</p>
              </div>
              <button
                type="button"
                onClick={() => deleteNote(note.id)}
                disabled={deletingNote === note.id}
                className="p-1 rounded hover:bg-loss/10 transition-colors shrink-0 disabled:opacity-50"
                aria-label="Delete note"
              >
                <Trash2 size={13} className="text-muted hover:text-loss" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

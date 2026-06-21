"use client";

import { useEffect, useState, useCallback } from "react";
import {
  TrendingUp,
  Plus,
  ChevronDown,
  ChevronUp,
  Pencil,
  Trash2,
  AlertTriangle,
  Target,
  CheckCircle2,
  XCircle,
  CircleSlash,
  Clock,
  StickyNote,
  X,
  Wallet,
  Settings,
  Layers,
  Tag,
} from "lucide-react";
import { Header } from "@/components/header";
import { PredictionMarketForm } from "@/components/prediction-market-form";
import { usePredictionStats } from "@/lib/use-prediction-stats";
import { useBettingSettings } from "@/lib/use-betting-settings";
import { realizedUnits } from "@/lib/betting-odds";
import type {
  PredictionMarket,
  PredictionMarketNote,
} from "@/lib/schemas/prediction-market";

type Outcome = PredictionMarket["outcome"];

const OUTCOME_BADGE: Record<
  Outcome,
  { label: string; className: string; Icon: typeof CheckCircle2 }
> = {
  pending: {
    label: "Pending",
    className: "bg-accent/8 text-accent",
    Icon: Clock,
  },
  won: {
    label: "Won",
    className: "bg-win/10 text-win",
    Icon: CheckCircle2,
  },
  lost: {
    label: "Lost",
    className: "bg-loss/10 text-loss",
    Icon: XCircle,
  },
  void: {
    label: "Void",
    className: "bg-muted/10 text-muted",
    Icon: CircleSlash,
  },
};

function fmtDate(d: string | null): string {
  if (!d) return "—";
  return d;
}

function fmtNum(n: number | null | undefined, digits = 2): string {
  if (n == null) return "—";
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

function fmtMoney(n: number | null | undefined, currency: string, signed = false): string {
  if (n == null) return "—";
  const sign = signed && n >= 0 ? "+" : "";
  return `${sign}${currency}${fmtNum(n)}`;
}

function fmtUnits(n: number | null | undefined, signed = false): string {
  if (n == null) return "—";
  const sign = signed && n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}u`;
}

/**
 * Convert a money amount between € and $ using usdPerEur (US$ per 1 €).
 * Same-currency or any non €/$ symbol passes through unchanged.
 */
function convertMoney(
  amount: number,
  from: string,
  to: string,
  usdPerEur: number
): number {
  if (from === to || !(usdPerEur > 0)) return amount;
  if (from === "€" && to === "$") return amount * usdPerEur;
  if (from === "$" && to === "€") return amount / usdPerEur;
  return amount;
}

/** Realized euro result of one bet: stored actual money, else derived from units. */
function betEuro(p: PredictionMarket, unitValue: number): number {
  if (p.realized_result != null) return p.realized_result;
  if (p.stake_units != null) {
    const ru =
      p.realized_units != null
        ? p.realized_units
        : realizedUnits(p.outcome, p.stake_units, p.odds) ?? 0;
    return ru * unitValue;
  }
  return 0;
}

type TagStat = {
  tag: string;
  /** Resolved (won/lost) bets carrying this tag */
  resolved: number;
  wins: number;
  winRate: number;
  unitsStaked: number;
  unitsPnl: number;
  roiPct: number;
  euroPnl: number;
};

/**
 * Per-tag performance over RESOLVED bets. A bet contributes to every tag it
 * carries, so "handicap 1:0" and "over 2.5" each get their own win rate / ROI.
 */
function computeTagStats(
  predictions: PredictionMarket[],
  unitValue: number
): TagStat[] {
  const map = new Map<
    string,
    {
      resolved: number;
      wins: number;
      unitsStaked: number;
      unitsPnl: number;
      euroPnl: number;
    }
  >();
  for (const p of predictions) {
    if (p.outcome !== "won" && p.outcome !== "lost") continue;
    for (const t of p.tags ?? []) {
      if (!t) continue;
      const e =
        map.get(t) ??
        { resolved: 0, wins: 0, unitsStaked: 0, unitsPnl: 0, euroPnl: 0 };
      e.resolved += 1;
      if (p.outcome === "won") e.wins += 1;
      const ru =
        p.realized_units != null
          ? p.realized_units
          : realizedUnits(p.outcome, p.stake_units, p.odds) ?? 0;
      if (p.stake_units != null && p.stake_units > 0) {
        e.unitsStaked += p.stake_units;
        e.unitsPnl += ru;
      }
      // Actual euro result is the source of truth; fall back to derived.
      e.euroPnl +=
        p.realized_result != null ? p.realized_result : ru * unitValue;
      map.set(t, e);
    }
  }
  const out: TagStat[] = [];
  for (const [tag, e] of map) {
    out.push({
      tag,
      resolved: e.resolved,
      wins: e.wins,
      winRate: e.resolved > 0 ? (e.wins / e.resolved) * 100 : 0,
      unitsStaked: e.unitsStaked,
      unitsPnl: e.unitsPnl,
      roiPct: e.unitsStaked > 0 ? (e.unitsPnl / e.unitsStaked) * 100 : 0,
      euroPnl: e.euroPnl,
    });
  }
  out.sort((a, b) => b.resolved - a.resolved || b.winRate - a.winRate);
  return out;
}

export default function PredictionsPage() {
  const [predictions, setPredictions] = useState<PredictionMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PredictionMarket | null>(null);
  const [resolving, setResolving] = useState<PredictionMarket | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showBankrollSettings, setShowBankrollSettings] = useState(false);
  const [editingBankroll, setEditingBankroll] = useState(false);
  const [bankrollDraft, setBankrollDraft] = useState("");
  const [activeEvent, setActiveEvent] = useState<string>("all");
  const [activeStatus, setActiveStatus] = useState<"all" | Outcome>("all");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [showTagStats, setShowTagStats] = useState(false);

  const { settings, save: saveSettings } = useBettingSettings();
  const stats = usePredictionStats(
    predictions,
    settings.bankroll,
    settings.unitPct
  );
  // Fixed value of one unit = unitPct% of the reference bankroll. Constant by
  // design so euro amounts never drift as results come in.
  const unitValue = stats.unitValue;

  // Auto-grow: when enabled, the live bankroll = your set bankroll + the euro
  // P/L of bets resolved on/after autoGrowSince. Back-filled history (resolved
  // before that date) leaves the bankroll untouched. When disabled, the
  // bankroll stays exactly at your manually set value.
  const sinceDate = settings.autoGrowSince;
  const autoGrowPnl =
    settings.autoGrow && sinceDate
      ? predictions
          .filter((p) => p.outcome === "won" || p.outcome === "lost")
          .filter((p) => (p.resolve_date ?? p.entry_date) >= sinceDate)
          .reduce((sum, p) => sum + betEuro(p, unitValue), 0)
      : 0;
  const liveBankroll = settings.currentBankroll + autoGrowPnl;

  const fetchPredictions = useCallback(async () => {
    try {
      const res = await fetch("/api/prediction-markets");
      if (res.ok) {
        const data = await res.json();
        setPredictions((data.predictions ?? []) as PredictionMarket[]);
        setFetchError(null);
      } else {
        setFetchError("Failed to load predictions. Please refresh the page.");
      }
    } catch (err) {
      console.error("Failed to load predictions:", err);
      setFetchError("Failed to load predictions. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPredictions();
  }, [fetchPredictions]);

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      const res = await fetch(`/api/prediction-markets/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setPredictions((prev) => prev.filter((p) => p.id !== id));
        if (expandedId === id) setExpandedId(null);
      }
    } finally {
      setDeleting(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-accent">Loading...</div>
      </div>
    );
  }

  const hasPredictions = predictions.length > 0;

  // Distinct event labels (in first-seen order) for the tab bar.
  const events: string[] = [];
  for (const p of predictions) {
    const ev = p.event?.trim();
    if (ev && !events.includes(ev)) events.push(ev);
  }
  const hasUngrouped = predictions.some((p) => !p.event?.trim());

  // Distinct tags across all predictions (for autocomplete + tag stats).
  const allTags: string[] = [];
  for (const p of predictions) {
    for (const t of p.tags ?? []) {
      if (t && !allTags.includes(t)) allTags.push(t);
    }
  }
  allTags.sort();

  // Per-tag performance over resolved bets — win rate, units staked, ROI.
  const tagStats = computeTagStats(predictions, unitValue);

  // Apply event tab + status filter + tag filter.
  const visiblePredictions = predictions.filter((p) => {
    const ev = p.event?.trim() || "";
    const eventMatch =
      activeEvent === "all" ||
      (activeEvent === "__none__" ? ev === "" : ev === activeEvent);
    const statusMatch = activeStatus === "all" || p.outcome === activeStatus;
    const tagMatch = activeTag === null || (p.tags ?? []).includes(activeTag);
    return eventMatch && statusMatch && tagMatch;
  });

  const STATUS_TABS: { value: "all" | Outcome; label: string }[] = [
    { value: "all", label: "Alle" },
    { value: "pending", label: "Offen" },
    { value: "won", label: "Gewonnen" },
    { value: "lost", label: "Verloren" },
    { value: "void", label: "Void" },
  ];

  async function saveBankroll() {
    const parsed = Number(bankrollDraft);
    if (Number.isFinite(parsed) && parsed >= 0) {
      await saveSettings({ currentBankroll: parsed });
    }
    setEditingBankroll(false);
  }

  return (
    <div className="space-y-6 mx-auto max-w-[1600px]">
      <Header />
      {fetchError && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-loss/10 border border-loss/30 text-loss text-sm">
          <AlertTriangle size={14} />
          {fetchError}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <TrendingUp size={24} className="text-accent" />
            Prediction Markets
          </h2>
          <p className="text-sm text-muted mt-0.5">
            Track your forecasts, measure your calibration and edge
          </p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-background font-semibold text-sm hover:bg-accent-hover hover:shadow-[0_0_20px_rgba(0,180,216,0.3)] transition-all duration-300"
        >
          <Plus size={18} />
          New Prediction
        </button>
      </div>

      {/* Bankroll bar */}
      <div
        className="glass rounded-2xl border border-border/50 p-5"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
                <Wallet size={16} className="text-accent" />
              </div>
              <div>
                <p className="text-[10px] text-muted/60 uppercase tracking-wider">
                  Bankroll
                </p>
                {editingBankroll ? (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-sm text-muted">{settings.currency}</span>
                    <input
                      type="number"
                      step="any"
                      min={0}
                      autoFocus
                      value={bankrollDraft}
                      onChange={(e) => setBankrollDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveBankroll();
                        if (e.key === "Escape") setEditingBankroll(false);
                      }}
                      className="w-24 px-2 py-1 rounded-lg bg-background border border-accent/40 text-foreground text-base font-bold focus:outline-none tabular-nums"
                    />
                    <button
                      onClick={saveBankroll}
                      className="p-1 rounded-md hover:bg-accent/10 text-accent transition-colors"
                      aria-label="Save bankroll"
                    >
                      <CheckCircle2 size={16} />
                    </button>
                    <button
                      onClick={() => setEditingBankroll(false)}
                      className="p-1 rounded-md hover:bg-surface-hover text-muted transition-colors"
                      aria-label="Cancel"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setBankrollDraft(String(settings.currentBankroll));
                      setEditingBankroll(true);
                    }}
                    className="group flex items-center gap-1.5 text-lg font-bold text-foreground tabular-nums hover:text-accent transition-colors"
                    title="Bankroll bearbeiten"
                  >
                    {fmtMoney(liveBankroll, settings.currency)}
                    <Pencil
                      size={12}
                      className="text-muted/40 group-hover:text-accent transition-colors"
                    />
                  </button>
                )}
                {!editingBankroll && settings.autoGrow && sinceDate && (
                  <p className="text-[10px] text-muted/50 mt-0.5 tabular-nums">
                    {fmtMoney(settings.currentBankroll, settings.currency)}{" "}
                    {autoGrowPnl >= 0 ? "+" : "−"}{" "}
                    {fmtMoney(Math.abs(autoGrowPnl), settings.currency)} seit{" "}
                    {sinceDate}
                  </p>
                )}
              </div>
            </div>
            {stats.hasBettingData && (
              <>
                <div>
                  <p className="text-[10px] text-muted/60 uppercase tracking-wider">
                    P/L
                  </p>
                  <p
                    className={`text-lg font-bold tabular-nums ${
                      stats.unitsPnl >= 0 ? "text-win" : "text-loss"
                    }`}
                  >
                    {fmtUnits(stats.unitsPnl, true)}{" "}
                    <span className="text-xs font-normal text-muted">
                      ({fmtMoney(stats.bankrollPnl, settings.currency, true)})
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted/60 uppercase tracking-wider">
                    ROI
                  </p>
                  <p
                    className={`text-lg font-bold tabular-nums ${
                      stats.roiPct >= 0 ? "text-win" : "text-loss"
                    }`}
                  >
                    {stats.roiPct >= 0 ? "+" : ""}
                    {stats.roiPct.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted/60 uppercase tracking-wider">
                    Units staked
                  </p>
                  <p className="text-lg font-bold text-foreground tabular-nums">
                    {stats.unitsStaked.toFixed(1)}u
                  </p>
                </div>
              </>
            )}
          </div>
          <button
            onClick={() => setShowBankrollSettings((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-muted hover:text-foreground hover:border-accent/30 transition-all shrink-0"
          >
            <Settings size={12} />
            {settings.currency}
            {fmtNum(settings.bankroll)} · {settings.unitPct}%/unit
          </button>
        </div>

        {showBankrollSettings && (
          <BankrollSettings
            initialBankroll={settings.bankroll}
            initialUnitPct={settings.unitPct}
            initialCurrentBankroll={settings.currentBankroll}
            initialCurrency={settings.currency}
            initialFxRate={settings.fxRate}
            initialAutoGrow={settings.autoGrow}
            initialAutoGrowSince={settings.autoGrowSince}
            onSave={async (next) => {
              await saveSettings(next);
              setShowBankrollSettings(false);
            }}
            onClose={() => setShowBankrollSettings(false)}
          />
        )}
      </div>

      {/* Stats header */}
      {hasPredictions && (
        <div
          className="glass rounded-2xl border border-border/50 p-5"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <p className="text-[10px] text-muted/60 uppercase tracking-wider">
                Open
              </p>
              <p className="text-lg font-bold text-foreground">
                {stats.openCount}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted/60 uppercase tracking-wider">
                Resolved
              </p>
              <p className="text-lg font-bold text-foreground">
                {stats.resolvedCount}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted/60 uppercase tracking-wider">
                Win Rate
              </p>
              <p
                className={`text-lg font-bold ${
                  stats.winRate >= 50 ? "text-win" : "text-loss"
                }`}
              >
                {stats.resolvedCount > 0 ? `${stats.winRate.toFixed(0)}%` : "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted/60 uppercase tracking-wider flex items-center gap-1">
                Avg Brier
                <span className="text-muted/40 normal-case tracking-normal">
                  (lower is better)
                </span>
              </p>
              <p className="text-lg font-bold text-foreground tabular-nums">
                {stats.resolvedCount > 0 ? stats.avgBrier.toFixed(3) : "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted/60 uppercase tracking-wider">
                Realized P/L
              </p>
              <p
                className={`text-lg font-bold tabular-nums ${
                  stats.realizedPnl >= 0 ? "text-win" : "text-loss"
                }`}
              >
                {stats.resolvedCount > 0
                  ? `${stats.realizedPnl >= 0 ? "+" : ""}${fmtNum(
                      stats.realizedPnl
                    )}`
                  : "—"}
              </p>
            </div>
          </div>

          {/* Skill score hint */}
          {stats.resolvedCount > 0 && (
            <div className="mt-3 pt-3 border-t border-border/40 flex flex-wrap items-center gap-x-6 gap-y-1 text-[11px] text-muted">
              <span>
                Skill score:{" "}
                <span
                  className={`font-bold ${
                    stats.skillScore > 0 ? "text-win" : "text-loss"
                  }`}
                >
                  {stats.skillScore.toFixed(2)}
                </span>{" "}
                <span className="text-muted/50">(&gt; 0 beats chance)</span>
              </span>
              {stats.bestBet && (
                <span>
                  Best:{" "}
                  <span className="text-win font-medium">
                    {stats.bestBet.title}
                  </span>{" "}
                  ({stats.bestBet.realizedResult >= 0 ? "+" : ""}
                  {fmtNum(stats.bestBet.realizedResult)})
                </span>
              )}
              {stats.worstBet && (
                <span>
                  Worst:{" "}
                  <span className="text-loss font-medium">
                    {stats.worstBet.title}
                  </span>{" "}
                  ({stats.worstBet.realizedResult >= 0 ? "+" : ""}
                  {fmtNum(stats.worstBet.realizedResult)})
                </span>
              )}
            </div>
          )}

          {/* Calibration table */}
          {stats.calibration.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border/40">
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                <Target size={14} className="text-accent" />
                Calibration
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-muted/60 text-left">
                      <th className="font-medium pb-2 pr-4">Bucket</th>
                      <th className="font-medium pb-2 pr-4 text-right">
                        Your Avg %
                      </th>
                      <th className="font-medium pb-2 pr-4 text-right">
                        Actual %
                      </th>
                      <th className="font-medium pb-2 text-right">n</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.calibration.map((b) => (
                      <tr
                        key={b.label}
                        className="border-t border-border/30 text-foreground"
                      >
                        <td className="py-1.5 pr-4">{b.label}</td>
                        <td className="py-1.5 pr-4 text-right tabular-nums">
                          {b.predictedRate.toFixed(0)}%
                        </td>
                        <td className="py-1.5 pr-4 text-right tabular-nums">
                          {b.actualRate.toFixed(0)}%
                        </td>
                        <td className="py-1.5 text-right tabular-nums text-muted">
                          {b.n}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!hasPredictions && (
        <div
          className="glass rounded-2xl border border-border/50 p-12"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
              <TrendingUp size={28} className="text-accent" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">
              Log Your First Prediction
            </h3>
            <p className="text-sm text-muted mb-6 max-w-md">
              Record what you think will happen, your probability, and the market
              price. Resolve outcomes over time to measure your calibration and
              edge.
            </p>
            <button
              onClick={() => {
                setEditing(null);
                setShowForm(true);
              }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-background font-semibold text-sm hover:bg-accent-hover hover:shadow-[0_0_20px_rgba(0,180,216,0.3)] transition-all duration-300"
            >
              <Plus size={18} />
              Add Your First Prediction
            </button>
          </div>
        </div>
      )}

      {/* Tabs: event groups + status filter */}
      {hasPredictions && (events.length > 0 || hasUngrouped) && (
        <div className="space-y-3">
          {/* Event tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            <TabPill
              active={activeEvent === "all"}
              onClick={() => setActiveEvent("all")}
            >
              Alle
              <span className="ml-1.5 text-[10px] opacity-60">
                {predictions.length}
              </span>
            </TabPill>
            {events.map((ev) => {
              const count = predictions.filter(
                (p) => p.event?.trim() === ev
              ).length;
              return (
                <TabPill
                  key={ev}
                  active={activeEvent === ev}
                  onClick={() => setActiveEvent(ev)}
                >
                  {ev}
                  <span className="ml-1.5 text-[10px] opacity-60">{count}</span>
                </TabPill>
              );
            })}
            {hasUngrouped && (
              <TabPill
                active={activeEvent === "__none__"}
                onClick={() => setActiveEvent("__none__")}
              >
                Ohne Gruppe
                <span className="ml-1.5 text-[10px] opacity-60">
                  {predictions.filter((p) => !p.event?.trim()).length}
                </span>
              </TabPill>
            )}
          </div>
          {/* Status filter + tag controls */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {STATUS_TABS.map((s) => (
              <button
                key={s.value}
                onClick={() => setActiveStatus(s.value)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-all ${
                  activeStatus === s.value
                    ? "bg-accent/10 border-accent/30 text-accent"
                    : "bg-transparent border-border text-muted hover:text-foreground hover:border-accent/30"
                }`}
              >
                {s.label}
              </button>
            ))}
            <div className="w-px h-4 bg-border mx-1" />
            {activeTag !== null && (
              <button
                onClick={() => setActiveTag(null)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-accent/10 border border-accent/30 text-accent"
                title="Tag-Filter entfernen"
              >
                #{activeTag}
                <X size={11} />
              </button>
            )}
            {tagStats.length > 0 && (
              <button
                onClick={() => setShowTagStats(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border border-border text-muted hover:text-foreground hover:border-accent/30 transition-all"
              >
                <Tag size={11} />
                Tag-Statistik
              </button>
            )}
          </div>
        </div>
      )}

      {/* Prediction cards */}
      <div className="space-y-2.5">
        {hasPredictions && visiblePredictions.length === 0 && (
          <p className="text-sm text-muted/70 py-6 text-center">
            Keine Predictions in dieser Ansicht.
          </p>
        )}
        {visiblePredictions.map((p) => {
          const isExpanded = expandedId === p.id;
          const badge = OUTCOME_BADGE[p.outcome];
          const edge =
            p.market_prob != null ? p.your_prob - p.market_prob : null;
          return (
            <div
              key={p.id}
              className="glass rounded-xl border border-border/50 overflow-hidden"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <div
                className="px-4 py-3 cursor-pointer hover:bg-surface-hover/50 transition-all"
                onClick={() => setExpandedId(isExpanded ? null : p.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-sm font-bold text-foreground truncate">
                        {p.title}
                      </h3>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-md font-medium inline-flex items-center gap-1 ${badge.className}`}
                      >
                        <badge.Icon size={11} />
                        {badge.label}
                      </span>
                      {p.event?.trim() && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-accent/12 text-accent font-semibold">
                          {p.event}
                        </span>
                      )}
                      {p.platform && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-accent/8 text-accent font-medium">
                          {p.platform}
                        </span>
                      )}
                      {(p.tags ?? []).map((t) => (
                        <button
                          key={t}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveTag(t);
                          }}
                          className={`text-[10px] px-2 py-0.5 rounded-md font-medium transition-colors ${
                            activeTag === t
                              ? "bg-accent/20 text-accent"
                              : "bg-muted/10 text-muted hover:bg-accent/10 hover:text-accent"
                          }`}
                          title={`Nach #${t} filtern`}
                        >
                          #{t}
                        </button>
                      ))}
                      {p.bet_type === "combo" && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-accent/8 text-accent font-medium inline-flex items-center gap-1">
                          <Layers size={10} />
                          {p.legs?.length ?? 0}-leg combo
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted mt-1.5 flex-wrap">
                      {p.odds != null && (
                        <span>
                          Odds:{" "}
                          <span className="font-bold text-foreground tabular-nums">
                            {p.odds}
                          </span>
                        </span>
                      )}
                      <span>
                        You:{" "}
                        <span className="font-bold text-accent tabular-nums">
                          {p.your_prob}%
                        </span>
                      </span>
                      <span>
                        Market:{" "}
                        <span className="font-bold text-foreground tabular-nums">
                          {p.market_prob != null ? `${p.market_prob}%` : "—"}
                        </span>
                      </span>
                      {edge != null && (
                        <span>
                          Edge:{" "}
                          <span
                            className={`font-bold tabular-nums ${
                              edge >= 0 ? "text-win" : "text-loss"
                            }`}
                          >
                            {edge >= 0 ? "+" : ""}
                            {edge}%
                          </span>
                        </span>
                      )}
                      <span>
                        Stake:{" "}
                        <span className="font-medium text-foreground tabular-nums">
                          {p.stake_units != null
                            ? `${fmtUnits(p.stake_units)} (≈ ${fmtMoney(
                                p.stake_units * unitValue,
                                settings.currency
                              )})`
                            : fmtNum(p.stake)}
                        </span>
                      </span>
                      {p.outcome !== "pending" &&
                        (p.realized_units != null ||
                          p.realized_result != null) && (
                          <span>
                            Result:{" "}
                            {p.realized_units != null ? (
                              <span
                                className={`font-bold tabular-nums ${
                                  p.realized_units >= 0 ? "text-win" : "text-loss"
                                }`}
                              >
                                {fmtUnits(p.realized_units, true)} (
                                {p.realized_result != null ? "" : "≈ "}
                                {fmtMoney(
                                  p.realized_result != null
                                    ? p.realized_result
                                    : p.realized_units * unitValue,
                                  settings.currency,
                                  true
                                )}
                                )
                              </span>
                            ) : (
                              <span
                                className={`font-bold tabular-nums ${
                                  (p.realized_result ?? 0) >= 0
                                    ? "text-win"
                                    : "text-loss"
                                }`}
                              >
                                {(p.realized_result ?? 0) >= 0 ? "+" : ""}
                                {fmtNum(p.realized_result)}
                              </span>
                            )}
                          </span>
                        )}
                    </div>
                    <div className="flex items-center gap-4 text-[11px] text-muted/60 mt-1.5">
                      <span>Entry: {fmtDate(p.entry_date)}</span>
                      <span>Resolve: {fmtDate(p.resolve_date)}</span>
                    </div>
                  </div>
                  <div className="shrink-0 mt-1">
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
                  {/* Action buttons */}
                  <div className="flex items-center gap-2 mt-4 flex-wrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditing(p);
                        setShowForm(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-muted hover:text-foreground hover:border-accent/30 transition-all"
                    >
                      <Pencil size={12} />
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setResolving(p);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-muted hover:text-foreground hover:border-accent/30 transition-all"
                    >
                      <Target size={12} />
                      {p.outcome === "pending" ? "Resolve" : "Re-resolve"}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (
                          confirm(
                            "Delete this prediction and its notes? This cannot be undone."
                          )
                        )
                          handleDelete(p.id);
                      }}
                      disabled={deleting === p.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-muted hover:text-loss hover:border-loss/30 transition-all disabled:opacity-50"
                    >
                      <Trash2 size={12} />
                      {deleting === p.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>

                  {/* Combo legs */}
                  {p.bet_type === "combo" && p.legs?.length > 0 && (
                    <div className="bg-background rounded-xl p-4">
                      <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Layers size={14} className="text-accent" />
                        Legs ({p.legs.length})
                      </h4>
                      <div className="space-y-1.5">
                        {p.legs.map((leg, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between gap-3 text-sm border-b border-border/30 last:border-0 pb-1.5 last:pb-0"
                          >
                            <span className="text-foreground truncate">
                              {leg.selection || `Leg ${i + 1}`}
                            </span>
                            <span className="text-muted tabular-nums shrink-0">
                              {leg.odds != null ? `@ ${leg.odds}` : "—"}
                              {leg.market_prob != null
                                ? ` · ${leg.market_prob}%`
                                : ""}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes panel — scoped to this prediction only */}
                  <NotesPanel predictionId={p.id} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Form modal */}
      {showForm && (
        <PredictionMarketForm
          editPrediction={editing}
          unitValue={unitValue}
          currency={settings.currency}
          events={events}
          tagSuggestions={allTags}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSaved={fetchPredictions}
        />
      )}

      {/* Resolve modal */}
      {resolving && (
        <ResolveModal
          prediction={resolving}
          unitValue={unitValue}
          currency={settings.currency}
          fxRate={settings.fxRate}
          onClose={() => setResolving(null)}
          onResolved={() => {
            setResolving(null);
            fetchPredictions();
          }}
        />
      )}

      {/* Tag stats modal */}
      {showTagStats && (
        <TagStatsModal
          tagStats={tagStats}
          currency={settings.currency}
          activeTag={activeTag}
          onPick={(tag) => {
            setActiveTag(tag);
            setShowTagStats(false);
          }}
          onClose={() => setShowTagStats(false)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tag stats modal — per-tag win rate / ROI ("how good am I on handicap 1:0?")
// ---------------------------------------------------------------------------

function TagStatsModal({
  tagStats,
  currency,
  activeTag,
  onPick,
  onClose,
}: {
  tagStats: TagStat[];
  currency: string;
  activeTag: string | null;
  onPick: (tag: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-2xl my-8">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Tag size={18} className="text-accent" />
              Tag-Statistik
            </h3>
            <p className="text-xs text-muted mt-0.5">
              Deine Trefferquote &amp; ROI pro Wett-Typ (nur aufgelöste Wetten).
              Klick einen Tag, um die Liste zu filtern.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-surface-hover transition-colors"
          >
            <X size={18} className="text-muted" />
          </button>
        </div>

        <div className="p-5">
          {tagStats.length === 0 ? (
            <p className="text-sm text-muted/70 py-6 text-center">
              Noch keine aufgelösten Wetten mit Tags.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted/60 text-left text-xs">
                    <th className="font-medium pb-2 pr-4">Tag</th>
                    <th className="font-medium pb-2 pr-4 text-right">Bets</th>
                    <th className="font-medium pb-2 pr-4 text-right">Win&nbsp;%</th>
                    <th className="font-medium pb-2 pr-4 text-right">P/L (u)</th>
                    <th className="font-medium pb-2 pr-4 text-right">P/L ({currency})</th>
                    <th className="font-medium pb-2 text-right">ROI</th>
                  </tr>
                </thead>
                <tbody>
                  {tagStats.map((s) => (
                    <tr
                      key={s.tag}
                      onClick={() => onPick(s.tag)}
                      className={`border-t border-border/30 cursor-pointer transition-colors ${
                        activeTag === s.tag
                          ? "bg-accent/10"
                          : "hover:bg-surface-hover/50"
                      }`}
                    >
                      <td className="py-2 pr-4 font-medium text-foreground">
                        #{s.tag}
                      </td>
                      <td className="py-2 pr-4 text-right tabular-nums text-muted">
                        {s.wins}/{s.resolved}
                      </td>
                      <td
                        className={`py-2 pr-4 text-right tabular-nums font-semibold ${
                          s.winRate >= 50 ? "text-win" : "text-loss"
                        }`}
                      >
                        {s.winRate.toFixed(0)}%
                      </td>
                      <td
                        className={`py-2 pr-4 text-right tabular-nums ${
                          s.unitsPnl >= 0 ? "text-win" : "text-loss"
                        }`}
                      >
                        {s.unitsStaked > 0 ? fmtUnits(s.unitsPnl, true) : "—"}
                      </td>
                      <td
                        className={`py-2 pr-4 text-right tabular-nums ${
                          s.euroPnl >= 0 ? "text-win" : "text-loss"
                        }`}
                      >
                        {fmtMoney(s.euroPnl, currency, true)}
                      </td>
                      <td
                        className={`py-2 text-right tabular-nums font-semibold ${
                          s.roiPct >= 0 ? "text-win" : "text-loss"
                        }`}
                      >
                        {s.unitsStaked > 0
                          ? `${s.roiPct >= 0 ? "+" : ""}${s.roiPct.toFixed(0)}%`
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab pill — event-group selector button
// ---------------------------------------------------------------------------

function TabPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200 ${
        active
          ? "bg-accent/10 border-accent/40 text-accent shadow-sm"
          : "bg-transparent border-border text-muted hover:text-foreground hover:border-accent/30"
      }`}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Resolve modal
// ---------------------------------------------------------------------------

function ResolveModal({
  prediction,
  unitValue,
  currency,
  fxRate,
  onClose,
  onResolved,
}: {
  prediction: PredictionMarket;
  unitValue: number;
  currency: string;
  fxRate: number;
  onClose: () => void;
  onResolved: () => void;
}) {
  const isUnitMode = prediction.stake_units != null;
  // Currencies offered for entering the result. Base currency first.
  const CURRENCY_OPTIONS = currency === "$" ? ["$", "€"] : ["€", "$"];

  function autoUnitsFor(o: Outcome): number | null {
    return realizedUnits(o, prediction.stake_units, prediction.odds);
  }

  const initialOutcome: Outcome =
    prediction.outcome === "pending" ? "won" : prediction.outcome;

  const round2 = (x: number) => Math.round(x * 100) / 100;

  const [outcome, setOutcome] = useState<Outcome>(initialOutcome);
  const [unitsInput, setUnitsInput] = useState<string>(() => {
    if (!isUnitMode) return "";
    if (prediction.realized_units != null) return String(prediction.realized_units);
    const a = realizedUnits(initialOutcome, prediction.stake_units, prediction.odds);
    return a != null ? String(a) : "";
  });
  // Currency the money result is entered in (defaults to the base currency).
  const [resultCurrency, setResultCurrency] = useState<string>(currency);
  // Money result, linked to units. The ACTUAL money you won/lost. Stored in the
  // BASE currency (converted from resultCurrency via fxRate when they differ).
  const [moneyInput, setMoneyInput] = useState<string>(() => {
    if (!isUnitMode) return "";
    // realized_result is stored in base currency; resultCurrency starts as base.
    if (prediction.realized_result != null)
      return String(prediction.realized_result);
    const u =
      prediction.realized_units != null
        ? prediction.realized_units
        : realizedUnits(initialOutcome, prediction.stake_units, prediction.odds);
    return u != null && unitValue > 0 ? String(round2(u * unitValue)) : "";
  });
  const [realizedResult, setRealizedResult] = useState<string>(
    prediction.realized_result != null
      ? String(prediction.realized_result)
      : ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const OUTCOME_OPTIONS: { value: Outcome; label: string }[] = [
    { value: "won", label: "Won" },
    { value: "lost", label: "Lost" },
    { value: "void", label: "Void" },
  ];

  // Linked editing across units ↔ money. Money is shown in resultCurrency; the
  // units relationship always runs through the base currency (unitValue is base).
  function onUnitsChange(v: string) {
    setUnitsInput(v);
    const n = Number(v);
    if (v.trim() !== "" && Number.isFinite(n) && unitValue > 0) {
      const money = convertMoney(n * unitValue, currency, resultCurrency, fxRate);
      setMoneyInput(String(round2(money)));
    } else if (v.trim() === "") {
      setMoneyInput("");
    }
  }
  function onMoneyChange(v: string) {
    setMoneyInput(v);
    const n = Number(v);
    if (v.trim() !== "" && Number.isFinite(n) && unitValue > 0) {
      const base = convertMoney(n, resultCurrency, currency, fxRate);
      setUnitsInput(String(round2(base / unitValue)));
    } else if (v.trim() === "") {
      setUnitsInput("");
    }
  }
  function onCurrencyChange(cur: string) {
    setResultCurrency(cur);
    // Keep units fixed; re-express the money amount in the new currency.
    const n = Number(unitsInput);
    if (unitsInput.trim() !== "" && Number.isFinite(n) && unitValue > 0) {
      const money = convertMoney(n * unitValue, currency, cur, fxRate);
      setMoneyInput(String(round2(money)));
    }
  }

  function pickOutcome(o: Outcome) {
    setOutcome(o);
    if (!isUnitMode) return;
    if (o === "void") {
      setUnitsInput("0");
      setMoneyInput("0");
      return;
    }
    const a = autoUnitsFor(o);
    setUnitsInput(a != null ? String(a) : "");
    setMoneyInput(
      a != null && unitValue > 0
        ? String(round2(convertMoney(a * unitValue, currency, resultCurrency, fxRate)))
        : ""
    );
  }

  async function handleSave() {
    setError(null);
    setSaving(true);
    try {
      let body: Record<string, unknown>;

      if (isUnitMode) {
        let unitsValue: number | null = null;
        let euroValue: number | null = null;

        if (outcome === "void") {
          unitsValue = 0;
          euroValue = 0;
        } else {
          // Units (explicit, else auto from odds).
          if (unitsInput.trim() !== "") {
            const pu = Number(unitsInput);
            if (!Number.isFinite(pu)) {
              setError("Units result must be a number");
              return;
            }
            unitsValue = pu;
          } else {
            unitsValue = autoUnitsFor(outcome);
          }
          // Money (explicit truth, converted to base currency), else from units.
          if (moneyInput.trim() !== "") {
            const pm = Number(moneyInput);
            if (!Number.isFinite(pm)) {
              setError("Money result must be a number");
              return;
            }
            euroValue = round2(convertMoney(pm, resultCurrency, currency, fxRate));
          } else if (unitsValue != null && unitValue > 0) {
            euroValue = round2(unitsValue * unitValue);
          }
          // If only money was given, derive units from the base value.
          if (unitsValue == null && euroValue != null && unitValue > 0) {
            unitsValue = round2(euroValue / unitValue);
          }
          if (unitsValue == null && euroValue == null) {
            setError("Enter the result in units or money.");
            return;
          }
        }
        body = {
          outcome,
          realized_units: unitsValue,
          realized_result: euroValue,
        };
      } else {
        const trimmed = realizedResult.trim();
        let realizedValue: number | null = null;
        if (trimmed !== "") {
          const parsed = Number(trimmed);
          if (Number.isNaN(parsed)) {
            setError("Result must be a number");
            return;
          }
          realizedValue = parsed;
        }
        body = { outcome, realized_result: realizedValue };
      }

      const res = await fetch(`/api/prediction-markets/${prediction.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to resolve prediction");
      }

      onResolved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resolve");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-md my-8">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="text-lg font-bold text-foreground">Resolve Bet</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-surface-hover transition-colors"
          >
            <X size={18} className="text-muted" />
          </button>
        </div>

        {error && (
          <div className="mx-5 mt-4 px-4 py-2.5 rounded-xl bg-loss/10 border border-loss/20 text-loss text-sm">
            {error}
          </div>
        )}

        <div className="p-5 space-y-5">
          <p className="text-sm text-muted">{prediction.title}</p>

          <div>
            <label className="block text-xs text-muted mb-2">Outcome</label>
            <div className="flex gap-2">
              {OUTCOME_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => pickOutcome(o.value)}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-all duration-200 ${
                    outcome === o.value
                      ? "bg-accent/10 border-accent/30 text-accent shadow-sm"
                      : "bg-background border-border text-muted hover:text-foreground hover:border-accent/30"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {isUnitMode ? (
            <div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-muted mb-1.5">
                    Result (units)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={outcome === "void" ? "0" : unitsInput}
                    disabled={outcome === "void"}
                    onChange={(e) => onUnitsChange(e.target.value)}
                    placeholder="auto from odds"
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50 transition-all placeholder-muted/50 tabular-nums disabled:opacity-50"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs text-muted">Result (money)</label>
                    <div className="flex gap-0.5">
                      {CURRENCY_OPTIONS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => onCurrencyChange(c)}
                          className={`px-1.5 py-0.5 rounded text-[11px] font-bold transition-colors ${
                            resultCurrency === c
                              ? "bg-accent/15 text-accent"
                              : "text-muted/50 hover:text-foreground"
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="number"
                    step="any"
                    value={outcome === "void" ? "0" : moneyInput}
                    disabled={outcome === "void"}
                    onChange={(e) => onMoneyChange(e.target.value)}
                    placeholder="actual money"
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50 transition-all placeholder-muted/50 tabular-nums disabled:opacity-50"
                  />
                </div>
              </div>
              <p className="text-[10px] text-muted/60 mt-1.5">
                Auto-calculated from your odds (
                {prediction.odds != null ? `@ ${prediction.odds}` : "no odds set"})
                and stake ({fmtUnits(prediction.stake_units)}). Edit either — the
                other updates.{" "}
                {resultCurrency !== currency
                  ? `Entered in ${resultCurrency}, stored as ${fmtMoney(
                      moneyInput.trim() !== ""
                        ? convertMoney(Number(moneyInput), resultCurrency, currency, fxRate)
                        : 0,
                      currency,
                      true
                    )} (rate 1€=${fxRate}$).`
                  : `Stored as your actual money result in ${currency}.`}
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-xs text-muted mb-1.5">
                Realized Result (signed P/L)
              </label>
              <input
                type="number"
                step="any"
                value={realizedResult}
                onChange={(e) => setRealizedResult(e.target.value)}
                placeholder="e.g. 120 or -50"
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50 transition-all placeholder-muted/50 tabular-nums"
              />
              <p className="text-[10px] text-muted/60 mt-1.5">
                Void bets are excluded from calibration scoring.
              </p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-muted hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-accent text-background font-semibold text-sm hover:bg-accent-hover hover:shadow-[0_0_20px_rgba(0,180,216,0.3)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save Resolution"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Notes panel — strictly scoped to a single prediction
// ---------------------------------------------------------------------------

function NotesPanel({ predictionId }: { predictionId: string }) {
  const [notes, setNotes] = useState<PredictionMarketNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [adding, setAdding] = useState(false);
  const [deletingNote, setDeletingNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchNotes = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/prediction-market-notes?prediction_id=${encodeURIComponent(
          predictionId
        )}`
      );
      if (res.ok) {
        const data = await res.json();
        setNotes((data.notes ?? []) as PredictionMarketNote[]);
        setError(null);
      } else {
        setError("Failed to load notes.");
      }
    } catch {
      setError("Failed to load notes.");
    } finally {
      setLoading(false);
    }
  }, [predictionId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  async function addNote() {
    const trimmed = content.trim();
    if (!trimmed) return;
    setAdding(true);
    setError(null);
    try {
      const res = await fetch("/api/prediction-market-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prediction_id: predictionId,
          content: trimmed,
        }),
      });
      if (res.ok) {
        setContent("");
        fetchNotes();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to add note");
      }
    } catch {
      setError("Failed to add note");
    } finally {
      setAdding(false);
    }
  }

  async function deleteNote(id: string) {
    setDeletingNote(id);
    try {
      const res = await fetch(`/api/prediction-market-notes/${id}`, {
        method: "DELETE",
      });
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
        <span className="text-muted/50 normal-case tracking-normal font-normal">
          (separate from your trade journal)
        </span>
      </h4>

      {error && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-loss/10 border border-loss/20 text-loss text-xs">
          {error}
        </div>
      )}

      {/* Add note */}
      <div className="flex flex-col gap-2 mb-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Why you took this position, new info, thesis updates..."
          rows={2}
          className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-foreground text-sm focus:outline-none focus:border-accent/50 transition-all placeholder-muted/50 resize-none"
        />
        <div className="flex justify-end">
          <button
            type="button"
            onClick={addNote}
            disabled={adding || !content.trim()}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-accent text-background font-semibold text-xs hover:bg-accent-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={12} />
            {adding ? "Adding..." : "Add note"}
          </button>
        </div>
      </div>

      {/* Notes list */}
      {loading ? (
        <p className="text-xs text-muted">Loading notes...</p>
      ) : notes.length === 0 ? (
        <p className="text-xs text-muted/60">No notes yet for this prediction.</p>
      ) : (
        <div className="space-y-2">
          {notes.map((n) => (
            <div
              key={n.id}
              className="flex items-start justify-between gap-3 px-3 py-2 rounded-lg bg-surface border border-border/50"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                  {n.content}
                </p>
                <p className="text-[10px] text-muted/60 mt-1">{n.note_date}</p>
              </div>
              <button
                type="button"
                onClick={() => deleteNote(n.id)}
                disabled={deletingNote === n.id}
                className="p-1 rounded hover:bg-loss/10 transition-colors disabled:opacity-50 shrink-0"
                aria-label="Delete note"
              >
                <Trash2 size={14} className="text-muted hover:text-loss" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bankroll settings — inline editor for starting bankroll / unit % / currency
// ---------------------------------------------------------------------------

function BankrollSettings({
  initialBankroll,
  initialUnitPct,
  initialCurrentBankroll,
  initialCurrency,
  initialFxRate,
  initialAutoGrow,
  initialAutoGrowSince,
  onSave,
  onClose,
}: {
  initialBankroll: number;
  initialUnitPct: number;
  initialCurrentBankroll: number;
  initialCurrency: string;
  initialFxRate: number;
  initialAutoGrow: boolean;
  initialAutoGrowSince: string | null;
  onSave: (next: {
    bankroll: number;
    unitPct: number;
    currentBankroll: number;
    currency: string;
    fxRate: number;
    autoGrow: boolean;
    autoGrowSince: string | null;
  }) => Promise<void>;
  onClose: () => void;
}) {
  const [bankroll, setBankroll] = useState(String(initialBankroll));
  const [unitPct, setUnitPct] = useState(String(initialUnitPct));
  const [currentBankroll, setCurrentBankroll] = useState(
    String(initialCurrentBankroll)
  );
  const [currency, setCurrency] = useState(initialCurrency);
  const [fxRate, setFxRate] = useState(String(initialFxRate));
  const [autoGrow, setAutoGrow] = useState(initialAutoGrow);
  const [autoGrowSince, setAutoGrowSince] = useState<string | null>(
    initialAutoGrowSince
  );
  const [saving, setSaving] = useState(false);

  const bk = Number(bankroll);
  const up = Number(unitPct);
  const cur = Number(currentBankroll);
  const fx = Number(fxRate);
  const unitVal =
    Number.isFinite(bk) && Number.isFinite(up) ? (bk * up) / 100 : null;

  function toggleAutoGrow() {
    setAutoGrow((on: boolean) => {
      const next = !on;
      // Turning on starts the growth clock today (unless one is already set).
      if (next && !autoGrowSince) {
        setAutoGrowSince(new Date().toISOString().slice(0, 10));
      }
      return next;
    });
  }

  async function save() {
    setSaving(true);
    try {
      await onSave({
        bankroll: Number.isFinite(bk) && bk > 0 ? bk : initialBankroll,
        unitPct: Number.isFinite(up) && up > 0 ? up : initialUnitPct,
        currentBankroll:
          Number.isFinite(cur) && cur >= 0 ? cur : initialCurrentBankroll,
        currency: currency.trim() || initialCurrency,
        fxRate: Number.isFinite(fx) && fx > 0 ? fx : initialFxRate,
        autoGrow,
        autoGrowSince: autoGrow
          ? autoGrowSince ?? new Date().toISOString().slice(0, 10)
          : autoGrowSince,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-4 pt-4 border-t border-border/40 grid grid-cols-1 sm:grid-cols-6 gap-3 items-end">
      <div>
        <label className="block text-[10px] text-muted/60 uppercase tracking-wider mb-1">
          Current bankroll
        </label>
        <input
          type="number"
          step="any"
          min={0}
          value={currentBankroll}
          onChange={(e) => setCurrentBankroll(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50 tabular-nums"
        />
      </div>
      <div>
        <label className="block text-[10px] text-muted/60 uppercase tracking-wider mb-1">
          Unit-base bankroll
        </label>
        <input
          type="number"
          step="any"
          min={0}
          value={bankroll}
          onChange={(e) => setBankroll(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50 tabular-nums"
        />
      </div>
      <div>
        <label className="block text-[10px] text-muted/60 uppercase tracking-wider mb-1">
          Unit (% of bankroll)
        </label>
        <input
          type="number"
          step="any"
          min={0}
          value={unitPct}
          onChange={(e) => setUnitPct(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50 tabular-nums"
        />
      </div>
      <div>
        <label className="block text-[10px] text-muted/60 uppercase tracking-wider mb-1">
          Currency
        </label>
        <input
          type="text"
          maxLength={4}
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50"
        />
      </div>
      <div>
        <label className="block text-[10px] text-muted/60 uppercase tracking-wider mb-1">
          FX rate (1€ = X$)
        </label>
        <input
          type="number"
          step="any"
          min={0}
          value={fxRate}
          onChange={(e) => setFxRate(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50 tabular-nums"
        />
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="flex-1 px-4 py-2 rounded-lg bg-accent text-background font-semibold text-xs hover:bg-accent-hover transition-all disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-2 rounded-lg text-xs text-muted hover:text-foreground transition-colors"
        >
          Cancel
        </button>
      </div>

      {/* Auto-grow toggle (full width) */}
      <div className="sm:col-span-6 flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-background border border-border/60">
        <div>
          <p className="text-xs font-medium text-foreground">
            Auto-grow bankroll
          </p>
          <p className="text-[10px] text-muted/60 mt-0.5">
            {autoGrow
              ? `Bankroll grows with results resolved on/after ${
                  autoGrowSince ?? "today"
                }. Back-filled history before that stays out.`
              : "Off — bankroll stays fixed at your set value (ideal while back-filling old bets)."}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={autoGrow}
          onClick={toggleAutoGrow}
          className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
            autoGrow ? "bg-accent" : "bg-border"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-background transition-transform ${
              autoGrow ? "translate-x-5" : ""
            }`}
          />
        </button>
      </div>
      {autoGrow && (
        <div className="sm:col-span-6 flex items-center gap-2">
          <label className="text-[10px] text-muted/60 uppercase tracking-wider">
            Grow since
          </label>
          <input
            type="date"
            value={autoGrowSince ?? ""}
            onChange={(e) => setAutoGrowSince(e.target.value || null)}
            className="px-3 py-1.5 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50"
          />
        </div>
      )}

      {unitVal != null && (
        <p className="sm:col-span-6 text-[11px] text-muted/70">
          1 unit = {currency}
          {unitVal.toLocaleString(undefined, { maximumFractionDigits: 2 })} (fixed
          — {unitPct}% of the unit-base bankroll). Euro amounts stay constant; only
          the unit count changes if you edit this. &quot;Current bankroll&quot; is
          yours to set and is never auto-changed.
        </p>
      )}
    </div>
  );
}

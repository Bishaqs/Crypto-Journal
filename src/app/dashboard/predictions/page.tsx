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
} from "lucide-react";
import { Header } from "@/components/header";
import { PredictionMarketForm } from "@/components/prediction-market-form";
import { usePredictionStats } from "@/lib/use-prediction-stats";
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

export default function PredictionsPage() {
  const [predictions, setPredictions] = useState<PredictionMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PredictionMarket | null>(null);
  const [resolving, setResolving] = useState<PredictionMarket | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const stats = usePredictionStats(predictions);

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

      {/* Prediction cards */}
      <div className="space-y-4">
        {predictions.map((p) => {
          const isExpanded = expandedId === p.id;
          const badge = OUTCOME_BADGE[p.outcome];
          const edge =
            p.market_prob != null ? p.your_prob - p.market_prob : null;
          return (
            <div
              key={p.id}
              className="glass rounded-2xl border border-border/50 overflow-hidden"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <div
                className="p-5 cursor-pointer hover:bg-surface-hover/50 transition-all"
                onClick={() => setExpandedId(isExpanded ? null : p.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-base font-bold text-foreground truncate">
                        {p.title}
                      </h3>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-md font-medium inline-flex items-center gap-1 ${badge.className}`}
                      >
                        <badge.Icon size={11} />
                        {badge.label}
                      </span>
                      {p.platform && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-accent/8 text-accent font-medium">
                          {p.platform}
                        </span>
                      )}
                      {p.direction && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-muted/10 text-muted font-medium">
                          {p.direction}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted mt-1.5 flex-wrap">
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
                          {fmtNum(p.stake)}
                        </span>
                      </span>
                      {p.outcome !== "pending" && p.realized_result != null && (
                        <span>
                          Result:{" "}
                          <span
                            className={`font-bold tabular-nums ${
                              p.realized_result >= 0 ? "text-win" : "text-loss"
                            }`}
                          >
                            {p.realized_result >= 0 ? "+" : ""}
                            {fmtNum(p.realized_result)}
                          </span>
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
          onClose={() => setResolving(null)}
          onResolved={() => {
            setResolving(null);
            fetchPredictions();
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Resolve modal
// ---------------------------------------------------------------------------

function ResolveModal({
  prediction,
  onClose,
  onResolved,
}: {
  prediction: PredictionMarket;
  onClose: () => void;
  onResolved: () => void;
}) {
  const [outcome, setOutcome] = useState<Outcome>(
    prediction.outcome === "pending" ? "won" : prediction.outcome
  );
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

  async function handleSave() {
    setError(null);
    setSaving(true);
    try {
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

      const res = await fetch(`/api/prediction-markets/${prediction.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          outcome,
          realized_result: realizedValue,
        }),
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
          <h3 className="text-lg font-bold text-foreground">
            Resolve Prediction
          </h3>
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
                  onClick={() => setOutcome(o.value)}
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

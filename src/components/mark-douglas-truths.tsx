"use client";

import { useState } from "react";
import { BookOpen, Star } from "lucide-react";

const FIVE_TRUTHS = [
  {
    id: 1,
    truth: "Anything can happen",
    question: "Did I accept that the outcome was uncertain?",
    hint: "No setup is 100%. The market can do anything on any given trade.",
  },
  {
    id: 2,
    truth: "I don't need to know what happens next",
    question: "Was I attached to a specific outcome?",
    hint: "Your job is to execute the plan, not predict the future.",
  },
  {
    id: 3,
    truth: "Random distribution of wins and losses",
    question: "Am I respecting variance?",
    hint: "Wins and losses are randomly distributed. A loss doesn't mean you're wrong.",
  },
  {
    id: 4,
    truth: "An edge is just a higher probability",
    question: "Am I thinking in probabilities?",
    hint: "Your edge plays out over 100 trades, not 1. Each trade is a probability event.",
  },
  {
    id: 5,
    truth: "Every moment in the market is unique",
    question: "Did I bring baggage from my last trade?",
    hint: "This trade has nothing to do with the last one. Fresh chart, fresh mind.",
  },
];

export function MarkDouglasTruths({
  onSave,
  initialScores,
}: {
  onSave?: (scores: Record<number, number>) => void;
  initialScores?: Record<number, number>;
}) {
  const [scores, setScores] = useState<Record<number, number>>(
    initialScores ?? {}
  );
  const [expanded, setExpanded] = useState(false);

  function setScore(truthId: number, score: number) {
    const updated = { ...scores, [truthId]: score };
    setScores(updated);
    onSave?.(updated);
  }

  const avgScore =
    Object.keys(scores).length > 0
      ? Object.values(scores).reduce((a, b) => a + b, 0) /
        Object.values(scores).length
      : 0;

  const weakest =
    Object.keys(scores).length === 5
      ? FIVE_TRUTHS.reduce((min, t) =>
          (scores[t.id] ?? 5) < (scores[min.id] ?? 5) ? t : min
        )
      : null;

  return (
    <div className="rounded-xl border border-border bg-surface/50">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-surface-hover/50 transition-colors rounded-xl"
      >
        <div className="flex items-center gap-2">
          <BookOpen size={14} className="text-accent" />
          <span className="text-xs font-medium text-foreground">
            Mark Douglas — 5 Truths
          </span>
        </div>
        <div className="flex items-center gap-2">
          {avgScore > 0 && (
            <span className="text-[10px] text-muted">
              Avg: {avgScore.toFixed(1)}/5
            </span>
          )}
          <span
            className={`text-muted transition-transform ${expanded ? "rotate-180" : ""}`}
          >
            ▾
          </span>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          <p className="text-[10px] text-muted italic">
            Rate how well you embodied each truth on this trade (1-5):
          </p>

          {FIVE_TRUTHS.map((truth) => (
            <div key={truth.id} className="space-y-1.5">
              <div>
                <p className="text-xs font-medium text-foreground">
                  {truth.id}. &quot;{truth.truth}&quot;
                </p>
                <p className="text-[10px] text-muted">{truth.question}</p>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    onClick={() => setScore(truth.id, s)}
                    className={`w-8 h-7 rounded-md text-xs font-medium transition-all flex items-center justify-center ${
                      scores[truth.id] === s
                        ? s >= 4
                          ? "bg-win/20 text-win border border-win/30"
                          : s >= 3
                            ? "bg-yellow-400/20 text-yellow-400 border border-yellow-400/30"
                            : "bg-loss/20 text-loss border border-loss/30"
                        : "bg-surface border border-border text-muted hover:text-foreground hover:border-accent/20"
                    }`}
                  >
                    {s}
                  </button>
                ))}
                {scores[truth.id] && (
                  <span className="text-[9px] text-muted ml-1">
                    {scores[truth.id]! >= 4
                      ? "Strong"
                      : scores[truth.id]! >= 3
                        ? "OK"
                        : "Work on this"}
                  </span>
                )}
              </div>
            </div>
          ))}

          {weakest && (
            <div className="mt-3 p-2.5 rounded-lg bg-accent/5 border border-accent/10">
              <p className="text-[10px] text-accent flex items-center gap-1">
                <Star size={10} />
                <span className="font-medium">Focus area:</span>{" "}
                &quot;{weakest.truth}&quot;
              </p>
              <p className="text-[10px] text-muted mt-0.5">{weakest.hint}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

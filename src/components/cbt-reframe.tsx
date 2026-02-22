"use client";

import { useState } from "react";
import { Brain, ChevronRight, Lightbulb, X, BarChart3 } from "lucide-react";

const NEGATIVE_THOUGHTS = [
  "I always lose on this setup",
  "The market is rigged against me",
  "I should have held longer",
  "I'm not cut out for trading",
  "I keep making the same mistakes",
  "Everyone else is profitable except me",
];

export function CbtReframe({
  onClose,
  setupWinRate,
  setupName,
  totalTrades,
}: {
  onClose: () => void;
  setupWinRate?: number;
  setupName?: string;
  totalTrades?: number;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedThought, setSelectedThought] = useState<string | null>(null);
  const [customThought, setCustomThought] = useState("");
  const [reframe, setReframe] = useState("");

  const thought = selectedThought || customThought;

  // Generate data-backed counter based on the thought
  function getCounter(thought: string): string {
    if (thought.includes("always lose") && setupWinRate) {
      return `Your data shows a ${setupWinRate}% win rate on ${setupName ?? "this setup"} over ${totalTrades ?? "multiple"} trades. "Always" isn't accurate — you win more than you think.`;
    }
    if (thought.includes("rigged")) {
      return `Markets aren't personal. Your overall stats show you have an edge — focus on your process, not individual outcomes.`;
    }
    if (thought.includes("held longer")) {
      return `Hindsight bias. You exited based on your plan at the time. Review your exit rules — were they followed? If yes, the process was correct regardless of what happened after.`;
    }
    if (thought.includes("not cut out")) {
      return `Trading is a skill, not a talent. Every profitable trader went through losing periods. Your journaling consistency alone puts you ahead of 90% of traders.`;
    }
    if (thought.includes("same mistakes")) {
      return `The fact that you notice the pattern means you're growing. Check your rule compliance trend — it's likely improving even if it doesn't feel like it.`;
    }
    if (thought.includes("everyone else")) {
      return `Survivorship bias. You only see winners posting on social media. Studies show 70-90% of retail traders lose money. Your journal gives you a real edge.`;
    }
    return `This thought is driven by emotion, not data. Take a moment to look at your actual statistics before accepting this narrative.`;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg mx-4 rounded-2xl border border-border bg-background p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Brain size={18} className="text-accent" />
            <h2 className="font-bold text-foreground">Cognitive Reframing</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface-hover text-muted hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-all ${
                s <= step ? "bg-accent" : "bg-border"
              }`}
            />
          ))}
        </div>

        {/* Step 1: Identify the thought */}
        {step === 1 && (
          <div>
            <p className="text-sm text-muted mb-4">
              What negative thought are you having right now?
            </p>
            <div className="space-y-2 mb-4">
              {NEGATIVE_THOUGHTS.map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setSelectedThought(t);
                    setCustomThought("");
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl border text-sm transition-all ${
                    selectedThought === t
                      ? "border-accent/40 bg-accent/10 text-accent"
                      : "border-border bg-surface text-foreground hover:border-accent/20"
                  }`}
                >
                  &quot;{t}&quot;
                </button>
              ))}
            </div>
            <div>
              <input
                type="text"
                value={customThought}
                onChange={(e) => {
                  setCustomThought(e.target.value);
                  setSelectedThought(null);
                }}
                placeholder="Or type your own thought..."
                className="w-full px-3 py-2.5 rounded-xl bg-surface border border-border text-foreground text-sm placeholder-muted focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <button
              onClick={() => thought && setStep(2)}
              disabled={!thought}
              className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent text-background font-medium hover:bg-accent-hover transition-colors disabled:opacity-40"
            >
              Examine This Thought <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Step 2: Challenge with data */}
        {step === 2 && thought && (
          <div>
            <div className="p-3 rounded-xl bg-loss/5 border border-loss/20 mb-4">
              <p className="text-xs text-muted mb-1">Your thought:</p>
              <p className="text-sm text-loss italic">&quot;{thought}&quot;</p>
            </div>

            <div className="p-4 rounded-xl bg-accent/5 border border-accent/20 mb-4">
              <div className="flex items-start gap-2">
                <BarChart3 size={16} className="text-accent shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-accent mb-1">
                    What your data says:
                  </p>
                  <p className="text-sm text-foreground">
                    {getCounter(thought)}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep(3)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent text-background font-medium hover:bg-accent-hover transition-colors"
            >
              Reframe It <Lightbulb size={16} />
            </button>
          </div>
        )}

        {/* Step 3: Reframe */}
        {step === 3 && (
          <div>
            <p className="text-sm text-muted mb-3">
              Write a more balanced version of this thought:
            </p>
            <textarea
              value={reframe}
              onChange={(e) => setReframe(e.target.value)}
              placeholder="e.g., 'One loss doesn't define my trading. My win rate is positive and I'm following my process.'"
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl bg-surface border border-border text-foreground text-sm placeholder-muted focus:outline-none focus:border-accent transition-colors resize-none"
            />

            <div className="mt-4 p-3 rounded-xl bg-win/5 border border-win/20">
              <div className="flex items-start gap-2">
                <Lightbulb size={14} className="text-win shrink-0 mt-0.5" />
                <p className="text-xs text-muted">
                  Writing balanced thoughts strengthens neural pathways for
                  rational decision-making. Over time, this becomes automatic.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="mt-4 w-full py-2.5 rounded-xl bg-win/10 text-win font-medium border border-win/20 hover:bg-win/20 transition-colors"
            >
              Done — Back to Trading
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

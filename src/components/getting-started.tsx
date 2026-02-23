"use client";

import { useState, useEffect } from "react";
import { Plus, Upload, BookOpen, Target, Brain, CheckCircle2, X } from "lucide-react";
import Link from "next/link";

const STORAGE_PREFIX = "stargate-started-";
const DISMISSED_KEY = "stargate-getting-started-dismissed";

interface Step {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  href?: string;
  action?: "logTrade" | "import";
}

const STEPS: Step[] = [
  {
    id: "first-trade",
    title: "Log your first trade",
    description: "Record a trade with entry/exit, size, and your emotional state.",
    icon: Plus,
    action: "logTrade",
  },
  {
    id: "first-journal",
    title: "Write a journal entry",
    description: "Reflect on your trading session. What went well? What to improve?",
    icon: BookOpen,
    href: "/dashboard/journal",
  },
  {
    id: "try-ai",
    title: "Talk to your AI Coach",
    description: "Ask the AI about your patterns. Works with demo data too.",
    icon: Brain,
    href: "/dashboard/ai",
  },
  {
    id: "import-trades",
    title: "Import from your exchange",
    description: "Upload a CSV export from Binance, Bybit, or any exchange.",
    icon: Upload,
    action: "import",
  },
];

interface GettingStartedProps {
  onLogTrade: () => void;
  onImport: () => void;
}

export function GettingStartedCard({ onLogTrade, onImport }: GettingStartedProps) {
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISSED_KEY)) {
      setDismissed(true);
      return;
    }
    const done = new Set<string>();
    for (const step of STEPS) {
      if (localStorage.getItem(`${STORAGE_PREFIX}${step.id}`)) done.add(step.id);
    }
    setCompleted(done);
  }, []);

  function markComplete(id: string) {
    localStorage.setItem(`${STORAGE_PREFIX}${id}`, "true");
    setCompleted((prev) => new Set([...prev, id]));
  }

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, "true");
    setDismissed(true);
  }

  if (dismissed || completed.size >= STEPS.length) return null;

  const progress = Math.round((completed.size / STEPS.length) * 100);

  return (
    <div className="glass rounded-2xl border border-accent/20 p-5 space-y-4" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground">Get Started</h3>
          <p className="text-xs text-muted mt-0.5">{completed.size} of {STEPS.length} complete</p>
        </div>
        <button onClick={dismiss} className="p-1 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-all" title="Dismiss">
          <X size={16} />
        </button>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-surface rounded-full h-1.5 overflow-hidden">
        <div className="h-full bg-accent transition-all duration-500 rounded-full" style={{ width: `${progress}%` }} />
      </div>

      {/* Steps */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {STEPS.map((step) => {
          const isDone = completed.has(step.id);
          const Icon = step.icon;

          const handleClick = () => {
            markComplete(step.id);
            if (step.action === "logTrade") onLogTrade();
            if (step.action === "import") onImport();
          };

          if (step.href && !step.action) {
            return (
              <Link
                key={step.id}
                href={step.href}
                onClick={() => markComplete(step.id)}
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                  isDone
                    ? "bg-win/5 border-win/20 opacity-60"
                    : "border-border hover:border-accent/30 hover:bg-accent/5"
                }`}
              >
                <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${isDone ? "bg-win/10" : "bg-accent/10"}`}>
                  {isDone ? <CheckCircle2 size={16} className="text-win" /> : <Icon size={16} className="text-accent" />}
                </div>
                <div>
                  <p className={`text-xs font-semibold ${isDone ? "text-muted line-through" : "text-foreground"}`}>{step.title}</p>
                  <p className="text-[10px] text-muted mt-0.5">{step.description}</p>
                </div>
              </Link>
            );
          }

          return (
            <button
              key={step.id}
              onClick={handleClick}
              className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                isDone
                  ? "bg-win/5 border-win/20 opacity-60"
                  : "border-border hover:border-accent/30 hover:bg-accent/5"
              }`}
            >
              <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${isDone ? "bg-win/10" : "bg-accent/10"}`}>
                {isDone ? <CheckCircle2 size={16} className="text-win" /> : <Icon size={16} className="text-accent" />}
              </div>
              <div>
                <p className={`text-xs font-semibold ${isDone ? "text-muted line-through" : "text-foreground"}`}>{step.title}</p>
                <p className="text-[10px] text-muted mt-0.5">{step.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

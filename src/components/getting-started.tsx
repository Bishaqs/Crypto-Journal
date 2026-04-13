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
  action?: "logTrade" | "import" | "psychology";
}

const BASE_STEPS: Step[] = [
  {
    id: "first-trade",
    title: "Log your first trade so I can start tracking your patterns",
    description: "Even one trade gives Nova something to work with.",
    icon: Plus,
    action: "logTrade",
  },
  {
    id: "first-journal",
    title: "Write about today's trading session",
    description: "A few sentences about how you felt. Nova reads these too.",
    icon: BookOpen,
    href: "/dashboard/journal",
  },
  {
    id: "try-ai",
    title: "Ask Nova about your psychology profile",
    description: "She already knows your patterns from onboarding.",
    icon: Brain,
    href: "/dashboard/ai?q=Based%20on%20my%20psychology%20profile%2C%20what%20should%20I%20watch%20for%20in%20my%20next%20trading%20session%3F",
  },
  {
    id: "import-trades",
    title: "Import from your exchange",
    description: "Upload a CSV export from Binance, Bybit, or any exchange.",
    icon: Upload,
    action: "import",
  },
];

const PSYCHOLOGY_STEP: Step = {
  id: "psychology-profile",
  title: "Complete your Psychology Profile",
  description: "A 5-min assessment that unlocks personalized AI coaching from Nova.",
  icon: Target,
  action: "psychology",
};

function getSteps(): Step[] {
  if (typeof window !== "undefined" && localStorage.getItem("stargate-psychology-completed-onboarding")) {
    return BASE_STEPS;
  }
  return [...BASE_STEPS, PSYCHOLOGY_STEP];
}

interface GettingStartedProps {
  onLogTrade: () => void;
  onImport: () => void;
  onPsychology: () => void;
}

export function GettingStartedCard({ onLogTrade, onImport, onPsychology }: GettingStartedProps) {
  const [steps, setSteps] = useState<Step[]>(BASE_STEPS);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setSteps(getSteps());
    if (localStorage.getItem(DISMISSED_KEY)) {
      setDismissed(true);
      return;
    }
    const currentSteps = getSteps();
    const done = new Set<string>();
    for (const step of currentSteps) {
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

  if (dismissed || completed.size >= steps.length) return null;

  const progress = Math.round((completed.size / steps.length) * 100);

  return (
    <div className="glass rounded-2xl border border-accent/20 p-5 space-y-4" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground">Get Started</h3>
          <p className="text-xs text-muted mt-0.5">{completed.size} of {steps.length} complete</p>
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
        {steps.map((step) => {
          const isDone = completed.has(step.id);
          const Icon = step.icon;

          const handleClick = () => {
            markComplete(step.id);
            if (step.action === "logTrade") onLogTrade();
            if (step.action === "import") onImport();
            if (step.action === "psychology") onPsychology();
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

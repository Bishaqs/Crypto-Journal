"use client";

import { useState } from "react";
import {
  Table2,
  BookOpen,
  CalendarDays,
  BarChart3,
  ClipboardList,
  Sparkles,
  ToggleRight,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

const FEATURES_KEY = "stargate-features-seen";

interface Feature {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  description: string;
  color: string;
}

const FEATURES: Feature[] = [
  {
    icon: Table2,
    title: "Trade Log",
    description:
      "Record every trade with entry/exit, size, emotion, and process score. Filter and search your full history.",
    color: "text-accent",
  },
  {
    icon: BookOpen,
    title: "Journal",
    description:
      "Daily reflections with rich text, images, and templates. Review your mindset and track your growth over time.",
    color: "text-accent",
  },
  {
    icon: CalendarDays,
    title: "Calendar",
    description:
      "See your P&L by day. Green days = profit, red days = loss. Spot streaks and patterns at a glance.",
    color: "text-accent",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description:
      "50+ metrics: P&L by hour, by setup, by emotion. Find your edge and eliminate your weak spots.",
    color: "text-accent",
  },
  {
    icon: ClipboardList,
    title: "Trade Plans",
    description:
      "Plan trades before executing. Set entries, targets, and stop-losses. Rate your execution after closing.",
    color: "text-accent",
  },
  {
    icon: Sparkles,
    title: "AI Coach",
    description:
      "Chat with an AI that knows your trading patterns. Get personalized insights and recommendations.",
    color: "text-accent",
  },
  {
    icon: ToggleRight,
    title: "Simple & Advanced Mode",
    description:
      "Start in Simple mode with 6 core tools. Switch to Advanced to unlock 12+ pro tools like Monte Carlo sims, Prop Firm tracking, and Tax Reports.",
    color: "text-accent",
  },
  {
    icon: TrendingUp,
    title: "Crypto & Stocks",
    description:
      "Toggle between Crypto and Stocks in the sidebar. Track both asset classes in one unified journal.",
    color: "text-accent",
  },
];

export function FeatureExplainer({ onComplete }: { onComplete: () => void }) {
  const [current, setCurrent] = useState(0);

  const feature = FEATURES[current];
  const isLast = current === FEATURES.length - 1;
  const Icon = feature.icon;

  function handleNext() {
    if (isLast) {
      localStorage.setItem(FEATURES_KEY, "true");
      onComplete();
    } else {
      setCurrent(current + 1);
    }
  }

  function handleSkip() {
    localStorage.setItem(FEATURES_KEY, "true");
    onComplete();
  }

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5 mb-8">
          {FEATURES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === current
                  ? "w-6 bg-accent"
                  : i < current
                    ? "w-1.5 bg-accent/40"
                    : "w-1.5 bg-border"
              }`}
            />
          ))}
        </div>

        {/* Feature card */}
        <div className="glass rounded-2xl border border-border/50 p-8 text-center space-y-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto">
            <Icon size={28} className={feature.color} />
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted font-semibold mb-2">
              {current + 1} of {FEATURES.length}
            </p>
            <h2 className="text-xl font-bold text-foreground">{feature.title}</h2>
            <p className="text-sm text-muted mt-2 leading-relaxed">{feature.description}</p>
          </div>

          <button
            onClick={handleNext}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-accent text-background font-semibold text-sm hover:bg-accent-hover hover:shadow-[0_0_20px_rgba(0,180,216,0.3)] transition-all duration-300"
          >
            {isLast ? (
              <>
                <CheckCircle2 size={16} />
                Let&apos;s Go!
              </>
            ) : (
              <>
                Next
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>

        {/* Skip */}
        {!isLast && (
          <button
            onClick={handleSkip}
            className="block mx-auto mt-4 text-xs text-muted/60 hover:text-muted transition-colors"
          >
            Skip tour
          </button>
        )}
      </div>
    </div>
  );
}

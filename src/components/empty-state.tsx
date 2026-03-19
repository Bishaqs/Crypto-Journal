"use client";

import { BarChart3, BookOpen, LineChart, FileQuestion } from "lucide-react";
import Link from "next/link";

type Variant = "trades" | "analytics" | "journal" | "generic";

const VARIANTS: Record<Variant, { icon: typeof BarChart3; title: string; description: string; actionLabel: string; actionHref: string }> = {
  trades: {
    icon: LineChart,
    title: "No trades yet",
    description: "Log your first trade to get started. Your dashboard will come alive with data.",
    actionLabel: "Log a Trade",
    actionHref: "/dashboard/trades",
  },
  analytics: {
    icon: BarChart3,
    title: "Not enough data",
    description: "Log a few more trades to unlock analytics. We need data to find your patterns.",
    actionLabel: "Go to Trade Log",
    actionHref: "/dashboard/trades",
  },
  journal: {
    icon: BookOpen,
    title: "Start journaling",
    description: "Write your first journal entry to begin tracking your trading mindset.",
    actionLabel: "New Entry",
    actionHref: "/dashboard/journal",
  },
  generic: {
    icon: FileQuestion,
    title: "No data yet",
    description: "There's nothing here yet. Start using Traverse to see your data.",
    actionLabel: "Go to Dashboard",
    actionHref: "/dashboard",
  },
};

interface EmptyStateProps {
  variant?: Variant;
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  compact?: boolean;
}

export function EmptyState({
  variant = "generic",
  title,
  description,
  actionLabel,
  actionHref,
  compact = false,
}: EmptyStateProps) {
  const defaults = VARIANTS[variant];
  const Icon = defaults.icon;
  const finalTitle = title ?? defaults.title;
  const finalDescription = description ?? defaults.description;
  const finalActionLabel = actionLabel ?? defaults.actionLabel;
  const finalActionHref = actionHref ?? defaults.actionHref;

  if (compact) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Icon size={28} className="text-muted/30 mb-3" />
        <p className="text-sm text-muted mb-2">{finalTitle}</p>
        <Link
          href={finalActionHref}
          className="text-xs text-accent hover:text-accent-hover font-medium transition-colors"
        >
          {finalActionLabel} &rarr;
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-5">
        <Icon size={28} className="text-accent" />
      </div>
      <h3 className="text-lg font-bold text-foreground mb-2">{finalTitle}</h3>
      <p className="text-sm text-muted max-w-sm mb-6">{finalDescription}</p>
      <Link
        href={finalActionHref}
        className="px-5 py-2.5 rounded-xl bg-accent text-background font-semibold text-sm hover:bg-accent-hover transition-all"
      >
        {finalActionLabel}
      </Link>
    </div>
  );
}

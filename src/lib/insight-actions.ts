import { BehavioralInsight } from "./types";

export type InsightAction = {
  label: string;
  href: string;
};

/**
 * Map a behavioral insight to actionable CTAs based on its label and sentiment.
 * Every negative insight gets at least one action. No insight without a next step.
 */
export function getInsightActions(insight: BehavioralInsight): InsightAction[] {
  const lower = insight.label.toLowerCase();
  const desc = insight.description.toLowerCase();

  // Emotion-related insights
  if (lower.includes("emotion") || lower.includes("feeling") || lower.includes("mood")) {
    const actions: InsightAction[] = [
      { label: "Review by Emotion", href: "/dashboard/insights" },
    ];
    if (insight.sentiment === "negative") {
      actions.unshift({ label: "Create Emotion Rule", href: "/dashboard/rules" });
    }
    return actions;
  }

  // Loss-related insights
  if (lower.includes("loss") || lower.includes("losing") || lower.includes("cost")) {
    const actions: InsightAction[] = [
      { label: "Review Losing Trades", href: "/dashboard/trades" },
    ];
    if (insight.sentiment === "negative") {
      actions.push({ label: "Set Loss Limit", href: "/dashboard/rules" });
    }
    return actions;
  }

  // Process score insights
  if (lower.includes("process") || lower.includes("discipline")) {
    if (insight.sentiment === "negative") {
      return [
        { label: "Set Process Rule", href: "/dashboard/rules" },
        { label: "Review Low-Process Trades", href: "/dashboard/trades" },
      ];
    }
    return [{ label: "View Process Trends", href: "/dashboard/insights" }];
  }

  // Confidence insights
  if (lower.includes("confidence") || lower.includes("overconfident") || lower.includes("calibration")) {
    return [
      { label: "Review by Confidence", href: "/dashboard/insights" },
      ...(insight.sentiment === "negative"
        ? [{ label: "Talk to Nova", href: "/dashboard/ai" }]
        : []),
    ];
  }

  // Win rate / setup insights
  if (lower.includes("win rate") || lower.includes("setup") || lower.includes("edge")) {
    return [
      { label: "View Edge Profile", href: "/dashboard/edge" },
    ];
  }

  // Streak insights
  if (lower.includes("streak") || lower.includes("consecutive")) {
    if (insight.sentiment === "negative") {
      return [
        { label: "Create Streak Rule", href: "/dashboard/rules" },
        { label: "Talk to Nova", href: "/dashboard/ai" },
      ];
    }
    return [{ label: "View Streak History", href: "/dashboard/insights" }];
  }

  // Overtrading
  if (lower.includes("overtrad") || lower.includes("too many trades") || desc.includes("trade count")) {
    return [
      { label: "Set Max Trades Rule", href: "/dashboard/rules" },
    ];
  }

  // Time-based insights
  if (lower.includes("time") || lower.includes("hour") || lower.includes("session")) {
    return [
      { label: "View Time Analysis", href: "/dashboard/psychology" },
    ];
  }

  // Checklist insights
  if (lower.includes("checklist") || lower.includes("pre-trade")) {
    return [
      { label: "Review Checklist Impact", href: "/dashboard/insights" },
    ];
  }

  // Default: at least one action for negative insights
  if (insight.sentiment === "negative") {
    return [
      { label: "Talk to Nova", href: "/dashboard/ai" },
    ];
  }

  // Positive/neutral insights — subtle action
  return [
    { label: "View Details", href: "/dashboard/insights" },
  ];
}

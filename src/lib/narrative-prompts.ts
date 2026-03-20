/**
 * Period-specific Nova prompts for hierarchical narrative generation.
 *
 * Daily narratives use raw trade stats + journal + checkins + behavioral logs.
 * Weekly/monthly/yearly narratives compress from the sub-period summaries below them.
 */

import type { SummaryStats } from "./trading-summaries";

// ─── Types ───────────────────────────────────────────────────────────────────

type JournalSnippet = {
  title: string | null;
  content: string | null;
  tags: string[] | null;
};

type CheckinSnippet = {
  mood: number;
  energy: number | null;
  traffic_light: string | null;
  gratitude: string | null;
  intention: string | null;
};

type BehavioralSnippet = {
  emotion: string | null;
  intensity: number | null;
  trigger: string | null;
  biases: string[] | null;
  physical_state: string | null;
};

type SubPeriodSummary = {
  period_start: string;
  stats: SummaryStats;
  narrative: string | null;
};

// ─── Shared system prefix ────────────────────────────────────────────────────

const NOVA_PREFIX = `You are Nova — a sharp, data-driven trading psychology coach writing a periodic performance narrative for a trader's journal.

RULES:
1. Reference ONLY the data provided. Never invent trades, symbols, or numbers.
2. Use specific numbers (win rate, P&L, emotion counts, mood scores) — no vague language.
3. Focus on process and psychology over raw P&L — a profitable period with declining discipline is a warning.
4. Integrate trading performance with psychological state (mood, emotions, journal reflections).
5. End with one specific, actionable coaching insight.
6. Write in flowing prose paragraphs. No markdown headers, no bullet points, no numbered lists.
7. Do NOT start with greetings. This is a written summary, not a conversation.
8. Be direct and concise — every sentence should carry information or insight.`;

// ─── Period-specific system prompts ──────────────────────────────────────────

export function getDailyNarrativePrompt(): string {
  return `${NOVA_PREFIX}

You are writing a DAILY summary (2-3 sentences). Cover what happened today across trades, mental state, and any journal reflections. Be tactical and specific.`;
}

export function getWeeklyNarrativePrompt(): string {
  return `${NOVA_PREFIX}

You are writing a WEEKLY summary (3-4 sentences). You receive the 7 daily summaries from this week. Identify emotional arcs across the days, process score trends, mood-performance correlations, and whether discipline held or eroded over the week.`;
}

export function getMonthlyNarrativePrompt(): string {
  return `${NOVA_PREFIX}

You are writing a MONTHLY summary (4-5 sentences). You receive the weekly summaries from this month. Identify behavioral evolution, recurring patterns, which weeks were strong and why, and whether the trader is trending toward or away from consistency.`;
}

export function getYearlyNarrativePrompt(): string {
  return `${NOVA_PREFIX}

You are writing a YEARLY summary (5-6 sentences). You receive the monthly summaries from this year. Tell the growth story — milestones reached, persistent challenges that need addressing, identity-level shifts in trading behavior, and one strategic focus for the coming year.`;
}

// ─── Context builders ────────────────────────────────────────────────────────

function formatStats(stats: SummaryStats): string {
  const parts: string[] = [];
  parts.push(`Trades: ${stats.tradeCount}, Win rate: ${stats.winRate}%, P&L: $${stats.totalPnl.toFixed(2)}`);

  if (stats.avgProcessScore != null) {
    parts.push(`Avg process score: ${stats.avgProcessScore}/10`);
  }
  if (stats.dominantEmotion) {
    parts.push(`Dominant emotion: ${stats.dominantEmotion}`);
  }
  if (stats.greenDays != null) {
    parts.push(`Green days: ${stats.greenDays}, Red days: ${stats.redDays ?? 0}`);
  }
  if (stats.bestTrade) {
    parts.push(`Best trade: ${stats.bestTrade.symbol} ($${stats.bestTrade.pnl.toFixed(2)})`);
  }
  if (stats.worstTrade) {
    parts.push(`Worst trade: ${stats.worstTrade.symbol} ($${stats.worstTrade.pnl.toFixed(2)})`);
  }

  const emotions = Object.entries(stats.emotionBreakdown);
  if (emotions.length > 0 && emotions[0][0] !== "Untagged") {
    const emoStr = emotions
      .slice(0, 4)
      .map(([e, d]) => `${e}: ${d.count} trades (${d.winRate}% WR)`)
      .join(", ");
    parts.push(`Emotions: ${emoStr}`);
  }

  if (stats.topSymbols.length > 0) {
    const symStr = stats.topSymbols
      .slice(0, 3)
      .map((s) => `${s.symbol} ($${s.pnl.toFixed(2)}, ${s.count} trades)`)
      .join(", ");
    parts.push(`Top symbols: ${symStr}`);
  }

  return parts.join("\n");
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim().slice(0, 300);
}

export function buildDailyNarrativeInput(
  date: string,
  stats: SummaryStats,
  journalNotes: JournalSnippet[],
  checkin: CheckinSnippet | null,
  behavioralLogs: BehavioralSnippet[],
): string {
  const parts: string[] = [`## Trading Day: ${date}`, "", formatStats(stats)];

  if (checkin) {
    const ci: string[] = [`Mood: ${checkin.mood}/5`];
    if (checkin.energy != null) ci.push(`Energy: ${checkin.energy}/5`);
    if (checkin.traffic_light) ci.push(`Readiness: ${checkin.traffic_light}`);
    if (checkin.gratitude) ci.push(`Gratitude: "${checkin.gratitude}"`);
    if (checkin.intention) ci.push(`Intention: "${checkin.intention}"`);
    parts.push("", "Daily check-in:", ci.join(", "));
  }

  if (behavioralLogs.length > 0) {
    const logs = behavioralLogs.slice(0, 3).map((b) => {
      const items: string[] = [];
      if (b.emotion) items.push(`emotion: ${b.emotion}`);
      if (b.intensity) items.push(`intensity: ${b.intensity}/5`);
      if (b.trigger) items.push(`trigger: ${b.trigger}`);
      if (b.biases?.length) items.push(`biases: ${b.biases.join(", ")}`);
      if (b.physical_state) items.push(`body: ${b.physical_state}`);
      return items.join(", ");
    });
    parts.push("", "Behavioral logs:", ...logs);
  }

  if (journalNotes.length > 0) {
    const notes = journalNotes.slice(0, 3).map((n) => {
      const title = n.title ? `"${n.title}"` : "(untitled)";
      const body = n.content ? ` — ${stripHtml(n.content)}` : "";
      const tags = n.tags?.length ? ` [${n.tags.join(", ")}]` : "";
      return `${title}${body}${tags}`;
    });
    parts.push("", "Journal entries:", ...notes);
  }

  return parts.join("\n");
}

export function buildHierarchicalNarrativeInput(
  periodType: "weekly" | "monthly" | "yearly",
  periodStart: string,
  stats: SummaryStats,
  subPeriods: SubPeriodSummary[],
): string {
  const labels: Record<string, string> = {
    weekly: "Week",
    monthly: "Month",
    yearly: "Year",
  };
  const subLabels: Record<string, string> = {
    weekly: "Day",
    monthly: "Week",
    yearly: "Month",
  };

  const parts: string[] = [
    `## ${labels[periodType]} starting ${periodStart}`,
    "",
    "Overall stats:",
    formatStats(stats),
  ];

  if (subPeriods.length > 0) {
    parts.push("", `${subLabels[periodType]}-by-${subLabels[periodType].toLowerCase()} breakdown:`);
    for (const sp of subPeriods) {
      const header = `${sp.period_start}: ${sp.stats.tradeCount} trades, ${sp.stats.winRate}% WR, $${sp.stats.totalPnl.toFixed(2)}`;
      if (sp.narrative) {
        parts.push(`- ${header}`, `  Nova's take: ${sp.narrative}`);
      } else {
        const extras: string[] = [];
        if (sp.stats.avgProcessScore != null) extras.push(`process: ${sp.stats.avgProcessScore}`);
        if (sp.stats.dominantEmotion) extras.push(`emotion: ${sp.stats.dominantEmotion}`);
        parts.push(`- ${header}${extras.length ? ` (${extras.join(", ")})` : ""}`);
      }
    }
  }

  return parts.join("\n");
}

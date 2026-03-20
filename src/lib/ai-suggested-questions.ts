/**
 * Generate personalized suggested questions for Nova based on user's actual trading data.
 * Computed client-side from already-loaded data — zero API calls.
 */
import type { Trade, JournalNote } from "./types";

const EVERGREEN = [
  "What patterns do you see in my recent trades?",
  "What should I focus on improving this week?",
  "Give me a daily debrief for today",
];

const BEGINNER_QUESTIONS = [
  "What's the most important thing for a new trader to focus on?",
  "Explain my dashboard stats in simple terms",
  "Help me build a simple trading plan",
  "What does a good process score look like?",
];

export function generateSuggestedQuestions(
  trades: Trade[],
  notes: JournalNote[],
  experienceLevel: string,
): string[] {
  const questions: string[] = [];
  const closed = trades.filter((t) => t.close_timestamp && t.pnl !== null);

  // If no trades, return beginner/generic questions
  if (closed.length === 0) {
    if (experienceLevel === "beginner") return BEGINNER_QUESTIONS.slice(0, 4);
    return [
      "I'm new here — what should I know about Traverse?",
      "How do I log my first trade?",
      ...EVERGREEN.slice(0, 2),
    ];
  }

  // ─── Data-driven questions ─────────────────────────────────────────────

  // Emotion analysis
  const emotionGroups: Record<string, { wins: number; total: number }> = {};
  for (const t of closed) {
    const e = t.emotion || "Untagged";
    if (!emotionGroups[e]) emotionGroups[e] = { wins: 0, total: 0 };
    emotionGroups[e].total++;
    if ((t.pnl ?? 0) > 0) emotionGroups[e].wins++;
  }
  const emotionEntries = Object.entries(emotionGroups).filter(([k, v]) => k !== "Untagged" && v.total >= 3);
  if (emotionEntries.length >= 2) {
    const best = emotionEntries.sort((a, b) => (b[1].wins / b[1].total) - (a[1].wins / a[1].total))[0];
    const bestWR = Math.round((best[1].wins / best[1].total) * 100);
    if (bestWR >= 60) {
      questions.push(`How can I get into a ${best[0]} state more consistently? I win ${bestWR}% when I'm ${best[0]}.`);
    }
    const worst = emotionEntries.sort((a, b) => (a[1].wins / a[1].total) - (b[1].wins / b[1].total))[0];
    const worstWR = Math.round((worst[1].wins / worst[1].total) * 100);
    if (worstWR < 40) {
      questions.push(`Why do I perform so poorly when I'm ${worst[0]}? (${worstWR}% win rate)`);
    }
  }

  // Revenge trading detection
  const sorted = [...closed].sort((a, b) => new Date(a.open_timestamp).getTime() - new Date(b.open_timestamp).getTime());
  let revengeCount = 0;
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    if ((prev.pnl ?? 0) < 0) {
      const gap = new Date(curr.open_timestamp).getTime() - new Date(prev.close_timestamp || prev.open_timestamp).getTime();
      if (gap < 3600000) revengeCount++;
    }
  }
  if (revengeCount >= 3) {
    questions.push(`I've had ${revengeCount} trades within an hour of a loss. Why do I keep revenge trading?`);
  }

  // Symbol analysis
  const symbolGroups: Record<string, { wins: number; losses: number; totalPnl: number }> = {};
  for (const t of closed) {
    const sym = t.symbol || "Unknown";
    if (!symbolGroups[sym]) symbolGroups[sym] = { wins: 0, losses: 0, totalPnl: 0 };
    symbolGroups[sym].totalPnl += t.pnl ?? 0;
    if ((t.pnl ?? 0) > 0) symbolGroups[sym].wins++;
    else symbolGroups[sym].losses++;
  }
  const worstSymbol = Object.entries(symbolGroups)
    .filter(([, v]) => v.losses >= 5)
    .sort((a, b) => a[1].totalPnl - b[1].totalPnl)[0];
  if (worstSymbol) {
    questions.push(`Why do I keep losing on ${worstSymbol[0]}? (${worstSymbol[1].losses} losses, $${Math.round(worstSymbol[1].totalPnl)})`);
  }

  // Day of week analysis
  const dayGroups: Record<number, { wins: number; total: number }> = {};
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  for (const t of closed) {
    const day = new Date(t.open_timestamp).getDay();
    if (!dayGroups[day]) dayGroups[day] = { wins: 0, total: 0 };
    dayGroups[day].total++;
    if ((t.pnl ?? 0) > 0) dayGroups[day].wins++;
  }
  const worstDay = Object.entries(dayGroups)
    .filter(([, v]) => v.total >= 5)
    .sort((a, b) => (a[1].wins / a[1].total) - (b[1].wins / b[1].total))[0];
  if (worstDay) {
    const wr = Math.round((worstDay[1].wins / worstDay[1].total) * 100);
    if (wr < 40) {
      questions.push(`What's going wrong with my ${dayNames[Number(worstDay[0])]} trades? (${wr}% win rate)`);
    }
  }

  // Streak
  let currentStreak = 0;
  const lastPnl = closed.length > 0 ? (closed[closed.length - 1].pnl ?? 0) : 0;
  const streakType = lastPnl > 0 ? "win" : "loss";
  for (let i = closed.length - 1; i >= 0; i--) {
    const p = closed[i].pnl ?? 0;
    if ((streakType === "win" && p > 0) || (streakType === "loss" && p < 0)) currentStreak++;
    else break;
  }
  if (currentStreak >= 5 && streakType === "win") {
    questions.push(`How do I maintain my ${currentStreak}-trade win streak?`);
  }
  if (currentStreak >= 3 && streakType === "loss") {
    questions.push(`I'm on a ${currentStreak}-trade losing streak. What should I do?`);
  }

  // Process score
  const withProcess = closed.filter((t) => t.process_score != null);
  if (withProcess.length >= 10) {
    const avg = withProcess.reduce((s, t) => s + (t.process_score ?? 0), 0) / withProcess.length;
    if (avg < 6) {
      questions.push(`My average process score is ${avg.toFixed(1)}/10. What specific habits would improve it?`);
    }
  }

  // Recent journal
  if (notes.length > 0) {
    const recent = notes[0];
    if (recent.title) {
      questions.push(`Let's dig into my journal entry "${recent.title}"`);
    }
  }

  // Beginner-specific additions
  if (experienceLevel === "beginner" && questions.length < 4) {
    questions.push("What does my data tell you about my trading personality?");
  }

  // Fill with evergreen to reach 6-8
  const target = 8;
  for (const q of EVERGREEN) {
    if (questions.length >= target) break;
    if (!questions.includes(q)) questions.push(q);
  }

  return questions.slice(0, target);
}

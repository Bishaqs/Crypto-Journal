/**
 * Shared AI prompt and context builders for the AI Coach routes.
 */

export const AI_CHAT_SYSTEM_PROMPT = `You are Stargate AI — a trading psychology coach and pattern analyst built into a crypto trading journal.

Your role:
- Analyze trading data to find behavioral patterns, emotional tendencies, and process breakdowns
- Frame everything through a psychology + process lens (not just P&L)
- Be direct, specific, and actionable — no fluff
- Reference specific trades by symbol and date when making points
- Frame losses as "learning investments" and focus on what the trader did right process-wise
- Celebrate consistency and discipline over profits
- If you see concerning patterns (revenge trading, FOMO, ignoring stops), flag them clearly but constructively

Personality: Think of yourself as a calm, experienced trading mentor who's seen it all. You're supportive but honest. You don't sugarcoat, but you don't demoralize either.

Format rules:
- Use markdown for formatting
- Keep responses focused and concise (200-400 words typically)
- Use bullet points for actionable items
- Bold key insights`;

export function buildTradeContext(
  trades: Record<string, unknown>[],
  context: Record<string, unknown>
): string {
  if (trades.length === 0) {
    return "No trade data available yet. The user is asking a general trading question.";
  }

  const closed = trades.filter((t) => t.close_timestamp);
  const open = trades.filter((t) => !t.close_timestamp);

  const totalPnl = closed.reduce((s, t) => s + (Number(t.pnl) || 0), 0);
  const wins = closed.filter((t) => (Number(t.pnl) || 0) > 0);
  const losses = closed.filter((t) => (Number(t.pnl) || 0) <= 0);
  const winRate = closed.length > 0 ? ((wins.length / closed.length) * 100).toFixed(1) : "N/A";

  const emotionCounts: Record<string, { count: number; pnl: number }> = {};
  for (const t of closed) {
    const emotion = String(t.emotion || "Untagged");
    if (!emotionCounts[emotion]) emotionCounts[emotion] = { count: 0, pnl: 0 };
    emotionCounts[emotion].count++;
    emotionCounts[emotion].pnl += Number(t.pnl) || 0;
  }

  const processScores = closed
    .filter((t) => t.process_score != null)
    .map((t) => Number(t.process_score));
  const avgProcess = processScores.length > 0
    ? (processScores.reduce((a, b) => a + b, 0) / processScores.length).toFixed(1)
    : "N/A";

  let summary = `## Trading Summary
- **Total closed trades**: ${closed.length}
- **Open positions**: ${open.length}
- **Total P&L**: $${totalPnl.toFixed(2)}
- **Win rate**: ${winRate}%
- **Wins**: ${wins.length} | **Losses**: ${losses.length}
- **Avg process score**: ${avgProcess}/10

## Emotion Breakdown
${Object.entries(emotionCounts)
  .map(([e, d]) => `- ${e}: ${d.count} trades, total P&L $${d.pnl.toFixed(2)}`)
  .join("\n")}

## Recent Trades (last 20)
`;

  const recent = trades.slice(0, 20);
  for (const t of recent) {
    const pnl = t.pnl != null ? `$${Number(t.pnl).toFixed(2)}` : "OPEN";
    const date = t.close_timestamp
      ? String(t.close_timestamp).split("T")[0]
      : String(t.open_timestamp).split("T")[0];
    summary += `- ${date} | ${t.symbol} ${t.position} | P&L: ${pnl} | Emotion: ${t.emotion || "—"} | Confidence: ${t.confidence ?? "—"}/10 | Process: ${t.process_score ?? "—"}/10 | Setup: ${t.setup_type || "—"}`;
    if (t.notes) summary += ` | Notes: ${String(t.notes).slice(0, 80)}`;
    summary += "\n";
  }

  if (context.weeklyReport) {
    summary += `\n## Additional Context\n${context.weeklyReport}\n`;
  }

  return summary;
}

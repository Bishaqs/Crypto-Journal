/**
 * Shared AI prompt and context builders for the AI Coach routes.
 */

export const AI_CHAT_SYSTEM_PROMPT = `You are Nova — a trading psychology coach and pattern analyst built into a multi-asset trading journal (crypto, stocks, commodities, forex).

Your role:
- Analyze trading data to find behavioral patterns, emotional tendencies, and process breakdowns
- Frame everything through a psychology + process lens (not just P&L)
- Be direct, specific, and actionable — no fluff
- Reference specific trades by symbol and date when making points
- Frame losses as "learning investments" and focus on what the trader did right process-wise
- Celebrate consistency and discipline over profits
- If you see concerning patterns (revenge trading, FOMO, ignoring stops), flag them clearly but constructively

Personality: Think of yourself as a calm, experienced trading mentor who's seen it all. You're supportive but honest. You don't sugarcoat, but you don't demoralize either.

## Destructive Pattern Detection

Use these criteria to identify patterns from the data — be specific, not vague:
- **Revenge trading**: 2+ entries within 30 min of a realized loss, or increased position size immediately after a loss
- **FOMO entry**: Entry with no setup type tagged, especially after a large green move in that symbol
- **Overtrading**: >5 trades in a single day, or >3 trades in the same symbol on the same day
- **Tilt cascade**: 3+ consecutive losses with declining process scores — the trader is spiraling
- **Disposition effect**: Avg winner is much smaller than avg loser despite a high win rate — cutting winners early, holding losers too long

## Cognitive Bias Coaching

When you detect these biases, use the coaching response:
- **Recency bias** (over-weighting last few trades): "Let's zoom out — what does your 30-trade sample say?"
- **Anchoring** (fixating on entry price): "Forget your entry. Would you take this trade right now at this price?"
- **Confirmation bias** (only seeing what confirms their view): "What would need to happen for you to be wrong here?"
- **Sunk cost** (adding to losers): "If you had no position, would you enter this trade fresh right now?"

## Process Score Interpretation

- **8-10**: Excellent discipline. Reinforce this. Ask what routine or mindset produced it.
- **5-7**: Partial adherence. Identify which specific rule was bent and why.
- **1-4**: Process breakdown. Ignore P&L entirely — focus only on what went wrong in the decision process.
- **Key rule**: High process score + loss = GOOD trade (unlucky, not undisciplined). Low process score + win = DANGEROUS trade (got lucky, will lose long-term). Coach accordingly.

## Emotion-Performance Matrix

Coach differently based on emotion tag + outcome:
- Confident + Win → reinforce, but watch for overconfidence creep
- Confident + Loss → healthy IF process score was high; flag if process was poor
- Anxious + Win → was the position too small? Did they exit too early out of fear?
- Revenge/FOMO + any outcome → immediate flag, pattern interrupt: "Stop. Step away. Review your rules."
- Calm/Neutral → this is the ideal state. Celebrate it and ask what pre-trade routine produced it.

## Statistical Guidance

Avoid misleading conclusions:
- <30 closed trades = not enough data to judge edge. Say so explicitly.
- Win rate alone is meaningless — always pair with risk:reward ratio.
- Win rate <40% with avg winner >2x avg loser = valid edge. Explain why this is fine.
- Profit factor: >1.5 = solid, >2.0 = excellent, <1.0 = losing money. Frame accordingly.
- Never give trade ideas or market predictions. You coach process and psychology, not entries.

## Multi-Asset Context

The trader may have positions across crypto, stocks, commodities, and forex.
- When analyzing patterns, note if certain behaviors differ by asset class
- Forex trades use "pair" (e.g., EUR/USD) instead of "symbol"
- Compare discipline and process scores across asset classes if data permits
- Look for patterns like: better discipline in one asset class but not others

## Journal Entries (from the Journal Page)

The trader writes dedicated journal entries on the Journal page. These include:
- **Trade reflections** (linked to specific trades via trade_id)
- **Daily notes** (pre-market plans, end-of-day reviews)
- **General notes** (strategy ideas, market observations, psychological insights)

IMPORTANT: "Trade memos" (short inline text on each trade row in the Recent Trades section) are different from "Journal Entries" (dedicated notes from the Journal page listed in the "Journal Entries" section below). When the user asks about their "journal notes" or "journal entries", refer to the "Journal Entries" section, NOT the trade memos.

When referencing journal entries, cite them by date and title. Use them to understand the trader's thought process beyond just numbers. They reveal intentions, lessons learned, and evolving strategies that raw trade data cannot show.

## Image Analysis

You can see images embedded in journal entries (charts, screenshots, annotated setups, trade executions).
Each image is labeled with its source note title and date in the "Attached Images" section of the context.
When the user asks about images or visual content:
- ALWAYS describe what you actually see in each image (chart patterns, indicators, price action, annotations, colors, timeframes)
- Relate your observations to the trade data and journal entry each image came from
- If you cannot make out details in an image, say so honestly rather than giving generic analysis
- Do NOT just say "I can see your images" and then ignore them — describe specific visual details

Format rules:
- Use markdown for formatting
- Keep responses focused and concise (200-500 words typically)
- Use bullet points for actionable items
- Bold key insights`;

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export type ExtractedImage = { url: string; noteTitle: string; noteDate: string };

/** Extract image URLs with source context from journal note HTML. Max 10. */
export function extractImagesFromNotes(notes: Record<string, unknown>[]): ExtractedImage[] {
  const MAX_IMAGES = 10;
  const images: ExtractedImage[] = [];
  const imgRegex = /<img[^>]+src="([^"]+)"[^>]*>/gi;

  for (const n of notes) {
    if (images.length >= MAX_IMAGES) break;
    const html = String(n.content || "");
    const title = String(n.title || "(untitled)");
    const date = String(n.note_date || n.created_at || "").split("T")[0];
    let match;
    while ((match = imgRegex.exec(html)) !== null && images.length < MAX_IMAGES) {
      images.push({ url: match[1], noteTitle: title, noteDate: date });
    }
  }
  return images;
}

export function buildTradeContext(
  trades: Record<string, unknown>[],
  context: Record<string, unknown>,
  notes?: Record<string, unknown>[],
): string {
  if (trades.length === 0 && (!notes || notes.length === 0)) {
    return "No trade data or journal notes available yet. The user is asking a general trading question.";
  }

  const closed = trades.filter((t) => t.close_timestamp);
  const open = trades.filter((t) => !t.close_timestamp);

  const totalPnl = closed.reduce((s, t) => s + (Number(t.pnl) || 0), 0);
  const wins = closed.filter((t) => (Number(t.pnl) || 0) > 0);
  const losses = closed.filter((t) => (Number(t.pnl) || 0) <= 0);
  const winRate = closed.length > 0 ? ((wins.length / closed.length) * 100).toFixed(1) : "N/A";

  // Avg winner vs avg loser
  const avgWin = wins.length > 0
    ? (wins.reduce((s, t) => s + (Number(t.pnl) || 0), 0) / wins.length).toFixed(2)
    : "N/A";
  const avgLoss = losses.length > 0
    ? (losses.reduce((s, t) => s + (Number(t.pnl) || 0), 0) / losses.length).toFixed(2)
    : "N/A";

  // Largest win / loss
  const pnls = closed.map((t) => Number(t.pnl) || 0);
  const largestWin = pnls.length > 0 ? Math.max(...pnls).toFixed(2) : "N/A";
  const largestLoss = pnls.length > 0 ? Math.min(...pnls).toFixed(2) : "N/A";

  // Profit factor
  const grossProfit = wins.reduce((s, t) => s + (Number(t.pnl) || 0), 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + (Number(t.pnl) || 0), 0));
  const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss).toFixed(2) : "∞";

  // Emotion breakdown with win rate
  const emotionStats: Record<string, { count: number; pnl: number; wins: number }> = {};
  for (const t of closed) {
    const emotion = String(t.emotion || "Untagged");
    if (!emotionStats[emotion]) emotionStats[emotion] = { count: 0, pnl: 0, wins: 0 };
    emotionStats[emotion].count++;
    emotionStats[emotion].pnl += Number(t.pnl) || 0;
    if ((Number(t.pnl) || 0) > 0) emotionStats[emotion].wins++;
  }

  // Process scores
  const processScores = closed
    .filter((t) => t.process_score != null)
    .map((t) => Number(t.process_score));
  const avgProcess = processScores.length > 0
    ? (processScores.reduce((a, b) => a + b, 0) / processScores.length).toFixed(1)
    : "N/A";

  // Process score trend: last 10 vs overall
  const recentProcessScores = processScores.slice(-10);
  const recentAvgProcess = recentProcessScores.length > 0
    ? (recentProcessScores.reduce((a, b) => a + b, 0) / recentProcessScores.length).toFixed(1)
    : "N/A";

  // Symbol performance
  const symbolStats: Record<string, { count: number; pnl: number; wins: number }> = {};
  for (const t of closed) {
    const sym = String(t.symbol || "Unknown");
    if (!symbolStats[sym]) symbolStats[sym] = { count: 0, pnl: 0, wins: 0 };
    symbolStats[sym].count++;
    symbolStats[sym].pnl += Number(t.pnl) || 0;
    if ((Number(t.pnl) || 0) > 0) symbolStats[sym].wins++;
  }
  const symbolEntries = Object.entries(symbolStats).sort((a, b) => b[1].pnl - a[1].pnl);
  const bestSymbols = symbolEntries.slice(0, 3);
  const worstSymbols = symbolEntries.slice(-3).reverse();

  // Setup type performance
  const setupStats: Record<string, { count: number; pnl: number; wins: number }> = {};
  for (const t of closed) {
    const setup = String(t.setup_type || "No setup");
    if (!setupStats[setup]) setupStats[setup] = { count: 0, pnl: 0, wins: 0 };
    setupStats[setup].count++;
    setupStats[setup].pnl += Number(t.pnl) || 0;
    if ((Number(t.pnl) || 0) > 0) setupStats[setup].wins++;
  }

  // Streak detection
  let currentStreak = 0;
  let currentStreakType = "";
  let maxWinStreak = 0;
  let maxLossStreak = 0;
  let tempWinStreak = 0;
  let tempLossStreak = 0;
  for (const t of closed) {
    if ((Number(t.pnl) || 0) > 0) {
      tempWinStreak++;
      tempLossStreak = 0;
      if (tempWinStreak > maxWinStreak) maxWinStreak = tempWinStreak;
    } else {
      tempLossStreak++;
      tempWinStreak = 0;
      if (tempLossStreak > maxLossStreak) maxLossStreak = tempLossStreak;
    }
  }
  currentStreak = tempWinStreak > 0 ? tempWinStreak : -tempLossStreak;
  currentStreakType = currentStreak > 0 ? "wins" : currentStreak < 0 ? "losses" : "neutral";

  // Overtrading detection: days with >5 trades
  const tradesPerDay: Record<string, number> = {};
  for (const t of closed) {
    const day = String(t.close_timestamp || t.open_timestamp || "").split("T")[0];
    if (day) tradesPerDay[day] = (tradesPerDay[day] || 0) + 1;
  }
  const overtradingDays = Object.entries(tradesPerDay).filter(([, c]) => c > 5);

  // Weekly P&L trend (last 4 weeks)
  const now = new Date();
  const weeklyPnl: { week: string; pnl: number; count: number }[] = [];
  for (let i = 3; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - (i + 1) * 7);
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() - i * 7);
    const weekTrades = closed.filter((t) => {
      const d = new Date(String(t.close_timestamp || ""));
      return d >= weekStart && d < weekEnd;
    });
    const wPnl = weekTrades.reduce((s, t) => s + (Number(t.pnl) || 0), 0);
    weeklyPnl.push({
      week: `${weekStart.toISOString().split("T")[0]} → ${weekEnd.toISOString().split("T")[0]}`,
      pnl: wPnl,
      count: weekTrades.length,
    });
  }

  // Asset class breakdown (only if trades have _assetType tags)
  const assetStats: Record<string, { count: number; pnl: number; wins: number }> = {};
  for (const t of closed) {
    const at = String(t._assetType || "crypto");
    if (!assetStats[at]) assetStats[at] = { count: 0, pnl: 0, wins: 0 };
    assetStats[at].count++;
    assetStats[at].pnl += Number(t.pnl) || 0;
    if ((Number(t.pnl) || 0) > 0) assetStats[at].wins++;
  }
  const assetClasses = Object.keys(assetStats);

  // Determine context budget — progressive truncation for large journals
  let recentTradeLimit = 50;
  let recentNoteLimit = 30;
  let noteContentLimit = 200;

  // Build summary
  let summary = `## Trading Summary (Full Journal: ${closed.length} closed trades, ${open.length} open)
- **Total P&L**: $${totalPnl.toFixed(2)}
- **Win rate**: ${winRate}% (${wins.length}W / ${losses.length}L)
- **Avg winner**: $${avgWin} | **Avg loser**: $${avgLoss}
- **Largest win**: $${largestWin} | **Largest loss**: $${largestLoss}
- **Profit factor**: ${profitFactor}
- **Open positions**: ${open.length}
`;

  // Asset class breakdown (only shown when multiple asset classes exist)
  if (assetClasses.length > 1) {
    summary += `\n## Asset Class Breakdown\n`;
    for (const [at, d] of Object.entries(assetStats).sort((a, b) => b[1].count - a[1].count)) {
      const wr = d.count > 0 ? ((d.wins / d.count) * 100).toFixed(0) : "0";
      summary += `- **${at.charAt(0).toUpperCase() + at.slice(1)}**: ${d.count} trades, WR ${wr}%, P&L $${d.pnl.toFixed(2)}\n`;
    }
  }

  summary += `
## Process Discipline
- **Avg process score**: ${avgProcess}/10 (overall) | ${recentAvgProcess}/10 (last 10 trades)
- **Trend**: ${avgProcess !== "N/A" && recentAvgProcess !== "N/A" ? (Number(recentAvgProcess) > Number(avgProcess) ? "Improving ↑" : Number(recentAvgProcess) < Number(avgProcess) ? "Declining ↓" : "Stable →") : "N/A"}

## Streaks
- **Current**: ${Math.abs(currentStreak)} ${currentStreakType}
- **Max win streak**: ${maxWinStreak} | **Max loss streak**: ${maxLossStreak}

## Emotion Breakdown
${Object.entries(emotionStats)
  .sort((a, b) => b[1].count - a[1].count)
  .map(([e, d]) => `- ${e}: ${d.count} trades, WR ${d.count > 0 ? ((d.wins / d.count) * 100).toFixed(0) : 0}%, P&L $${d.pnl.toFixed(2)}`)
  .join("\n")}

## Top Symbols (by P&L)
${bestSymbols.map(([s, d]) => `- ${s}: ${d.count} trades, WR ${((d.wins / d.count) * 100).toFixed(0)}%, P&L $${d.pnl.toFixed(2)}`).join("\n")}

## Worst Symbols (by P&L)
${worstSymbols.map(([s, d]) => `- ${s}: ${d.count} trades, WR ${((d.wins / d.count) * 100).toFixed(0)}%, P&L $${d.pnl.toFixed(2)}`).join("\n")}

## Setup Performance
${Object.entries(setupStats)
  .sort((a, b) => b[1].count - a[1].count)
  .slice(0, 6)
  .map(([s, d]) => `- ${s}: ${d.count} trades, WR ${((d.wins / d.count) * 100).toFixed(0)}%, P&L $${d.pnl.toFixed(2)}`)
  .join("\n")}

## Weekly Trend (last 4 weeks)
${weeklyPnl.map((w) => `- ${w.week}: $${w.pnl.toFixed(2)} (${w.count} trades)`).join("\n")}
${overtradingDays.length > 0 ? `\n## Overtrading Alerts\n${overtradingDays.length} day(s) with >5 trades: ${overtradingDays.map(([d, c]) => `${d} (${c})`).join(", ")}` : ""}
`;

  // Check if we need to reduce context size before adding recent trades + notes
  // Rough estimate: current summary + upcoming sections
  if (summary.length > 30000) {
    recentTradeLimit = 20;
    recentNoteLimit = 15;
    noteContentLimit = 100;
  }

  // Recent trades
  summary += `\n## Recent Trades (last ${Math.min(recentTradeLimit, trades.length)})\n`;
  const recent = trades.slice(0, recentTradeLimit);
  for (const t of recent) {
    const pnl = t.pnl != null ? `$${Number(t.pnl).toFixed(2)}` : "OPEN";
    const date = t.close_timestamp
      ? String(t.close_timestamp).split("T")[0]
      : String(t.open_timestamp).split("T")[0];
    const assetType = t._assetType ? ` [${t._assetType}]` : "";
    summary += `- ${date} | ${t.symbol} ${t.position}${assetType} | P&L: ${pnl} | Emotion: ${t.emotion || "—"} | Confidence: ${t.confidence ?? "—"}/10 | Process: ${t.process_score ?? "—"}/10 | Setup: ${t.setup_type || "—"}`;
    if (t.notes) summary += ` | Trade memo: ${String(t.notes).slice(0, 80)}`;
    summary += "\n";
  }

  // Journal notes section
  if (notes && notes.length > 0) {
    const sortedNotes = [...notes].sort((a, b) => {
      const dateA = String(a.note_date || a.created_at || "");
      const dateB = String(b.note_date || b.created_at || "");
      return dateB.localeCompare(dateA);
    });

    const displayNotes = sortedNotes.slice(0, recentNoteLimit);
    summary += `\n## Journal Entries from the Journal Page (${displayNotes.length} most recent of ${notes.length} total)\nThese are dedicated journal entries the trader wrote on the Journal page — distinct from inline trade memos above.\n`;

    for (const n of displayNotes) {
      const date = String(n.note_date || n.created_at || "").split("T")[0];
      const title = n.title ? `"${n.title}"` : "(untitled)";
      const type = n.note_type || "general";
      const asset = n.asset_type || "—";
      const tags = Array.isArray(n.tags) && n.tags.length > 0 ? ` | Tags: ${n.tags.join(", ")}` : "";
      const content = stripHtml(String(n.content || "")).slice(0, noteContentLimit);
      const linkedTrade = n.trade_id ? " (linked to trade)" : "";

      summary += `- ${date} | ${title} [${type}, ${asset}]${linkedTrade}${tags} — ${content}${content.length >= noteContentLimit ? "..." : ""}\n`;
    }
  }

  if (context.weeklyReport) {
    summary += `\n## Additional Context\n${context.weeklyReport}\n`;
  }

  // Final context size safety — hard truncate if still too large
  if (summary.length > 60000) {
    return summary.slice(0, 60000) + "\n\n[Context truncated due to size — aggregate statistics above are computed from ALL data]";
  }

  return summary;
}

/** Build a text summary of behavioral logs and daily check-ins for AI analysis. */
export function buildBehavioralContext(
  logs: { emotion: string; intensity: number | null; trigger: string | null; physical_state: string | string[] | null; biases: string[] | null; traffic_light: string | null; note: string | null; created_at: string }[],
  checkins: { date: string; mood: number; energy: number | null; traffic_light: "green" | "yellow" | "red" }[],
): string {
  const parts: string[] = [];

  if (logs.length > 0) {
    parts.push(`## Behavioral Logs (${logs.length} entries)`);
    for (const l of logs.slice(-20)) {
      const date = l.created_at?.split("T")[0] ?? "unknown";
      const biases = l.biases?.length ? ` | biases: ${l.biases.join(", ")}` : "";
      const trigger = l.trigger ? ` | trigger: ${l.trigger}` : "";
      const physical = l.physical_state ? ` | physical: ${Array.isArray(l.physical_state) ? l.physical_state.join(", ") : l.physical_state}` : "";
      const light = l.traffic_light ? ` [${l.traffic_light}]` : "";
      parts.push(`- ${date}: ${l.emotion} (intensity ${l.intensity ?? "?"})${light}${trigger}${physical}${biases}${l.note ? ` — "${l.note}"` : ""}`);
    }
  }

  if (checkins.length > 0) {
    parts.push(`\n## Daily Check-ins (${checkins.length} days)`);
    for (const c of checkins.slice(-14)) {
      parts.push(`- ${c.date}: mood ${c.mood}/10, energy ${c.energy ?? "?"}/10, light ${c.traffic_light}`);
    }
  }

  return parts.join("\n") || "No behavioral data available.";
}

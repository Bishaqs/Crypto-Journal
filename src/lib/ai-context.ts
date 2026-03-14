/**
 * Shared AI prompt and context builders for the AI Coach routes.
 */

export const AI_CHAT_SYSTEM_PROMPT = `You are Nova — a sharp, data-driven trading coach embedded in a multi-asset trading journal (crypto, stocks, commodities, forex). You have access to the trader's full history: trades, journal entries, playbooks, emotions, process scores, and images.

## Who You Are

You're the coach who asks the hard questions. Not a cheerleader, not a therapist — a mentor who makes traders think. You're direct and specific. Every statement you make must reference THIS trader's actual data — specific symbols, dates, P&L figures, process scores. If you can't back a claim with their data, don't make it.

You use the Socratic method: ask probing questions that force self-reflection before handing answers. "Your BTCUSDT trades have a 34% win rate but your ETHUSDT trades hit 71%. What are you doing differently?" is better than "Consider focusing on your stronger setups."

## How to Respond

**Match depth to the question.** Simple question = 2-3 sentences. Deep analysis = thorough breakdown. Never pad short answers to fill space.

**In follow-up messages**, be concise. Don't re-analyze everything — build on what was already discussed. Reference prior points naturally: "Building on what we discussed about your revenge trading pattern..."

**Never give generic advice.** "Use proper risk management" is useless. "Your last 5 SOLUSDT losses averaged -$340 with no stop loss tagged — your playbook says max risk is $200. What's happening there?" is coaching.

**Challenge contradictions.** If their process score is 8/10 but they broke 3 playbook rules, call it out. If they say they're disciplined but the data shows 7 trades on Tuesday after a loss streak, show them.

## What to Analyze

**Process over P&L — always.** A high-process loss is a good trade (variance). A low-process win is a dangerous trade (luck). Coach accordingly.

**Pattern detection** — flag these with specific evidence:
- Revenge trading: entries within 30 min of a loss, or increased size post-loss
- FOMO: no setup type, entry after a large move
- Overtrading: >5 trades/day or >3 same-symbol same-day
- Tilt cascade: 3+ consecutive losses with declining process scores
- Disposition effect: avg winner << avg loser despite high win rate

**Cognitive biases** — when you see them, challenge with a question:
- Recency bias → "Zoom out — what does your 30-trade sample show?"
- Anchoring → "Ignore your entry price. Would you take this trade right now?"
- Confirmation bias → "What would need to happen for you to be wrong?"
- Sunk cost → "If you were flat, would you enter this position fresh today?"

**Emotion-performance correlation** — analyze emotion tags vs outcomes. Calm/confident states that produce wins should be reinforced. FOMO/revenge/frustrated states should trigger a pattern interrupt.

## Statistical Guardrails

- <30 trades = insufficient sample. Say so.
- Win rate is meaningless without risk:reward. A 35% win rate with 3:1 R:R is a strong edge.
- Profit factor: >1.5 solid, >2.0 excellent, <1.0 losing.
- Never give trade ideas or market predictions. Coach process and psychology only.

## Data Context

- **Trade memos** (inline on trade rows) ≠ **Journal entries** (dedicated notes from the Journal page). When the trader asks about "journal entries," reference the Journal Entries section.
- Forex trades use "pair" instead of "symbol."
- When multi-asset data exists, compare discipline across asset classes.
- Cite journal entries by date and title — they reveal the trader's thinking beyond numbers.
- When images are attached, describe what you actually see (chart patterns, annotations, timeframes). Never ignore images.

## Playbook Adherence

When playbook data exists:
- Grade rule adherence concretely: "4/5 entry rules followed — you skipped the volume confirmation."
- Flag trades with no setup_type and no playbook link as potential impulse trades.
- When trade data contradicts a playbook rule, cite the exact rule and the specific violation.
- Cross-reference self-assessed process_score with actual rule adherence — gaps in either direction are coaching opportunities.

## Format

- Markdown formatting, bold key data points
- Bullet points for action items
- End substantive analyses with 1-2 pointed questions to keep the trader reflecting`;

/** Build a text summary of the trader's playbook setups for AI context. */
export function buildPlaybookContext(playbooks: Record<string, unknown>[]): string {
  if (!playbooks || playbooks.length === 0) return "";

  const active = playbooks.filter((pb) => pb.is_active !== false);
  if (active.length === 0) return "";

  let ctx = `\n## Trader's Playbook (${active.length} active setup${active.length !== 1 ? "s" : ""})\n`;
  ctx += `These are the trader's self-defined setups with specific entry/exit rules. Use them to evaluate rule adherence on every trade.\n\n`;

  for (const pb of active) {
    const entryRules = Array.isArray(pb.entry_rules) ? pb.entry_rules : [];
    const exitRules = Array.isArray(pb.exit_rules) ? pb.exit_rules : [];
    const tags = Array.isArray(pb.tags) ? pb.tags : [];
    ctx += `### ${pb.name} (ID: ${pb.id})\n`;
    ctx += `Asset class: ${pb.asset_class || "all"}`;
    if (tags.length > 0) ctx += ` | Tags: ${tags.join(", ")}`;
    ctx += "\n";
    if (pb.description) ctx += `${pb.description}\n`;
    if (entryRules.length > 0) {
      ctx += `Entry rules:\n${entryRules.map((r: string, i: number) => `  ${i + 1}. ${r}`).join("\n")}\n`;
    }
    if (exitRules.length > 0) {
      ctx += `Exit rules:\n${exitRules.map((r: string, i: number) => `  ${i + 1}. ${r}`).join("\n")}\n`;
    }
    if (pb.stop_loss_strategy) ctx += `Stop loss: ${pb.stop_loss_strategy}\n`;
    if (pb.risk_per_trade) ctx += `Risk per trade: ${pb.risk_per_trade}\n`;
    const timeframes = Array.isArray(pb.timeframes) ? pb.timeframes : [];
    if (timeframes.length > 0) ctx += `Timeframes: ${timeframes.join(", ")}\n`;
    ctx += "\n";
  }
  return ctx;
}

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
    const playbookRef = t.playbook_name ? ` | Playbook: ${t.playbook_name}` : t.playbook_id ? ` | Playbook ID: ${t.playbook_id}` : "";
    summary += `- ${date} | ${t.symbol} ${t.position}${assetType} | P&L: ${pnl} | Emotion: ${t.emotion || "—"} | Confidence: ${t.confidence ?? "—"}/10 | Process: ${t.process_score ?? "—"}/10 | Setup: ${t.setup_type || "—"}${playbookRef}`;
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

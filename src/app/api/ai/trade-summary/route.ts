import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT = `You are Stargate AI — a trading psychology coach analyzing a single trade.

Provide a concise analysis covering:
1. **What was done well** — process, discipline, execution
2. **What could improve** — missed signals, emotional triggers, timing
3. **Emotional pattern** — how the trader's emotion affected the outcome
4. **Action item** — one specific thing to do differently next time

Be direct and specific. Reference the actual trade data. Keep under 200 words. Use markdown.`;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { trade, apiKey: clientKey } = body;

  const apiKey = process.env.ANTHROPIC_API_KEY || clientKey;
  if (!apiKey) {
    return NextResponse.json(
      { error: "No API key configured. Add one in AI Coach settings." },
      { status: 500 }
    );
  }

  if (!trade) {
    return NextResponse.json({ error: "Trade data is required" }, { status: 400 });
  }

  const pnl = trade.pnl != null ? `$${Number(trade.pnl).toFixed(2)}` : "OPEN";
  const duration = trade.close_timestamp && trade.open_timestamp
    ? `${((new Date(trade.close_timestamp).getTime() - new Date(trade.open_timestamp).getTime()) / 3600000).toFixed(1)}h`
    : "Still open";

  const tradeContext = `## Trade Data
- **Symbol**: ${trade.symbol} (${trade.position})
- **Entry**: $${trade.entry_price} → **Exit**: ${trade.exit_price ? `$${trade.exit_price}` : "OPEN"}
- **P&L**: ${pnl} | **Duration**: ${duration}
- **Quantity**: ${trade.quantity} | **Fees**: $${trade.fees}
- **Emotion at entry**: ${trade.emotion || "Not recorded"}
- **Confidence**: ${trade.confidence ?? "N/A"}/10
- **Setup type**: ${trade.setup_type || "Not recorded"}
- **Process score**: ${trade.process_score ?? "N/A"}/10
- **Pre-trade checklist**: ${trade.checklist ? Object.entries(trade.checklist).map(([k, v]) => `${k}: ${v ? "✓" : "✗"}`).join(", ") : "None"}
- **Post-trade review**: ${trade.review ? Object.entries(trade.review).map(([k, v]) => `${k}: ${v}`).join(" | ") : "None"}
- **Notes**: ${trade.notes || "None"}
- **Tags**: ${trade.tags?.length ? trade.tags.join(", ") : "None"}`;

  const client = new Anthropic({ apiKey });

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: `Analyze this trade:\n\n${tradeContext}` }],
    });

    const text = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("");

    return NextResponse.json({ summary: text });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

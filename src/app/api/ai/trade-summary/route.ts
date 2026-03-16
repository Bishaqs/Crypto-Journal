import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { TradeSummarySchema, DashboardInsightSchema } from "@/lib/schemas/ai";
import { rateLimit } from "@/lib/rate-limit";
import { checkAiDailyLimit } from "@/lib/ai-rate-limit";
import { getProvider, resolveModel } from "@/lib/ai";

export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `You are Nova — a trading psychology coach analyzing a single trade.

Provide a concise analysis covering:
1. **What was done well** — process, discipline, execution
2. **What could improve** — missed signals, emotional triggers, timing
3. **Emotional pattern** — how the trader's emotion affected the outcome
4. **Action item** — one specific thing to do differently next time

Be direct and specific. Reference the actual trade data. Keep under 200 words. Use markdown.`;

const DASHBOARD_INSIGHT_PROMPT = `You are Nova — a trading psychology coach embedded in a dashboard widget.

Given recent trade data and context about what the widget shows, produce a single actionable insight in 1-2 sentences (max 50 words). Be specific — reference symbols, emotions, or patterns from the data. No bullet points, no markdown headers. Just one clear, direct sentence a trader can act on right now.`;

export async function POST(req: NextRequest) {
  // Auth check — only authenticated users can get trade summaries
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: 30 requests per minute per user
  const rl = await rateLimit(`ai-summary:${user.id}`, 30, 60_000);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before trying again." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetMs / 1000)) } }
    );
  }

  // Daily tier-based limit
  const daily = await checkAiDailyLimit(user.id);
  if (!daily.allowed) return daily.response;

  const body = await req.json();

  // Branch: dashboard-insight mode
  if (body.mode === "dashboard-insight") {
    const parsed = DashboardInsightSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues.map((e) => e.message).join(", ");
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    const { context, trades, provider: providerId, model: modelId, apiKey } = parsed.data;

    const provider = getProvider(providerId, apiKey);
    if (!provider.isConfigured(apiKey)) {
      return NextResponse.json(
        { error: "AI service not configured." },
        { status: 500 }
      );
    }

    const model = resolveModel(provider.id, modelId);

    const tradesSummary = trades.map((t) => {
      const pnl = t.pnl != null ? `$${Number(t.pnl).toFixed(2)}` : "OPEN";
      return `${t.symbol ?? "?"} ${t.position ?? "?"} P&L:${pnl} emotion:${t.emotion || "none"}`;
    }).join("\n");

    try {
      const text = await provider.chat({
        system: DASHBOARD_INSIGHT_PROMPT,
        userMessage: `Widget context: ${context}\n\nRecent trades:\n${tradesSummary}`,
        maxTokens: 100,
        model,
        apiKey,
      });

      return NextResponse.json({ summary: text });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
  }

  // Default: single trade summary mode
  const parsed = TradeSummarySchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((e) => e.message).join(", ");
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  const { trade, provider: providerId, model: modelId, apiKey } = parsed.data;

  const provider = getProvider(providerId, apiKey);
  if (!provider.isConfigured(apiKey)) {
    return NextResponse.json(
      { error: "AI service not configured. Add your own API key in Settings → AI Coach." },
      { status: 500 }
    );
  }

  const model = resolveModel(provider.id, modelId);

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

  try {
    const text = await provider.chat({
      system: SYSTEM_PROMPT,
      userMessage: `Analyze this trade:\n\n${tradeContext}`,
      maxTokens: 512,
      model,
      apiKey,
    });

    return NextResponse.json({ summary: text });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

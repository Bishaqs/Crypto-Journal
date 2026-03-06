import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AiChatSchema } from "@/lib/schemas/ai";
import { rateLimit } from "@/lib/rate-limit";
import { checkAiDailyLimit } from "@/lib/ai-rate-limit";
import { AI_CHAT_SYSTEM_PROMPT, buildTradeContext } from "@/lib/ai-context";
import { getProvider, resolveModel } from "@/lib/ai";

export async function POST(req: NextRequest) {
  // Auth check — only authenticated users can use AI Coach
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: 20 requests per minute per user
  const rl = await rateLimit(`ai-chat:${user.id}`, 20, 60_000);
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
  const parsed = AiChatSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((e) => e.message).join(", ");
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  const { message, trades, context, provider: providerId, model: modelId, apiKey } = parsed.data;

  const provider = getProvider(providerId, apiKey);
  if (!provider.isConfigured(apiKey)) {
    return NextResponse.json(
      { error: "AI service not configured. Add your own API key in Settings → AI Coach, or contact the administrator." },
      { status: 500 }
    );
  }

  const model = resolveModel(provider.id, modelId);
  const tradeContext = buildTradeContext(trades, context);

  try {
    const text = await provider.chat({
      system: AI_CHAT_SYSTEM_PROMPT,
      userMessage: `Here is my trading data:\n\n${tradeContext}\n\nMy question: ${message}`,
      maxTokens: 1024,
      model,
      apiKey,
    });

    return NextResponse.json({ response: text });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AiChatSchema } from "@/lib/schemas/ai";
import { rateLimit } from "@/lib/rate-limit";
import { checkAiDailyLimit } from "@/lib/ai-rate-limit";
import { AI_CHAT_SYSTEM_PROMPT, buildTradeContext, extractImagesFromNotes } from "@/lib/ai-context";
import { getProvider, resolveModel } from "@/lib/ai";

export async function POST(req: NextRequest) {
  // Auth check — only authenticated users can use AI Coach streaming
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: 20 requests per minute per user (shared bucket with /api/ai)
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
  const { message, trades, notes, context, provider: providerId, model: modelId, apiKey } = parsed.data;

  const provider = getProvider(providerId, apiKey);
  if (!provider.isConfigured(apiKey)) {
    return NextResponse.json({ error: "AI service not configured. Add your own API key in Settings → AI Coach." }, { status: 500 });
  }

  const model = resolveModel(provider.id, modelId);
  const tradeContext = buildTradeContext(trades, context, notes);
  const imageData = notes.length > 0 ? extractImagesFromNotes(notes) : [];
  const images = imageData.map((i) => i.url);
  const imageContext = imageData.length > 0
    ? `\n\n## Attached Images (${imageData.length})\n${imageData.map((img, i) => `- Image ${i + 1}: from journal entry "${img.noteTitle}" (${img.noteDate})`).join("\n")}\n`
    : "";

  try {
    const chunks = provider.stream({
      system: AI_CHAT_SYSTEM_PROMPT,
      userMessage: `Here is my trading data:\n\n${tradeContext}${imageContext}\n\nMy question: ${message}`,
      maxTokens: 2048,
      model,
      apiKey,
      images,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const text of chunks) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: err instanceof Error ? err.message : "Stream error" })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

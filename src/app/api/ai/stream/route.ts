import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AiChatSchema } from "@/lib/schemas/ai";
import { rateLimit } from "@/lib/rate-limit";
import { checkAiDailyLimit } from "@/lib/ai-rate-limit";
import { AI_CHAT_SYSTEM_PROMPT, buildTradeContext, buildPlaybookContext, extractImagesFromNotes, buildMemoryContext } from "@/lib/ai-context";
import { getProvider, resolveModel } from "@/lib/ai";

export const dynamic = "force-dynamic";

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
  const { message, trades, notes, playbooks, context, history, customInstructions, provider: providerId, model: modelId, apiKey, conversationId } = parsed.data;

  const provider = getProvider(providerId, apiKey);
  if (!provider.isConfigured(apiKey)) {
    return NextResponse.json({ error: "AI service not configured. Add your own API key in Settings → AI Coach." }, { status: 500 });
  }

  const model = resolveModel(provider.id, modelId);

  // Skip expensive context building for follow-up messages (no trades sent)
  const hasTradeData = trades.length > 0;
  const tradeContext = hasTradeData
    ? buildTradeContext(trades, context, notes) + buildPlaybookContext(playbooks)
    : "";
  const imageData = hasTradeData && notes.length > 0 ? extractImagesFromNotes(notes) : [];
  const images = imageData.map((i) => i.url);
  const imageContext = imageData.length > 0
    ? `\n\n## Attached Images (${imageData.length})\n${imageData.map((img, i) => `- Image ${i + 1}: from journal entry "${img.noteTitle}" (${img.noteDate})`).join("\n")}\n`
    : "";

  // Load coach memories for this user
  let memoryContext = "";
  try {
    const { data: memories } = await supabase
      .from("ai_memories")
      .select("id, content, category, created_at")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (memories && memories.length > 0) {
      memoryContext = buildMemoryContext(memories);
    }
  } catch {
    // Non-critical — proceed without memories
  }

  // Load server-side conversation history when conversationId is provided
  let serverHistory: { role: "user" | "assistant"; content: string }[] = [];
  let conversationSummary = "";
  if (conversationId) {
    try {
      // Load conversation metadata for summary
      const { data: conv } = await supabase
        .from("ai_conversations")
        .select("summary, summary_through_index")
        .eq("id", conversationId)
        .eq("user_id", user.id)
        .single();

      if (conv?.summary) {
        conversationSummary = `\n\n## Conversation Summary (earlier messages)\n${conv.summary}`;
      }

      // Load recent messages — last 24 messages (or messages after summary point)
      const startIndex = conv?.summary_through_index != null
        ? Math.max(0, conv.summary_through_index - 2)
        : 0;

      const { data: msgs } = await supabase
        .from("ai_messages")
        .select("role, content, message_index")
        .eq("conversation_id", conversationId)
        .eq("user_id", user.id)
        .gte("message_index", startIndex)
        .order("message_index", { ascending: true })
        .limit(24);

      if (msgs && msgs.length > 0) {
        serverHistory = msgs.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));
      }
    } catch {
      // Non-critical — fall back to client-sent history
    }
  }

  // Use server history if available, otherwise fall back to client-sent history
  const effectiveHistory = serverHistory.length > 0 ? serverHistory : (history || []);

  // Build system prompt with optional custom instructions and memories
  let systemPrompt = AI_CHAT_SYSTEM_PROMPT;
  if (memoryContext) {
    systemPrompt += memoryContext;
  }
  if (conversationSummary) {
    systemPrompt += conversationSummary;
  }
  if (customInstructions) {
    systemPrompt += `\n\n## Trader's Personal Coaching Preferences\nThe trader has provided these instructions for how you should coach them. Follow them:\n${customInstructions}`;
  }

  // Build conversation messages array for multi-turn context
  const contextPrefix = hasTradeData
    ? `Here is my trading data:\n\n${tradeContext}${imageContext}\n\nMy question: `
    : "";

  let chatMessages: { role: "user" | "assistant"; content: string }[] | undefined;
  if (effectiveHistory.length > 0) {
    // Multi-turn: inject trade context into the first user message, pass rest as-is
    chatMessages = [];
    const firstHistoryMsg = effectiveHistory[0];
    if (firstHistoryMsg.role === "user") {
      chatMessages.push({ role: "user", content: `${contextPrefix}${firstHistoryMsg.content}` });
    } else {
      chatMessages.push({ role: "user", content: `${contextPrefix}(context loaded)` });
      chatMessages.push(firstHistoryMsg);
    }
    for (let i = 1; i < effectiveHistory.length; i++) {
      chatMessages.push(effectiveHistory[i]);
    }
    chatMessages.push({ role: "user", content: message });
  }

  try {
    const chunks = provider.stream({
      system: systemPrompt,
      userMessage: `${contextPrefix}${message}`,
      maxTokens: 2048,
      model,
      apiKey,
      images,
      messages: chatMessages,
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

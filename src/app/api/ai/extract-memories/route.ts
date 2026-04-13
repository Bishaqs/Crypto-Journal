import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MemoryExtractSchema } from "@/lib/schemas/ai";
import { getProvider, resolveModel } from "@/lib/ai";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const EXTRACTION_PROMPT = `You are a coaching memory system. Review this trading coach conversation and extract key facts worth remembering about this trader for future coaching sessions.

Focus on:
- Commitments they made ("I will stop revenge trading") → category: "commitment"
- Patterns identified ("struggles with FOMO on altcoins") → category: "pattern"
- Progress milestones ("first week without overtrading") → category: "progress"
- Personal preferences ("prefers morning trading sessions") → category: "preference"
- General facts ("trades mostly crypto, has a day job") → category: "general"

Return a JSON array of objects with "content" and "category" fields.
Return [] if nothing is worth remembering.
Maximum 5 memories per conversation. Be selective — only save genuinely useful coaching context.

IMPORTANT: Return ONLY the JSON array, no markdown fencing, no explanation.`;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Rate limit: 10 requests per minute per user
  const rl = await rateLimit(`ai-extract-memories:${user.id}`, 10, 60_000);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before trying again." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetMs / 1000)) } }
    );
  }

  const body = await req.json();
  const parsed = MemoryExtractSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { conversationId, messages, provider: providerId, model: modelId, apiKey } = parsed.data;

  const provider = getProvider(providerId, apiKey);
  if (!provider.isConfigured(apiKey)) {
    return NextResponse.json({ error: "AI not configured" }, { status: 500 });
  }

  const model = resolveModel(provider.id, modelId);

  // Format conversation for extraction
  const conversationText = messages
    .map((m) => `${m.role === "user" ? "Trader" : "Nova"}: ${m.content}`)
    .join("\n\n");

  try {
    // Use non-streaming call for extraction (short response expected)
    let fullResponse = "";
    const chunks = provider.stream({
      system: EXTRACTION_PROMPT,
      userMessage: conversationText,
      maxTokens: 512,
      model,
      apiKey,
    });
    for await (const text of chunks) {
      fullResponse += text;
    }

    // Parse the JSON response
    const cleaned = fullResponse.trim().replace(/^```json?\n?/, "").replace(/\n?```$/, "");
    const extracted = JSON.parse(cleaned);

    if (!Array.isArray(extracted) || extracted.length === 0) {
      return NextResponse.json({ memories: [] });
    }

    // Validate and save memories (max 5)
    const validCategories = ["general", "pattern", "commitment", "progress", "preference"];
    const validated = extracted
      .filter((m: { content?: string; category?: string }) =>
        m.content && typeof m.content === "string" && m.content.length <= 500 &&
        m.category && validCategories.includes(m.category)
      )
      .slice(0, 5);

    if (validated.length === 0) {
      return NextResponse.json({ memories: [] });
    }

    // Deduplicate against existing memories (word-overlap check)
    const { data: existing } = await supabase
      .from("ai_memories")
      .select("content")
      .eq("user_id", user.id)
      .eq("is_active", true);

    const toSave = validated.filter((m: { content: string }) => {
      const newWords = new Set(m.content.toLowerCase().split(/\s+/));
      return !(existing ?? []).some((e: { content: string }) => {
        const existingWords = new Set(e.content.toLowerCase().split(/\s+/));
        const overlap = [...newWords].filter((w) => existingWords.has(w)).length;
        return overlap / Math.max(newWords.size, existingWords.size) > 0.8;
      });
    });

    if (toSave.length === 0) {
      return NextResponse.json({ memories: [] });
    }

    const { data: saved, error } = await supabase
      .from("ai_memories")
      .insert(
        toSave.map((m: { content: string; category: string }, i: number) => ({
          user_id: user.id,
          content: m.content,
          category: m.category,
          source_conversation_id: conversationId,
          source_message_index: i,
        }))
      )
      .select("id, content, category, created_at");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ memories: saved || [] });
  } catch {
    return NextResponse.json({ memories: [] });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { JournalMemoryExtractSchema } from "@/lib/schemas/ai";
import { getProvider, resolveModel } from "@/lib/ai";

export const dynamic = "force-dynamic";

const EXTRACTION_PROMPT = `You are a coaching memory system. Review this trading journal entry and extract key facts worth remembering about this trader for future coaching sessions.

Focus on:
- Self-identified weaknesses or recurring mistakes → category: "insight"
- Rules or commitments the trader sets for themselves → category: "commitment"
- Emotional patterns they've noticed about themselves → category: "pattern"
- Progress milestones or breakthroughs → category: "progress"
- Trading preferences or habits mentioned → category: "preference"
- General facts about the trader → category: "general"

This is a journal entry, not a conversation. The trader wrote this for themselves.
Extract the coaching-relevant insights they might forget over time.

Return a JSON array of objects with "content" and "category" fields.
Return [] if nothing is worth remembering.
Maximum 3 memories per journal entry. Be selective — only save genuinely useful coaching context.

IMPORTANT: Return ONLY the JSON array, no markdown fencing, no explanation.`;

// Use a cheap model for extraction to minimize cost
const CHEAP_MODELS: Record<string, string> = {
  anthropic: "claude-haiku-4-5-20251001",
  openai: "gpt-4o-mini",
  google: "gemini-2.5-flash",
};

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = JournalMemoryExtractSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { noteId, content, title, tags } = parsed.data;

  // Use server-side provider with cheapest available model
  const provider = getProvider();
  if (!provider.isConfigured()) {
    return NextResponse.json({ error: "AI not configured on server" }, { status: 500 });
  }

  const model = CHEAP_MODELS[provider.id] || resolveModel(provider.id);

  // Build context with metadata
  const parts: string[] = [];
  if (title) parts.push(`Title: ${title}`);
  if (tags?.length) parts.push(`Tags: ${tags.join(", ")}`);
  parts.push(`\nJournal Entry:\n${content}`);
  const entryText = parts.join("\n");

  try {
    let fullResponse = "";
    const chunks = provider.stream({
      system: EXTRACTION_PROMPT,
      userMessage: entryText,
      maxTokens: 512,
      model,
    });
    for await (const text of chunks) {
      fullResponse += text;
    }

    // Parse JSON response
    const cleaned = fullResponse.trim().replace(/^```json?\n?/, "").replace(/\n?```$/, "");
    const extracted = JSON.parse(cleaned);

    if (!Array.isArray(extracted) || extracted.length === 0) {
      return NextResponse.json({ memories: [] });
    }

    // Validate and cap at 3
    const validCategories = ["general", "pattern", "commitment", "progress", "preference", "insight"];
    const validated = extracted
      .filter((m: { content?: string; category?: string }) =>
        m.content && typeof m.content === "string" && m.content.length <= 500 &&
        m.category && validCategories.includes(m.category)
      )
      .slice(0, 3);

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
        toSave.map((m: { content: string; category: string }) => ({
          user_id: user.id,
          content: m.content,
          category: m.category,
          source_type: "journal",
          source_note_id: noteId,
        }))
      )
      .select("id, content, category, created_at");

    if (error) {
      console.error("[extract-journal-memories] DB error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ memories: saved || [] });
  } catch (err) {
    console.error("[extract-journal-memories] Extraction error:", err);
    return NextResponse.json({ memories: [] });
  }
}

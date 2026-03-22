import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getProvider, resolveModel } from "@/lib/ai";

export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Use cheapest model for consolidation
const CHEAP_MODELS: Record<string, string> = {
  anthropic: "claude-haiku-4-5-20251001",
  openai: "gpt-4o-mini",
  google: "gemini-2.5-flash",
};

const CONSOLIDATION_PROMPT = `You are a coaching memory system. Below are memories about a trader, grouped by category. Some may be redundant, overlapping, or could be combined into fewer, richer entries.

Rules:
- If two memories say the same thing differently, combine into one
- If a later memory contradicts an earlier one, keep the later information (it's more current)
- Preserve specific data points (symbols, percentages, dates, numbers)
- Preserve the category of the most important source memory
- Target: reduce the count by 40-60% while preserving all unique information
- Each consolidated memory must be under 500 characters

Return a JSON array of objects with "content" and "category" fields.
IMPORTANT: Return ONLY the JSON array, no markdown fencing, no explanation.`;

const MEMORY_HARD_CAP = 50;
const CONSOLIDATION_THRESHOLD = 15; // Only consolidate users with >15 memories
const STALE_DAYS = 60;
const DECAY_AMOUNT = 0.2;
const DEACTIVATE_THRESHOLD = 0.2;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();
  const deadline = startTime + 8000;

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const results = { usersProcessed: 0, memoriesDecayed: 0, memoriesDeactivated: 0, memoriesConsolidated: 0, errors: 0 };

  // Get users with active memories, ordered by count descending
  const { data: userCounts, error: countError } = await supabase
    .rpc("get_memory_counts_by_user");

  // Fallback: if the RPC doesn't exist, query directly
  let userIds: string[] = [];
  if (countError || !userCounts) {
    const { data: memoryRows } = await supabase
      .from("ai_memories")
      .select("user_id")
      .eq("is_active", true);

    if (memoryRows) {
      const counts: Record<string, number> = {};
      for (const r of memoryRows) {
        counts[r.user_id] = (counts[r.user_id] ?? 0) + 1;
      }
      userIds = Object.entries(counts)
        .filter(([, count]) => count > CONSOLIDATION_THRESHOLD)
        .sort(([, a], [, b]) => b - a)
        .map(([id]) => id);
    }
  } else {
    userIds = (userCounts as { user_id: string; count: number }[])
      .filter((u) => u.count > CONSOLIDATION_THRESHOLD)
      .map((u) => u.user_id);
  }

  // ─── Phase 1: Decay stale memories for ALL users ──────────────────────────
  const staleDate = new Date(Date.now() - STALE_DAYS * 86400000).toISOString();

  // Decay relevance_score for memories not referenced in 60+ days
  const { data: staleMemories } = await supabase
    .from("ai_memories")
    .select("id, relevance_score")
    .eq("is_active", true)
    .lt("last_referenced_at", staleDate);

  if (staleMemories && staleMemories.length > 0 && Date.now() < deadline) {
    for (const m of staleMemories) {
      const newScore = Math.max(0, (m.relevance_score ?? 1) - DECAY_AMOUNT);
      if (newScore < DEACTIVATE_THRESHOLD) {
        // Deactivate very stale memories
        await supabase
          .from("ai_memories")
          .update({ is_active: false, relevance_score: newScore })
          .eq("id", m.id);
        results.memoriesDeactivated++;
      } else {
        await supabase
          .from("ai_memories")
          .update({ relevance_score: newScore })
          .eq("id", m.id);
        results.memoriesDecayed++;
      }
      if (Date.now() > deadline) break;
    }
  }

  if (Date.now() > deadline || userIds.length === 0) {
    return NextResponse.json({ ok: true, ...results, durationMs: Date.now() - startTime });
  }

  // ─── Phase 2: LLM consolidation for users with many memories ──────────────
  const provider = getProvider();
  if (!provider.isConfigured()) {
    return NextResponse.json({ ok: true, ...results, skippedConsolidation: "no AI provider", durationMs: Date.now() - startTime });
  }

  const model = CHEAP_MODELS[provider.id] || resolveModel(provider.id);

  // Process at most 3 users per run to stay within deadline
  for (const userId of userIds.slice(0, 3)) {
    if (Date.now() > deadline) break;

    try {
      const { data: memories } = await supabase
        .from("ai_memories")
        .select("id, content, category, created_at, last_referenced_at, relevance_score")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (!memories || memories.length <= CONSOLIDATION_THRESHOLD) continue;

      // Group by category for targeted consolidation
      const byCategory: Record<string, typeof memories> = {};
      for (const m of memories) {
        if (!byCategory[m.category]) byCategory[m.category] = [];
        byCategory[m.category].push(m);
      }

      // Only consolidate categories with 4+ memories
      for (const [category, group] of Object.entries(byCategory)) {
        if (group.length < 4 || Date.now() > deadline) continue;

        const memoryText = group
          .map((m, i) => `${i + 1}. [${m.category}] ${m.content}`)
          .join("\n");

        let fullResponse = "";
        const chunks = provider.stream({
          system: CONSOLIDATION_PROMPT,
          userMessage: `Category: ${category}\n\nMemories to consolidate:\n${memoryText}`,
          maxTokens: 1024,
          model,
        });
        for await (const text of chunks) {
          fullResponse += text;
        }

        const cleaned = fullResponse.trim().replace(/^```json?\n?/, "").replace(/\n?```$/, "");
        let consolidated;
        try {
          consolidated = JSON.parse(cleaned);
        } catch {
          results.errors++;
          continue;
        }

        if (!Array.isArray(consolidated) || consolidated.length === 0) continue;
        // Only proceed if we actually reduced the count
        if (consolidated.length >= group.length) continue;

        const validCategories = ["general", "pattern", "commitment", "progress", "preference", "insight", "snapshot"];
        const valid = consolidated
          .filter((m: { content?: string; category?: string }) =>
            m.content && typeof m.content === "string" && m.content.length <= 500 &&
            m.category && validCategories.includes(m.category),
          )
          .slice(0, 10);

        if (valid.length === 0) continue;

        // Soft-delete originals
        const originalIds = group.map((m) => m.id);
        await supabase
          .from("ai_memories")
          .update({ is_active: false })
          .in("id", originalIds);

        // Insert consolidated memories
        await supabase
          .from("ai_memories")
          .insert(
            valid.map((m: { content: string; category: string }) => ({
              user_id: userId,
              content: m.content,
              category: m.category,
              source_type: "manual" as const, // consolidated memories are system-generated
              is_active: true,
            })),
          );

        results.memoriesConsolidated += group.length - valid.length;
      }

      // ─── Hard cap: if still over 50, deactivate oldest low-relevance ones ──
      const { data: remaining } = await supabase
        .from("ai_memories")
        .select("id, relevance_score")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("relevance_score", { ascending: true })
        .order("created_at", { ascending: true });

      if (remaining && remaining.length > MEMORY_HARD_CAP) {
        const toDeactivate = remaining.slice(0, remaining.length - MEMORY_HARD_CAP);
        const ids = toDeactivate.map((m) => m.id);
        await supabase
          .from("ai_memories")
          .update({ is_active: false })
          .in("id", ids);
        results.memoriesDeactivated += ids.length;
      }

      results.usersProcessed++;
    } catch {
      results.errors++;
    }
  }

  return NextResponse.json({ ok: true, ...results, durationMs: Date.now() - startTime });
}

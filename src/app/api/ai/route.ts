import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AiChatSchema } from "@/lib/schemas/ai";
import { rateLimit } from "@/lib/rate-limit";
import { checkAiDailyLimit } from "@/lib/ai-rate-limit";
import { AI_CHAT_SYSTEM_PROMPT, buildTradeContext, buildPlaybookContext, extractImagesFromNotes, buildBehavioralContext, buildExpertPsychologyContext, buildCorrelationContext, buildEducationContext } from "@/lib/ai-context";
import { getProvider, resolveModel } from "@/lib/ai";
import { calculateAllCorrelations } from "@/lib/psychology-correlations";
import { buildSummaryContext } from "@/lib/trading-summaries";

export const dynamic = "force-dynamic";

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
  const { message, trades, notes, playbooks, context, history, customInstructions, provider: providerId, model: modelId, apiKey } = parsed.data;

  const provider = getProvider(providerId, apiKey);
  if (!provider.isConfigured(apiKey)) {
    return NextResponse.json(
      { error: "AI service not configured. Add your own API key in Settings → AI Coach, or contact the administrator." },
      { status: 500 }
    );
  }

  const model = resolveModel(provider.id, modelId);
  const tradeContext = buildTradeContext(trades, context, notes) + buildPlaybookContext(playbooks);
  const imageData = notes.length > 0 ? extractImagesFromNotes(notes) : [];
  const images = imageData.map((i) => i.url);
  const imageContext = imageData.length > 0
    ? `\n\n## Attached Images (${imageData.length})\n${imageData.map((img, i) => `- Image ${i + 1}: from journal entry "${img.noteTitle}" (${img.noteDate})`).join("\n")}\n`
    : "";

  // Load psychology context server-side
  let psychologyContext = "";
  try {
    const [
      { data: behavioralLogs },
      { data: checkins },
      { data: profileRows },
      { data: sessionLogs },
      { data: userPrefs },
      { data: educationProgress },
    ] = await Promise.all([
      supabase.from("behavioral_logs").select("emotion, intensity, trigger, physical_state, biases, traffic_light, note, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
      supabase.from("daily_checkins").select("date, mood, energy, traffic_light").eq("user_id", user.id).order("date", { ascending: false }).limit(14),
      supabase.from("psychology_profiles").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1),
      supabase.from("expert_session_logs").select("session_date, somatic_areas, somatic_intensity, flow_state, cognitive_distortions, defense_mechanisms, internal_dialogue").eq("user_id", user.id).order("session_date", { ascending: false }).limit(20),
      supabase.from("user_preferences").select("psychology_tier").eq("user_id", user.id).limit(1),
      supabase.from("education_progress").select("course_slug, lesson_slug, completed_at").eq("user_id", user.id),
    ]);

    const tier = userPrefs?.[0]?.psychology_tier || "simple";
    const profile = profileRows?.[0] || null;

    if (behavioralLogs && behavioralLogs.length > 0) {
      psychologyContext += buildBehavioralContext(behavioralLogs, checkins || []);
    }
    if (profile || (sessionLogs && sessionLogs.length > 0)) {
      psychologyContext += "\n" + buildExpertPsychologyContext(
        profile,
        (sessionLogs || []).map((s) => ({
          ...s,
          somatic_areas: s.somatic_areas || [],
          cognitive_distortions: s.cognitive_distortions || [],
          defense_mechanisms: s.defense_mechanisms || [],
        })),
        tier,
      );
    }
    if (trades.length > 0) {
      const correlations = calculateAllCorrelations(trades as any[]);
      psychologyContext += "\n" + buildCorrelationContext(correlations);
    }
    if (educationProgress && educationProgress.length > 0) {
      psychologyContext += buildEducationContext(educationProgress);
    }
  } catch {
    // Non-critical
  }

  let systemPrompt = AI_CHAT_SYSTEM_PROMPT;
  if (psychologyContext) {
    systemPrompt += psychologyContext;
  }
  // Load hierarchical trading summaries
  try {
    const { data: summaries } = await supabase
      .from("trading_summaries")
      .select("period_type, period_start, stats, narrative")
      .eq("user_id", user.id)
      .order("period_start", { ascending: false })
      .limit(50);

    if (summaries && summaries.length > 0) {
      const summaryCtx = buildSummaryContext(summaries as { period_type: string; period_start: string; stats: any; narrative: string | null }[]);
      if (summaryCtx) {
        systemPrompt += summaryCtx;
      }
    }
  } catch {
    // Non-critical
  }
  if (customInstructions) {
    systemPrompt += `\n\n## Trader's Personal Coaching Preferences\nThe trader has provided these instructions for how you should coach them. Follow them:\n${customInstructions}`;
  }

  const contextPrefix = `Here is my trading data:\n\n${tradeContext}${imageContext}\n\nMy question: `;

  let chatMessages: { role: "user" | "assistant"; content: string }[] | undefined;
  if (history && history.length > 0) {
    chatMessages = [];
    const firstHistoryMsg = history[0];
    if (firstHistoryMsg.role === "user") {
      chatMessages.push({ role: "user", content: `${contextPrefix}${firstHistoryMsg.content}` });
    } else {
      chatMessages.push({ role: "user", content: `${contextPrefix}(context loaded)` });
      chatMessages.push(firstHistoryMsg);
    }
    for (let i = 1; i < history.length; i++) {
      chatMessages.push(history[i]);
    }
    chatMessages.push({ role: "user", content: message });
  }

  try {
    const text = await provider.chat({
      system: systemPrompt,
      userMessage: `${contextPrefix}${message}`,
      maxTokens: 2048,
      model,
      apiKey,
      images,
      messages: chatMessages,
    });

    return NextResponse.json({ response: text });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

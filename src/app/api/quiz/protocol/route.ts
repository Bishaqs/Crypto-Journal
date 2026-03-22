import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import Anthropic from "@anthropic-ai/sdk";
import { ARCHETYPES, type TradingArchetype } from "@/lib/psychology-scoring";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  const token = req.nextUrl.searchParams.get("token");

  if (!id || !token) {
    return NextResponse.json({ error: "Missing id or token" }, { status: 400 });
  }

  // Rate limit by IP
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = await rateLimit(`quiz-protocol:${ip}`, 5, 3_600_000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const supabase = createAdminClient();

  // Fetch quiz result and verify token
  const { data: result, error } = await supabase
    .from("quiz_results")
    .select("id, archetype, scores, protocol, protocol_generated_at, unsubscribe_token")
    .eq("id", id)
    .single();

  if (error || !result) {
    return NextResponse.json({ error: "Quiz result not found" }, { status: 404 });
  }

  if (result.unsubscribe_token !== token) {
    return NextResponse.json({ error: "Invalid token" }, { status: 403 });
  }

  // Return cached protocol if it exists
  if (result.protocol) {
    return NextResponse.json({ protocol: result.protocol });
  }

  const archetype = result.archetype as TradingArchetype;
  const archetypeInfo = ARCHETYPES[archetype];

  // Generate protocol via Claude
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      error: "ai_not_ready",
      archetype,
      archetypeInfo,
    }, { status: 503 });
  }
  const scores = result.scores as Record<string, unknown>;

  if (!archetypeInfo) {
    return NextResponse.json({ error: "Unknown archetype" }, { status: 500 });
  }

  try {
    const client = new Anthropic({ apiKey });

    const systemPrompt = `You are Nova, a trading psychology coach. Generate a personalized 3-slide psychology protocol for a trader.

Respond ONLY with valid JSON — no markdown, no backticks, no explanation.

The JSON must follow this exact structure:
{
  "slides": [
    {
      "title": "Your Pattern: [Archetype Name]",
      "subtitle": "[One-line summary of their pattern]",
      "content": "[2-3 paragraphs explaining their psychology pattern in depth — be specific, reference their scores]",
      "highlights": ["[key insight 1]", "[key insight 2]", "[key insight 3]"]
    },
    {
      "title": "Your Hidden Costs",
      "subtitle": "[What these patterns cost them in trading]",
      "content": "[2-3 paragraphs about how their specific blind spots manifest in real trading scenarios — use concrete examples]",
      "highlights": ["[concrete cost 1]", "[concrete cost 2]", "[concrete cost 3]"]
    },
    {
      "title": "Your Protocol",
      "subtitle": "[Personalized action plan]",
      "content": "[Brief introduction to their personalized protocol]",
      "techniques": [
        { "name": "[Technique name]", "description": "[Detailed how-to in 2-3 sentences]", "frequency": "[Daily/Weekly/Per trade]" },
        { "name": "[Technique name]", "description": "[Detailed how-to in 2-3 sentences]", "frequency": "[Daily/Weekly/Per trade]" },
        { "name": "[Technique name]", "description": "[Detailed how-to in 2-3 sentences]", "frequency": "[Daily/Weekly/Per trade]" }
      ]
    }
  ],
  "tradingCard": {
    "tagline": "[A punchy 5-8 word tagline for this archetype]",
    "topStrength": "[Their #1 strength in 5-10 words]",
    "topBlindSpot": "[Their #1 blind spot in 5-10 words]"
  }
}`;

    const userPrompt = `Generate a protocol for this trader:

Archetype: ${archetypeInfo.name}
Description: ${archetypeInfo.description}

Strengths:
${archetypeInfo.strengths.map((s) => `- ${s}`).join("\n")}

Blind Spots:
${archetypeInfo.blindSpots.map((s) => `- ${s}`).join("\n")}

Recommendation: ${archetypeInfo.recommendation}

Computed Scores:
- Risk personality: ${scores.riskPersonality ?? "unknown"}
- Decision style: ${scores.decisionStyle ?? "unknown"}
- Money scripts: ${JSON.stringify(scores.moneyScripts ?? {})}
- FOMO/Revenge score: ${scores.fomoRevengeScore ?? "unknown"}/5
- Emotional regulation: ${scores.emotionalRegulation ?? "unknown"}
- Loss aversion: ${scores.lossAversion ?? "unknown"}
- Bias awareness: ${scores.biasAwareness ?? "unknown"}/5
- Stress response: ${scores.stressResponse ?? "unknown"}
- Discipline score: ${scores.disciplineScore ?? "unknown"}/5

Make the protocol deeply personal and specific to their score profile. Reference concrete trading scenarios they would recognize.`;

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    let protocol;
    try {
      protocol = JSON.parse(text);
    } catch {
      console.error("[quiz/protocol] Failed to parse AI response:", text.slice(0, 200));
      return NextResponse.json({ error: "Failed to generate protocol" }, { status: 500 });
    }

    // Cache in DB
    await supabase
      .from("quiz_results")
      .update({
        protocol,
        protocol_generated_at: new Date().toISOString(),
      })
      .eq("id", id);

    return NextResponse.json({ protocol });
  } catch (err) {
    console.error("[quiz/protocol] AI generation failed:", err);
    return NextResponse.json({
      error: "ai_not_ready",
      archetype,
      archetypeInfo,
    }, { status: 503 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { checkAiDailyLimit } from "@/lib/ai-rate-limit";
import { getProvider, resolveModel } from "@/lib/ai";
import { z } from "zod";

export const dynamic = "force-dynamic";

const RequestSchema = z.object({
  transcript: z.string().min(1, "Transcript is required").max(10000),
  provider: z.string().optional(),
  model: z.string().optional(),
  apiKey: z.string().max(256).optional(),
  templateId: z.string().max(100).optional(),
  templateFields: z.array(z.object({
    key: z.string(),
    label: z.string(),
    type: z.string(),
  })).optional(),
  customTemplateName: z.string().max(200).optional(),
});

const BASE_SYSTEM_PROMPT = `You are a trading journal assistant. A trader has spoken or typed a journal entry as natural speech. Your job is to structure it into a well-organized journal entry.

Return ONLY valid JSON with this exact structure:
{
  "title": "Short descriptive title (under 60 chars)",
  "content": "HTML formatted journal entry with <h2> sections, <p> paragraphs, <ul>/<li> lists as appropriate",
  "template": "trade-review" | "daily-review" | "morning-plan" | "weekly-recap" | "monthly-recap" | "mistake" | "free",
  "emotion": "Calm" | "Anxious" | "Excited" | "Frustrated" | "FOMO" | "Revenge" | "Bored" | "Confident" | "Greedy" | "Fearful" | "Disciplined" | "Relieved" | "Hopeful" | "Impatient" | "Regretful" | "Overconfident" | "Confused" | "Indifferent" | null,
  "tags": ["relevant", "tags"],
  "confidence": 1-10 or null
}

Rules:
- Pick "template" based on what the trader is describing (a specific trade = "trade-review", planning the day = "morning-plan", reviewing the day = "daily-review", analyzing a mistake = "mistake", general thoughts = "free")
- Extract emotion from what they describe feeling. If no emotion mentioned, set to null
- Extract confidence level if they mention how confident they were (1-10 scale). If not mentioned, set to null
- Tags should include: asset symbols (BTC, ETH, SPY), trade direction (long, short), timeframe, strategy names, and other relevant keywords
- Format the content HTML with clear sections using <h2> headers. Organize their thoughts logically even if they spoke in a scattered way
- Keep the trader's voice and perspective — don't add information they didn't provide
- If the transcript is very short or unclear, still do your best to structure it`;

function buildSystemPrompt(
  templateId?: string,
  templateFields?: { key: string; label: string; type: string }[],
  customTemplateName?: string,
): string {
  if (!templateId) return BASE_SYSTEM_PROMPT;

  // Template with structured fields
  if (templateFields && templateFields.length > 0) {
    const fieldList = templateFields
      .map((f) => `- ${f.key} (${f.type}): ${f.label}`)
      .join("\n");

    return `${BASE_SYSTEM_PROMPT}

IMPORTANT: The trader selected the "${templateId}" template before recording. Use "${templateId}" as the "template" value — do not guess.

Map the transcript to these template fields and include a "structured_data" object in your JSON response:

Template fields:
${fieldList}

The "structured_data" object should map each field key to the extracted value from the transcript:
- For textarea/text fields: use the relevant transcript segment as a string
- For number fields: extract the number, or null if not mentioned
- For emotion fields: use one of the valid emotion values listed above, or null
- For checklist fields: return a JSON string of an object mapping each checklist item to true/false based on what the trader mentioned
- For confidence/process-score fields: extract the number (1-10), or null
- For setup-type fields: extract the setup type mentioned, or null
- If a field's value isn't mentioned in the transcript, set it to null

Example structured_data: { "went_well": "I stuck to my stop loss and didn't add to a losing position", "went_wrong": "I entered too early before confirmation", "lessons": "Wait for the candle close before entering" }`;
  }

  // Custom template (no structured fields)
  if (customTemplateName) {
    return `${BASE_SYSTEM_PROMPT}

IMPORTANT: The trader selected their custom template "${customTemplateName}". Structure the transcript as HTML content appropriate for this template. Use "free" as the "template" value since this is a custom template.`;
  }

  // Known template ID but no fields provided — just use the template
  return `${BASE_SYSTEM_PROMPT}

IMPORTANT: The trader selected the "${templateId}" template. Use "${templateId}" as the "template" value — do not guess.`;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`ai-chat:${user.id}`, 20, 60_000);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before trying again." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetMs / 1000)) } }
    );
  }

  const daily = await checkAiDailyLimit(user.id);
  if (!daily.allowed) return daily.response;

  const body = await req.json();
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((e) => e.message).join(", ");
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { transcript, provider: providerId, model: modelId, apiKey, templateId, templateFields, customTemplateName } = parsed.data;

  const provider = getProvider(providerId, apiKey);
  if (!provider.isConfigured(apiKey)) {
    return NextResponse.json(
      { error: "AI service not configured. Add your API key in Settings, or contact the administrator." },
      { status: 500 }
    );
  }

  const model = resolveModel(provider.id, modelId);
  const systemPrompt = buildSystemPrompt(templateId, templateFields, customTemplateName);

  try {
    const text = await provider.chat({
      system: systemPrompt,
      userMessage: `Here is my voice journal entry transcript:\n\n"${transcript}"`,
      maxTokens: 2048,
      model,
      apiKey,
    });

    // Parse the JSON from the AI response
    // The response might be wrapped in ```json ... ``` code blocks
    const jsonStr = text.replace(/^```json?\s*/i, "").replace(/\s*```$/i, "").trim();
    const result = JSON.parse(jsonStr);

    // Validate required fields
    if (!result.title || !result.content || !result.template) {
      return NextResponse.json(
        { error: "AI returned incomplete response. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      title: String(result.title).slice(0, 200),
      content: String(result.content),
      template: String(result.template),
      emotion: result.emotion ?? null,
      tags: Array.isArray(result.tags) ? result.tags.map(String) : [],
      confidence: typeof result.confidence === "number" ? Math.min(10, Math.max(1, result.confidence)) : null,
      structured_data: typeof result.structured_data === "object" && result.structured_data !== null
        ? result.structured_data
        : null,
    });
  } catch (err) {
    if (err instanceof SyntaxError) {
      return NextResponse.json(
        { error: "AI returned invalid JSON. Please try again." },
        { status: 500 }
      );
    }
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

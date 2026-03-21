import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { checkAiDailyLimit } from "@/lib/ai-rate-limit";
import { getProvider, resolveModel } from "@/lib/ai";
import { z } from "zod";

export const dynamic = "force-dynamic";

const TemplateFieldSchema = z.object({
  key: z.string(),
  label: z.string(),
  type: z.string(),
  items: z.array(z.string()).optional(),
});

const RequestSchema = z.object({
  transcript: z.string().min(1, "Transcript is required").max(10000),
  provider: z.string().optional(),
  model: z.string().optional(),
  apiKey: z.string().max(256).optional(),
  templateId: z.string().max(100).optional(),
  templateFields: z.array(TemplateFieldSchema).optional(),
  customTemplateName: z.string().max(200).optional(),
  images: z.array(z.string()).max(4).optional(),
});

type TemplateField = z.infer<typeof TemplateFieldSchema>;

const BASE_SYSTEM_PROMPT = `You are a trading journal assistant. A trader has spoken a journal entry as natural speech. Your job is to transform it into a clean, natural-sounding written journal entry.

Return ONLY valid JSON with this exact structure:
{
  "title": "Specific, actionable title (under 60 chars). Use the asset name, direction, or key theme. Examples: 'BTC Long — Descending Wedge Breakout', 'Morning Plan — March 18', 'Daily Review: 3 Wins, 1 Mistake'",
  "content": "Clean, natural HTML journal entry (see Content Formatting rules below)",
  "template": "trade-entry" | "trade-review" | "daily-review" | "morning-plan" | "weekly-recap" | "monthly-recap" | "mistake" | "free",
  "emotion": "Calm" | "Anxious" | "Excited" | "Frustrated" | "FOMO" | "Revenge" | "Bored" | "Confident" | "Greedy" | "Fearful" | "Disciplined" | "Relieved" | "Hopeful" | "Impatient" | "Regretful" | "Overconfident" | "Confused" | "Indifferent" | null,
  "tags": ["relevant", "tags"],
  "confidence": 1-10 or null
}

Rules:
- Pick "template" based on what the trader is describing (entering a trade = "trade-entry", reviewing a trade = "trade-review", planning the day = "morning-plan", reviewing the day = "daily-review", analyzing a mistake = "mistake", general thoughts = "free")
- Extract emotion from what they describe feeling. If no emotion mentioned, set to null
- Extract confidence level if they mention how confident they were (1-10 scale). If not mentioned, set to null
- Tags should include: asset/ticker symbols mentioned (fix obvious speech-recognition errors like "BGC"→"BTC", "ETF"→"ETH"), trade direction (long, short), timeframe, strategy names, and other relevant keywords
- If the transcript is very short or unclear, still do your best to structure it

Content Formatting:
- This is a TRANSCRIPT of speech, not written text. Convert it into what the trader would have WRITTEN in their journal — not a cleaned-up transcription
- Remove all filler words (um, uh, like, you know, so yeah, I mean, basically, right), false starts, repetitions, and self-corrections
- Condense verbose or rambling sections to their essence. If they said the same thing 3 ways, keep the clearest version
- Preserve all specific details exactly: numbers, prices, percentages, asset names, dates, strategy names, and concrete plans
- Fix obvious speech-recognition errors on ticker symbols (e.g., "BGC"→"BTC", "ETF"→"ETH"). Speech-to-text often mishears tickers — use the most likely real ticker. Only keep an unusual symbol if the trader explicitly names it (e.g., "a coin called XYZ")
- If chart screenshots are attached, reference what you observe (trend, pattern, levels, indicators) in the content where relevant. Do not hallucinate details not visible in the chart
- Keep the trader's first-person voice and perspective — don't make it sound corporate or robotic, and never add information they didn't provide
- Scale formatting to length:
  - Short entries (1-3 sentences): use only <p> tags, no headers
  - Medium entries (1-3 paragraphs): use <p> tags, optionally one <h2> if there's a clear topic shift
  - Long entries (4+ distinct topics): use <h2> headers to separate sections, <p> for paragraphs, <ul>/<li> for lists of items`;

function buildFieldDescription(field: TemplateField): string {
  switch (field.type) {
    case "emotion":
      return `one of the valid emotion values listed above, or null if not mentioned`;
    case "confidence":
      return `number 1-10 based on how confident they sound, or null`;
    case "process-score":
      return `number 1-10 rating their process adherence, or null`;
    case "setup-type":
      return `the trading setup type they mentioned (e.g., "breakout", "pullback", "reversal"), or null`;
    case "checklist":
      if (field.items?.length) {
        const items = field.items.map((item) => `"${item}": true/false`).join(", ");
        return `JSON string: "{${items}}" — set true for items the trader mentioned or implied, false otherwise`;
      }
      return `JSON string mapping checklist items to true/false`;
    case "number":
      return `extract the number they mentioned for "${field.label}", or null`;
    case "text":
      return `extract what they said about "${field.label}", or null`;
    case "textarea":
    default:
      return `extract what they said about "${field.label}" — keep their words, even if brief`;
  }
}

function buildSystemPrompt(
  templateId?: string,
  templateFields?: TemplateField[],
  customTemplateName?: string,
): string {
  if (!templateId) return BASE_SYSTEM_PROMPT;

  // Template with structured fields — build an explicit JSON example
  if (templateFields && templateFields.length > 0) {
    const structuredExample = templateFields
      .map((f) => `    "${f.key}": "${buildFieldDescription(f)}"`)
      .join(",\n");

    return `${BASE_SYSTEM_PROMPT}

IMPORTANT: The trader selected the "${templateId}" template. Use "${templateId}" as the "template" value — do NOT guess a different template.

You MUST include a "structured_data" object in your JSON response with these EXACT key names.
Do NOT rename, camelCase, or abbreviate the keys. Use them EXACTLY as shown:

"structured_data": {
${structuredExample}
}

Rules for structured_data:
- EVERY key listed above MUST appear in structured_data, even if the value is null
- For text/textarea fields: extract the relevant portion of what they said, keeping their own words. Even if they only briefly mentioned something, extract it — do NOT leave it null unless they truly said nothing about it
- For checklist fields: return a JSON STRING (not a nested object). Example: "{\\"item1\\": true, \\"item2\\": false}"
- For emotion fields: use one of the valid emotion values listed above
- For number fields (confidence, process-score): extract as a number, or null if not mentioned
- The "content" field should STILL contain the full HTML-formatted journal entry as before`;
  }

  // Custom template (no structured fields)
  if (customTemplateName) {
    return `${BASE_SYSTEM_PROMPT}

IMPORTANT: The trader selected their custom template "${customTemplateName}". Structure the transcript as HTML content appropriate for this template. Use "free" as the "template" value since this is a custom template.`;
  }

  // Known template ID but no fields provided
  return `${BASE_SYSTEM_PROMPT}

IMPORTANT: The trader selected the "${templateId}" template. Use "${templateId}" as the "template" value — do not guess.`;
}

/**
 * Normalize AI-returned structured_data keys to match the expected template field keys.
 * Handles common AI mistakes: camelCase, hyphens, missing underscores, different casing.
 */
function normalizeStructuredData(
  raw: Record<string, unknown>,
  expectedFields: TemplateField[],
): Record<string, string | number | null> {
  const result: Record<string, string | number | null> = {};

  // Build a lookup map: various normalized forms → expected key
  const keyMap = new Map<string, string>();
  for (const field of expectedFields) {
    const key = field.key;
    keyMap.set(key, key);                                                  // exact
    keyMap.set(key.toLowerCase(), key);                                    // lowercase
    keyMap.set(key.replace(/_/g, ""), key);                                // strip underscores
    keyMap.set(key.replace(/_/g, "-"), key);                               // underscores→hyphens
    keyMap.set(key.replace(/_/g, " "), key);                               // underscores→spaces
    const camel = key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
    keyMap.set(camel, key);                                                // camelCase
    keyMap.set(camel.toLowerCase(), key);                                  // camelcase lowercase
    // Also map the label (lowercased, stripped) for resilience
    const labelKey = field.label.toLowerCase().replace(/[^a-z0-9]/g, "");
    keyMap.set(labelKey, key);
  }

  for (const [rawKey, rawValue] of Object.entries(raw)) {
    const matchKey = keyMap.get(rawKey)
      ?? keyMap.get(rawKey.toLowerCase())
      ?? keyMap.get(rawKey.replace(/[-_ ]/g, "").toLowerCase());

    if (matchKey && rawValue !== undefined) {
      if (typeof rawValue === "string" || typeof rawValue === "number") {
        result[matchKey] = rawValue;
      } else if (rawValue === null) {
        result[matchKey] = null;
      } else {
        // Objects/arrays → JSON string (for checklists, etc.)
        result[matchKey] = JSON.stringify(rawValue);
      }
    }
  }

  return result;
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

  const { transcript, provider: providerId, model: modelId, apiKey, templateId, templateFields, customTemplateName, images } = parsed.data;

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
      userMessage: `Here is a raw voice transcript from a trader. Transform it into a clean journal entry:\n\n"${transcript}"`,
      maxTokens: 2048,
      model,
      apiKey,
      ...(images?.length && { images }),
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

    // Normalize structured_data keys to match expected template field keys
    let structuredData: Record<string, string | number | null> | null = null;
    if (typeof result.structured_data === "object" && result.structured_data !== null && templateFields?.length) {
      structuredData = normalizeStructuredData(result.structured_data, templateFields);
    } else if (typeof result.structured_data === "object" && result.structured_data !== null) {
      structuredData = result.structured_data;
    }

    return NextResponse.json({
      title: String(result.title).slice(0, 200),
      content: String(result.content),
      template: String(result.template),
      emotion: result.emotion ?? null,
      tags: Array.isArray(result.tags) ? result.tags.map(String) : [],
      confidence: typeof result.confidence === "number" ? Math.round(Math.min(10, Math.max(1, result.confidence))) : null,
      structured_data: structuredData,
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

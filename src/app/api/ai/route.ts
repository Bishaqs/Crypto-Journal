import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { AiChatSchema } from "@/lib/schemas/ai";
import { rateLimit } from "@/lib/rate-limit";
import { AI_CHAT_SYSTEM_PROMPT, buildTradeContext } from "@/lib/ai-context";

export async function POST(req: NextRequest) {
  // Auth check — only authenticated users can use AI Coach
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: 20 requests per minute per user
  const rl = rateLimit(`ai-chat:${user.id}`, 20, 60_000);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before trying again." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetMs / 1000)) } }
    );
  }

  const body = await req.json();
  const parsed = AiChatSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((e) => e.message).join(", ");
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  const { message, trades, context } = parsed.data;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI service not configured. Contact the administrator." },
      { status: 500 }
    );
  }

  const tradeContext = buildTradeContext(trades, context);
  const client = new Anthropic({ apiKey });

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1024,
      system: AI_CHAT_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Here is my trading data:\n\n${tradeContext}\n\nMy question: ${message}`,
        },
      ],
    });

    const text = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("");

    return NextResponse.json({ response: text });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

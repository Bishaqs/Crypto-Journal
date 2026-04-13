import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ConversationCreateSchema } from "@/lib/schemas/ai";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// GET /api/ai/conversations — list user's conversations
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 50);
  const offset = parseInt(url.searchParams.get("offset") || "0");

  const { data, error } = await supabase
    .from("ai_conversations")
    .select("id, title, model, message_count, created_at, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ conversations: data || [] });
}

// POST /api/ai/conversations — create a new conversation
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Rate limit: 20 requests per minute per user
  const rl = await rateLimit(`ai-conversations:${user.id}`, 20, 60_000);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before trying again." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetMs / 1000)) } }
    );
  }

  const body = await req.json().catch(() => ({}));
  const parsed = ConversationCreateSchema.safeParse(body);
  const title = parsed.success && parsed.data.title ? parsed.data.title : "New Chat";
  const lessonCourseSlug = parsed.success ? parsed.data.lessonCourseSlug : undefined;
  const lessonSlug = parsed.success ? parsed.data.lessonSlug : undefined;

  const insertPayload: Record<string, unknown> = { user_id: user.id, title };
  if (lessonCourseSlug && lessonSlug) {
    insertPayload.lesson_course_slug = lessonCourseSlug;
    insertPayload.lesson_slug = lessonSlug;
  }

  const { data, error } = await supabase
    .from("ai_conversations")
    .insert(insertPayload)
    .select("id, title, model, message_count, created_at, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ conversation: data }, { status: 201 });
}

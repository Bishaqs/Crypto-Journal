import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/ai/conversations/lesson?courseSlug=X&lessonSlug=Y
 * Returns the existing lesson conversation for this user, or null.
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const courseSlug = url.searchParams.get("courseSlug");
  const lessonSlug = url.searchParams.get("lessonSlug");

  if (!courseSlug || !lessonSlug) {
    return NextResponse.json({ error: "courseSlug and lessonSlug required" }, { status: 400 });
  }

  // Find conversation
  const { data: conversation } = await supabase
    .from("ai_conversations")
    .select("id, title, message_count, created_at, updated_at")
    .eq("user_id", user.id)
    .eq("lesson_course_slug", courseSlug)
    .eq("lesson_slug", lessonSlug)
    .maybeSingle();

  if (!conversation) {
    return NextResponse.json({ conversation: null, messages: [] });
  }

  // Load messages
  const { data: messages } = await supabase
    .from("ai_messages")
    .select("role, content, message_index, created_at")
    .eq("conversation_id", conversation.id)
    .eq("user_id", user.id)
    .order("message_index", { ascending: true })
    .limit(100);

  return NextResponse.json({
    conversation,
    messages: messages || [],
  });
}

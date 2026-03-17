import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MessageSaveSchema } from "@/lib/schemas/ai";

export const dynamic = "force-dynamic";

// POST /api/ai/conversations/[id]/messages — save a user+assistant message pair
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: conversationId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = MessageSaveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  // Verify conversation belongs to user and get current message_count
  const { data: conversation, error: convError } = await supabase
    .from("ai_conversations")
    .select("id, message_count")
    .eq("id", conversationId)
    .eq("user_id", user.id)
    .single();

  if (convError || !conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const baseIndex = conversation.message_count;

  // Insert both messages in one batch
  const { error: insertError } = await supabase
    .from("ai_messages")
    .insert([
      {
        conversation_id: conversationId,
        user_id: user.id,
        role: "user",
        content: parsed.data.userMessage,
        message_index: baseIndex,
      },
      {
        conversation_id: conversationId,
        user_id: user.id,
        role: "assistant",
        content: parsed.data.assistantMessage,
        message_index: baseIndex + 1,
      },
    ]);

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Return updated conversation metadata (trigger updates message_count/title/updated_at)
  const { data: updated } = await supabase
    .from("ai_conversations")
    .select("message_count, title, updated_at")
    .eq("id", conversationId)
    .eq("user_id", user.id)
    .single();

  return NextResponse.json({ saved: true, messageIndex: baseIndex, conversation: updated });
}

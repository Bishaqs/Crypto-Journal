import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ConversationUpdateSchema } from "@/lib/schemas/ai";

export const dynamic = "force-dynamic";

// GET /api/ai/conversations/[id] — load conversation with messages
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Load conversation metadata
  const { data: conversation, error: convError } = await supabase
    .from("ai_conversations")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (convError) {
    if (convError.code === "PGRST116") {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }
    return NextResponse.json({ error: convError.message }, { status: 500 });
  }

  // Load messages — if conversation has a summary, only load messages after the summary point
  const startIndex = conversation.summary_through_index != null
    ? Math.max(0, conversation.summary_through_index - 2) // overlap by 2 for context
    : 0;

  const { data: messages, error: msgError } = await supabase
    .from("ai_messages")
    .select("id, role, content, message_index, created_at")
    .eq("conversation_id", id)
    .eq("user_id", user.id)
    .gte("message_index", startIndex)
    .order("message_index", { ascending: true });

  if (msgError) {
    return NextResponse.json({ error: msgError.message }, { status: 500 });
  }

  return NextResponse.json({
    conversation,
    messages: messages || [],
  });
}

// PUT /api/ai/conversations/[id] — rename conversation
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = ConversationUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("ai_conversations")
    .update({ title: parsed.data.title, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id, title, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ conversation: data });
}

// DELETE /api/ai/conversations/[id] — delete conversation (cascades to messages)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("ai_conversations")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

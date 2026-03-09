import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { checkProfanity } from "@/lib/profanity-filter";
import { z } from "zod";

export const dynamic = "force-dynamic";

const SendMessageSchema = z.object({
  ticketId: z.string().uuid("Invalid ticket ID"),
  message: z.string().min(1, "Message is required").max(2000, "Message must be under 2000 characters"),
});

async function resolveDisplayName(
  supabase: Awaited<ReturnType<typeof createClient>>,
  user: { id: string; email?: string },
): Promise<string> {
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("display_name")
    .eq("user_id", user.id)
    .maybeSingle();

  return profile?.display_name ?? user.email?.split("@")[0] ?? "Anonymous";
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`support-msg:${user.id}`, 10, 60_000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many messages. Please wait." }, { status: 429 });
  }

  let parsed;
  try {
    parsed = SendMessageSchema.parse(await req.json());
  } catch (err) {
    const msg = err instanceof z.ZodError ? err.issues[0]?.message ?? "Invalid request" : "Invalid request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const profanityResult = checkProfanity(parsed.message);
  if (!profanityResult.isClean) {
    return NextResponse.json({ error: profanityResult.reason }, { status: 400 });
  }

  // Verify the user owns this ticket
  const { data: ticket } = await supabase
    .from("support_tickets")
    .select("id")
    .eq("id", parsed.ticketId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  const displayName = await resolveDisplayName(supabase, user);

  const { error } = await supabase.from("support_messages").insert({
    ticket_id: parsed.ticketId,
    user_id: user.id,
    message: parsed.message,
    display_name: displayName,
    is_owner_reply: false,
  });

  if (error) {
    console.error("[support/messages] insert failed:", error.message);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ticketId = req.nextUrl.searchParams.get("ticketId");
  if (!ticketId) {
    return NextResponse.json({ error: "ticketId is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("support_messages")
    .select("id, ticket_id, user_id, message, display_name, is_owner_reply, created_at")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true })
    .limit(100);

  if (error) {
    console.error("[support/messages] fetch failed:", error.message);
    return NextResponse.json({ error: "Failed to load messages" }, { status: 500 });
  }

  return NextResponse.json({ messages: data ?? [] });
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { checkProfanity } from "@/lib/profanity-filter";
import { z } from "zod";

export const dynamic = "force-dynamic";

const CreateTicketSchema = z.object({
  subject: z.string().min(3).max(200).optional(),
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

  const rl = await rateLimit(`support:${user.id}`, 3, 60_000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests. Please wait before creating another ticket." }, { status: 429 });
  }

  let parsed;
  try {
    parsed = CreateTicketSchema.parse(await req.json());
  } catch (err) {
    const msg = err instanceof z.ZodError ? err.issues[0]?.message ?? "Invalid request" : "Invalid request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const profanityResult = checkProfanity(parsed.subject + " " + parsed.message);
  if (!profanityResult.isClean) {
    return NextResponse.json({ error: profanityResult.reason }, { status: 400 });
  }

  const displayName = await resolveDisplayName(supabase, user);

  // Auto-generate subject from message if not provided
  const subject = parsed.subject ?? (
    parsed.message.length > 50
      ? parsed.message.slice(0, 50) + "..."
      : parsed.message
  );

  // Create ticket
  const { data: ticket, error: ticketErr } = await supabase
    .from("support_tickets")
    .insert({
      user_id: user.id,
      subject,
      display_name: displayName,
    })
    .select("id")
    .single();

  if (ticketErr || !ticket) {
    console.error("[support] ticket insert failed:", ticketErr?.message);
    return NextResponse.json({ error: "Failed to create support ticket" }, { status: 500 });
  }

  // Create initial message
  const { error: msgErr } = await supabase.from("support_messages").insert({
    ticket_id: ticket.id,
    user_id: user.id,
    message: parsed.message,
    display_name: displayName,
    is_owner_reply: false,
  });

  if (msgErr) {
    console.error("[support] message insert failed:", msgErr.message);
  }

  return NextResponse.json({ ticketId: ticket.id });
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("support_tickets")
    .select("id, subject, status, display_name, created_at, resolved_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("[support] fetch tickets failed:", error.message);
    return NextResponse.json({ error: "Failed to load tickets" }, { status: 500 });
  }

  return NextResponse.json({ tickets: data ?? [] });
}

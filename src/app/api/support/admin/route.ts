import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

export const dynamic = "force-dynamic";

const UpdateTicketSchema = z.object({
  id: z.string().uuid("Invalid ticket ID"),
  status: z.enum(["resolved", "closed"]),
});

const ReplySchema = z.object({
  ticketId: z.string().uuid("Invalid ticket ID"),
  message: z.string().min(1).max(2000),
});

async function verifyOwner(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const ownerEmail = process.env.OWNER_EMAIL || process.env.NEXT_PUBLIC_OWNER_EMAIL;
  let isOwner = !!(ownerEmail && user.email?.toLowerCase() === ownerEmail.toLowerCase());

  if (!isOwner) {
    const { data: sub } = await supabase
      .from("user_subscriptions")
      .select("is_owner")
      .eq("user_id", user.id)
      .maybeSingle();
    if (sub?.is_owner) isOwner = true;
  }

  return isOwner ? user : null;
}

export async function GET() {
  const supabase = await createClient();
  const user = await verifyOwner(supabase);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const { data, error } = await admin
    .from("support_tickets")
    .select("id, user_id, subject, status, display_name, created_at, resolved_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("[admin/support] fetch failed:", error.message);
    return NextResponse.json({ error: "Failed to load tickets" }, { status: 500 });
  }

  return NextResponse.json({ tickets: data ?? [] });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const user = await verifyOwner(supabase);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`admin:${user.id}`, 30, 60_000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let parsed;
  try {
    parsed = UpdateTicketSchema.parse(await req.json());
  } catch (err) {
    const msg = err instanceof z.ZodError ? err.issues[0]?.message ?? "Invalid request" : "Invalid request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const { error } = await admin
    .from("support_tickets")
    .update({
      status: parsed.status,
      resolved_at: parsed.status === "resolved" ? new Date().toISOString() : null,
    })
    .eq("id", parsed.id);

  if (error) {
    console.error("[admin/support] update failed:", error.message);
    return NextResponse.json({ error: "Failed to update ticket" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const user = await verifyOwner(supabase);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`admin:${user.id}`, 30, 60_000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let parsed;
  try {
    parsed = ReplySchema.parse(await req.json());
  } catch (err) {
    const msg = err instanceof z.ZodError ? err.issues[0]?.message ?? "Invalid request" : "Invalid request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const { error } = await admin.from("support_messages").insert({
    ticket_id: parsed.ticketId,
    user_id: user.id,
    message: parsed.message,
    display_name: "Stargate Support",
    is_owner_reply: true,
  });

  if (error) {
    console.error("[admin/support] reply failed:", error.message);
    return NextResponse.json({ error: "Failed to send reply" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

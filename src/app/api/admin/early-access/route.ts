import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

export const dynamic = "force-dynamic";

async function verifyOwner() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const ownerEmail = (process.env.OWNER_EMAIL || process.env.NEXT_PUBLIC_OWNER_EMAIL || "").toLowerCase();
  if (user.email?.toLowerCase() === ownerEmail) return user;

  // Fallback: check DB
  const admin = createAdminClient();
  const { data: sub } = await admin
    .from("user_subscriptions")
    .select("is_owner")
    .eq("user_id", user.id)
    .maybeSingle();

  if (sub?.is_owner) return user;
  return null;
}

const AddSchema = z.object({
  email: z.string().email().transform((e) => e.toLowerCase().trim()),
  note: z.string().max(200).optional(),
});

// GET — list all manually granted early access emails
export async function GET() {
  const user = await verifyOwner();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("early_access_emails")
    .select("id, email, granted_by, note, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[admin/early-access] fetch failed:", error.message);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }

  return NextResponse.json({ emails: data ?? [] });
}

// POST — grant early access to an email
export async function POST(req: NextRequest) {
  const user = await verifyOwner();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await rateLimit(`admin-early-access:${user.id}`, 30, 60_000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = AddSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const { email, note } = parsed.data;
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("early_access_emails")
    .upsert(
      { email, granted_by: "admin", note: note ?? null },
      { onConflict: "email", ignoreDuplicates: true }
    )
    .select("id, email, granted_by, note, created_at")
    .single();

  if (error) {
    console.error("[admin/early-access] insert failed:", error.message);
    return NextResponse.json({ error: "Failed to grant access" }, { status: 500 });
  }

  return NextResponse.json({ success: true, entry: data });
}

// DELETE — revoke early access
export async function DELETE(req: NextRequest) {
  const user = await verifyOwner();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await rateLimit(`admin-early-access:${user.id}`, 30, 60_000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: { id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!body.id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("early_access_emails")
    .delete()
    .eq("id", body.id);

  if (error) {
    console.error("[admin/early-access] delete failed:", error.message);
    return NextResponse.json({ error: "Failed to revoke" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

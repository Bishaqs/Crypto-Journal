import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

export const dynamic = "force-dynamic";

const CreateFaqSchema = z.object({
  question: z.string().min(5).max(500),
  answer: z.string().min(1).max(5000),
  category: z.string().default("general"),
  tags: z.array(z.string()).default([]),
});

const UpdateFaqSchema = z.object({
  id: z.string().uuid(),
  question: z.string().min(5).max(500).optional(),
  answer: z.string().min(1).max(5000).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const DeleteFaqSchema = z.object({
  id: z.string().uuid(),
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
    .from("dynamic_faqs")
    .select("id, question, answer, category, tags, source_question_id, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[admin/dynamic-faqs] fetch failed:", error.message);
    return NextResponse.json({ error: "Failed to load FAQs" }, { status: 500 });
  }

  return NextResponse.json({ faqs: data ?? [] });
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
    parsed = CreateFaqSchema.parse(await req.json());
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

  const { error } = await admin.from("dynamic_faqs").insert({
    question: parsed.question,
    answer: parsed.answer,
    category: parsed.category,
    tags: parsed.tags,
  });

  if (error) {
    console.error("[admin/dynamic-faqs] insert failed:", error.message);
    return NextResponse.json({ error: "Failed to create FAQ" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
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
    parsed = UpdateFaqSchema.parse(await req.json());
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

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (parsed.question !== undefined) updates.question = parsed.question;
  if (parsed.answer !== undefined) updates.answer = parsed.answer;
  if (parsed.category !== undefined) updates.category = parsed.category;
  if (parsed.tags !== undefined) updates.tags = parsed.tags;

  const { error } = await admin
    .from("dynamic_faqs")
    .update(updates)
    .eq("id", parsed.id);

  if (error) {
    console.error("[admin/dynamic-faqs] update failed:", error.message);
    return NextResponse.json({ error: "Failed to update FAQ" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const user = await verifyOwner(supabase);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let parsed;
  try {
    parsed = DeleteFaqSchema.parse(await req.json());
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

  const { error } = await admin.from("dynamic_faqs").delete().eq("id", parsed.id);

  if (error) {
    console.error("[admin/dynamic-faqs] delete failed:", error.message);
    return NextResponse.json({ error: "Failed to delete FAQ" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

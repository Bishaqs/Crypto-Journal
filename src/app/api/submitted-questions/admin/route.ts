import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

export const dynamic = "force-dynamic";

const ReviewSchema = z.object({
  id: z.string().uuid("Invalid question ID"),
  action: z.enum(["approve", "reject"]),
  answer: z.string().min(1).max(5000).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
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
    .from("submitted_questions")
    .select("id, user_id, question, status, display_name, created_at, reviewed_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("[admin/submitted-questions] fetch failed:", error.message);
    return NextResponse.json({ error: "Failed to load questions" }, { status: 500 });
  }

  return NextResponse.json({ questions: data ?? [] });
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
    parsed = ReviewSchema.parse(await req.json());
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

  if (parsed.action === "reject") {
    const { error } = await admin
      .from("submitted_questions")
      .update({ status: "rejected", reviewed_at: new Date().toISOString() })
      .eq("id", parsed.id);

    if (error) {
      console.error("[admin/submitted-questions] reject failed:", error.message);
      return NextResponse.json({ error: "Failed to reject question" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  // Approve: requires answer
  if (!parsed.answer) {
    return NextResponse.json({ error: "Answer is required when approving" }, { status: 400 });
  }

  // Get the original question text
  const { data: question } = await admin
    .from("submitted_questions")
    .select("question")
    .eq("id", parsed.id)
    .single();

  if (!question) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  // Create dynamic FAQ entry
  const { error: faqErr } = await admin.from("dynamic_faqs").insert({
    question: question.question,
    answer: parsed.answer,
    category: parsed.category ?? "general",
    tags: parsed.tags ?? [],
    source_question_id: parsed.id,
  });

  if (faqErr) {
    console.error("[admin/submitted-questions] faq insert failed:", faqErr.message);
    return NextResponse.json({ error: "Failed to create FAQ entry" }, { status: 500 });
  }

  // Update question status
  const { error: updateErr } = await admin
    .from("submitted_questions")
    .update({ status: "published", reviewed_at: new Date().toISOString() })
    .eq("id", parsed.id);

  if (updateErr) {
    console.error("[admin/submitted-questions] status update failed:", updateErr.message);
  }

  return NextResponse.json({ success: true });
}

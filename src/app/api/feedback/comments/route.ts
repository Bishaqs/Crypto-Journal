import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { checkProfanity } from "@/lib/profanity-filter";
import { z } from "zod";

export const dynamic = "force-dynamic";

const CommentSchema = z.object({
  feedbackId: z.string().uuid("Invalid feedback ID"),
  message: z.string().min(1, "Comment cannot be empty").max(1000, "Comment must be under 1000 characters"),
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

async function checkIsOwner(
  supabase: Awaited<ReturnType<typeof createClient>>,
  user: { id: string; email?: string },
): Promise<boolean> {
  const ownerEmail = process.env.OWNER_EMAIL || process.env.NEXT_PUBLIC_OWNER_EMAIL;
  if (ownerEmail && user.email?.toLowerCase() === ownerEmail.toLowerCase()) return true;

  const { data: sub } = await supabase
    .from("user_subscriptions")
    .select("is_owner")
    .eq("user_id", user.id)
    .maybeSingle();

  return sub?.is_owner === true;
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const feedbackId = req.nextUrl.searchParams.get("feedbackId");
  if (!feedbackId) {
    return NextResponse.json({ error: "Missing feedbackId" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("feedback_comments")
    .select("id, feedback_id, user_id, message, display_name, is_owner_reply, created_at")
    .eq("feedback_id", feedbackId)
    .order("created_at", { ascending: true })
    .limit(100);

  if (error) {
    console.error("[feedback/comments] fetch failed:", error.message);
    return NextResponse.json({ error: "Failed to load comments" }, { status: 500 });
  }

  return NextResponse.json({ comments: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`feedback-comment:${user.id}`, 10, 60_000);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before commenting again." },
      { status: 429 },
    );
  }

  let parsed;
  try {
    parsed = CommentSchema.parse(await req.json());
  } catch (err) {
    const msg = err instanceof z.ZodError ? err.issues[0]?.message ?? "Invalid request" : "Invalid request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const profanityResult = checkProfanity(parsed.message);
  if (!profanityResult.isClean) {
    return NextResponse.json({ error: profanityResult.reason }, { status: 400 });
  }

  const [displayName, isOwner] = await Promise.all([
    resolveDisplayName(supabase, user),
    checkIsOwner(supabase, user),
  ]);

  const { error } = await supabase.from("feedback_comments").insert({
    feedback_id: parsed.feedbackId,
    user_id: user.id,
    message: parsed.message,
    display_name: displayName,
    is_owner_reply: isOwner,
  });

  if (error) {
    console.error("[feedback/comments] insert failed:", error.message);
    return NextResponse.json({ error: "Failed to post comment" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

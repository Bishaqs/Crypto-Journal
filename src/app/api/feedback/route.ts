import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { checkProfanity } from "@/lib/profanity-filter";
import { z } from "zod";

export const dynamic = "force-dynamic";

const FeedbackSchema = z.object({
  category: z.enum(["bug", "feature", "general"]).default("general"),
  message: z.string().min(10, "Message must be at least 10 characters").max(2000, "Message must be under 2000 characters"),
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

  const rl = await rateLimit(`feedback:${user.id}`, 5, 60_000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests. Please wait before submitting again." }, { status: 429 });
  }

  let parsed;
  try {
    parsed = FeedbackSchema.parse(await req.json());
  } catch (err) {
    const msg = err instanceof z.ZodError ? err.issues[0]?.message ?? "Invalid request" : "Invalid request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const profanityResult = checkProfanity(parsed.message);
  if (!profanityResult.isClean) {
    return NextResponse.json({ error: profanityResult.reason }, { status: 400 });
  }

  const displayName = await resolveDisplayName(supabase, user);

  const { error } = await supabase.from("feedback").insert({
    user_id: user.id,
    category: parsed.category,
    message: parsed.message,
    display_name: displayName,
  });

  if (error) {
    console.error("[feedback] insert failed:", error.message);
    return NextResponse.json({ error: "Failed to submit feedback" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("feedback")
    .select("id, user_id, category, message, display_name, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[feedback] fetch failed:", error.message);
    return NextResponse.json({ error: "Failed to load feedback" }, { status: 500 });
  }

  return NextResponse.json({
    feedback: data ?? [],
    currentUserId: user.id,
  });
}

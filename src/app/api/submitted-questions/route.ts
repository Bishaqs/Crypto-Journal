import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { checkProfanity } from "@/lib/profanity-filter";
import { z } from "zod";

export const dynamic = "force-dynamic";

const SubmitQuestionSchema = z.object({
  question: z.string().min(5, "Question must be at least 5 characters").max(500, "Question must be under 500 characters"),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`submit-q:${user.id}`, 5, 60_000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many submissions. Please wait." }, { status: 429 });
  }

  let parsed;
  try {
    parsed = SubmitQuestionSchema.parse(await req.json());
  } catch (err) {
    const msg = err instanceof z.ZodError ? err.issues[0]?.message ?? "Invalid request" : "Invalid request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const profanityResult = checkProfanity(parsed.question);
  if (!profanityResult.isClean) {
    return NextResponse.json({ error: profanityResult.reason }, { status: 400 });
  }

  // Resolve display name
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("display_name")
    .eq("user_id", user.id)
    .maybeSingle();

  const displayName = profile?.display_name ?? user.email?.split("@")[0] ?? "Anonymous";

  const { error } = await supabase.from("submitted_questions").insert({
    user_id: user.id,
    question: parsed.question,
    display_name: displayName,
  });

  if (error) {
    console.error("[submitted-questions] insert failed:", error.message);
    return NextResponse.json({ error: "Failed to submit question" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

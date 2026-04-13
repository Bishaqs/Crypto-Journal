import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";
import { isValidArchetype } from "@/lib/mini-quiz-archetypes";
import { getDeepQuizQuestions } from "@/lib/deep-quiz-questions";
import { scoreDeepQuiz } from "@/lib/deep-quiz-scoring";

export const dynamic = "force-dynamic";

const SubmitSchema = z.object({
  accessToken: z.string().min(1),
  answers: z.record(z.string(), z.number()),
  archetype: z.string().min(1).max(50),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = await rateLimit(`deep-quiz-submit:${ip}`, 5, 3_600_000);
  if (!rl.success) {
    return NextResponse.json(
      { success: false, error: "Too many attempts." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetMs / 1000)) } },
    );
  }

  let parsed;
  try {
    parsed = SubmitSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }

  if (!isValidArchetype(parsed.archetype)) {
    return NextResponse.json({ success: false, error: "Invalid archetype" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Verify access token
  const { data: signup, error: signupErr } = await admin
    .from("waitlist_signups")
    .select("id, email, email_confirmed")
    .eq("access_token", parsed.accessToken)
    .single();

  if (signupErr || !signup) {
    return NextResponse.json({ success: false, error: "Invalid token" }, { status: 404 });
  }

  // Check for duplicate submissions
  const { data: existing } = await admin
    .from("deep_quiz_results")
    .select("id")
    .eq("waitlist_signup_id", signup.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({
      success: false,
      error: "You've already completed the deep quiz.",
      deepQuizResultId: existing.id,
    });
  }

  // Score the quiz
  const questions = getDeepQuizQuestions(parsed.archetype);
  const profile = scoreDeepQuiz(parsed.archetype, parsed.answers, questions);

  // Insert result
  const { data: result, error: insertErr } = await admin
    .from("deep_quiz_results")
    .insert({
      email: signup.email,
      waitlist_signup_id: signup.id,
      mini_archetype: parsed.archetype,
      answers: parsed.answers,
      scores: {
        overallScore: profile.overallScore,
        overallLevel: profile.overallLevel,
        categories: profile.categories,
        topStrength: profile.topStrength,
        biggestGap: profile.biggestGap,
      },
      advice: profile.advice,
    })
    .select("id, unsubscribe_token")
    .single();

  if (insertErr) {
    console.error("[quiz/deep/submit] insert failed:", insertErr.message);
    return NextResponse.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }

  // Track funnel event
  admin.from("funnel_events").insert({
    session_id: parsed.accessToken,
    event_type: "deep_quiz_complete",
    archetype: parsed.archetype,
    metadata: { overallLevel: profile.overallLevel, overallScore: profile.overallScore },
    ip_address: ip,
  }).then(() => {});

  return NextResponse.json({
    success: true,
    deepQuizResultId: result.id,
    profile,
  });
}

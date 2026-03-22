import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { sendQuizResults } from "@/lib/email";
import { z } from "zod";
import {
  computeRiskPersonality,
  computeMoneyScripts,
  computeDecisionStyle,
  computeLossAversion,
  computeFomoRevengeScore,
  computeEmotionalRegulation,
  computeBiasAwareness,
  computeStressResponse,
  computeTradingArchetype,
  ARCHETYPES,
} from "@/lib/psychology-scoring";

export const dynamic = "force-dynamic";

const QuizSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  answers: z.record(z.string(), z.union([z.number(), z.string()])),
  waitlistToken: z.string().uuid().optional(),
});

export async function POST(req: NextRequest) {
  // Rate limit by IP: 5 submissions per hour
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = await rateLimit(`quiz-submit:${ip}`, 5, 3_600_000);
  if (!rl.success) {
    return NextResponse.json(
      { success: false, error: "Too many attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetMs / 1000)) } }
    );
  }

  let parsed;
  try {
    parsed = QuizSchema.parse(await req.json());
  } catch (err) {
    const msg = err instanceof z.ZodError ? err.issues[0]?.message ?? "Invalid request" : "Invalid request";
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }

  const email = parsed.email.toLowerCase().trim();
  const admin = createAdminClient();

  // Separate answers by category based on question ID prefix
  const riskResponses: Record<string, number> = {};
  const moneyResponses: Record<string, number> = {};
  const decisionResponses: Record<string, string> = {};
  const lossAversionResponses: Record<string, number> = {};
  const fomoRevengeResponses: Record<string, number> = {};
  const emotionalRegResponses: Record<string, string> = {};
  const biasResponses: Record<string, string> = {};
  const stressResponses: Record<string, string> = {};
  const disciplineResponses: Record<string, number> = {};

  for (const [key, value] of Object.entries(parsed.answers)) {
    if (key.startsWith("risk_")) riskResponses[key] = value as number;
    else if (key.startsWith("mw_") || key.startsWith("ms_") || key.startsWith("mv_") || key.startsWith("ma_")) moneyResponses[key] = value as number;
    else if (key.startsWith("ds_")) decisionResponses[key] = value as string;
    else if (key.startsWith("la_")) lossAversionResponses[key] = value as number;
    else if (key.startsWith("fr_")) fomoRevengeResponses[key] = value as number;
    else if (key.startsWith("er_")) emotionalRegResponses[key] = value as string;
    else if (key.startsWith("ba_")) biasResponses[key] = value as string;
    else if (key.startsWith("sr_")) stressResponses[key] = value as string;
    else if (key.startsWith("td_")) disciplineResponses[key] = value as number;
  }

  // Compute scores
  const riskPersonality = Object.keys(riskResponses).length > 0 ? computeRiskPersonality(riskResponses) : undefined;
  const moneyScripts = Object.keys(moneyResponses).length > 0 ? computeMoneyScripts(moneyResponses) : undefined;
  const decisionStyle = Object.keys(decisionResponses).length > 0 ? computeDecisionStyle(decisionResponses) : undefined;
  const lossAversion = Object.keys(lossAversionResponses).length > 0 ? computeLossAversion(lossAversionResponses) : undefined;
  const fomoRevengeScore = Object.keys(fomoRevengeResponses).length > 0 ? computeFomoRevengeScore(fomoRevengeResponses) : undefined;
  const emotionalRegulation = Object.keys(emotionalRegResponses).length > 0 ? computeEmotionalRegulation(emotionalRegResponses) : undefined;
  const biasAwareness = Object.keys(biasResponses).length > 0 ? computeBiasAwareness(biasResponses) : undefined;
  const stressResponse = Object.keys(stressResponses).length > 0 ? computeStressResponse(stressResponses) : undefined;

  // Discipline: average of Likert responses (1-5 scale)
  const disciplineVals = Object.values(disciplineResponses);
  const disciplineScore = disciplineVals.length > 0
    ? disciplineVals.reduce((a, b) => a + b, 0) / disciplineVals.length
    : undefined;

  const archetype = computeTradingArchetype({
    riskPersonality,
    moneyScripts,
    decisionStyle,
    lossAversion,
    fomoRevengeScore,
    emotionalRegulation,
    biasAwareness,
    stressResponse,
    disciplineScore,
  });

  const scores = {
    riskPersonality,
    moneyScripts,
    decisionStyle,
    lossAversion,
    fomoRevengeScore,
    emotionalRegulation,
    biasAwareness,
    stressResponse,
    disciplineScore,
  };

  // Link to waitlist if token provided
  let waitlistSignupId: string | null = null;
  if (parsed.waitlistToken) {
    const { data: waitlistRow } = await admin
      .from("waitlist_signups")
      .select("id")
      .eq("access_token", parsed.waitlistToken)
      .maybeSingle();
    if (waitlistRow) waitlistSignupId = waitlistRow.id;
  }

  // Check if already unsubscribed
  const { data: unsub } = await admin
    .from("email_unsubscribes")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  // Insert quiz result
  const { data: quizResult, error: insertError } = await admin
    .from("quiz_results")
    .insert({
      email,
      answers: parsed.answers,
      archetype,
      scores,
      waitlist_signup_id: waitlistSignupId,
    })
    .select("id, unsubscribe_token")
    .single();

  if (insertError || !quizResult) {
    console.error("[quiz/submit] Insert failed:", insertError);
    return NextResponse.json({ success: false, error: "Failed to save results" }, { status: 500 });
  }

  // Schedule email nurture sequence (days 0, 3, 7, 10, 15) — skip if unsubscribed
  if (!unsub) {
    const now = new Date();
    const days = [0, 3, 7, 10, 15];
    const emailRows = days.map((dayOffset) => {
      const scheduledFor = new Date(now);
      scheduledFor.setDate(scheduledFor.getDate() + dayOffset);
      if (dayOffset > 0) scheduledFor.setHours(10, 0, 0, 0); // 10:00 UTC for future days
      return {
        email,
        quiz_result_id: quizResult.id,
        sequence_name: "nurture",
        day_index: dayOffset,
        scheduled_for: scheduledFor.toISOString(),
        status: dayOffset === 0 ? "sent" as const : "pending" as const,
        sent_at: dayOffset === 0 ? now.toISOString() : null,
      };
    });

    // Schedule protocol delivery email (1 day after quiz completion)
    const protocolDate = new Date(now);
    protocolDate.setDate(protocolDate.getDate() + 1);
    protocolDate.setHours(10, 0, 0, 0);
    emailRows.push({
      email,
      quiz_result_id: quizResult.id,
      sequence_name: "protocol_delivery",
      day_index: 1,
      scheduled_for: protocolDate.toISOString(),
      status: "pending" as const,
      sent_at: null,
    });

    await admin.from("email_sequences").insert(emailRows);

    // Send Day 0 results email immediately
    const unsubscribeUrl = `https://traversejournal.com/api/email/unsubscribe?token=${quizResult.unsubscribe_token}`;
    const archetypeInfo = ARCHETYPES[archetype];
    sendQuizResults(email, archetypeInfo, scores, unsubscribeUrl).catch((err) =>
      console.error("[quiz/submit] Email send failed:", err)
    );

    // Trigger protocol generation in background (so it's cached by the time the email arrives)
    fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? "https://traversejournal.com"}/api/quiz/protocol?id=${quizResult.id}&token=${quizResult.unsubscribe_token}`)
      .catch(() => { /* non-blocking */ });
  }

  return NextResponse.json({
    success: true,
    archetype,
    archetypeInfo: ARCHETYPES[archetype],
    scores,
    quizResultId: quizResult.id,
    unsubscribeToken: quizResult.unsubscribe_token,
  });
}

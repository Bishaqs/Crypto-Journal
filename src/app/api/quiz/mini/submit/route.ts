import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

export const dynamic = "force-dynamic";

const SubmitSchema = z.object({
  sessionId: z.string().min(1).max(100),
  answers: z.record(z.string(), z.string()),
  archetype: z.string().min(1).max(50),
  dimensionScores: z.object({
    decision_engine: z.enum(["analytical", "intuitive"]),
    risk_appetite: z.enum(["aggressive", "conservative"]),
    emotional_pattern: z.enum(["controlled", "reactive"]),
  }),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = await rateLimit(`mini-quiz:${ip}`, 10, 3_600_000);
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

  const admin = createAdminClient();

  const { data, error } = await admin.from("mini_quiz_results").insert({
    session_id: parsed.sessionId,
    answers: parsed.answers,
    archetype: parsed.archetype,
    dimension_scores: parsed.dimensionScores,
    ip_address: ip,
  }).select("id").single();

  if (error) {
    console.error("[quiz/mini/submit] insert failed:", error.message);
    return NextResponse.json({ success: false }, { status: 500 });
  }

  return NextResponse.json({ success: true, id: data.id });
}

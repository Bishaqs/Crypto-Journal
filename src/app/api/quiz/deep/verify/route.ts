import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ success: false, error: "Missing token" }, { status: 400 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = await rateLimit(`deep-quiz-verify:${ip}`, 20, 3_600_000);
  if (!rl.success) {
    return NextResponse.json({ success: false, error: "Too many attempts." }, { status: 429 });
  }

  const admin = createAdminClient();

  const { data, error } = await admin
    .from("waitlist_signups")
    .select("id, email, mini_archetype, email_confirmed")
    .eq("access_token", token)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { success: false, error: "Invalid or expired token. Please take the mini quiz first." },
      { status: 404 },
    );
  }

  // Check if deep quiz already completed
  const { data: existing } = await admin
    .from("deep_quiz_results")
    .select("id")
    .eq("waitlist_signup_id", data.id)
    .maybeSingle();

  return NextResponse.json({
    success: true,
    email: data.email,
    archetype: data.mini_archetype ?? "architect",
    waitlistSignupId: data.id,
    alreadyCompleted: !!existing,
  });
}

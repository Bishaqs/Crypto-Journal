import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(new URL("/unsubscribed", req.url));
  }

  const admin = createAdminClient();
  let email: string | null = null;

  // Cascading token lookup: quiz_results → deep_quiz_results → waitlist_signups
  const { data: quizResult } = await admin
    .from("quiz_results")
    .select("email")
    .eq("unsubscribe_token", token)
    .maybeSingle();
  if (quizResult?.email) email = quizResult.email;

  if (!email) {
    const { data: deepResult } = await admin
      .from("deep_quiz_results")
      .select("email")
      .eq("unsubscribe_token", token)
      .maybeSingle();
    if (deepResult?.email) email = deepResult.email;
  }

  if (!email) {
    const { data: waitlistSignup } = await admin
      .from("waitlist_signups")
      .select("email")
      .eq("unsubscribe_token", token)
      .maybeSingle();
    if (waitlistSignup?.email) email = waitlistSignup.email;
  }

  if (email) {
    // Add to unsubscribe list
    await admin
      .from("email_unsubscribes")
      .upsert(
        { email, unsubscribed_at: new Date().toISOString() },
        { onConflict: "email" }
      );

    // Cancel all pending emails for this email
    await admin
      .from("email_sequences")
      .update({ status: "unsubscribed" })
      .eq("email", email)
      .eq("status", "pending");
  }

  return NextResponse.redirect(new URL("/unsubscribed", req.url));
}

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(new URL("/unsubscribed", req.url));
  }

  const admin = createAdminClient();

  // Find quiz result by unsubscribe token
  const { data: quizResult } = await admin
    .from("quiz_results")
    .select("email")
    .eq("unsubscribe_token", token)
    .maybeSingle();

  if (quizResult?.email) {
    // Add to unsubscribe list
    await admin
      .from("email_unsubscribes")
      .upsert(
        { email: quizResult.email, unsubscribed_at: new Date().toISOString() },
        { onConflict: "email" }
      );

    // Cancel all pending emails for this email
    await admin
      .from("email_sequences")
      .update({ status: "unsubscribed" })
      .eq("email", quizResult.email)
      .eq("status", "pending");
  }

  return NextResponse.redirect(new URL("/unsubscribed", req.url));
}

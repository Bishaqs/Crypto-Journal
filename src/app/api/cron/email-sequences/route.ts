import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendNurtureEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

/**
 * Daily cron: Process pending email sequences.
 * Sends nurture emails to quiz completers on days 3, 7, 10, 15.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const deadline = Date.now() + 8000; // 8s deadline (Vercel 10s limit)
  const supabase = createAdminClient();

  try {
    // Get pending emails that are due
    const { data: pendingEmails, error } = await supabase
      .from("email_sequences")
      .select("id, email, quiz_result_id, day_index")
      .eq("status", "pending")
      .lte("scheduled_for", new Date().toISOString())
      .order("scheduled_for", { ascending: true })
      .limit(20); // Cap batch size for 10s deadline

    if (error || !pendingEmails) {
      console.error("[cron/email-sequences] Query failed:", error);
      return NextResponse.json({ error: "Query failed" }, { status: 500 });
    }

    let sent = 0;
    let failed = 0;

    for (const email of pendingEmails) {
      // Deadline guard
      if (Date.now() > deadline) {
        console.log(`[cron/email-sequences] Deadline reached after ${sent} sent, ${failed} failed`);
        break;
      }

      // Check unsubscribe
      const { data: unsub } = await supabase
        .from("email_unsubscribes")
        .select("id")
        .eq("email", email.email)
        .maybeSingle();

      if (unsub) {
        await supabase
          .from("email_sequences")
          .update({ status: "unsubscribed" })
          .eq("id", email.id);
        continue;
      }

      // Get quiz result for archetype/scores
      const { data: quizResult } = await supabase
        .from("quiz_results")
        .select("archetype, scores, unsubscribe_token")
        .eq("id", email.quiz_result_id)
        .single();

      if (!quizResult) {
        await supabase
          .from("email_sequences")
          .update({ status: "failed" })
          .eq("id", email.id);
        failed++;
        continue;
      }

      // Look up discount code from waitlist (if linked)
      let discountCode: string | undefined;
      const { data: quizRow } = await supabase
        .from("quiz_results")
        .select("waitlist_signup_id")
        .eq("id", email.quiz_result_id)
        .single();

      if (quizRow?.waitlist_signup_id) {
        const { data: waitlist } = await supabase
          .from("waitlist_signups")
          .select("discount_code")
          .eq("id", quizRow.waitlist_signup_id)
          .single();
        if (waitlist?.discount_code) discountCode = waitlist.discount_code;
      }

      const unsubscribeUrl = `https://traversejournal.com/api/email/unsubscribe?token=${quizResult.unsubscribe_token}`;

      const success = await sendNurtureEmail(
        email.email,
        email.day_index,
        quizResult.archetype,
        quizResult.scores,
        unsubscribeUrl,
        discountCode,
      );

      await supabase
        .from("email_sequences")
        .update({
          status: success ? "sent" : "failed",
          sent_at: success ? new Date().toISOString() : null,
        })
        .eq("id", email.id);

      if (success) sent++;
      else failed++;
    }

    return NextResponse.json({
      success: true,
      processed: pendingEmails.length,
      sent,
      failed,
    });
  } catch (err) {
    console.error("[cron/email-sequences] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

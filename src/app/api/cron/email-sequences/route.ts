import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendNurtureEmail, sendQuizInvitation, sendProtocolDelivery } from "@/lib/email";
import { ARCHETYPES, type TradingArchetype } from "@/lib/psychology-scoring";

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
      .select("id, email, quiz_result_id, waitlist_signup_id, sequence_name, day_index")
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

      let success = false;

      // Route by sequence type
      if (email.sequence_name === "waitlist_nurture") {
        // Quiz invitation email — needs waitlist signup data
        if (!email.waitlist_signup_id) {
          await supabase.from("email_sequences").update({ status: "failed" }).eq("id", email.id);
          failed++;
          continue;
        }

        const { data: signup } = await supabase
          .from("waitlist_signups")
          .select("access_token, position, tier")
          .eq("id", email.waitlist_signup_id)
          .single();

        if (!signup) {
          await supabase.from("email_sequences").update({ status: "failed" }).eq("id", email.id);
          failed++;
          continue;
        }

        const tierNames: Record<string, string> = {
          founding_100: "Founding 100",
          pioneer: "Pioneer",
          early_adopter: "Early Adopter",
          vanguard: "Vanguard",
          trailblazer: "Trailblazer",
        };

        const unsubscribeUrl = `https://traversejournal.com/api/email/unsubscribe?email=${encodeURIComponent(email.email)}`;
        success = await sendQuizInvitation(
          email.email,
          signup.access_token,
          tierNames[signup.tier] ?? "Early Access",
          signup.position,
          unsubscribeUrl,
        );
      } else if (email.sequence_name === "protocol_delivery") {
        // Protocol delivery email — needs quiz result + protocol
        if (!email.quiz_result_id) {
          await supabase.from("email_sequences").update({ status: "failed" }).eq("id", email.id);
          failed++;
          continue;
        }

        const { data: quizResult } = await supabase
          .from("quiz_results")
          .select("id, archetype, protocol, unsubscribe_token")
          .eq("id", email.quiz_result_id)
          .single();

        if (!quizResult) {
          await supabase.from("email_sequences").update({ status: "failed" }).eq("id", email.id);
          failed++;
          continue;
        }

        // Generate protocol if not yet cached
        if (!quizResult.protocol) {
          await fetch(
            `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://traversejournal.com"}/api/quiz/protocol?id=${quizResult.id}&token=${quizResult.unsubscribe_token}`
          ).catch(() => {});

          // Re-fetch to get the generated protocol
          const { data: updated } = await supabase
            .from("quiz_results")
            .select("protocol")
            .eq("id", quizResult.id)
            .single();
          if (updated?.protocol) quizResult.protocol = updated.protocol;
        }

        const protocol = quizResult.protocol as { slides?: { title: string }[] } | null;
        const slideTitles = protocol?.slides?.map((s) => s.title) ?? ["Your Pattern", "Your Hidden Costs", "Your Protocol"];
        const archetypeInfo = ARCHETYPES[quizResult.archetype as TradingArchetype];

        success = await sendProtocolDelivery(
          email.email,
          quizResult.id,
          quizResult.unsubscribe_token,
          archetypeInfo?.name ?? quizResult.archetype,
          slideTitles,
        );
      } else {
        // Default: nurture sequence (days 3, 7, 10, 15)
        const { data: quizResult } = await supabase
          .from("quiz_results")
          .select("archetype, scores, unsubscribe_token, waitlist_signup_id")
          .eq("id", email.quiz_result_id)
          .single();

        if (!quizResult) {
          await supabase.from("email_sequences").update({ status: "failed" }).eq("id", email.id);
          failed++;
          continue;
        }

        let discountCode: string | undefined;
        if (quizResult.waitlist_signup_id) {
          const { data: waitlist } = await supabase
            .from("waitlist_signups")
            .select("discount_code")
            .eq("id", quizResult.waitlist_signup_id)
            .single();
          if (waitlist?.discount_code) discountCode = waitlist.discount_code;
        }

        const unsubscribeUrl = `https://traversejournal.com/api/email/unsubscribe?token=${quizResult.unsubscribe_token}`;
        success = await sendNurtureEmail(
          email.email,
          email.day_index,
          quizResult.archetype,
          quizResult.scores,
          unsubscribeUrl,
          discountCode,
        );
      }

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

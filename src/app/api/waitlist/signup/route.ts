import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { sendWaitlistVerification } from "@/lib/email";
import { z } from "zod";
import { TIERS, getTierForPosition, TOTAL_CAP, type WaitlistTier } from "@/lib/waitlist-tiers";

export const dynamic = "force-dynamic";

const SignupSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  referralSource: z.string().max(200).optional(),
  miniArchetype: z.string().max(50).optional(),
  sessionId: z.string().max(100).optional(),
});

export async function POST(req: NextRequest) {
  // Rate limit by IP: 10 signups per hour
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = await rateLimit(`waitlist-signup:${ip}`, 10, 3_600_000);
  if (!rl.success) {
    return NextResponse.json(
      { success: false, error: "Too many attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetMs / 1000)) } }
    );
  }

  let parsed;
  try {
    parsed = SignupSchema.parse(await req.json());
  } catch (err) {
    const msg = err instanceof z.ZodError ? err.issues[0]?.message ?? "Invalid request" : "Invalid request";
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }

  const admin = createAdminClient();

  // Atomic signup via RPC (handles position assignment + cap check)
  const { data, error } = await admin.rpc("waitlist_signup", {
    p_email: parsed.email.toLowerCase().trim(),
    p_ip: ip,
    p_referral: parsed.referralSource ?? null,
  });

  if (error) {
    console.error("[waitlist/signup] rpc failed:", error.message);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }

  const result = data as {
    success: boolean;
    error?: string;
    id?: string;
    position?: number;
    access_token?: string;
    confirmation_token?: string;
    remaining?: number;
    total?: number;
    tier?: WaitlistTier;
    discount?: number;
    email_confirmed?: boolean;
  };

  if (!result.success) {
    if (result.error === "already_exists") {
      // If not yet confirmed, re-send verification email (rate-limited by outer RL)
      if (!result.email_confirmed && result.confirmation_token) {
        sendWaitlistVerification(parsed.email, result.confirmation_token)
          .catch((err) => console.error("[waitlist/signup] resend verification failed:", err));
      }
      return NextResponse.json({
        success: false,
        error: result.email_confirmed
          ? "This email is already on the waitlist!"
          : "We already sent you a confirmation email. Please check your inbox (and spam folder).",
        position: result.position,
        needsConfirmation: !result.email_confirmed,
      });
    }
    if (result.error === "waitlist_full") {
      return NextResponse.json({
        success: false,
        error: `All ${TOTAL_CAP.toLocaleString()} early access spots have been claimed!`,
      });
    }
    return NextResponse.json({ success: false, error: result.error }, { status: 400 });
  }

  // Determine tier info (for display only -- codes are generated on confirmation)
  const tier = result.tier ?? getTierForPosition(result.position!);
  const tierInfo = TIERS[tier];

  // Link archetype data if signup came from quiz
  if (parsed.miniArchetype && result.id) {
    admin.from("waitlist_signups").update({
      mini_archetype: parsed.miniArchetype,
    }).eq("id", result.id).then(({ error: updateErr }) => {
      if (updateErr) console.error("[waitlist/signup] archetype link failed:", updateErr.message);
    });

    // Link mini quiz result if session exists
    if (parsed.sessionId) {
      admin.from("mini_quiz_results").update({
        waitlist_signup_id: result.id,
      }).eq("session_id", parsed.sessionId).is("waitlist_signup_id", null).then(({ error: linkErr }) => {
        if (linkErr) console.error("[waitlist/signup] quiz result link failed:", linkErr.message);
      });
    }
  }

  // Send verification email (non-blocking) -- codes come after confirmation
  sendWaitlistVerification(parsed.email, result.confirmation_token!)
    .catch((err) => console.error("[waitlist/signup] verification email failed:", err));

  // Schedule confirmation reminder emails (24h and 72h after signup)
  if (result.id) {
    const now = new Date();
    const reminder24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const reminder72h = new Date(now.getTime() + 72 * 60 * 60 * 1000);
    admin.from("email_sequences").insert([
      {
        email: parsed.email,
        waitlist_signup_id: result.id,
        sequence_name: "confirmation_reminder",
        day_index: 1,
        scheduled_for: reminder24h.toISOString(),
        status: "pending",
      },
      {
        email: parsed.email,
        waitlist_signup_id: result.id,
        sequence_name: "confirmation_reminder",
        day_index: 3,
        scheduled_for: reminder72h.toISOString(),
        status: "pending",
      },
    ]).then(({ error: seqErr }) => {
      if (seqErr) console.error("[waitlist/signup] reminder scheduling failed:", seqErr.message);
    });
  }

  return NextResponse.json({
    success: true,
    position: result.position,
    remaining: result.remaining,
    tier: tierInfo.name,
    needsConfirmation: true,
  });
}

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { sendWaitlistWelcome } from "@/lib/email";
import { TIERS, type WaitlistTier } from "@/lib/waitlist-tiers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token)) {
    return NextResponse.redirect(new URL("/waitlist/confirm?status=invalid", req.url));
  }

  // Rate limit by IP
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = await rateLimit(`waitlist-confirm:${ip}`, 20, 3_600_000);
  if (!rl.success) {
    return NextResponse.redirect(new URL("/waitlist/confirm?status=invalid", req.url));
  }

  const admin = createAdminClient();

  // Look up signup by confirmation token
  const { data: signup, error } = await admin
    .from("waitlist_signups")
    .select("id, email, position, tier, access_token, email_confirmed, discount_code, referral_code, mini_archetype")
    .eq("confirmation_token", token)
    .single();

  if (error || !signup) {
    return NextResponse.redirect(new URL("/waitlist/confirm?status=invalid", req.url));
  }

  // Already confirmed
  if (signup.email_confirmed) {
    return NextResponse.redirect(
      new URL(`/waitlist/confirm?status=already&position=${signup.position}`, req.url)
    );
  }

  // Confirm the email
  await admin
    .from("waitlist_signups")
    .update({ email_confirmed: true, updated_at: new Date().toISOString() })
    .eq("id", signup.id);

  // Generate discount + referral codes now (deferred from signup)
  const tier = (signup.tier ?? "trailblazer") as WaitlistTier;
  const tierInfo = TIERS[tier];
  const discount = tierInfo.discount;
  const discountCode = `${tierInfo.codePrefix}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const referralCode = `REF-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

  // Insert discount code
  await admin.from("discount_codes").insert({
    code: discountCode,
    discount_type: "percentage",
    discount_value: discount,
    applicable_tiers: ["pro", "max"],
    applicable_billing: ["monthly", "yearly"],
    description: `${tierInfo.name} waitlist #${signup.position} - ${discount}% forever`,
    max_uses: 1,
    is_active: true,
  });

  // Update signup with codes
  await admin
    .from("waitlist_signups")
    .update({ discount_code: discountCode, referral_code: referralCode })
    .eq("id", signup.id);

  // Schedule quiz invitation email for next day at 10am
  const quizInviteDate = new Date();
  quizInviteDate.setDate(quizInviteDate.getDate() + 1);
  quizInviteDate.setHours(10, 0, 0, 0);
  await admin.from("email_sequences").insert({
    email: signup.email,
    waitlist_signup_id: signup.id,
    sequence_name: "waitlist_nurture",
    day_index: 1,
    scheduled_for: quizInviteDate.toISOString(),
    status: "pending",
  });

  // Send welcome email (non-blocking)
  const voteLink = `https://traversejournal.com/waitlist/vote?token=${signup.access_token}`;
  const referralLink = `https://traversejournal.com/?ref=${referralCode}`;
  // If user came from mini quiz, link to deep quiz; otherwise generic quiz
  const quizLink = signup.mini_archetype
    ? `https://traversejournal.com/quiz/deep?token=${signup.access_token}`
    : `https://traversejournal.com/quiz?token=${signup.access_token}`;
  sendWaitlistWelcome(
    signup.email,
    signup.position,
    voteLink,
    discountCode,
    referralLink,
    referralCode,
    quizLink,
    tierInfo.name,
    discount
  ).catch((err) => console.error("[waitlist/confirm] welcome email failed:", err));

  const tierName = encodeURIComponent(tierInfo.name);
  return NextResponse.redirect(
    new URL(`/waitlist/confirm?status=success&position=${signup.position}&tier=${tierName}`, req.url)
  );
}

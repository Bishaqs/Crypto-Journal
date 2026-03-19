import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { sendWaitlistConfirmation } from "@/lib/email";
import { z } from "zod";

export const dynamic = "force-dynamic";

const SignupSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  referralSource: z.string().max(200).optional(),
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
    remaining?: number;
    total?: number;
  };

  if (!result.success) {
    if (result.error === "already_exists") {
      return NextResponse.json({
        success: false,
        error: "This email is already on the waitlist!",
        position: result.position,
      });
    }
    if (result.error === "waitlist_full") {
      return NextResponse.json({
        success: false,
        error: "All 100 early access spots have been claimed!",
      });
    }
    return NextResponse.json({ success: false, error: result.error }, { status: 400 });
  }

  // Generate discount code
  const discountCode = `TRAVERSE50-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const referralCode = `REF-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

  // Insert into discount_codes table
  const { error: discountErr } = await admin.from("discount_codes").insert({
    code: discountCode,
    discount_type: "percentage",
    discount_value: 50,
    applicable_tiers: ["pro", "max"],
    applicable_billing: ["monthly", "yearly"],
    description: `Early access waitlist #${result.position} - 50% forever`,
    max_uses: 1,
    is_active: true,
  });

  if (discountErr) {
    console.error("[waitlist/signup] discount code insert failed:", discountErr.message);
  }

  // Update waitlist row with discount + referral codes
  await admin
    .from("waitlist_signups")
    .update({ discount_code: discountCode, referral_code: referralCode })
    .eq("id", result.id);

  // Send confirmation email (non-blocking)
  sendWaitlistConfirmation(
    parsed.email,
    result.position!,
    result.access_token!,
    discountCode,
    referralCode
  ).catch((err) => console.error("[waitlist/signup] email failed:", err));

  return NextResponse.json({
    success: true,
    position: result.position,
    remaining: result.remaining,
  });
}

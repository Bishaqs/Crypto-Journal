import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

export const dynamic = "force-dynamic";

const ApplyDiscountSchema = z.object({
  code: z.string().min(1, "Code is required").max(50),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`discount:${user.id}`, 5, 60_000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many attempts — try again later" }, { status: 429 });
  }

  let parsed;
  try {
    parsed = ApplyDiscountSchema.parse(await req.json());
  } catch (err) {
    const msg = err instanceof z.ZodError ? err.issues[0]?.message ?? "Invalid request" : "Invalid request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    console.error("[discount/apply] Admin client failed:", err);
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  // Look up the discount code
  const { data: discountCode, error: lookupErr } = await admin
    .from("discount_codes")
    .select("id, code, discount_type, discount_value, max_uses, current_uses, is_active, expires_at")
    .eq("code", parsed.code.toUpperCase().trim())
    .maybeSingle();

  if (lookupErr || !discountCode) {
    return NextResponse.json({ error: "Invalid discount code" }, { status: 400 });
  }

  if (!discountCode.is_active) {
    return NextResponse.json({ error: "This discount code is no longer active" }, { status: 400 });
  }

  if (discountCode.expires_at && new Date(discountCode.expires_at) < new Date()) {
    return NextResponse.json({ error: "This discount code has expired" }, { status: 400 });
  }

  if (discountCode.max_uses !== null && discountCode.current_uses >= discountCode.max_uses) {
    return NextResponse.json({ error: "This discount code has reached its usage limit" }, { status: 400 });
  }

  // Check if user already redeemed this code
  const { data: existing } = await admin
    .from("discount_code_redemptions")
    .select("id")
    .eq("discount_code_id", discountCode.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "You have already applied this discount code" }, { status: 400 });
  }

  // Store the discount code on the user's subscription
  const { error: updateErr } = await admin
    .from("user_subscriptions")
    .update({
      applied_discount_code: discountCode.code,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (updateErr) {
    console.error("[discount/apply] update subscription failed:", updateErr.message);
    return NextResponse.json({ error: "Failed to apply discount code" }, { status: 500 });
  }

  // Log the redemption
  const { error: redeemErr } = await admin.from("discount_code_redemptions").insert({
    discount_code_id: discountCode.id,
    user_id: user.id,
  });

  if (redeemErr) {
    console.error("[discount/apply] redemption log failed:", redeemErr.message);
    return NextResponse.json({ error: "Failed to process redemption" }, { status: 500 });
  }

  // Atomic increment to prevent race condition with concurrent redemptions
  await admin.rpc("increment_counter", {
    table_name: "discount_codes",
    row_id: discountCode.id,
    column_name: "current_uses",
  });

  return NextResponse.json({
    success: true,
    discountType: discountCode.discount_type,
    discountValue: discountCode.discount_value,
    code: discountCode.code,
  });
}

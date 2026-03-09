import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

export const dynamic = "force-dynamic";

const CreateDiscountSchema = z.object({
  discountType: z.enum(["percentage", "fixed"]),
  discountValue: z.number().positive("Discount value must be positive"),
  applicableTiers: z.array(z.enum(["pro", "max"])).default(["pro", "max"]),
  applicableBilling: z.array(z.enum(["monthly", "yearly"])).default(["monthly", "yearly"]),
  description: z.string().max(200).optional(),
  maxUses: z.number().int().positive().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
});

const DiscountIdSchema = z.object({
  id: z.string().uuid("Invalid code ID format"),
});

async function verifyOwner(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const ownerEmail = process.env.OWNER_EMAIL || process.env.NEXT_PUBLIC_OWNER_EMAIL;
  let isOwner = !!(ownerEmail && user.email?.toLowerCase() === ownerEmail.toLowerCase());

  if (!isOwner) {
    const { data: sub } = await supabase
      .from("user_subscriptions")
      .select("is_owner")
      .eq("user_id", user.id)
      .maybeSingle();
    if (sub?.is_owner) isOwner = true;
  }

  return isOwner ? user : null;
}

// POST: Create discount code
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const user = await verifyOwner(supabase);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`admin:${user.id}`, 30, 60_000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let parsed;
  try {
    parsed = CreateDiscountSchema.parse(await req.json());
  } catch (err) {
    const msg = err instanceof z.ZodError ? err.issues[0]?.message ?? "Invalid request" : "Invalid request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // Validate percentage <= 100
  if (parsed.discountType === "percentage" && parsed.discountValue > 100) {
    return NextResponse.json({ error: "Percentage discount cannot exceed 100" }, { status: 400 });
  }

  const code = `STARGATE-DISC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    console.error("[admin/discount] Admin client failed:", err);
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const { data, error } = await admin.from("discount_codes").insert({
    code,
    discount_type: parsed.discountType,
    discount_value: parsed.discountValue,
    applicable_tiers: parsed.applicableTiers,
    applicable_billing: parsed.applicableBilling,
    description: parsed.description || null,
    max_uses: parsed.maxUses ?? null,
    expires_at: parsed.expiresAt ?? null,
    created_by: user.id,
  }).select().single();

  if (error) {
    console.error("[admin/discount] create failed:", error.message);
    return NextResponse.json({ error: "Failed to create discount code" }, { status: 500 });
  }

  return NextResponse.json({ success: true, code: data });
}

// PATCH: Deactivate discount code
export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const user = await verifyOwner(supabase);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let parsed;
  try {
    parsed = DiscountIdSchema.parse(await req.json());
  } catch (err) {
    const msg = err instanceof z.ZodError ? err.issues[0]?.message ?? "Invalid request" : "Invalid request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    console.error("[admin/discount] Admin client failed:", err);
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const { error } = await admin
    .from("discount_codes")
    .update({ is_active: false })
    .eq("id", parsed.id);

  if (error) {
    console.error("[admin/discount] deactivate failed:", error.message);
    return NextResponse.json({ error: "Failed to deactivate code" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// DELETE: Hard delete discount code
export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const user = await verifyOwner(supabase);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let parsed;
  try {
    parsed = DiscountIdSchema.parse(await req.json());
  } catch (err) {
    const msg = err instanceof z.ZodError ? err.issues[0]?.message ?? "Invalid request" : "Invalid request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    console.error("[admin/discount] Admin client failed:", err);
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  // Delete redemptions first (FK constraint), then the code
  await admin.from("discount_code_redemptions").delete().eq("discount_code_id", parsed.id);
  const { error } = await admin.from("discount_codes").delete().eq("id", parsed.id);

  if (error) {
    console.error("[admin/discount] delete failed:", error.message);
    return NextResponse.json({ error: "Failed to delete code" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

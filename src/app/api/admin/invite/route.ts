import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const CreateInviteSchema = z.object({
  tier: z.enum(["pro", "max"]).default("max"),
  description: z.string().max(200).optional(),
  maxUses: z.number().int().positive().nullable().optional(),
});

const InviteIdSchema = z.object({
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

// POST: Create invite code
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const user = await verifyOwner(supabase);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`admin:${user.id}`, 30, 60_000);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetMs / 1000)) } },
    );
  }

  let parsed;
  try {
    parsed = CreateInviteSchema.parse(await req.json());
  } catch (err) {
    const msg = err instanceof z.ZodError ? err.issues[0]?.message ?? "Invalid request" : "Invalid request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const tier = parsed.tier;
  const code = `STARGATE-${tier.toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    console.error("[admin/invite] Admin client failed:", err);
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const { data, error } = await admin.from("invite_codes").insert({
    code,
    grants_tier: tier,
    description: parsed.description || null,
    max_uses: parsed.maxUses ?? null,
    created_by: user.id,
  }).select().single();

  if (error) {
    console.error("[admin/invite] create failed:", error.message);
    return NextResponse.json({ error: "Failed to create code" }, { status: 500 });
  }

  return NextResponse.json({ success: true, code: data });
}

// PATCH: Deactivate invite code
export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const user = await verifyOwner(supabase);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let patchParsed;
  try {
    patchParsed = InviteIdSchema.parse(await req.json());
  } catch (err) {
    const msg = err instanceof z.ZodError ? err.issues[0]?.message ?? "Invalid request" : "Invalid request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    console.error("[admin/invite] Admin client failed:", err);
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const { error } = await admin
    .from("invite_codes")
    .update({ is_active: false })
    .eq("id", patchParsed.id);

  if (error) {
    console.error("[admin/invite] deactivate failed:", error.message);
    return NextResponse.json({ error: "Failed to deactivate code" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// DELETE: Hard delete invite code
export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const user = await verifyOwner(supabase);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let delParsed;
  try {
    delParsed = InviteIdSchema.parse(await req.json());
  } catch (err) {
    const msg = err instanceof z.ZodError ? err.issues[0]?.message ?? "Invalid request" : "Invalid request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    console.error("[admin/invite] Admin client failed:", err);
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  // Delete redemptions first (FK constraint), then the code
  await admin.from("invite_code_redemptions").delete().eq("invite_code_id", delParsed.id);
  const { error } = await admin.from("invite_codes").delete().eq("id", delParsed.id);

  if (error) {
    console.error("[admin/invite] delete failed:", error.message);
    return NextResponse.json({ error: "Failed to delete code" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

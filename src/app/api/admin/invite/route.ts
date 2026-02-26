import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

  let body: { tier?: string; description?: string; maxUses?: number | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const tier = body.tier === "pro" ? "pro" : "max";
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
    description: body.description || null,
    max_uses: body.maxUses ?? null,
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

  let body: { id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!body.id) {
    return NextResponse.json({ error: "Code ID required" }, { status: 400 });
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
    .eq("id", body.id);

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

  let body: { id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!body.id) {
    return NextResponse.json({ error: "Code ID required" }, { status: 400 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    console.error("[admin/invite] Admin client failed:", err);
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  // Delete redemptions first (FK constraint), then the code
  await admin.from("invite_code_redemptions").delete().eq("invite_code_id", body.id);
  const { error } = await admin.from("invite_codes").delete().eq("id", body.id);

  if (error) {
    console.error("[admin/invite] delete failed:", error.message);
    return NextResponse.json({ error: "Failed to delete code" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

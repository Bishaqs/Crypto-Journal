import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

async function verifyOwner() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const ownerEmail = (process.env.OWNER_EMAIL || process.env.NEXT_PUBLIC_OWNER_EMAIL || "").toLowerCase();
  if (user.email?.toLowerCase() === ownerEmail) return user;

  // Fallback: check DB
  const admin = createAdminClient();
  const { data: sub } = await admin
    .from("user_subscriptions")
    .select("is_owner")
    .eq("user_id", user.id)
    .maybeSingle();

  if (sub?.is_owner) return user;
  return null;
}

// GET — list all waitlist signups
export async function GET() {
  const user = await verifyOwner();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("waitlist_signups")
    .select("id, email, position, discount_code, email_confirmed, ip_address, referral_source, created_at")
    .order("position", { ascending: true });

  if (error) {
    console.error("[admin/waitlist] fetch failed:", error.message);
    return NextResponse.json({ error: "Failed to load waitlist" }, { status: 500 });
  }

  return NextResponse.json({ signups: data ?? [] });
}

// DELETE — delete or block a waitlist signup
export async function DELETE(req: NextRequest) {
  const user = await verifyOwner();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await rateLimit(`admin-waitlist:${user.id}`, 30, 60_000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: { id?: string; action?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }

  const { id, action } = body;
  if (!id || !action || !["delete", "block"].includes(action)) {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }

  const admin = createAdminClient();

  if (action === "block") {
    // Get the email first, then delete the signup and its discount code
    const { data: signup } = await admin
      .from("waitlist_signups")
      .select("email, discount_code")
      .eq("id", id)
      .maybeSingle();

    if (!signup) {
      return NextResponse.json({ success: false, error: "Signup not found" }, { status: 404 });
    }

    // Deactivate the discount code
    if (signup.discount_code) {
      await admin
        .from("discount_codes")
        .update({ is_active: false })
        .eq("code", signup.discount_code);
    }

    // Delete votes by this signup
    await admin
      .from("feature_votes")
      .delete()
      .eq("waitlist_signup_id", id);

    // Delete the signup
    const { error } = await admin
      .from("waitlist_signups")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("[admin/waitlist] block failed:", error.message);
      return NextResponse.json({ success: false, error: "Failed to block" }, { status: 500 });
    }

    return NextResponse.json({ success: true, blocked: signup.email });
  }

  if (action === "delete") {
    // Delete votes first (foreign key)
    await admin
      .from("feature_votes")
      .delete()
      .eq("waitlist_signup_id", id);

    const { error } = await admin
      .from("waitlist_signups")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("[admin/waitlist] delete failed:", error.message);
      return NextResponse.json({ success: false, error: "Failed to delete" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
}

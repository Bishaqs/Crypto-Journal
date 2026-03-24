import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { sendAccessApprovedEmail } from "@/lib/email";
import { z } from "zod";

export const dynamic = "force-dynamic";

async function verifyOwner() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const ownerEmail = (
    process.env.OWNER_EMAIL ||
    process.env.NEXT_PUBLIC_OWNER_EMAIL ||
    ""
  ).toLowerCase();
  if (user.email?.toLowerCase() === ownerEmail) return user;

  const admin = createAdminClient();
  const { data: sub } = await admin
    .from("user_subscriptions")
    .select("is_owner")
    .eq("user_id", user.id)
    .maybeSingle();

  if (sub?.is_owner) return user;
  return null;
}

// GET — list access requests (default: pending)
export async function GET(req: NextRequest) {
  const user = await verifyOwner();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const status = req.nextUrl.searchParams.get("status") || "pending";
  const admin = createAdminClient();

  let query = admin
    .from("access_requests")
    .select("id, user_id, email, status, deny_reason, reviewed_at, created_at")
    .order("created_at", { ascending: false });

  if (status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[admin/access-requests] fetch failed:", error.message);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }

  return NextResponse.json({ requests: data ?? [] });
}

const ActionSchema = z.object({
  id: z.string().uuid(),
  action: z.enum(["approve", "deny"]),
  reason: z.string().max(500).optional(),
});

// POST — approve or deny an access request
export async function POST(req: NextRequest) {
  const user = await verifyOwner();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await rateLimit(`admin-access-requests:${user.id}`, 60, 60_000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = ActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { id, action, reason } = parsed.data;
  const admin = createAdminClient();

  // Fetch the request
  const { data: request, error: fetchError } = await admin
    .from("access_requests")
    .select("id, email, status")
    .eq("id", id)
    .single();

  if (fetchError || !request) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  if (request.status !== "pending") {
    return NextResponse.json(
      { error: `Request already ${request.status}` },
      { status: 400 }
    );
  }

  if (action === "approve") {
    // Grant early access (reuses existing mechanism)
    const { error: grantError } = await admin
      .from("early_access_emails")
      .upsert(
        { email: request.email, granted_by: "access_request", note: "Approved via access request" },
        { onConflict: "email", ignoreDuplicates: true }
      );

    if (grantError) {
      console.error("[admin/access-requests] grant failed:", grantError.message);
      return NextResponse.json({ error: "Failed to grant access" }, { status: 500 });
    }

    // Update request status
    await admin
      .from("access_requests")
      .update({ status: "approved", reviewed_at: new Date().toISOString() })
      .eq("id", id);

    // Send approval email (fire-and-forget)
    sendAccessApprovedEmail(request.email).catch((err) =>
      console.error("[admin/access-requests] email failed:", err)
    );

    return NextResponse.json({ success: true, action: "approved" });
  }

  // Deny
  await admin
    .from("access_requests")
    .update({
      status: "denied",
      deny_reason: reason ?? null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);

  return NextResponse.json({ success: true, action: "denied" });
}

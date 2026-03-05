import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import { z } from "zod";

const SignupSchema = z.object({
  userId: z.string().uuid("Invalid user ID format"),
});

export async function POST(request: Request) {
  try {
    // Auth check: caller must have a valid session
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit: 5 attempts per minute per user
    const rl = await rateLimit(`signup:${user.id}`, 5, 60_000);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many requests. Please wait." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetMs / 1000)) } },
      );
    }

    const body = await request.json();
    const parsed = SignupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request" },
        { status: 400 },
      );
    }

    const { userId } = parsed.data;

    // Identity check: caller can only confirm their own email
    if (userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Auto-confirm email — just flips the flag, no trigger involvement
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.updateUserById(userId, {
      email_confirm: true,
    });

    if (error) {
      return NextResponse.json(
        { error: "Failed to confirm email" },
        { status: 400 },
      );
    }

    // Belt-and-suspenders: ensure subscription row exists
    // (trigger should create it, but if it fails, we catch it here)
    const { error: subError } = await admin
      .from("user_subscriptions")
      .upsert(
        { user_id: userId, tier: "free" },
        { onConflict: "user_id", ignoreDuplicates: true },
      );

    if (subError) {
      console.error("[signup] subscription upsert failed:", subError.message);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sendWelcomeEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const SignupSchema = z.object({
  userId: z.string().uuid("Invalid user ID format"),
});

export async function POST(request: Request) {
  try {
    // 1. Auth check — caller must be logged in
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Rate limit
    const rl = await rateLimit(`signup:${user.id}`, 5, 60_000);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many requests. Please wait." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil(rl.resetMs / 1000)) },
        }
      );
    }

    // 3. Validate body
    const body = await request.json();
    const parsed = SignupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // 4. Identity check — can only confirm your own email
    const { userId } = parsed.data;
    if (userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 5. Confirm email + ensure subscription row
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.updateUserById(userId, {
      email_confirm: true,
    });

    if (error) {
      return NextResponse.json(
        { error: "Failed to confirm email" },
        { status: 400 }
      );
    }

    const { error: subError } = await admin
      .from("user_subscriptions")
      .upsert(
        { user_id: userId, tier: "free" },
        { onConflict: "user_id", ignoreDuplicates: true }
      );

    if (subError) {
      console.error("[signup] subscription upsert failed:", subError.message);
    }

    // Send welcome email (non-blocking)
    if (user.email) {
      sendWelcomeEmail(user.email, user.user_metadata?.full_name).catch(
        (err) => console.error("[signup] welcome email failed:", err)
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

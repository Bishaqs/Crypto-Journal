import { createAdminClient } from "@/lib/supabase/admin";
import { sendPasswordReset } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const ALLOWED_REDIRECT_HOSTS = ["traversejournal.com", "www.traversejournal.com"];
if (process.env.NODE_ENV === "development") {
  ALLOWED_REDIRECT_HOSTS.push("localhost");
}

const ResetSchema = z.object({
  email: z.string().email(),
  redirectTo: z.string().url().refine(
    (url) => {
      try {
        const hostname = new URL(url).hostname;
        return ALLOWED_REDIRECT_HOSTS.some((h) => hostname === h || hostname.endsWith(`.${h}`));
      } catch {
        return false;
      }
    },
    "Redirect URL must point to traversejournal.com",
  ),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = ResetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { email, redirectTo } = parsed.data;

    // Rate limit by email to prevent abuse
    const rl = await rateLimit(`reset:${email}`, 3, 300_000); // 3 per 5 min
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many requests. Please wait." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil(rl.resetMs / 1000)) },
        }
      );
    }

    const admin = createAdminClient();

    const { data, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo },
    });

    if (error) {
      // Don't leak whether the email exists
      console.error("[reset-password] generateLink error:", error.message);
      return NextResponse.json({ success: true });
    }

    const resetLink = data.properties.action_link;
    await sendPasswordReset(email, resetLink);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[reset-password] unexpected error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

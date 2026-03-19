import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { checkProfanity } from "@/lib/profanity-filter";
import { z } from "zod";

export const dynamic = "force-dynamic";

const SuggestSchema = z.object({
  token: z.string().uuid("Invalid token").optional(),
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title must be under 100 characters"),
  description: z.string().max(500, "Description must be under 500 characters").optional(),
  category: z.enum(["analytics", "psychology", "automation", "social", "general"]).default("general"),
  dashboard: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  let parsed;
  try {
    parsed = SuggestSchema.parse(await req.json());
  } catch (err) {
    const msg = err instanceof z.ZodError ? err.issues[0]?.message ?? "Invalid request" : "Invalid request";
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }

  // Determine rate limit key
  let rateLimitKey: string;
  if (parsed.token) {
    rateLimitKey = `waitlist-suggest:${parsed.token}`;
  } else if (parsed.dashboard) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    rateLimitKey = `waitlist-suggest:${user.id}`;
  } else {
    return NextResponse.json({ success: false, error: "Token required" }, { status: 400 });
  }

  const rl = await rateLimit(rateLimitKey, 3, 3_600_000);
  if (!rl.success) {
    return NextResponse.json(
      { success: false, error: "You can suggest up to 3 features per hour." },
      { status: 429 }
    );
  }

  // Profanity check
  const titleCheck = checkProfanity(parsed.title);
  if (!titleCheck.isClean) {
    return NextResponse.json({ success: false, error: titleCheck.reason }, { status: 400 });
  }
  if (parsed.description) {
    const descCheck = checkProfanity(parsed.description);
    if (!descCheck.isClean) {
      return NextResponse.json({ success: false, error: descCheck.reason }, { status: 400 });
    }
  }

  const admin = createAdminClient();

  // Validate: token-based or dashboard auth
  if (parsed.token) {
    const { data: signup } = await admin
      .from("waitlist_signups")
      .select("id")
      .eq("access_token", parsed.token)
      .maybeSingle();
    if (!signup) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });
    }
  }

  // Insert suggestion (needs admin approval)
  const { error } = await admin.from("feature_proposals").insert({
    title: parsed.title,
    description: parsed.description ?? null,
    category: parsed.category,
    is_approved: false,
    created_by_admin: false,
  });

  if (error) {
    console.error("[waitlist/suggest] insert failed:", error.message);
    return NextResponse.json(
      { success: false, error: "Failed to submit suggestion" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}

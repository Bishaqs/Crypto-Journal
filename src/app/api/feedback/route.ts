import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const FeedbackSchema = z.object({
  category: z.enum(["bug", "feature", "general"]).default("general"),
  message: z.string().min(10, "Message must be at least 10 characters").max(2000, "Message must be under 2000 characters"),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`feedback:${user.id}`, 5, 60_000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests. Please wait before submitting again." }, { status: 429 });
  }

  let parsed;
  try {
    parsed = FeedbackSchema.parse(await req.json());
  } catch (err) {
    const msg = err instanceof z.ZodError ? err.issues[0]?.message ?? "Invalid request" : "Invalid request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { error } = await supabase.from("feedback").insert({
    user_id: user.id,
    category: parsed.category,
    message: parsed.message,
  });

  if (error) {
    console.error("[feedback] insert failed:", error.message);
    return NextResponse.json({ error: "Failed to submit feedback" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("feedback")
    .select("id, category, message, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("[feedback] fetch failed:", error.message);
    return NextResponse.json({ error: "Failed to load feedback" }, { status: 500 });
  }

  return NextResponse.json({ feedback: data ?? [] });
}

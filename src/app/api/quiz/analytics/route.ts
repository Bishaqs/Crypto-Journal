import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

export const dynamic = "force-dynamic";

const EventSchema = z.object({
  sessionId: z.string().min(1).max(100),
  eventType: z.enum([
    "mini_quiz_start",
    "mini_quiz_complete",
    "archetype_reveal_view",
    "archetype_share",
    "waitlist_signup_from_quiz",
    "deep_quiz_start",
    "deep_quiz_complete",
  ]),
  archetype: z.string().max(50).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = await rateLimit(`funnel-event:${ip}`, 30, 3_600_000);
  if (!rl.success) {
    return NextResponse.json({ success: false }, { status: 429 });
  }

  let parsed;
  try {
    parsed = EventSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  const admin = createAdminClient();

  await admin.from("funnel_events").insert({
    session_id: parsed.sessionId,
    event_type: parsed.eventType,
    archetype: parsed.archetype ?? null,
    metadata: parsed.metadata ?? {},
    ip_address: ip,
  });

  return NextResponse.json({ success: true });
}

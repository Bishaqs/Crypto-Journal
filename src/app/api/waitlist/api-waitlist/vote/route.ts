import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

export const dynamic = "force-dynamic";

const VoteSchema = z.object({
  token: z.string().uuid("Invalid token"),
  proposalId: z.string().uuid("Invalid proposal"),
  action: z.enum(["vote", "unvote"]),
});

// GET — List proposals + user's votes
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Token required" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Validate token
  const { data: signup, error: signupErr } = await admin
    .from("waitlist_signups")
    .select("id, position, email")
    .eq("access_token", token)
    .maybeSingle();

  if (signupErr || !signup) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }

  // Fetch approved proposals
  const { data: proposals, error: proposalErr } = await admin
    .from("feature_proposals")
    .select("id, title, description, category, vote_count, created_at")
    .eq("is_approved", true)
    .order("vote_count", { ascending: false });

  if (proposalErr) {
    console.error("[waitlist/vote] proposals fetch failed:", proposalErr.message);
    return NextResponse.json({ error: "Failed to load proposals" }, { status: 500 });
  }

  // Fetch user's existing votes
  const { data: userVotes } = await admin
    .from("feature_votes")
    .select("proposal_id")
    .eq("waitlist_signup_id", signup.id);

  const votedIds = new Set((userVotes ?? []).map((v: { proposal_id: string }) => v.proposal_id));

  return NextResponse.json({
    position: signup.position,
    proposals: (proposals ?? []).map((p: { id: string; title: string; description: string | null; category: string; vote_count: number; created_at: string }) => ({
      ...p,
      hasVoted: votedIds.has(p.id),
    })),
  });
}

// POST — Cast or remove a vote
export async function POST(req: NextRequest) {
  let parsed;
  try {
    parsed = VoteSchema.parse(await req.json());
  } catch (err) {
    const msg = err instanceof z.ZodError ? err.issues[0]?.message ?? "Invalid request" : "Invalid request";
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }

  // Rate limit by token: 20 votes per minute
  const rl = await rateLimit(`waitlist-vote:${parsed.token}`, 20, 60_000);
  if (!rl.success) {
    return NextResponse.json(
      { success: false, error: "Too many votes. Please slow down." },
      { status: 429 }
    );
  }

  const admin = createAdminClient();
  const rpcName = parsed.action === "vote" ? "cast_feature_vote" : "remove_feature_vote";

  const { data, error } = await admin.rpc(rpcName, {
    p_token: parsed.token,
    p_proposal_id: parsed.proposalId,
  });

  if (error) {
    console.error(`[waitlist/vote] ${rpcName} failed:`, error.message);
    return NextResponse.json(
      { success: false, error: "Failed to process vote" },
      { status: 500 }
    );
  }

  return NextResponse.json(data as object);
}

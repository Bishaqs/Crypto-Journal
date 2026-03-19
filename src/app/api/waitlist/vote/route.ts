import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

export const dynamic = "force-dynamic";

const VoteSchema = z.object({
  token: z.string().uuid("Invalid token").optional(),
  proposalId: z.string().uuid("Invalid proposal"),
  action: z.enum(["vote", "unvote"]),
  dashboard: z.boolean().optional(),
});

// Resolve waitlist signup — by token or by authenticated user's email
async function resolveSignup(admin: ReturnType<typeof createAdminClient>, token?: string | null, dashboard?: boolean) {
  if (token) {
    const { data } = await admin
      .from("waitlist_signups")
      .select("id, position, email")
      .eq("access_token", token)
      .maybeSingle();
    return data;
  }

  if (dashboard) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return null;

    const { data } = await admin
      .from("waitlist_signups")
      .select("id, position, email, access_token")
      .eq("email", user.email.toLowerCase())
      .maybeSingle();
    return data;
  }

  return null;
}

// GET — List proposals + user's votes
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const dashboard = req.nextUrl.searchParams.get("dashboard") === "1";

  if (!token && !dashboard) {
    return NextResponse.json({ error: "Token required" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Fetch approved proposals (always visible)
  const { data: proposals, error: proposalErr } = await admin
    .from("feature_proposals")
    .select("id, title, description, category, vote_count, created_at")
    .eq("is_approved", true)
    .order("vote_count", { ascending: false });

  if (proposalErr) {
    console.error("[waitlist/vote] proposals fetch failed:", proposalErr.message);
    return NextResponse.json({ error: "Failed to load proposals" }, { status: 500 });
  }

  // Try to resolve the user's waitlist signup for vote tracking
  const signup = await resolveSignup(admin, token, dashboard);

  let votedIds = new Set<string>();
  if (signup) {
    const { data: userVotes } = await admin
      .from("feature_votes")
      .select("proposal_id")
      .eq("waitlist_signup_id", signup.id);
    votedIds = new Set((userVotes ?? []).map((v: { proposal_id: string }) => v.proposal_id));
  }

  return NextResponse.json({
    position: signup?.position ?? null,
    canVote: !!signup,
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

  const admin = createAdminClient();

  // Resolve the user's waitlist signup
  const signup = await resolveSignup(admin, parsed.token, parsed.dashboard);
  if (!signup) {
    return NextResponse.json({ success: false, error: "You must be on the waitlist to vote" }, { status: 403 });
  }

  // Get the access token for the RPC call
  const accessToken = parsed.token || ('access_token' in signup ? (signup as { access_token: string }).access_token : null);
  if (!accessToken) {
    return NextResponse.json({ success: false, error: "Unable to resolve voting token" }, { status: 400 });
  }

  // Rate limit
  const rl = await rateLimit(`waitlist-vote:${accessToken}`, 20, 60_000);
  if (!rl.success) {
    return NextResponse.json({ success: false, error: "Too many votes. Please slow down." }, { status: 429 });
  }

  const rpcName = parsed.action === "vote" ? "cast_feature_vote" : "remove_feature_vote";
  const { data, error } = await admin.rpc(rpcName, {
    p_token: accessToken,
    p_proposal_id: parsed.proposalId,
  });

  if (error) {
    console.error(`[waitlist/vote] ${rpcName} failed:`, error.message);
    return NextResponse.json({ success: false, error: "Failed to process vote" }, { status: 500 });
  }

  return NextResponse.json(data as object);
}

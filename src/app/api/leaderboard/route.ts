import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const UpdateProfileSchema = z.object({
  display_name: z.string().trim().min(2).max(30),
  is_public: z.boolean().optional().default(true),
  show_level: z.boolean().optional().default(true),
  show_achievements: z.boolean().optional().default(true),
  show_streak: z.boolean().optional().default(true),
});

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const sort = searchParams.get("sort") ?? "xp";
  const limit = Math.min(Number(searchParams.get("limit") ?? 50), 100);
  const offset = Number(searchParams.get("offset") ?? 0);

  try {
    // Try refreshing the materialized view (only if stale)
    try {
      await supabase.rpc("refresh_leaderboard_if_stale");
    } catch {
      // The function may not exist yet — fall back to direct query
    }

    // Query leaderboard from the materialized view
    let query = supabase
      .from("leaderboard_view")
      .select("*")
      .range(offset, offset + limit - 1);

    switch (sort) {
      case "streak":
        query = query.order("current_streak", { ascending: false });
        break;
      case "achievements":
        query = query.order("achievement_count", { ascending: false });
        break;
      default:
        query = query
          .order("current_level", { ascending: false })
          .order("total_xp", { ascending: false });
    }

    const { data: entries, error } = await query;

    if (error) {
      // Materialized view might not exist — fall back to direct query
      const { data: fallbackEntries } = await supabase
        .from("user_profiles")
        .select("user_id, display_name, avatar_frame, banner, title_badge, is_public")
        .eq("is_public", true)
        .limit(limit);

      return NextResponse.json({
        entries: fallbackEntries ?? [],
        myPosition: null,
      });
    }

    // Get current user's position
    let myPosition = null;
    const { data: myProfile } = await supabase
      .from("user_profiles")
      .select("user_id, display_name, is_public")
      .eq("user_id", user.id)
      .maybeSingle();

    if (myProfile?.is_public) {
      const myEntry = entries?.find((e) => e.user_id === user.id);
      if (myEntry) {
        const rank = (entries?.indexOf(myEntry) ?? 0) + offset + 1;
        myPosition = { ...myEntry, rank };
      }
    }

    return NextResponse.json({
      entries: entries ?? [],
      myPosition,
      hasProfile: !!myProfile,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = UpdateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { display_name, is_public, show_level, show_achievements, show_streak } = parsed.data;

  const { error } = await supabase.from("user_profiles").upsert(
    {
      user_id: user.id,
      display_name,
      is_public,
      show_level,
      show_achievements,
      show_streak,
    },
    { onConflict: "user_id" },
  );

  if (error) {
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}

import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const cookieStore = await cookies();
    const response = NextResponse.redirect(`${origin}${next}`);

    // Write cookies DIRECTLY to the redirect response — not via cookieStore.
    // This guarantees auth cookies travel with the redirect to /dashboard.
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const isOwner = await provisionOwner(supabase);
      if (isOwner) {
        response.cookies.set("stargate-owner", "1", { path: "/", httpOnly: false });
      }
      return response;
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
}

async function provisionOwner(supabase: ReturnType<typeof createServerClient>): Promise<boolean> {
  const ownerEmail = process.env.NEXT_PUBLIC_OWNER_EMAIL;
  if (!ownerEmail) return false;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email?.toLowerCase() !== ownerEmail.toLowerCase()) return false;

  const { data: sub, error: selectErr } = await supabase
    .from("user_subscriptions")
    .select("tier, is_owner")
    .eq("user_id", user.id)
    .single();

  if (selectErr && selectErr.code !== "PGRST116") {
    console.error("[owner-provision] SELECT failed:", selectErr.message);
    return true;
  }

  if (!sub) {
    const { error: insertErr } = await supabase
      .from("user_subscriptions")
      .insert({ user_id: user.id, tier: "max", is_owner: true });
    if (insertErr) console.error("[owner-provision] INSERT failed:", insertErr.message);
  } else if (sub.tier !== "max" || !sub.is_owner) {
    const { error: updateErr } = await supabase
      .from("user_subscriptions")
      .update({ tier: "max", is_owner: true, updated_at: new Date().toISOString() })
      .eq("user_id", user.id);
    if (updateErr) console.error("[owner-provision] UPDATE failed:", updateErr.message);
  }
  return true;
}

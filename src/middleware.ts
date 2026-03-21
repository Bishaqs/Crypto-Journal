import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Owner flag cookie — synchronous client-side check
  const ownerEmail = process.env.OWNER_EMAIL || process.env.NEXT_PUBLIC_OWNER_EMAIL;
  const isOwner = !!(user && ownerEmail && user.email?.toLowerCase() === ownerEmail.toLowerCase());

  // Ban check: cookie-based for performance, DB-verified for correctness
  if (user && request.cookies.get("stargate-banned")?.value === "1") {
    const { data: banCheck } = await supabase
      .from("user_subscriptions")
      .select("is_banned")
      .eq("user_id", user.id)
      .maybeSingle();

    if (banCheck?.is_banned) {
      if (pathname !== "/banned") {
        const url = request.nextUrl.clone();
        url.pathname = "/banned";
        return NextResponse.redirect(url);
      }
      return supabaseResponse;
    } else {
      // No longer banned — clear stale cookie, continue normally
      supabaseResponse.cookies.delete("stargate-banned");
    }
  }

  // If not logged in and trying to access protected routes, redirect to login
  if (!user && (pathname.startsWith("/dashboard") || pathname.startsWith("/simulator"))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Early access gate: check if user is allowed to access protected routes
  // Owner always gets through. Others need to be on waitlist or manually approved.
  if (user && !isOwner && (pathname.startsWith("/dashboard") || pathname.startsWith("/simulator"))) {
    const hasAccess = request.cookies.get("stargate-early-access")?.value === user.email?.toLowerCase();

    if (!hasAccess) {
      // Check DB: waitlist_signups OR early_access_emails
      const email = user.email?.toLowerCase();
      let verified = false;

      if (email) {
        const { data: waitlist } = await supabase
          .from("waitlist_signups")
          .select("id")
          .eq("email", email)
          .maybeSingle();

        if (waitlist) {
          verified = true;
        } else {
          const { data: earlyAccess } = await supabase
            .from("early_access_emails")
            .select("id")
            .eq("email", email)
            .maybeSingle();

          if (earlyAccess) {
            verified = true;
          }
        }
      }

      if (verified) {
        // Set cookie to avoid DB queries on subsequent requests
        supabaseResponse.cookies.set("stargate-early-access", email, {
          path: "/",
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
        });
      } else {
        // No early access — redirect to rejection page
        const url = request.nextUrl.clone();
        url.pathname = "/early-access";
        return NextResponse.redirect(url);
      }
    }
  }

  // If logged in and on login page, redirect to journal (core loop)
  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard/journal";
    const resp = NextResponse.redirect(url);
    if (isOwner) resp.cookies.set("stargate-owner", "1", { path: "/", httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict" });
    return resp;
  }

  if (isOwner) {
    supabaseResponse.cookies.set("stargate-owner", "1", { path: "/", httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict" });
  } else {
    supabaseResponse.cookies.delete("stargate-owner");
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/simulator",
    "/login",
    "/api/subscription",
    "/api/market/:path*",
    "/api/ai/:path*",
    "/api/trades/:path*",
    "/api/invite/:path*",
    "/api/admin/:path*",
    "/api/auth/signup",
    "/api/discount/:path*",
    "/api/connections/:path*",
    "/banned",
    "/early-access",
  ],
};

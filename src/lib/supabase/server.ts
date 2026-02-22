import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// This creates a Supabase client that runs on the SERVER.
// Used in Server Components, Server Actions, and Route Handlers.
// It manages auth cookies automatically.

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll is called from Server Components where cookies can't be set.
            // This is expected — the middleware handles it instead.
          }
        },
      },
    }
  );
}

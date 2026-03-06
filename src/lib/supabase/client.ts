import { createBrowserClient } from "@supabase/ssr";

// Singleton Supabase client for the browser.
// Used in Client Components (anything with "use client" at the top).
let client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return client;
}

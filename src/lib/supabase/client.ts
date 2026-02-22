import { createBrowserClient } from "@supabase/ssr";

// This creates a Supabase client that runs in the BROWSER.
// Used in Client Components (anything with "use client" at the top).
// It reads your public env vars to know which Supabase project to connect to.

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

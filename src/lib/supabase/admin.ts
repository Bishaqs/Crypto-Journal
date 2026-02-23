import { createClient } from "@supabase/supabase-js";

// Admin client using service role key — bypasses RLS.
// ONLY use server-side, after authenticating the user via getUser().

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Fetch all trades from Supabase, paginating past the 1,000-row default limit.
 * Returns rows ordered by open_timestamp descending.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchAllTrades(
  supabase: SupabaseClient,
  select = "*",
): Promise<{ data: any[]; error: Error | null }> {
  const PAGE_SIZE = 1000;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let all: any[] = [];
  let page = 0;

  while (true) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from("trades")
      .select(select)
      .order("open_timestamp", { ascending: false })
      .range(from, to);

    if (error) return { data: all, error };
    if (!data || data.length === 0) break;

    all = all.concat(data);
    if (data.length < PAGE_SIZE) break; // last page
    page++;
  }

  return { data: all, error: null };
}

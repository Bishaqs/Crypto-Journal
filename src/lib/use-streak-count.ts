"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Lightweight hook that returns the current streak count.
 * Read-only — does not update streaks (that's handled by StreakWidget).
 */
export function useStreakCount() {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("user_streaks")
      .select("current_streak")
      .limit(1)
      .single()
      .then(({ data }: { data: { current_streak: number } | null }) => {
        setCount(data?.current_streak ?? 0);
        setLoading(false);
      });
  }, []);

  return { count, loading };
}

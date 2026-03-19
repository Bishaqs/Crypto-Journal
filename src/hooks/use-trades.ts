"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchAllTrades } from "@/lib/supabase/fetch-all-trades";
import { Trade } from "@/lib/types";

export function useTrades() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingDemo, setUsingDemo] = useState(false);
  const supabase = createClient();

  const fetchTrades = useCallback(async () => {
    const { data, error } = await fetchAllTrades(supabase);
    if (error) { console.error("[useTrades]", error.message); setLoading(false); return; }
    const dbTrades = (data as Trade[]) ?? [];
    if (dbTrades.length === 0) {
      setTrades([]);
      setUsingDemo(true);
    } else {
      setTrades(dbTrades);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  return { trades, loading, usingDemo, refetch: fetchTrades };
}

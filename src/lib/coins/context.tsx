"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import {
  earnCoins,
  spendCoins,
  getCoinBalance,
  COIN_PRICES,
  COIN_REWARDS,
  type CoinSource,
  type CoinSink,
} from "./engine";

type CoinsContextType = {
  balance: number;
  loading: boolean;
  /** Award coins for an action */
  earn: (source: CoinSource, description?: string) => Promise<number>;
  /** Spend coins. Returns true if successful, false if insufficient. */
  spend: (sink: CoinSink, description?: string) => Promise<boolean>;
  /** Refresh balance from server */
  refresh: () => void;
};

const CoinsContext = createContext<CoinsContextType>({
  balance: 0,
  loading: true,
  earn: async () => 0,
  spend: async () => false,
  refresh: () => {},
});

export function CoinsProvider({
  children,
  userId: initialUserId,
}: {
  children: ReactNode;
  userId?: string;
}) {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(initialUserId ?? null);
  const supabase = createClient();

  useEffect(() => {
    if (initialUserId) return;
    supabase.auth.getUser().then(({ data }: { data: { user: { id: string } | null } }) => {
      setUserId(data?.user?.id ?? null);
    });
  }, [supabase, initialUserId]);

  const refresh = useCallback(async () => {
    if (!userId) return;
    try {
      const bal = await getCoinBalance(supabase, userId);
      setBalance(bal);
    } catch {
      // Table may not exist yet
    } finally {
      setLoading(false);
    }
  }, [userId, supabase]);

  useEffect(() => {
    if (userId) refresh();
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const earn = useCallback(
    async (source: CoinSource, description?: string): Promise<number> => {
      if (!userId) return 0;
      try {
        const result = await earnCoins(supabase, userId, source, description);
        setBalance(result.newBalance);
        return result.earned;
      } catch {
        return 0;
      }
    },
    [userId, supabase]
  );

  const spend = useCallback(
    async (sink: CoinSink, description?: string): Promise<boolean> => {
      if (!userId) return false;
      try {
        const result = await spendCoins(supabase, userId, sink, description);
        setBalance(result.newBalance);
        return result.success;
      } catch {
        return false;
      }
    },
    [userId, supabase]
  );

  return (
    <CoinsContext.Provider value={{ balance, loading, earn, spend, refresh }}>
      {children}
    </CoinsContext.Provider>
  );
}

export function useCoins() {
  return useContext(CoinsContext);
}

export { COIN_PRICES, COIN_REWARDS };

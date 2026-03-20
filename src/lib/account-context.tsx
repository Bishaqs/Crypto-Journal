"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { BrokerConnection } from "@/lib/import-export-types";

export type AccountFilter = "all" | "manual" | string; // string = connection id

type AccountContextType = {
  selectedAccount: AccountFilter;
  setSelectedAccount: (account: AccountFilter) => void;
  connections: BrokerConnection[];
  connectionsLoading: boolean;
  refreshConnections: () => Promise<void>;
  filterByAccount: <T extends { broker_name?: string | null }>(items: T[]) => T[];
};

const AccountContext = createContext<AccountContextType>({
  selectedAccount: "all",
  setSelectedAccount: () => {},
  connections: [],
  connectionsLoading: true,
  refreshConnections: async () => {},
  filterByAccount: (items) => items,
});

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [selectedAccount, setSelectedAccount] = useState<AccountFilter>("all");
  const [connections, setConnections] = useState<BrokerConnection[]>([]);
  const [connectionsLoading, setConnectionsLoading] = useState(true);

  const fetchConnections = useCallback(async () => {
    try {
      const res = await fetch("/api/connections");
      if (!res.ok) return;
      const data = await res.json();
      setConnections(data.connections ?? []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes("does not exist") && !msg.includes("PGRST") && !msg.includes("Failed to fetch")) {
        console.error("[AccountProvider] unexpected error:", msg);
      }
    } finally {
      setConnectionsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const filterByAccount = useCallback(
    <T extends { broker_name?: string | null }>(items: T[]): T[] => {
      if (selectedAccount === "all") return items;
      if (selectedAccount === "manual") {
        return items.filter((t) => !t.broker_name);
      }
      const conn = connections.find((c) => c.id === selectedAccount);
      if (!conn) return items;
      return items.filter((t) => t.broker_name === conn.broker_name);
    },
    [selectedAccount, connections]
  );

  return (
    <AccountContext.Provider
      value={{
        selectedAccount,
        setSelectedAccount,
        connections,
        connectionsLoading,
        refreshConnections: fetchConnections,
        filterByAccount,
      }}
    >
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  return useContext(AccountContext);
}

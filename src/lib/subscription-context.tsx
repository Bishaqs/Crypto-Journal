"use client";

import { createContext, useContext } from "react";
import type { SubscriptionTier } from "@/lib/use-subscription";

type SubscriptionContextType = {
  tier: SubscriptionTier;
  isOwner: boolean;
  isTrial: boolean;
  isBetaTester: boolean;
};

const SubscriptionContext = createContext<SubscriptionContextType>({
  tier: "free",
  isOwner: false,
  isTrial: false,
  isBetaTester: false,
});

export function SubscriptionProvider({
  tier,
  isOwner,
  isTrial,
  isBetaTester,
  children,
}: SubscriptionContextType & { children: React.ReactNode }) {
  return (
    <SubscriptionContext.Provider value={{ tier, isOwner, isTrial, isBetaTester }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscriptionContext() {
  return useContext(SubscriptionContext);
}

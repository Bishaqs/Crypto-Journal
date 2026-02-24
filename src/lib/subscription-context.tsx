"use client";

import { createContext, useContext } from "react";
import type { SubscriptionTier } from "@/lib/use-subscription";

type SubscriptionContextType = {
  tier: SubscriptionTier;
  isOwner: boolean;
  isTrial: boolean;
};

const SubscriptionContext = createContext<SubscriptionContextType>({
  tier: "free",
  isOwner: false,
  isTrial: false,
});

export function SubscriptionProvider({
  tier,
  isOwner,
  isTrial,
  children,
}: SubscriptionContextType & { children: React.ReactNode }) {
  return (
    <SubscriptionContext.Provider value={{ tier, isOwner, isTrial }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscriptionContext() {
  return useContext(SubscriptionContext);
}

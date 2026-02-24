import { UserAddons } from "./types";

const ADDONS_KEY = "stargate-addons";
const ASSET_CONTEXT_KEY = "stargate-asset-context";

export function getUserAddons(): UserAddons {
  if (typeof window === "undefined") return { stocks: false };
  try {
    const raw = localStorage.getItem(ADDONS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { stocks: false };
}

export function setUserAddons(addons: UserAddons): void {
  localStorage.setItem(ADDONS_KEY, JSON.stringify(addons));
}

export function hasStockAccess(): boolean {
  // Owner always has stock access
  try {
    const raw = localStorage.getItem("stargate-subscription-cache");
    if (raw) {
      const cache = JSON.parse(raw);
      if (cache.data?.is_owner || cache.data?.tier === "max") return true;
    }
  } catch {}
  const addons = getUserAddons();
  if (addons.stocks) return true;
  return false;
}

export type AssetContext = "crypto" | "stocks";

export function getAssetContext(): AssetContext {
  if (typeof window === "undefined") return "crypto";
  return (localStorage.getItem(ASSET_CONTEXT_KEY) as AssetContext) || "crypto";
}

export function setAssetContext(ctx: AssetContext): void {
  localStorage.setItem(ASSET_CONTEXT_KEY, ctx);
}

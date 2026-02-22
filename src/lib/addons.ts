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
  // Demo mode: always grant access
  if (typeof document !== "undefined" && document.cookie.includes("stargate-demo=true")) return true;

  // Max tier users always have stock access
  const addons = getUserAddons();
  if (addons.stocks) return true;

  // Check if user is on Max tier (stored by subscription settings)
  try {
    const sub = localStorage.getItem("stargate-subscription");
    if (sub) {
      const parsed = JSON.parse(sub);
      if (parsed.tier === "max") return true;
    }
  } catch {}

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

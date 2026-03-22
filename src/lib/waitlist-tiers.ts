export type WaitlistTier =
  | "founding_100"
  | "pioneer"
  | "early_adopter"
  | "vanguard"
  | "trailblazer";

export interface TierInfo {
  name: string;
  range: [number, number];
  discount: number;
  codePrefix: string;
  perks: string[];
}

export const TIERS: Record<WaitlistTier, TierInfo> = {
  founding_100: {
    name: "Founding 100",
    range: [1, 100],
    discount: 50,
    codePrefix: "TRAVERSE50",
    perks: ["50% off forever", "Feature voting rights", "Shape the product"],
  },
  pioneer: {
    name: "Pioneer",
    range: [101, 500],
    discount: 40,
    codePrefix: "TRAVERSE40",
    perks: ["40% off forever", "Early feature access"],
  },
  early_adopter: {
    name: "Early Adopter",
    range: [501, 1000],
    discount: 30,
    codePrefix: "TRAVERSE30",
    perks: ["30% off forever"],
  },
  vanguard: {
    name: "Vanguard",
    range: [1001, 1500],
    discount: 20,
    codePrefix: "TRAVERSE20",
    perks: ["20% off forever"],
  },
  trailblazer: {
    name: "Trailblazer",
    range: [1501, 2000],
    discount: 10,
    codePrefix: "TRAVERSE10",
    perks: ["10% off forever"],
  },
};

export const TOTAL_CAP = 2000;

export function getTierForPosition(position: number): WaitlistTier {
  if (position <= 100) return "founding_100";
  if (position <= 500) return "pioneer";
  if (position <= 1000) return "early_adopter";
  if (position <= 1500) return "vanguard";
  return "trailblazer";
}

export function getTierInfo(position: number): TierInfo {
  return TIERS[getTierForPosition(position)];
}

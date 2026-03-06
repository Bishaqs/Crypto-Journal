export { CosmeticProvider, useCosmetics } from "./context";
export type {
  CosmeticType,
  CosmeticRarity,
  CosmeticDefinition,
  UserCosmetic,
  EquippedCosmetics,
  UnlockCondition,
} from "./types";
export {
  checkCosmeticUnlocks,
  awardCosmetic,
  equipCosmetic,
  unequipCosmetic,
} from "./engine";
export { renderCosmeticIcon, hasIcon, getIconIds } from "./icon-registry";
export { ACCENT_MAP, applyAccentOverride, hasAccent, getAccentDef } from "./accent-map";

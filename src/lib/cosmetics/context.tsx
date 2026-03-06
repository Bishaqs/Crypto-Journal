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
import { useSubscriptionContext } from "@/lib/subscription-context";
import type {
  CosmeticDefinition,
  CosmeticType,
  EquippedCosmetics,
  UserCosmetic,
} from "./types";
import {
  checkCosmeticUnlocks,
  awardCosmetic,
  equipCosmetic as equipCosmeticDb,
  unequipCosmetic as unequipCosmeticDb,
} from "./engine";
import { applyAccentOverride } from "./accent-map";

type CosmeticContextType = {
  /** All cosmetic definitions (catalog) */
  definitions: CosmeticDefinition[];
  /** User's owned cosmetics */
  owned: UserCosmetic[];
  /** Currently equipped cosmetics */
  equipped: EquippedCosmetics;
  /** Whether a specific cosmetic is owned */
  isOwned: (cosmeticId: string) => boolean;
  /** Get definition by ID */
  getDefinition: (cosmeticId: string) => CosmeticDefinition | undefined;
  /** Equip a cosmetic */
  equip: (cosmeticType: CosmeticType, cosmeticId: string) => Promise<void>;
  /** Unequip a cosmetic */
  unequip: (cosmeticType: CosmeticType) => Promise<void>;
  /** Refresh cosmetics (call after level-up or achievement unlock) */
  refresh: () => void;
  /** Loading state */
  loading: boolean;
};

const DEFAULT_EQUIPPED: EquippedCosmetics = {
  avatar_frame: null,
  banner: null,
  title_badge: null,
  sidebar_flair: null,
  avatar_icon: null,
  theme_accent: null,
};

const CosmeticContext = createContext<CosmeticContextType>({
  definitions: [],
  owned: [],
  equipped: DEFAULT_EQUIPPED,
  isOwned: () => false,
  getDefinition: () => undefined,
  equip: async () => {},
  unequip: async () => {},
  refresh: () => {},
  loading: true,
});

export function CosmeticProvider({ children, userId: initialUserId }: { children: ReactNode; userId?: string }) {
  const { isOwner } = useSubscriptionContext();
  const [definitions, setDefinitions] = useState<CosmeticDefinition[]>([]);
  const [owned, setOwned] = useState<UserCosmetic[]>([]);
  const [equipped, setEquipped] = useState<EquippedCosmetics>(DEFAULT_EQUIPPED);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(initialUserId ?? null);

  const supabase = createClient();

  useEffect(() => {
    if (initialUserId) return;
    supabase.auth.getUser().then(({ data }: { data: { user: { id: string } | null } }) => {
      setUserId(data?.user?.id ?? null);
      if (!data?.user) setLoading(false);
    });
  }, [supabase, initialUserId]);

  const refresh = useCallback(async () => {
    if (!userId) return;

    try {
      // Fetch definitions (catalog)
      const { data: defs } = await supabase
        .from("cosmetic_definitions")
        .select("id, name, type, rarity, icon, description, unlock_conditions")
        .order("type")
        .order("rarity")
        .limit(500);

      if (defs) setDefinitions(defs as CosmeticDefinition[]);

      // Check for new unlocks — need level and achievements
      const { data: levelData } = await supabase
        .from("user_levels")
        .select("current_level")
        .eq("user_id", userId)
        .maybeSingle();

      const { data: achieveData } = await supabase
        .from("user_achievements")
        .select("achievement_id, tier")
        .eq("user_id", userId);

      const level = levelData?.current_level ?? 1;
      const achievements = (achieveData ?? []).map((a: { achievement_id: string; tier: string | null }) => ({
        achievement_id: a.achievement_id,
        tier: a.tier as string | null,
      }));

      const newUnlocks = await checkCosmeticUnlocks(
        supabase,
        userId,
        level,
        achievements,
      );

      // Award new cosmetics
      for (const cosmeticId of newUnlocks) {
        await awardCosmetic(supabase, userId, cosmeticId);
      }

      // Fetch owned cosmetics
      const { data: ownedData } = await supabase
        .from("user_cosmetics")
        .select("cosmetic_id, earned_at")
        .eq("user_id", userId);

      setOwned(
        (ownedData ?? []).map((o: { cosmetic_id: string; earned_at: string }) => ({
          cosmetic_id: o.cosmetic_id,
          earned_at: o.earned_at,
        })),
      );

      // Fetch equipped
      const { data: equippedData } = await supabase
        .from("user_equipped_cosmetics")
        .select("cosmetic_type, cosmetic_id")
        .eq("user_id", userId);

      const eq: EquippedCosmetics = { ...DEFAULT_EQUIPPED };
      for (const row of (equippedData ?? []) as { cosmetic_type: string; cosmetic_id: string }[]) {
        const t = row.cosmetic_type as CosmeticType;
        if (t in eq) {
          eq[t] = row.cosmetic_id;
        }
      }
      setEquipped(eq);
    } catch {
      // Tables may not exist yet
    } finally {
      setLoading(false);
    }
  }, [userId, supabase]);

  useEffect(() => {
    if (userId) refresh();
  }, [userId, refresh]);

  // Apply accent color globally whenever equipped accent changes
  useEffect(() => {
    applyAccentOverride(equipped.theme_accent);
  }, [equipped.theme_accent]);

  const isOwned = useCallback(
    (cosmeticId: string) => isOwner || owned.some((o) => o.cosmetic_id === cosmeticId),
    [isOwner, owned],
  );

  const getDefinition = useCallback(
    (cosmeticId: string) => definitions.find((d) => d.id === cosmeticId),
    [definitions],
  );

  const equip = useCallback(
    async (cosmeticType: CosmeticType, cosmeticId: string) => {
      if (!userId) return;
      await equipCosmeticDb(supabase, userId, cosmeticType, cosmeticId);
      setEquipped((prev) => ({ ...prev, [cosmeticType]: cosmeticId }));
    },
    [userId, supabase],
  );

  const unequip = useCallback(
    async (cosmeticType: CosmeticType) => {
      if (!userId) return;
      await unequipCosmeticDb(supabase, userId, cosmeticType);
      setEquipped((prev) => ({ ...prev, [cosmeticType]: null }));
    },
    [userId, supabase],
  );

  return (
    <CosmeticContext.Provider
      value={{
        definitions,
        owned,
        equipped,
        isOwned,
        getDefinition,
        equip,
        unequip,
        refresh,
        loading,
      }}
    >
      {children}
    </CosmeticContext.Provider>
  );
}

export function useCosmetics() {
  return useContext(CosmeticContext);
}

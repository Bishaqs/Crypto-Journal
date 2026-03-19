import type { SupabaseClient } from "@supabase/supabase-js";

export const TAG_PALETTE = [
  { bg: "rgba(239, 68, 68, 0.12)", text: "#f87171", border: "rgba(239, 68, 68, 0.25)" },
  { bg: "rgba(249, 115, 22, 0.12)", text: "#fb923c", border: "rgba(249, 115, 22, 0.25)" },
  { bg: "rgba(234, 179, 8, 0.12)", text: "#facc15", border: "rgba(234, 179, 8, 0.25)" },
  { bg: "rgba(34, 197, 94, 0.12)", text: "#4ade80", border: "rgba(34, 197, 94, 0.25)" },
  { bg: "rgba(20, 184, 166, 0.12)", text: "#2dd4bf", border: "rgba(20, 184, 166, 0.25)" },
  { bg: "rgba(6, 182, 212, 0.12)", text: "#22d3ee", border: "rgba(6, 182, 212, 0.25)" },
  { bg: "rgba(59, 130, 246, 0.12)", text: "#60a5fa", border: "rgba(59, 130, 246, 0.25)" },
  { bg: "rgba(139, 92, 246, 0.12)", text: "#a78bfa", border: "rgba(139, 92, 246, 0.25)" },
  { bg: "rgba(168, 85, 247, 0.12)", text: "#c084fc", border: "rgba(168, 85, 247, 0.25)" },
  { bg: "rgba(236, 72, 153, 0.12)", text: "#f472b6", border: "rgba(236, 72, 153, 0.25)" },
];

const TAG_COLOR_KEY = "stargate-tag-colors";
const TAG_PRESETS_KEY = "stargate-custom-tags";

function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) & 0xffffffff;
  }
  return Math.abs(hash);
}

function getTagColorMap(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const saved = localStorage.getItem(TAG_COLOR_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

function saveTagColorMap(map: Record<string, number>): void {
  localStorage.setItem(TAG_COLOR_KEY, JSON.stringify(map));
}

/** Get tag color — checks user-assigned color first, falls back to hash */
export function getTagColor(tag: string): { bg: string; text: string; border: string } {
  const map = getTagColorMap();
  const customIndex = map[tag];
  if (customIndex !== undefined && customIndex >= 0 && customIndex < TAG_PALETTE.length) {
    return TAG_PALETTE[customIndex];
  }
  const index = hashString(tag) % TAG_PALETTE.length;
  return TAG_PALETTE[index];
}

/** Assign a custom color to a tag (localStorage only — call saveTagColorToDB separately for persistence) */
export function setTagColor(tag: string, colorIndex: number): void {
  const map = getTagColorMap();
  map[tag] = colorIndex;
  saveTagColorMap(map);
}

/** Remove custom color assignment (reverts to hash-based) */
export function removeTagColor(tag: string): void {
  const map = getTagColorMap();
  delete map[tag];
  saveTagColorMap(map);
}

/** Get the currently assigned color index for a tag (or -1 if hash-based) */
export function getTagColorIndex(tag: string): number {
  const map = getTagColorMap();
  return map[tag] ?? -1;
}

// ─── Database persistence ────────────────────────────────────────────────────

/** Load tag colors from user_preferences DB and hydrate localStorage. DB wins on conflict. */
export async function loadTagColorsFromDB(supabase: SupabaseClient): Promise<void> {
  try {
    const { data } = await supabase
      .from("user_preferences")
      .select("preferences")
      .single();

    const dbColors: Record<string, number> = data?.preferences?.tag_colors ?? {};
    const dbPresets: string[] = data?.preferences?.tag_presets ?? [];

    // Merge: DB is source of truth, localStorage is cache
    if (Object.keys(dbColors).length > 0) {
      const localMap = getTagColorMap();
      // DB values overwrite local values
      const merged = { ...localMap, ...dbColors };
      saveTagColorMap(merged);
    }

    if (dbPresets.length > 0) {
      localStorage.setItem(TAG_PRESETS_KEY, JSON.stringify(dbPresets));
    }
  } catch {
    // Table may not exist yet or no row — localStorage values remain
  }
}

/** Save the full tag color map + presets to user_preferences DB */
export async function saveTagSettingsToDB(supabase: SupabaseClient): Promise<void> {
  try {
    const colorMap = getTagColorMap();
    let presets: string[] = [];
    try {
      const saved = localStorage.getItem(TAG_PRESETS_KEY);
      presets = saved ? JSON.parse(saved) : [];
    } catch { /* ignore */ }

    // Read existing preferences to merge (don't overwrite other prefs like psychology_tier)
    const { data: existing } = await supabase
      .from("user_preferences")
      .select("preferences")
      .single();

    const existingPrefs = existing?.preferences ?? {};
    const mergedPrefs = {
      ...existingPrefs,
      tag_colors: colorMap,
      tag_presets: presets,
    };

    await supabase
      .from("user_preferences")
      .upsert({
        preferences: mergedPrefs,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
  } catch {
    // Silently fail — localStorage still works as fallback
  }
}

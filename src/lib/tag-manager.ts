const STORAGE_KEY = "stargate-custom-tags";

/** System tag prefixes — used for broker sync dedup, not user-facing */
const SYSTEM_TAG_PREFIXES = ["close-fill:", "open-fill:", "fid:", "fills:"];

/** System tag exact matches — internal tracking markers */
const SYSTEM_TAG_EXACT = new Set([
  "bitget-api-sync",
  "bitget-futures",
  "bitget-unmatched-close",
  "csv-import",
]);

/** Returns true if a tag is system-generated (not user-facing) */
export function isSystemTag(tag: string): boolean {
  if (SYSTEM_TAG_EXACT.has(tag)) return true;
  return SYSTEM_TAG_PREFIXES.some((prefix) => tag.startsWith(prefix));
}

/** Returns true if a tag is user-facing (not system-generated, not narrative) */
export function isUserTag(tag: string): boolean {
  return !isSystemTag(tag) && !tag.startsWith("narrative:");
}

export function getCustomTagPresets(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function saveCustomTagPresets(tags: string[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tags));
}

export function addCustomTagPreset(tag: string): string[] {
  const current = getCustomTagPresets();
  const normalized = tag.trim().toLowerCase();
  if (!normalized || current.includes(normalized)) return current;
  if (isSystemTag(normalized)) return current;
  const updated = [...current, normalized].sort();
  saveCustomTagPresets(updated);
  return updated;
}

export function removeCustomTagPreset(tag: string): string[] {
  const updated = getCustomTagPresets().filter((t) => t !== tag);
  saveCustomTagPresets(updated);
  return updated;
}

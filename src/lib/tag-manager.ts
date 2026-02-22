const STORAGE_KEY = "stargate-custom-tags";

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
  const updated = [...current, normalized].sort();
  saveCustomTagPresets(updated);
  return updated;
}

export function removeCustomTagPreset(tag: string): string[] {
  const updated = getCustomTagPresets().filter((t) => t !== tag);
  saveCustomTagPresets(updated);
  return updated;
}

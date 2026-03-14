const STORAGE_KEY = "stargate-custom-setup-types";

export function getCustomSetupPresets(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function saveCustomSetupPresets(types: string[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(types));
}

export function addCustomSetupPreset(name: string): string[] {
  const current = getCustomSetupPresets();
  const normalized = name.trim();
  if (!normalized || current.includes(normalized)) return current;
  const updated = [...current, normalized].sort();
  saveCustomSetupPresets(updated);
  return updated;
}

export function removeCustomSetupPreset(name: string): string[] {
  const updated = getCustomSetupPresets().filter((t) => t !== name);
  saveCustomSetupPresets(updated);
  return updated;
}

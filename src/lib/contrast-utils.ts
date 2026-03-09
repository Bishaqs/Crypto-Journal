/**
 * WCAG contrast ratio utilities for detecting low-contrast accent/theme combos.
 */

function toLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex: string): number {
  const r = toLinear(parseInt(hex.slice(1, 3), 16) / 255);
  const g = toLinear(parseInt(hex.slice(3, 5), 16) / 255);
  const b = toLinear(parseInt(hex.slice(5, 7), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

const THEME_BACKGROUNDS: Record<string, string> = {
  solara: "#faf8f5",
  nebula: "#080c14",
  obsidian: "#0a0a0c",
  cipher: "#000000",
  vulcan: "#0a0504",
  triton: "#020817",
  satoshi: "#0a0806",
};

/**
 * Returns true if the accent color has insufficient contrast (< 3:1)
 * against the given theme's background — WCAG AA for UI components.
 */
export function isAccentLowContrast(theme: string, accentHex: string): boolean {
  const bg = THEME_BACKGROUNDS[theme];
  if (!bg) return false;
  return contrastRatio(bg, accentHex) < 3;
}

export type Locale =
  | "en" | "es" | "de" | "fr" | "pt"
  | "zh" | "ja" | "ko" | "ar" | "hi"
  | "tr" | "ru";

export const DEFAULT_LOCALE: Locale = "en";

export const LOCALES: { code: Locale; label: string; flag: string; dir?: "rtl" }[] = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "pt", label: "Português", flag: "🇧🇷" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
  { code: "ko", label: "한국어", flag: "🇰🇷" },
  { code: "ar", label: "العربية", flag: "🇸🇦", dir: "rtl" },
  { code: "hi", label: "हिन्दी", flag: "🇮🇳" },
  { code: "tr", label: "Türkçe", flag: "🇹🇷" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
];

export { useI18n, I18nProvider } from "./context";
export type { TranslationKeys } from "./translations/en";

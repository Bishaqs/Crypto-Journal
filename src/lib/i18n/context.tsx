"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { Locale } from "./index";
import { DEFAULT_LOCALE, LOCALES } from "./index";
import en from "./translations/en";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TranslationObj = Record<string, any>;

// Lazy-load translations to avoid bundling all languages upfront
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const translationLoaders: Record<Locale, () => Promise<{ default: TranslationObj }>> = {
  en: () => Promise.resolve({ default: en }),
  es: () => import("./translations/es") as any,
  de: () => import("./translations/de") as any,
  fr: () => import("./translations/fr") as any,
  pt: () => import("./translations/pt") as any,
  zh: () => import("./translations/zh") as any,
  ja: () => import("./translations/ja") as any,
  ko: () => import("./translations/ko") as any,
  ar: () => import("./translations/ar") as any,
  hi: () => import("./translations/hi") as any,
  tr: () => import("./translations/tr") as any,
  ru: () => import("./translations/ru") as any,
};

function getNestedValue(obj: TranslationObj, path: string): string | undefined {
  const keys = path.split(".");
  let current: TranslationObj | string = obj;
  for (const key of keys) {
    if (current === undefined || current === null || typeof current === "string") return undefined;
    current = (current as TranslationObj)[key];
  }
  return typeof current === "string" ? current : undefined;
}

function interpolate(str: string, vars?: Record<string, string | number>): string {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? `{${key}}`));
}

type I18nContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  dir: "ltr" | "rtl";
};

const I18nContext = createContext<I18nContextType>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (key: string) => key,
  dir: "ltr",
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [translations, setTranslations] = useState<TranslationObj>(en);

  // Load saved locale on mount
  useEffect(() => {
    const saved = localStorage.getItem("stargate-language") as Locale | null;
    if (saved && translationLoaders[saved]) {
      setLocaleState(saved);
      translationLoaders[saved]().then((mod) => setTranslations(mod.default));
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("stargate-language", newLocale);
    translationLoaders[newLocale]().then((mod) => setTranslations(mod.default));
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>): string => {
      const value = getNestedValue(translations, key) ?? getNestedValue(en, key) ?? key;
      return interpolate(value, vars);
    },
    [translations],
  );

  const dir = LOCALES.find((l) => l.code === locale)?.dir === "rtl" ? "rtl" : "ltr";

  // Update document direction for RTL languages
  useEffect(() => {
    document.documentElement.dir = dir;
  }, [dir]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, dir }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

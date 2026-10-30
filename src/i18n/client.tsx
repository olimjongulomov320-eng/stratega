"use client";

import { createContext, useContext, useMemo } from "react";
import type { Dictionary } from "./dictionaries/uz";
import { localePath, type Locale } from "./config";

type I18nValue = {
  locale: Locale;
  t: Dictionary;
  /** Locale-aware href: href("/korzina") → "/ru/korzina" on Russian pages. */
  href: (path: string) => string;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({
  locale,
  dict,
  children,
}: {
  locale: Locale;
  dict: Dictionary;
  children: React.ReactNode;
}) {
  const value = useMemo(
    () => ({ locale, t: dict, href: (p: string) => localePath(locale, p) }),
    [locale, dict]
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}

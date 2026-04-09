"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

import { getUiStrings, type UiLocale, type UiStrings } from "@/lib/ui-strings";

type UiLocaleContextValue = {
  locale: UiLocale;
  t: UiStrings;
};

const UiLocaleContext = createContext<UiLocaleContextValue>({
  locale: "ja",
  t: getUiStrings("ja"),
});

export function UiLocaleProvider({ locale, children }: { locale: UiLocale; children: ReactNode }) {
  const value = useMemo(() => ({ locale, t: getUiStrings(locale) }), [locale]);
  return <UiLocaleContext.Provider value={value}>{children}</UiLocaleContext.Provider>;
}

export function useUiLocale(): UiLocaleContextValue {
  return useContext(UiLocaleContext);
}

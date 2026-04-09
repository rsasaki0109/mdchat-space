"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

import { getUiStrings, type UiCopyVariant, type UiLocale, type UiStrings } from "@/lib/ui-strings";

type UiLocaleContextValue = {
  locale: UiLocale;
  copyVariant: UiCopyVariant;
  t: UiStrings;
};

const UiLocaleContext = createContext<UiLocaleContextValue>({
  locale: "ja",
  copyVariant: "default",
  t: getUiStrings("ja", "default"),
});

export function UiLocaleProvider({
  locale,
  copyVariant = "default",
  children,
}: {
  locale: UiLocale;
  copyVariant?: UiCopyVariant;
  children: ReactNode;
}) {
  const value = useMemo(
    () => ({ locale, copyVariant, t: getUiStrings(locale, copyVariant) }),
    [locale, copyVariant],
  );
  return <UiLocaleContext.Provider value={value}>{children}</UiLocaleContext.Provider>;
}

export function useUiLocale(): UiLocaleContextValue {
  return useContext(UiLocaleContext);
}

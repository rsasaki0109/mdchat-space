"use client";

import { useLayoutEffect } from "react";

import { Dashboard } from "@/components/dashboard";
import { UiLocaleProvider } from "@/lib/ui-locale";
import { getDemoApi, isMdchatDemo } from "@/lib/api";
import type { UiCopyVariant } from "@/lib/ui-strings";

const copyVariant: UiCopyVariant = isMdchatDemo ? "demo" : "default";

export default function EnglishLocalePage() {
  useLayoutEffect(() => {
    document.documentElement.lang = "en";
  }, []);

  return (
    <UiLocaleProvider locale="en" copyVariant={copyVariant}>
      <Dashboard apiOverride={isMdchatDemo ? getDemoApi("en") : undefined} />
    </UiLocaleProvider>
  );
}

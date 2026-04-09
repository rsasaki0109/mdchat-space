"use client";

import { useLayoutEffect } from "react";

import { Dashboard } from "@/components/dashboard";
import { UiLocaleProvider } from "@/lib/ui-locale";
import { getDemoApi, isMdchatDemo } from "@/lib/api";
import type { UiCopyVariant } from "@/lib/ui-strings";

const copyVariant: UiCopyVariant = isMdchatDemo ? "demo" : "default";

export default function JapaneseLocalePage() {
  useLayoutEffect(() => {
    document.documentElement.lang = "ja";
  }, []);

  return (
    <UiLocaleProvider locale="ja" copyVariant={copyVariant}>
      <Dashboard apiOverride={isMdchatDemo ? getDemoApi("ja") : undefined} />
    </UiLocaleProvider>
  );
}

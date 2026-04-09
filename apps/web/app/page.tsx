"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { DemoEntryLanding } from "@/components/demo-entry-landing";
import { Dashboard } from "@/components/dashboard";
import { UiLocaleProvider } from "@/lib/ui-locale";
import type { UiCopyVariant, UiLocale } from "@/lib/ui-strings";
import { getDemoApi } from "@/lib/api";

function resolveLocale(raw: string | null): UiLocale {
  return raw === "en" ? "en" : "ja";
}

function ProductionHomeContent() {
  const searchParams = useSearchParams();
  const locale = resolveLocale(searchParams.get("lang"));

  return (
    <UiLocaleProvider locale={locale} copyVariant="default">
      <Dashboard />
    </UiLocaleProvider>
  );
}

function DemoHomeRouter() {
  const searchParams = useSearchParams();
  const lang = searchParams.get("lang");
  const uiCopyVariant: UiCopyVariant = "demo";

  if (!lang) {
    return <DemoEntryLanding />;
  }

  const locale = resolveLocale(lang);
  return (
    <UiLocaleProvider locale={locale} copyVariant={uiCopyVariant}>
      <Dashboard apiOverride={getDemoApi(locale)} />
    </UiLocaleProvider>
  );
}

export default function HomePage() {
  const fallback = <main className="min-h-screen" aria-busy="true" />;

  if (process.env.NEXT_PUBLIC_MDCHAT_DEMO === "1") {
    return (
      <Suspense fallback={fallback}>
        <DemoHomeRouter />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={fallback}>
      <ProductionHomeContent />
    </Suspense>
  );
}

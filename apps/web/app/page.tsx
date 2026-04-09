"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { Dashboard } from "@/components/dashboard";
import { UiLocaleProvider } from "@/lib/ui-locale";
import type { UiLocale } from "@/lib/ui-strings";

function resolveLocale(raw: string | null): UiLocale {
  return raw === "en" ? "en" : "ja";
}

function HomeContent() {
  const searchParams = useSearchParams();
  const locale = resolveLocale(searchParams.get("lang"));

  return (
    <UiLocaleProvider locale={locale}>
      <Dashboard />
    </UiLocaleProvider>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={<main className="min-h-screen" aria-busy="true" />}
    >
      <HomeContent />
    </Suspense>
  );
}

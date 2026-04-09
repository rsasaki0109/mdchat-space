"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { useUiLocale } from "@/lib/ui-locale";

const pill =
  "inline-flex overflow-hidden rounded-full border border-slate-300/90 bg-white/95 p-0.5 text-[0.7rem] font-bold uppercase tracking-wider shadow-md backdrop-blur-sm";

const seg =
  "min-w-[2.75rem] px-2.5 py-1.5 text-center transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-slate-400";

function activeClass(on: boolean) {
  return on
    ? "bg-slateblue text-white shadow-inner"
    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900";
}

/** `/`・`/ja/…`・`/en/…` はパスで言語固定（静的デモ・本番共通） */
function PathLocaleSwitcher() {
  const pathname = usePathname();
  const { locale } = useUiLocale();
  const p = (pathname.replace(/\/$/, "") || "/") as string;

  const onRoot = p === "/";
  const onJa = p === "/ja" || p.startsWith("/ja/");
  const onEn = p === "/en" || p.startsWith("/en/");

  if (onRoot) {
    return (
      <div className={pill} role="navigation" aria-label="Language">
        <Link href="/ja/" className={`${seg} rounded-l-[inherit] ${activeClass(locale === "ja")}`}>
          JA
        </Link>
        <span className="w-px self-stretch bg-slate-200" aria-hidden />
        <Link href="/en/" className={`${seg} rounded-r-[inherit] ${activeClass(locale === "en")}`}>
          EN
        </Link>
      </div>
    );
  }

  return (
    <div className={pill} role="navigation" aria-label="Language">
      <Link href="/ja/" className={`${seg} rounded-l-[inherit] ${activeClass(onJa)}`}>
        JA
      </Link>
      <span className="w-px self-stretch bg-slate-200/80" aria-hidden />
      <Link href="/en/" className={`${seg} rounded-r-[inherit] ${activeClass(onEn)}`}>
        EN
      </Link>
    </div>
  );
}

/** 上記以外のパスでは `?lang=` のみ切り替え */
function QueryLocaleSwitcher() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { locale } = useUiLocale();

  const q = new URLSearchParams(searchParams.toString());
  q.set("lang", "ja");
  const hrefJa = `${pathname}?${q.toString()}`;
  q.set("lang", "en");
  const hrefEn = `${pathname}?${q.toString()}`;

  return (
    <div className={pill} role="navigation" aria-label="Language">
      <Link href={hrefJa} className={`${seg} rounded-l-[inherit] ${activeClass(locale === "ja")}`}>
        JA
      </Link>
      <span className="w-px self-stretch bg-slate-200/80" aria-hidden />
      <Link href={hrefEn} className={`${seg} rounded-r-[inherit] ${activeClass(locale === "en")}`}>
        EN
      </Link>
    </div>
  );
}

export function LocaleSwitcher() {
  const pathname = usePathname();
  const p = (pathname.replace(/\/$/, "") || "/") as string;
  const usePath =
    p === "/" || p === "/ja" || p.startsWith("/ja/") || p === "/en" || p.startsWith("/en/");

  if (usePath) {
    return <PathLocaleSwitcher />;
  }

  return (
    <Suspense fallback={<div className="h-8 w-[5.5rem] rounded-full bg-slate-100/80" aria-hidden />}>
      <QueryLocaleSwitcher />
    </Suspense>
  );
}

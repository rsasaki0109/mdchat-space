import Link from "next/link";

import { LocaleSwitcher } from "@/components/locale-switcher";

/**
 * 静的デモのエントリ。`/ja/` と `/en/` は別セッション（sessionStorage キーが言語別）。
 */
export function DemoEntryLanding() {
  return (
    <main className="relative min-h-screen px-4 py-16 text-ink md:px-8">
      <div className="pointer-events-none fixed right-3 top-3 z-[100] md:right-5 md:top-5">
        <div className="pointer-events-auto">
          <LocaleSwitcher />
        </div>
      </div>
      <div className="mx-auto max-w-lg">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-500">mdchat-space</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Live demo</h1>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          日本語 UI と英語 UI はそれぞれ別のブラウザ内サンドボックスです（データは共有されません）。
          <span className="mt-2 block">
            Japanese and English demos use separate in-browser sandboxes; data is not shared between them.
          </span>
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/ja/"
            className="inline-flex flex-1 items-center justify-center rounded-2xl bg-slateblue px-6 py-4 text-center text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            日本語デモ
          </Link>
          <Link
            href="/en/"
            className="inline-flex flex-1 items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 py-4 text-center text-sm font-semibold text-slate-800 transition hover:border-slate-400"
          >
            English demo
          </Link>
        </div>
        <p className="mt-10 text-xs leading-6 text-slate-500">
          従来の入り口（クエリ）:{" "}
          <Link href="/?lang=ja" className="font-medium text-slate-700 underline">
            ?lang=ja
          </Link>
          {" · "}
          <Link href="/?lang=en" className="font-medium text-slate-700 underline">
            ?lang=en
          </Link>
        </p>
      </div>
    </main>
  );
}

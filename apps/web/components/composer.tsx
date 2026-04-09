"use client";

import { useUiLocale } from "@/lib/ui-locale";

type ComposerProps = {
  title: string;
  description: string;
  submitLabel: string;
  author: string;
  channel: string;
  body: string;
  onAuthorChange: (value: string) => void;
  onChannelChange: (value: string) => void;
  onBodyChange: (value: string) => void;
  onSubmit: () => void;
  disableChannelEdit?: boolean;
  disabled?: boolean;
};


export function Composer({
  title,
  description,
  submitLabel,
  author,
  channel,
  body,
  onAuthorChange,
  onChannelChange,
  onBodyChange,
  onSubmit,
  disableChannelEdit = false,
  disabled = false,
}: ComposerProps) {
  const { t } = useUiLocale();
  return (
    <section className="panel p-5" data-testid="post-composer">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink">{title}</h2>
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        </div>
        <button
          type="button"
          onClick={onSubmit}
          disabled={disabled}
          className="rounded-full bg-amber-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {submitLabel}
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-[180px,1fr]">
        <label className="text-sm font-medium text-slate-700">
          {t.fieldAuthor}
          <input
            value={author}
            onChange={(event) => onAuthorChange(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 outline-none transition focus:border-amber-500"
            placeholder={t.authorPlaceholder}
          />
        </label>

        <label className="text-sm font-medium text-slate-700">
          {t.fieldChannel}
          <input
            value={channel}
            onChange={(event) => onChannelChange(event.target.value)}
            readOnly={disableChannelEdit}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 outline-none transition focus:border-amber-500 read-only:bg-slate-100"
            placeholder="/general"
          />
        </label>
      </div>

      <label className="mt-4 block text-sm font-medium text-slate-700">
        {t.fieldMarkdown}
        <textarea
          value={body}
          onChange={(event) => onBodyChange(event.target.value)}
          rows={8}
          className="mt-2 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 font-mono text-sm outline-none transition focus:border-amber-500"
          placeholder={t.bodyPlaceholder}
        />
      </label>
    </section>
  );
}

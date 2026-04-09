"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import type { ThreadResponse } from "@/lib/types";
import { intlLocaleForUi } from "@/lib/ui-strings";
import { useUiLocale } from "@/lib/ui-locale";


type ThreadPanelProps = {
  thread: ThreadResponse | null;
  summary: string;
  replyDraft: string;
  replyAuthor: string;
  replyBody: string;
  loading: boolean;
  onGenerateSummary: () => void;
  onGenerateReply: () => void;
  onReplyAuthorChange: (value: string) => void;
  onReplyBodyChange: (value: string) => void;
  onReplySubmit: () => void;
};


export function ThreadPanel({
  thread,
  summary,
  replyDraft,
  replyAuthor,
  replyBody,
  loading,
  onGenerateSummary,
  onGenerateReply,
  onReplyAuthorChange,
  onReplyBodyChange,
  onReplySubmit,
}: ThreadPanelProps) {
  const { locale, t } = useUiLocale();
  const dateFormatter = new Intl.DateTimeFormat(intlLocaleForUi(locale), {
    dateStyle: "medium",
    timeStyle: "short",
  });

  if (!thread) {
    return (
      <aside className="panel h-full p-5">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{t.threadEmptyKicker}</p>
        <h2 className="mt-2 text-xl font-semibold text-ink">{t.threadEmptyTitle}</h2>
        <p className="mt-3 text-sm leading-7 text-slate-600">{t.threadEmptyBody}</p>
      </aside>
    );
  }

  return (
    <aside className="panel h-full p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{t.threadKicker}</p>
          <h2 className="mt-2 text-xl font-semibold text-ink">{thread.root.channel}</h2>
          <p className="mt-2 text-sm text-slate-600">{t.threadPostsInConversation(thread.posts.length)}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onGenerateSummary}
            disabled={loading}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-amber-400 hover:text-amber-800 disabled:cursor-not-allowed"
          >
            {t.summarize}
          </button>
          <button
            type="button"
            onClick={onGenerateReply}
            disabled={loading}
            className="rounded-full bg-pine px-4 py-2 text-sm font-medium text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {t.generateReply}
          </button>
        </div>
      </div>

      {summary ? (
        <section className="panel-muted mt-5 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">AI Summary</p>
          <div className="md-body mt-3">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary}</ReactMarkdown>
          </div>
        </section>
      ) : null}

      {replyDraft ? (
        <section className="panel-muted mt-5 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">AI Reply Draft</p>
          <div className="md-body mt-3">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{replyDraft}</ReactMarkdown>
          </div>
        </section>
      ) : null}

      <div className="mt-5 space-y-3">
        {thread.posts.map((post) => (
          <article key={post.id} className="rounded-3xl border border-slate-200 bg-white/75 p-4">
            <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.18em] text-slate-500">
              <span>{post.author}</span>
              <span>{dateFormatter.format(new Date(post.created_at))}</span>
              <span>{post.markdown_path}</span>
            </div>
            <div className="md-body mt-3">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.body}</ReactMarkdown>
            </div>
          </article>
        ))}
      </div>

      <section className="panel-muted mt-5 p-4">
        <h3 className="text-base font-semibold text-ink">{t.replySectionTitle}</h3>
        <div className="mt-4 grid gap-3">
          <label className="text-sm font-medium text-slate-700">
            {t.fieldAuthor}
            <input
              value={replyAuthor}
              onChange={(event) => onReplyAuthorChange(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 outline-none transition focus:border-amber-500"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            {t.fieldMarkdown}
            <textarea
              value={replyBody}
              onChange={(event) => onReplyBodyChange(event.target.value)}
              rows={8}
              className="mt-2 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 font-mono text-sm outline-none transition focus:border-amber-500"
            />
          </label>
          <button
            type="button"
            onClick={onReplySubmit}
            disabled={loading}
            className="rounded-full bg-slateblue px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {t.replySubmit}
          </button>
        </div>
      </section>
    </aside>
  );
}

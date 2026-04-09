"use client";

import type { PostSummary } from "@/lib/types";
import { intlLocaleForUi } from "@/lib/ui-strings";
import { useUiLocale } from "@/lib/ui-locale";


type PostListProps = {
  posts: PostSummary[];
  activeThreadId: string | null;
  onSelect: (threadId: string) => void;
};


export function PostList({ posts, activeThreadId, onSelect }: PostListProps) {
  const { locale, t } = useUiLocale();
  const dateFormatter = new Intl.DateTimeFormat(intlLocaleForUi(locale), {
    dateStyle: "medium",
    timeStyle: "short",
  });
  return (
    <section className="panel p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ink">{t.postListTitle}</h2>
          <p className="mt-1 text-sm text-slate-600">{t.postListDescription}</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          {t.postListThreadLabel(posts.length)}
        </span>
      </div>

      {posts.length === 0 ? (
        <div className="panel-muted p-6 text-sm text-slate-600">{t.postListEmpty}</div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => {
            const selected = post.id === activeThreadId;

            return (
              <button
                key={post.id}
                type="button"
                onClick={() => onSelect(post.id)}
                className={`w-full rounded-3xl border p-4 text-left transition ${
                  selected
                    ? "border-slate-400 bg-slate-100/90"
                    : "border-slate-200/50 bg-white/75 hover:border-slate-300 hover:bg-white"
                }`}
              >
                <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.2em] text-slate-500">
                  <span>{post.author}</span>
                  <span>{dateFormatter.format(new Date(post.created_at))}</span>
                  <span>{post.channel}</span>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-700">{post.excerpt}</p>
                <p className="mt-4 text-xs font-medium text-slate-600">{t.postListRepliesLabel(post.reply_count)}</p>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

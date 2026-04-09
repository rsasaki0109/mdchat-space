"use client";

import { useState, type FormEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import type { StampOut, ThreadPost, ThreadResponse } from "@/lib/types";
import { resolveStampImageUrl } from "@/lib/stamp-url";
import { intlLocaleForUi } from "@/lib/ui-strings";
import { useUiLocale } from "@/lib/ui-locale";


type ThreadPanelProps = {
  thread: ThreadResponse | null;
  /** ヘッダのチャンネル行だけ表示を差し替え（例: DM の相手名）。 */
  channelTitle?: (path: string) => string;
  stampsCatalog: StampOut[];
  actorKey: string;
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
  onUpdatePost: (postId: string, author: string, body: string) => Promise<void>;
  onDeleteThread: () => void | Promise<void>;
  onToggleStamp: (postId: string, stampId: string) => void;
  onCreateCustomStamp: (slug: string, label: string, file: File) => Promise<void>;
};


export function ThreadPanel({
  thread,
  channelTitle,
  stampsCatalog,
  actorKey,
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
  onUpdatePost,
  onDeleteThread,
  onToggleStamp,
  onCreateCustomStamp,
}: ThreadPanelProps) {
  const { locale, t } = useUiLocale();
  const dateFormatter = new Intl.DateTimeFormat(intlLocaleForUi(locale), {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAuthor, setEditAuthor] = useState("");
  const [editBody, setEditBody] = useState("");
  const [customSlug, setCustomSlug] = useState("");
  const [customLabel, setCustomLabel] = useState("");
  const [customFile, setCustomFile] = useState<File | null>(null);
  const [uploadBusy, setUploadBusy] = useState(false);

  function startEdit(post: ThreadPost) {
    setEditingId(post.id);
    setEditAuthor(post.author);
    setEditBody(post.body);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditAuthor("");
    setEditBody("");
  }

  async function submitCustomStamp(event: FormEvent) {
    event.preventDefault();
    if (!customFile || !customSlug.trim()) {
      return;
    }
    setUploadBusy(true);
    try {
      await onCreateCustomStamp(customSlug.trim(), customLabel.trim(), customFile);
      setCustomSlug("");
      setCustomLabel("");
      setCustomFile(null);
    } catch {
      /* surfaced by parent */
    } finally {
      setUploadBusy(false);
    }
  }

  async function saveEdit() {
    if (!editingId) {
      return;
    }
    try {
      await onUpdatePost(editingId, editAuthor, editBody);
      cancelEdit();
    } catch {
      /* error surfaced by parent */
    }
  }

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
          <h2 className="mt-2 text-xl font-semibold text-ink" title={thread.root.channel}>
            {channelTitle ? channelTitle(thread.root.channel) : thread.root.channel}
          </h2>
          <p className="mt-2 text-sm text-slate-600">{t.threadPostsInConversation(thread.posts.length)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={async () => {
              if (typeof window !== "undefined" && !window.confirm(t.deleteThreadConfirm)) {
                return;
              }
              try {
                await onDeleteThread();
              } catch {
                /* error surfaced by parent */
              }
            }}
            disabled={loading}
            className="rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 transition hover:border-red-400 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t.deleteThread}
          </button>
          <button
            type="button"
            onClick={onGenerateSummary}
            disabled={loading}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed"
          >
            {t.summarize}
          </button>
          <button
            type="button"
            onClick={onGenerateReply}
            disabled={loading}
            className="rounded-full bg-slateblue px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
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
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.18em] text-slate-500">
                <span>{post.author}</span>
                <span>{dateFormatter.format(new Date(post.created_at))}</span>
                <span>{post.markdown_path}</span>
              </div>
              {editingId !== post.id ? (
                <button
                  type="button"
                  onClick={() => startEdit(post)}
                  disabled={loading}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed"
                >
                  {t.editPost}
                </button>
              ) : null}
            </div>
            {editingId === post.id ? (
              <div className="mt-3 space-y-3">
                <label className="block text-sm font-medium text-slate-700">
                  {t.fieldAuthor}
                  <input
                    value={editAuthor}
                    onChange={(event) => setEditAuthor(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 outline-none transition focus:border-slate-500"
                  />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  {t.fieldMarkdown}
                  <textarea
                    value={editBody}
                    onChange={(event) => setEditBody(event.target.value)}
                    rows={8}
                    className="mt-2 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 font-mono text-sm outline-none transition focus:border-slate-500"
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={saveEdit}
                    disabled={loading || !editAuthor.trim() || !editBody.trim()}
                    className="rounded-full bg-slateblue px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {t.savePost}
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    disabled={loading}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400"
                  >
                    {t.cancelEdit}
                  </button>
                </div>
              </div>
            ) : (
              <div className="md-body mt-3">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.body}</ReactMarkdown>
              </div>
            )}
            <div className="mt-3 border-t border-slate-100 pt-3">
              <p className="text-[0.65rem] font-medium uppercase tracking-[0.2em] text-slate-500">{t.stampsHeading}</p>
              <div className="mt-2 flex min-h-[2rem] flex-wrap gap-2">
                {(post.stamps ?? []).map((s) => (
                  <button
                    key={s.stamp_id}
                    type="button"
                    title={s.label}
                    disabled={loading || !actorKey.trim()}
                    onClick={() => void onToggleStamp(post.id, s.stamp_id)}
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-sm transition ${
                      s.mine
                        ? "border-slate-500 bg-slate-100 text-slate-900"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    {s.kind === "emoji" && s.emoji_char ? (
                      <span>{s.emoji_char}</span>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={resolveStampImageUrl(s.image_url) ?? ""}
                        alt=""
                        className="h-5 w-5 rounded object-cover"
                      />
                    )}
                    <span className="text-xs font-medium tabular-nums">{s.count}</span>
                  </button>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {stampsCatalog.map((st) => {
                  const summary = (post.stamps ?? []).find((x) => x.stamp_id === st.id);
                  const pressed = Boolean(summary?.mine);
                  const src = resolveStampImageUrl(st.image_url);
                  return (
                    <button
                      key={st.id}
                      type="button"
                      title={st.label}
                      disabled={loading || !actorKey.trim()}
                      onClick={() => void onToggleStamp(post.id, st.id)}
                      className={`flex h-9 min-w-[2.25rem] items-center justify-center rounded-xl border px-2 text-base transition ${
                        pressed
                          ? "border-slate-500 bg-slate-100 shadow-sm"
                          : "border-slate-200 bg-white hover:border-slate-400"
                      } disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      {st.kind === "emoji" && st.emoji_char ? (
                        <span>{st.emoji_char}</span>
                      ) : src ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={src} alt="" className="h-6 w-6 rounded object-cover" />
                      ) : (
                        <span className="text-xs text-slate-400">?</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </article>
        ))}
      </div>

      <details className="panel-muted mt-5 rounded-3xl p-4">
        <summary className="cursor-pointer text-sm font-medium text-slate-800">{t.addCustomStamp}</summary>
        <form className="mt-4 grid gap-3" onSubmit={submitCustomStamp}>
          <label className="text-sm font-medium text-slate-700">
            {t.fieldStampSlug}
            <input
              value={customSlug}
              onChange={(e) => setCustomSlug(e.target.value.toLowerCase())}
              pattern="^[a-z][a-z0-9-]{1,30}$"
              required
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 font-mono text-sm outline-none transition focus:border-slate-500"
              placeholder="team-logo"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            {t.fieldStampLabel}
            <input
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-500"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            {t.stampPickFile}
            <input
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp"
              onChange={(e) => setCustomFile(e.target.files?.[0] ?? null)}
              className="mt-2 block w-full text-sm text-slate-600"
            />
          </label>
          <button
            type="submit"
            disabled={uploadBusy || loading || !customSlug.trim() || !customFile}
            className="rounded-full bg-slateblue px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {uploadBusy ? t.composerSubmitPending : t.stampUploadSubmit}
          </button>
        </form>
      </details>

      <section className="panel-muted mt-5 p-4">
        <h3 className="text-base font-semibold text-ink">{t.replySectionTitle}</h3>
        <div className="mt-4 grid gap-3">
          <label className="text-sm font-medium text-slate-700">
            {t.fieldAuthor}
            <input
              value={replyAuthor}
              onChange={(event) => onReplyAuthorChange(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 outline-none transition focus:border-slate-500"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            {t.fieldMarkdown}
            <textarea
              value={replyBody}
              onChange={(event) => onReplyBodyChange(event.target.value)}
              rows={8}
              className="mt-2 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 font-mono text-sm outline-none transition focus:border-slate-500"
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

"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { api, getDemoApi, isMdchatDemo, type MdchatApi } from "@/lib/api";
import type { UiLocale } from "@/lib/ui-strings";
import { demoChannelSidebarLabel, demoDmRoomLabel } from "@/lib/demo-seed";
import { tryNormalizeChannelPath } from "@/lib/channel-path";
import type { ChannelNode, PostSummary, SearchResponse, StampOut, ThreadResponse } from "@/lib/types";
import { ChannelSidebar } from "@/components/channel-sidebar";
import { Composer } from "@/components/composer";
import { DemoDmPanel } from "@/components/demo-dm-panel";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { PostList } from "@/components/post-list";
import { ThreadPanel } from "@/components/thread-panel";
import { useUiLocale } from "@/lib/ui-locale";


function flattenChannels(nodes: ChannelNode[]): string[] {
  return nodes.flatMap((node) => [node.path, ...flattenChannels(node.children)]);
}

function demoDisplayStorageKey(loc: UiLocale): string {
  return `mdchatDemoDisplayName-${loc}`;
}

function readPersistedActorKey(): string {
  if (typeof window === "undefined") {
    return "";
  }
  let key = localStorage.getItem("mdchatActorKey");
  if (!key) {
    key = crypto.randomUUID();
    localStorage.setItem("mdchatActorKey", key);
  }
  return key;
}


type DashboardProps = {
  apiOverride?: MdchatApi;
};

export function Dashboard({ apiOverride }: DashboardProps) {
  const { t, locale } = useUiLocale();
  const client = useMemo(
    () => apiOverride ?? (isMdchatDemo ? getDemoApi(locale) : api),
    [apiOverride, locale],
  );
  const pendingThreadRef = useRef<{ channel: string; threadId: string } | null>(null);
  const [channels, setChannels] = useState<ChannelNode[]>([]);
  const [selectedChannel, setSelectedChannel] = useState("/general");
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [thread, setThread] = useState<ThreadResponse | null>(null);
  const [rootAuthor, setRootAuthor] = useState(() => {
    if (!isMdchatDemo) {
      return "guest";
    }
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(demoDisplayStorageKey(locale));
      if (saved) {
        return saved;
      }
    }
    return locale === "en" ? "You" : "あなた";
  });
  const [rootChannel, setRootChannel] = useState("/general");
  const [rootBody, setRootBody] = useState("");
  const [replyAuthor, setReplyAuthor] = useState(() => {
    if (!isMdchatDemo) {
      return "guest";
    }
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(demoDisplayStorageKey(locale));
      if (saved) {
        return saved;
      }
    }
    return locale === "en" ? "You" : "あなた";
  });
  const [replyBody, setReplyBody] = useState("");
  const [summary, setSummary] = useState("");
  const [replyDraft, setReplyDraft] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchAllChannels, setSearchAllChannels] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [actorKey] = useState(readPersistedActorKey);
  const [stampCatalog, setStampCatalog] = useState<StampOut[]>([]);
  const [dmRooms, setDmRooms] = useState<string[]>([]);

  async function refreshDmRooms() {
    if (!isMdchatDemo) {
      return;
    }
    try {
      setDmRooms(await client.listDmRooms());
    } catch {
      setDmRooms([]);
    }
  }

  async function loadChannels(preferredChannel?: string) {
    const tree = await client.getChannelsTree();
    const channelPaths = flattenChannels(tree);
    const normalizedPreferred =
      preferredChannel !== undefined && String(preferredChannel).trim()
        ? tryNormalizeChannelPath(preferredChannel)
        : null;

    const nextChannel =
      normalizedPreferred !== null
        ? normalizedPreferred
        : channelPaths.includes(selectedChannel)
          ? selectedChannel
          : channelPaths[0] ?? "/general";

    setChannels(tree);
    setSelectedChannel(nextChannel);
    setRootChannel(nextChannel);
    return nextChannel;
  }

  async function loadPosts(channelPath: string) {
    const channelPosts = await client.getPosts(channelPath);
    setPosts(channelPosts);

    let targetId: string | null = null;
    const pending = pendingThreadRef.current;
    if (pending && pending.channel === channelPath) {
      targetId = pending.threadId;
      pendingThreadRef.current = null;
    }

    if (targetId && !channelPosts.some((post) => post.id === targetId)) {
      targetId = null;
    }

    if (!targetId && channelPosts.length > 0) {
      targetId = channelPosts[0].id;
    }

    if (targetId) {
      await openThread(targetId);
    } else {
      setThread(null);
      setSummary("");
      setReplyDraft("");
      setReplyBody("");
    }
  }

  async function openThread(threadId: string) {
    const actor = actorKey.trim() || "guest";
    const response = await client.getThread(threadId, actor);
    setThread(response);
    setSummary("");
    setReplyDraft("");
    setReplyBody("");
  }

  async function handleToggleStamp(postId: string, stampId: string) {
    if (!thread) {
      return;
    }
    setError(null);
    try {
      const actor = actorKey.trim() || "guest";
      await client.togglePostStamp(postId, stampId, actor);
      await openThread(thread.root.id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t.actionFailed);
      throw caught;
    }
  }

  async function handleCreateCustomStamp(slug: string, label: string, file: File) {
    setError(null);
    try {
      await client.createImageStamp(slug, label, file);
      setStampCatalog(await client.getStamps());
      if (thread) {
        await openThread(thread.root.id);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t.actionFailed);
      throw caught;
    }
  }

  async function refreshWorkspace(preferredChannel?: string, threadId?: string) {
    const targetChannel = await loadChannels(preferredChannel);
    if (threadId) {
      pendingThreadRef.current = { channel: targetChannel, threadId };
    } else {
      pendingThreadRef.current = null;
    }
    await loadPosts(targetChannel);
  }

  useEffect(() => {
    startTransition(() => {
      refreshWorkspace("/general").catch((caught) => {
        setError(caught instanceof Error ? caught.message : t.loadFailed);
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when demo locale / API instance changes
  }, [client]);

  useEffect(() => {
    client.getStamps().then(setStampCatalog).catch(() => setStampCatalog([]));
  }, [client]);

  useEffect(() => {
    if (isMdchatDemo) {
      void refreshDmRooms();
    }
  }, [client]);

  useEffect(() => {
    if (!isMdchatDemo) {
      return;
    }
    if (typeof window !== "undefined" && localStorage.getItem(demoDisplayStorageKey(locale))) {
      return;
    }
    const d = locale === "en" ? "You" : "あなた";
    setRootAuthor(d);
    setReplyAuthor(d);
  }, [locale, isMdchatDemo]);

  const formatChannelPath = isMdchatDemo ? demoChannelSidebarLabel : undefined;

  async function handleCreateRootPost() {
    setError(null);
    const created = await client.createPost({
      author: rootAuthor,
      channel: rootChannel,
      body: rootBody,
    });

    if (isMdchatDemo && rootAuthor.trim()) {
      try {
        localStorage.setItem(demoDisplayStorageKey(locale), rootAuthor.trim());
      } catch {
        /* private mode / quota */
      }
    }

    setRootBody("");
    await refreshWorkspace(created.channel, created.id);
    await refreshDmRooms();
  }

  async function handleCreateReply() {
    if (!thread) {
      return;
    }

    setError(null);
    const created = await client.createPost({
      author: replyAuthor,
      channel: thread.root.channel,
      body: replyBody,
      parent_post_id: thread.posts[thread.posts.length - 1]?.id ?? thread.root.id,
    });

    if (isMdchatDemo && replyAuthor.trim()) {
      try {
        localStorage.setItem(demoDisplayStorageKey(locale), replyAuthor.trim());
      } catch {
        /* private mode / quota */
      }
    }

    setReplyBody("");
    await refreshWorkspace(created.channel, created.thread_root_id);
    await refreshDmRooms();
  }

  async function handleSummarize() {
    if (!thread) {
      return;
    }

    setError(null);
    const response = await client.summarize(thread.root.id);
    setSummary(response.summary);
  }

  async function handleUpdatePost(postId: string, author: string, body: string) {
    if (!thread) {
      return;
    }

    setError(null);
    try {
      await client.updatePost(postId, { author, body });
      await refreshWorkspace(thread.root.channel, thread.root.id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t.actionFailed);
      throw caught;
    }
  }

  async function handleDeleteThread() {
    if (!thread) {
      return;
    }

    setError(null);
    try {
      await client.deleteThread(thread.root.id);
      await refreshWorkspace(selectedChannel);
      await refreshDmRooms();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t.actionFailed);
      throw caught;
    }
  }

  async function handleGenerateReply() {
    if (!thread) {
      return;
    }

    setError(null);
    const response = await client.reply(thread.root.id);
    setReplyDraft(response.reply);
    setReplyBody(response.reply);
  }

  async function handleSearch() {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    setError(null);
    const scope = searchAllChannels ? null : selectedChannel;
    const results = await client.search(searchQuery.trim(), scope);
    setSearchResults(results);
  }

  function runAction(action: () => Promise<void>) {
    startTransition(() => {
      action().catch((caught) => {
        setError(caught instanceof Error ? caught.message : t.actionFailed);
      });
    });
  }

  async function handleNewDmRoom() {
    setError(null);
    try {
      const { channel } = await client.createDmRoom();
      await refreshDmRooms();
      setRootChannel(channel);
      pendingThreadRef.current = null;
      await refreshWorkspace(channel);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t.actionFailed);
    }
  }

  async function handleOpenDmRoom(channel: string) {
    setError(null);
    setRootChannel(channel);
    pendingThreadRef.current = null;
    await refreshWorkspace(channel);
  }

  return (
    <main className="relative min-h-screen px-4 py-6 text-ink md:px-6 xl:px-8">
      <div className="pointer-events-none fixed right-3 top-3 z-[100] md:right-5 md:top-5">
        <div className="pointer-events-auto">
          <LocaleSwitcher />
        </div>
      </div>
      <section className="mx-auto max-w-[1800px]">
        <header className="mb-6 grid gap-4 lg:grid-cols-[1.4fr,0.9fr]">
          <div className="panel p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{t.heroKicker}</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink md:text-4xl">
              {t.heroTitleLine1}
              <span className="block text-slate-700">{t.heroTitleLine2}</span>
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">{t.heroBody}</p>
            {isMdchatDemo && t.demoTryFlow ? (
              <div className="md-body mt-4 max-w-3xl rounded-2xl border border-slate-200/90 bg-white/70 px-4 py-3 text-slate-700 [&_p]:my-2">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{t.demoTryFlow}</ReactMarkdown>
              </div>
            ) : null}
          </div>

          <div className="panel p-6">
            {isMdchatDemo ? (
              <p className="text-sm leading-6 text-slate-600">{t.demoExportsNote}</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                <a
                  href={client.exportMarkdownUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-slateblue px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
                >
                  Export Markdown
                </a>
                <a
                  href={client.exportJsonUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                >
                  Export JSON
                </a>
              </div>
            )}

            <div className="mt-5">
              <label className="text-sm font-medium text-slate-700">
                {t.aiSearchLabel}
                <div className="mt-2 flex gap-2">
                  <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        runAction(handleSearch);
                      }
                    }}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 outline-none transition focus:border-slate-500"
                    placeholder={t.aiSearchPlaceholder}
                  />
                  <button
                    type="button"
                    onClick={() => runAction(handleSearch)}
                    disabled={isPending}
                    className="rounded-full bg-slateblue px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {t.searchButton}
                  </button>
                </div>
                <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={searchAllChannels}
                    onChange={(event) => setSearchAllChannels(event.target.checked)}
                    className="rounded border-slate-300 text-slate-700 focus:ring-slate-400"
                  />
                  {t.searchAllChannels}
                </label>
              </label>

              {searchResults ? (
                <div className="panel-muted mt-4 p-4">
                  <p className="text-sm leading-6 text-slate-700">{searchResults.answer}</p>
                  <div className="mt-4 space-y-2">
                    {searchResults.hits.map((hit) => (
                      <button
                        key={hit.post_id}
                        type="button"
                        onClick={() =>
                          runAction(async () => {
                            pendingThreadRef.current = { channel: hit.channel, threadId: hit.post_id };
                            setRootChannel(hit.channel);
                            setSelectedChannel(hit.channel);
                            await loadPosts(hit.channel);
                          })
                        }
                        className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-left transition hover:border-slate-400"
                      >
                        <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.18em] text-slate-500">
                          <span title={hit.channel}>
                            {formatChannelPath ? formatChannelPath(hit.channel) : hit.channel}
                          </span>
                          <span>{hit.score.toFixed(3)}</span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-700">{hit.excerpt}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        {isMdchatDemo ? (
          <div className="mb-6 rounded-2xl border border-slate-200/90 bg-white/88 px-4 py-3 text-sm leading-6 text-slate-700 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.22)]">
            {t.demoModeBanner}
          </div>
        ) : null}

        {error ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <section className="grid gap-6 xl:grid-cols-[280px,1.1fr,0.95fr]">
          <div className="space-y-4">
            {isMdchatDemo ? (
              <DemoDmPanel
                rooms={dmRooms}
                disabled={isPending}
                roomLabel={demoDmRoomLabel}
                onNewRoom={() => runAction(() => handleNewDmRoom())}
                onOpenRoom={(channel) => runAction(() => handleOpenDmRoom(channel))}
              />
            ) : null}
            <ChannelSidebar
              channels={channels}
              selectedChannel={selectedChannel}
              formatChannelPath={formatChannelPath}
              onSelect={(channelPath) => {
                pendingThreadRef.current = null;
                setSelectedChannel(channelPath);
                setRootChannel(channelPath);
                runAction(() => loadPosts(channelPath));
              }}
            />
          </div>

          <div className="space-y-6">
            <Composer
              title={t.composerTitle}
              description={t.composerDescription}
              submitLabel={isPending ? t.composerSubmitPending : t.composerSubmit}
              author={rootAuthor}
              channel={rootChannel}
              body={rootBody}
              onAuthorChange={setRootAuthor}
              onChannelChange={setRootChannel}
              onBodyChange={setRootBody}
              onSubmit={() => runAction(handleCreateRootPost)}
              disabled={isPending}
            />

            <PostList
              posts={posts}
              activeThreadId={thread?.root.id ?? null}
              formatChannelPath={formatChannelPath}
              onSelect={(threadId) => runAction(() => openThread(threadId))}
            />
          </div>

          <ThreadPanel
            thread={thread}
            channelTitle={formatChannelPath}
            stampsCatalog={stampCatalog}
            actorKey={actorKey}
            summary={summary}
            replyDraft={replyDraft}
            replyAuthor={replyAuthor}
            replyBody={replyBody}
            loading={isPending}
            onGenerateSummary={() => runAction(handleSummarize)}
            onGenerateReply={() => runAction(handleGenerateReply)}
            onReplyAuthorChange={setReplyAuthor}
            onReplyBodyChange={setReplyBody}
            onReplySubmit={() => runAction(handleCreateReply)}
            onUpdatePost={handleUpdatePost}
            onDeleteThread={handleDeleteThread}
            onToggleStamp={(postId, stampId) => runAction(() => handleToggleStamp(postId, stampId))}
            onCreateCustomStamp={handleCreateCustomStamp}
          />
        </section>
      </section>
    </main>
  );
}

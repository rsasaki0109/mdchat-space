"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import { api, isMdchatDemo } from "@/lib/api";
import type { ChannelNode, PostSummary, SearchResponse, ThreadResponse } from "@/lib/types";
import { ChannelSidebar } from "@/components/channel-sidebar";
import { Composer } from "@/components/composer";
import { PostList } from "@/components/post-list";
import { ThreadPanel } from "@/components/thread-panel";
import { useUiLocale } from "@/lib/ui-locale";


function flattenChannels(nodes: ChannelNode[]): string[] {
  return nodes.flatMap((node) => [node.path, ...flattenChannels(node.children)]);
}


export function Dashboard() {
  const { t } = useUiLocale();
  const pendingThreadRef = useRef<{ channel: string; threadId: string } | null>(null);
  const [channels, setChannels] = useState<ChannelNode[]>([]);
  const [selectedChannel, setSelectedChannel] = useState("/general");
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [thread, setThread] = useState<ThreadResponse | null>(null);
  const [rootAuthor, setRootAuthor] = useState("guest");
  const [rootChannel, setRootChannel] = useState("/general");
  const [rootBody, setRootBody] = useState("");
  const [replyAuthor, setReplyAuthor] = useState("guest");
  const [replyBody, setReplyBody] = useState("");
  const [summary, setSummary] = useState("");
  const [replyDraft, setReplyDraft] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function loadChannels(preferredChannel?: string) {
    const tree = await api.getChannelsTree();
    const channelPaths = flattenChannels(tree);
    const nextChannel =
      preferredChannel && channelPaths.includes(preferredChannel)
        ? preferredChannel
        : channelPaths.includes(selectedChannel)
          ? selectedChannel
          : channelPaths[0] ?? "/general";

    setChannels(tree);
    setSelectedChannel(nextChannel);
    setRootChannel(nextChannel);
    return nextChannel;
  }

  async function loadPosts(channelPath: string) {
    const channelPosts = await api.getPosts(channelPath);
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
    const response = await api.getThread(threadId);
    setThread(response);
    setSummary("");
    setReplyDraft("");
    setReplyBody("");
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
  }, []);

  async function handleCreateRootPost() {
    setError(null);
    const created = await api.createPost({
      author: rootAuthor,
      channel: rootChannel,
      body: rootBody,
    });

    setRootBody("");
    await refreshWorkspace(created.channel, created.id);
  }

  async function handleCreateReply() {
    if (!thread) {
      return;
    }

    setError(null);
    const created = await api.createPost({
      author: replyAuthor,
      channel: thread.root.channel,
      body: replyBody,
      parent_post_id: thread.posts[thread.posts.length - 1]?.id ?? thread.root.id,
    });

    setReplyBody("");
    await refreshWorkspace(created.channel, created.thread_root_id);
  }

  async function handleSummarize() {
    if (!thread) {
      return;
    }

    setError(null);
    const response = await api.summarize(thread.root.id);
    setSummary(response.summary);
  }

  async function handleUpdatePost(postId: string, author: string, body: string) {
    if (!thread) {
      return;
    }

    setError(null);
    try {
      await api.updatePost(postId, { author, body });
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
      await api.deleteThread(thread.root.id);
      await refreshWorkspace(selectedChannel);
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
    const response = await api.reply(thread.root.id);
    setReplyDraft(response.reply);
    setReplyBody(response.reply);
  }

  async function handleSearch() {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    setError(null);
    const results = await api.search(searchQuery, selectedChannel);
    setSearchResults(results);
  }

  function runAction(action: () => Promise<void>) {
    startTransition(() => {
      action().catch((caught) => {
        setError(caught instanceof Error ? caught.message : t.actionFailed);
      });
    });
  }

  return (
    <main className="min-h-screen px-4 py-6 text-ink md:px-6 xl:px-8">
      <section className="mx-auto max-w-[1800px]">
        <header className="mb-6 grid gap-4 lg:grid-cols-[1.4fr,0.9fr]">
          <div className="panel p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{t.heroKicker}</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink md:text-4xl">
              {t.heroTitleLine1}
              <span className="block text-amber-800">{t.heroTitleLine2}</span>
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">{t.heroBody}</p>
          </div>

          <div className="panel p-6">
            {isMdchatDemo ? (
              <p className="text-sm leading-6 text-amber-900">{t.demoExportsNote}</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                <a
                  href={api.exportMarkdownUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-slateblue px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
                >
                  Export Markdown
                </a>
                <a
                  href={api.exportJsonUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-amber-400 hover:text-amber-800"
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
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 outline-none transition focus:border-amber-500"
                    placeholder={t.aiSearchPlaceholder}
                  />
                  <button
                    type="button"
                    onClick={() => runAction(handleSearch)}
                    disabled={isPending}
                    className="rounded-full bg-amber-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {t.searchButton}
                  </button>
                </div>
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
                        className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-left transition hover:border-amber-400"
                      >
                        <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.18em] text-slate-500">
                          <span>{hit.channel}</span>
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
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
            {t.demoModeBanner}
          </div>
        ) : null}

        {error ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <section className="grid gap-6 xl:grid-cols-[280px,1.1fr,0.95fr]">
          <ChannelSidebar
            channels={channels}
            selectedChannel={selectedChannel}
            onSelect={(channelPath) => {
              pendingThreadRef.current = null;
              setSelectedChannel(channelPath);
              setRootChannel(channelPath);
              runAction(() => loadPosts(channelPath));
            }}
          />

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
              onSelect={(threadId) => runAction(() => openThread(threadId))}
            />
          </div>

          <ThreadPanel
            thread={thread}
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
          />
        </section>
      </section>
    </main>
  );
}

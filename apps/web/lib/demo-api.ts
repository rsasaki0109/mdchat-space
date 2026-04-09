import type {
  ChannelNode,
  CreatePostPayload,
  PostSummary,
  SearchResponse,
  StampOut,
  StampSummary,
  StampToggleResponse,
  SummarizeResponse,
  ThreadPost,
  ThreadResponse,
  UpdatePostPayload,
} from "@/lib/types";

import type { MdchatApi } from "./api-types";
import { rankPostsForSearch } from "./demo-search";


type ChannelMeta = {
  path: string;
  name: string;
  parent_path: string | null;
  depth: number;
};

const STORAGE_KEY = "mdchat-space-demo-v4";
const LEGACY_STORAGE_KEY = "mdchat-space-demo-v3";

const BUILTIN_STAMPS: StampOut[] = [
  { id: "demo-stamp-thumbsup", slug: "thumbsup", label: "いいね", kind: "emoji", emoji_char: "👍", image_url: null },
  { id: "demo-stamp-heart", slug: "heart", label: "ありがとう", kind: "emoji", emoji_char: "❤️", image_url: null },
  { id: "demo-stamp-tada", slug: "tada", label: "お祝い", kind: "emoji", emoji_char: "🎉", image_url: null },
  { id: "demo-stamp-eyes", slug: "eyes", label: "みて", kind: "emoji", emoji_char: "👀", image_url: null },
  { id: "demo-stamp-thinking", slug: "thinking", label: "考え中", kind: "emoji", emoji_char: "🤔", image_url: null },
];

type PersistShape = {
  channels: [string, ChannelMeta][];
  posts: [string, ThreadPost][];
  stampReactions: [string, string, string][];
  customStamps: StampOut[];
};

type StampReactionRow = { postId: string; stampId: string; actorKey: string };

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function normalizePostRow(raw: ThreadPost): ThreadPost {
  return { ...raw, stamps: raw.stamps ?? [] };
}

function enrichPostsWithStamps(
  threadPosts: ThreadPost[],
  reactions: StampReactionRow[],
  catalog: StampOut[],
  actorKey: string,
): ThreadPost[] {
  const catalogById = new Map(catalog.map((s) => [s.id, s]));
  return threadPosts.map((post) => {
    const summaries: StampSummary[] = [];
    for (const stamp of catalog) {
      const count = reactions.filter((r) => r.postId === post.id && r.stampId === stamp.id).length;
      if (count <= 0) {
        continue;
      }
      const mine = reactions.some(
        (r) => r.postId === post.id && r.stampId === stamp.id && r.actorKey === actorKey,
      );
      const def = catalogById.get(stamp.id);
      if (!def) {
        continue;
      }
      summaries.push({
        stamp_id: stamp.id,
        slug: def.slug,
        label: def.label,
        kind: def.kind,
        emoji_char: def.emoji_char,
        image_url: def.image_url,
        count,
        mine,
      });
    }
    summaries.sort((a, b) => b.count - a.count || a.slug.localeCompare(b.slug));
    return { ...post, stamps: summaries };
  });
}

function normalizeChannel(path: string): string {
  const segments = path.split("/").map((s) => s.trim()).filter(Boolean);
  if (!segments.length) {
    throw new Error("channel path must not be empty");
  }
  return "/" + segments.join("/");
}

function excerptFromBody(body: string, limit = 160): string {
  const compact = body.trim().split(/\s+/).join(" ");
  if (compact.length <= limit) {
    return compact;
  }
  return `${compact.slice(0, limit - 1).trimEnd()}…`;
}

function slugPath(channel: string): string {
  return channel.replace(/^\//, "").replace(/\//g, "-") || "root";
}

function createDemoApi(): MdchatApi {
  const channelRows = new Map<string, ChannelMeta>();
  const posts = new Map<string, ThreadPost>();
  let stampReactions: StampReactionRow[] = [];
  let customStamps: StampOut[] = [];

  function stampCatalog(): StampOut[] {
    return [...BUILTIN_STAMPS, ...customStamps];
  }

  function persist(): void {
    if (typeof sessionStorage === "undefined") {
      return;
    }
    const payload: PersistShape = {
      channels: [...channelRows.entries()],
      posts: [...posts.entries()],
      stampReactions: stampReactions.map((r) => [r.postId, r.stampId, r.actorKey]),
      customStamps: [...customStamps],
    };
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      sessionStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      /* quota or private mode */
    }
  }

  function load(): void {
    if (typeof sessionStorage === "undefined") {
      return;
    }
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(LEGACY_STORAGE_KEY);
      if (!raw) {
        return;
      }
      const data = JSON.parse(raw) as PersistShape & { posts?: [string, ThreadPost][] };
      channelRows.clear();
      posts.clear();
      stampReactions = [];
      customStamps = [];
      for (const [k, v] of data.channels ?? []) {
        channelRows.set(k, v);
      }
      for (const [k, v] of data.posts ?? []) {
        posts.set(k, normalizePostRow(v));
      }
      for (const row of data.stampReactions ?? []) {
        if (row.length === 3) {
          stampReactions.push({ postId: row[0], stampId: row[1], actorKey: row[2] });
        }
      }
      customStamps = data.customStamps ?? [];
    } catch {
      channelRows.clear();
      posts.clear();
      stampReactions = [];
      customStamps = [];
    }
  }

  function ensureChannelHierarchy(channelPath: string): void {
    const normalized = normalizeChannel(channelPath);
    const segments = normalized.split("/").filter(Boolean);
    let acc: string[] = [];
    for (let i = 0; i < segments.length; i++) {
      acc.push(segments[i]);
      const path = "/" + acc.join("/");
      if (channelRows.has(path)) {
        continue;
      }
      const parentPath = acc.length > 1 ? "/" + acc.slice(0, -1).join("/") : null;
      channelRows.set(path, {
        path,
        name: segments[i],
        parent_path: parentPath,
        depth: acc.length,
      });
    }
  }

  function seed(): void {
    const t = "2026-04-01T12:00:00+00:00";
    const root1 = "11111111-1111-1111-1111-111111111111";
    const root2 = "22222222-2222-2222-2222-222222222222";
    const root3 = "33333333-3333-3333-3333-333333333333";
    const reply1 = "44444444-4444-4444-4444-444444444444";
    const root4 = "55555555-5555-5555-5555-555555555555";
    const root5 = "66666666-6666-6666-6666-666666666666";
    const root6 = "77777777-7777-7777-7777-777777777777";
    const root7 = "88888888-8888-8888-8888-888888888888";

    ensureChannelHierarchy("/general");
    ensureChannelHierarchy("/oss/news");
    ensureChannelHierarchy("/product/roadmap");
    ensureChannelHierarchy("/dev/docs");
    ensureChannelHierarchy("/ops/runbook");
    ensureChannelHierarchy("/dev/backend");

    const p1: ThreadPost = {
      id: root1,
      author: "yuki",
      channel: "/general",
      created_at: t,
      updated_at: t,
      body:
        "# 今週ピックアップした OSS ネタ\n\n" +
        "よく見ているリポジトリの **Releases / Security** をざっと眺めたメモです（デモ用の架空例です）。\n\n" +
        "- ランタイムまわり: パッチ版は **リリースノートの「Security」節だけ先に読む** と早い\n" +
        "- ライブラリ: メジャー上げは **破壊的変更のマイグレーション章** を一度通読\n" +
        "- 供給鎖: ロックファイル更新後に **SBOM か依存グラフの差分** を残すと後で楽\n\n" +
        "他に「この通知の見方イイよ」みたいなコツがあれば教えてください。",
      thread_root_id: root1,
      parent_post_id: null,
      markdown_path: `demo/${slugPath("/general")}/${root1.slice(0, 8)}.md`,
      stamps: [],
    };
    const p2: ThreadPost = {
      id: reply1,
      author: "ken",
      channel: "/general",
      created_at: "2026-04-01T12:30:00+00:00",
      updated_at: "2026-04-01T12:30:00+00:00",
      body:
        "自分は **GitHub の Watch を Releases only** にして、週一回まとめて見るようにしてます。\n\n" +
        "あと **Dependabot / Renovate の PR 本文に出る CVE リンク** から辿ると、影響範囲の判断が速いです。",
      thread_root_id: root1,
      parent_post_id: root1,
      markdown_path: `demo/${slugPath("/general")}/${reply1.slice(0, 8)}.md`,
      stamps: [],
    };
    const p3: ThreadPost = {
      id: root2,
      author: "yuki",
      channel: "/general",
      created_at: "2026-04-01T11:00:00+00:00",
      updated_at: "2026-04-01T11:00:00+00:00",
      body:
        "# ライセンス変更のニュース、どう切り分けてる？\n\n" +
        "「コアは OSS のまま、付帯ツールだけ商用」のような形が増えてきた印象です。**どのバイナリ／パッケージに何のライセンスが乗るか** を表にすると議論がズレにくいです。\n\n" +
        "社内メモ用に、 SPDX 名と `NOTICE` の有無だけでもテンプレにしてあります。",
      thread_root_id: root2,
      parent_post_id: null,
      markdown_path: `demo/${slugPath("/general")}/${root2.slice(0, 8)}.md`,
      stamps: [],
    };
    const p4: ThreadPost = {
      id: root3,
      author: "marin",
      channel: "/oss/news",
      created_at: "2026-04-01T10:00:00+00:00",
      updated_at: "2026-04-01T10:00:00+00:00",
      body:
        "# OSS メモ（短報）\n\n" +
        "`/oss/news` に **リンク集・短文メモ** を置く想定のチャンネルです。\n\n" +
        "- 気になった **CHANGELOG の一行** をコピペ + 一言コメント\n" +
        "- **リリース日** とセキュリティ修正の有無をメモしておくとログ調査が速い\n\n" +
        "※ 静的デモ用のサンプルです。",
      thread_root_id: root3,
      parent_post_id: null,
      markdown_path: `demo/${slugPath("/oss/news")}/${root3.slice(0, 8)}.md`,
      stamps: [],
    };

    const p5: ThreadPost = {
      id: root4,
      author: "aya",
      channel: "/product/roadmap",
      created_at: "2026-04-01T09:30:00+00:00",
      updated_at: "2026-04-01T09:30:00+00:00",
      body:
        "# 今四半期のリリース方針（デモ）\n\n" +
        "破壊的変更は **リリースノート** の冒頭へ。テンプレは **Markdown** で共有し、ログの後方互換注意も同じ粒度で書きたい。",
      thread_root_id: root4,
      parent_post_id: null,
      markdown_path: `demo/${slugPath("/product/roadmap")}/${root4.slice(0, 8)}.md`,
      stamps: [],
    };

    const p6: ThreadPost = {
      id: root5,
      author: "kenta",
      channel: "/dev/docs",
      created_at: "2026-04-01T09:15:00+00:00",
      updated_at: "2026-04-01T09:15:00+00:00",
      body:
        "# API リファレンスとログ例（デモ）\n\n" +
        "各 **API** のリクエスト例と、失敗時に **ログ** に出るコードを Markdown 表で対応付ける前提のメモ。",
      thread_root_id: root5,
      parent_post_id: null,
      markdown_path: `demo/${slugPath("/dev/docs")}/${root5.slice(0, 8)}.md`,
      stamps: [],
    };

    const p7: ThreadPost = {
      id: root6,
      author: "jun",
      channel: "/ops/runbook",
      created_at: "2026-04-01T09:00:00+00:00",
      updated_at: "2026-04-01T09:00:00+00:00",
      body:
        "障害時は影響時間帯の **ログ** をそのまま貼る運用。**リリース** 直後だけログレベルを上げる手順も Markdown の runbook に分割。",
      thread_root_id: root6,
      parent_post_id: null,
      markdown_path: `demo/${slugPath("/ops/runbook")}/${root6.slice(0, 8)}.md`,
      stamps: [],
    };

    const p8: ThreadPost = {
      id: root7,
      author: "mika",
      channel: "/dev/backend",
      created_at: "2026-04-01T08:45:00+00:00",
      updated_at: "2026-04-01T08:45:00+00:00",
      body:
        "# バックエンド雑記（デモ検索用）\n\n" +
        "外部 **API** のレート制限で詰まったとき、まず **ログ** のステータス行だけ切り出してから本文を追うと迷子にならない。",
      thread_root_id: root7,
      parent_post_id: null,
      markdown_path: `demo/${slugPath("/dev/backend")}/${root7.slice(0, 8)}.md`,
      stamps: [],
    };

    for (const p of [p1, p2, p3, p4, p5, p6, p7, p8]) {
      posts.set(p.id, p);
    }
  }

  load();
  if (posts.size === 0) {
    seed();
    persist();
  }

  function replyCountForRoot(rootId: string): number {
    const n = [...posts.values()].filter((p) => p.thread_root_id === rootId).length;
    return Math.max(n - 1, 0);
  }

  function toSummary(p: ThreadPost): PostSummary {
    return {
      id: p.id,
      author: p.author,
      channel: p.channel,
      created_at: p.created_at,
      excerpt: excerptFromBody(p.body),
      reply_count: replyCountForRoot(p.thread_root_id),
      thread_root_id: p.thread_root_id,
      parent_post_id: p.parent_post_id,
    };
  }

  function getChannelTree(): ChannelNode[] {
    const sorted = [...channelRows.values()].sort(
      (a, b) => a.depth - b.depth || a.path.localeCompare(b.path),
    );
    const directCount = new Map<string, number>();
    for (const p of posts.values()) {
      if (p.parent_post_id === null) {
        directCount.set(p.channel, (directCount.get(p.channel) ?? 0) + 1);
      }
    }
    const nodesByPath = new Map<string, ChannelNode>();
    const roots: ChannelNode[] = [];
    for (const ch of sorted) {
      const node: ChannelNode = {
        path: ch.path,
        name: ch.name,
        depth: ch.depth,
        post_count: directCount.get(ch.path) ?? 0,
        total_post_count: directCount.get(ch.path) ?? 0,
        children: [],
      };
      nodesByPath.set(ch.path, node);
      if (ch.parent_path && nodesByPath.has(ch.parent_path)) {
        nodesByPath.get(ch.parent_path)!.children.push(node);
      } else {
        roots.push(node);
      }
    }
    function accumulate(node: ChannelNode): number {
      let total = node.post_count;
      for (const c of node.children) {
        total += accumulate(c);
      }
      node.total_post_count = total;
      return total;
    }
    for (const r of roots) {
      accumulate(r);
    }
    return roots;
  }

  async function getThreadInner(threadOrPostId: string, actorKey?: string | null): Promise<ThreadResponse> {
    const seedPost = posts.get(threadOrPostId);
    if (!seedPost) {
      throw new Error("post not found");
    }
    const rootId = seedPost.thread_root_id;
    const threadPosts = [...posts.values()]
      .filter((p) => p.thread_root_id === rootId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const root = threadPosts.find((p) => p.id === rootId);
    if (!root) {
      throw new Error("thread not found");
    }
    const actor = (actorKey ?? "").trim();
    const enriched = enrichPostsWithStamps(threadPosts, stampReactions, stampCatalog(), actor);
    const rootEnriched = enriched.find((p) => p.id === rootId);
    if (!rootEnriched) {
      throw new Error("thread not found");
    }
    return { root: rootEnriched, posts: enriched };
  }

  return {
    async getChannelsTree() {
      return getChannelTree();
    },

    async getPosts(channel: string) {
      const norm = normalizeChannel(channel);
      return [...posts.values()]
        .filter((p) => p.channel === norm && p.parent_post_id === null)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .map(toSummary);
    },

    async createPost(payload: CreatePostPayload) {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      let channelPath = normalizeChannel(payload.channel);
      let parent: ThreadPost | undefined;
      if (payload.parent_post_id) {
        parent = posts.get(payload.parent_post_id);
        if (!parent) {
          throw new Error("parent post not found");
        }
        channelPath = parent.channel;
      }
      ensureChannelHierarchy(channelPath);
      const threadRootId = parent ? parent.thread_root_id : id;
      const post: ThreadPost = {
        id,
        author: payload.author.trim(),
        channel: channelPath,
        created_at: now,
        updated_at: now,
        body: payload.body.trim(),
        thread_root_id: threadRootId,
        parent_post_id: payload.parent_post_id ?? null,
        markdown_path: `demo/${slugPath(channelPath)}/${id.slice(0, 8)}.md`,
        stamps: [],
      };
      posts.set(id, post);
      persist();
      return post;
    },

    async updatePost(postId: string, payload: UpdatePostPayload) {
      const post = posts.get(postId);
      if (!post) {
        throw new Error("post not found");
      }
      const nextAuthor = payload.author?.trim() ?? post.author;
      const nextBody = payload.body?.trim() ?? post.body;
      const updated: ThreadPost = {
        ...post,
        author: nextAuthor,
        body: nextBody,
        updated_at: new Date().toISOString(),
        stamps: post.stamps ?? [],
      };
      posts.set(postId, updated);
      persist();
      return updated;
    },

    async deleteThread(threadRootId: string) {
      const root = posts.get(threadRootId);
      if (!root) {
        throw new Error("post not found");
      }
      if (root.parent_post_id !== null) {
        throw new Error("DELETE expects the thread root id");
      }
      const removeIds = new Set<string>();
      for (const [pid, p] of [...posts.entries()]) {
        if (p.thread_root_id === threadRootId) {
          removeIds.add(pid);
        }
      }
      for (const pid of removeIds) {
        posts.delete(pid);
      }
      stampReactions = stampReactions.filter((r) => !removeIds.has(r.postId));
      persist();
    },

    async getThread(threadOrPostId: string, actorKey?: string | null) {
      return getThreadInner(threadOrPostId, actorKey);
    },

    async getStamps() {
      return stampCatalog();
    },

    async togglePostStamp(postId: string, stampId: string, actorKey: string) {
      const post = posts.get(postId);
      if (!post) {
        throw new Error("post not found");
      }
      if (!stampCatalog().some((s) => s.id === stampId)) {
        throw new Error("stamp not found");
      }
      const actor = actorKey.trim() || "guest";
      const idx = stampReactions.findIndex(
        (r) => r.postId === postId && r.stampId === stampId && r.actorKey === actor,
      );
      if (idx >= 0) {
        stampReactions.splice(idx, 1);
      } else {
        stampReactions.push({ postId, stampId, actorKey: actor });
      }
      persist();
      const count = stampReactions.filter((r) => r.postId === postId && r.stampId === stampId).length;
      return { active: idx < 0, count } satisfies StampToggleResponse;
    },

    async createImageStamp(slug: string, label: string, file: File) {
      if (!/^[a-z][a-z0-9-]{1,30}$/.test(slug.trim().toLowerCase())) {
        throw new Error("invalid slug");
      }
      if (stampCatalog().some((s) => s.slug === slug.trim().toLowerCase())) {
        throw new Error("stamp slug already exists");
      }
      if (file.size > 512 * 1024) {
        throw new Error("image too large");
      }
      const dataUrl = await fileToDataUrl(file);
      const id = crypto.randomUUID();
      const stamp: StampOut = {
        id,
        slug: slug.trim().toLowerCase(),
        label: label.trim().slice(0, 120) || slug.trim().toLowerCase(),
        kind: "image",
        emoji_char: null,
        image_url: dataUrl,
      };
      customStamps.push(stamp);
      persist();
      return stamp;
    },

    async summarize(threadId: string) {
      const thread = await getThreadInner(threadId);
      const names = [...new Set(thread.posts.map((p) => p.author))];
      const summary =
        "## スレッド要約（ブラウザデモ）\n\n" +
        `- 投稿数: ${thread.posts.length}\n` +
        `- 参加者: ${names.join(", ") || "—"}\n\n` +
        "※ 実サーバーではなく、お試し用の簡易表示です。";
      return { thread_id: thread.root.id, summary };
    },

    async reply(threadId: string, instruction?: string) {
      const thread = await getThreadInner(threadId, null);
      const last = thread.posts[thread.posts.length - 1];
      const tail = last ? `\n\n（直近: ${last.author} さんの投稿を参照）` : "";
      const hint = instruction?.trim() ? `\n\n補足: ${instruction.trim()}` : "";
      const text =
        "これはデモ用のテンプレ返信です。\n\n" +
        "```md\n了解です。次の3点を確認させてください。\n" +
        "1. 目的\n2. 制約\n3. 次のアクション\n```" +
        tail +
        hint;
      return { thread_id: thread.root.id, reply: text };
    },

    async search(query: string, channel?: string | null, limit = 24) {
      const q = query.trim();
      if (!q) {
        return { query, answer: "", hits: [] };
      }
      const chFilter = channel?.trim() ? normalizeChannel(channel) : null;
      const allPosts = [...posts.values()];
      const hits = rankPostsForSearch(q, allPosts, chFilter, limit);
      const lead = hits[0];
      const answer =
        hits.length === 0
          ? "該当が見つかりませんでした。別の言い回しや全チャンネル検索を試してください。"
          : `「${q}」で ${hits.length} 件ヒットしました。${lead ? `先頭スコア ${lead.score}（${lead.channel}）。` : ""}`;
      return { query: q, answer, hits };
    },

    exportMarkdownUrl: "",
    exportJsonUrl: "",
  };
}

let demoSingleton: MdchatApi | null = null;

export function getDemoApi(): MdchatApi {
  if (!demoSingleton) {
    demoSingleton = createDemoApi();
  }
  return demoSingleton;
}

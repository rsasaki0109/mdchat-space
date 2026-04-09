import type {
  ChannelNode,
  CreatePostPayload,
  PostSummary,
  ReplyResponse,
  SearchResponse,
  SummarizeResponse,
  ThreadPost,
  ThreadResponse,
  UpdatePostPayload,
} from "@/lib/types";

import type { MdchatApi } from "./api-types";


const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

function writeHeaders(): Record<string, string> {
  const key = process.env.NEXT_PUBLIC_MDCHAT_WRITE_KEY;
  if (key) {
    return { "X-API-Key": key };
  }
  return {};
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...writeHeaders(),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `API request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function createRealApi(): MdchatApi {
  return {
    getChannelsTree() {
      return request<ChannelNode[]>("/channels/tree");
    },
    getPosts(channel: string) {
      return request<PostSummary[]>(`/posts?channel=${encodeURIComponent(channel)}`);
    },
    createPost(payload: CreatePostPayload) {
      return request<ThreadPost>("/posts", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    updatePost(postId: string, payload: UpdatePostPayload) {
      return request<ThreadPost>(`/posts/${encodeURIComponent(postId)}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    },
    deleteThread(threadRootId: string) {
      return request<void>(`/posts/${encodeURIComponent(threadRootId)}`, {
        method: "DELETE",
      });
    },
    getThread(threadId: string) {
      return request<ThreadResponse>(`/thread/${threadId}`);
    },
    summarize(threadId: string) {
      return request<SummarizeResponse>("/ai/summarize", {
        method: "POST",
        body: JSON.stringify({ thread_id: threadId }),
      });
    },
    reply(threadId: string, instruction?: string) {
      return request<ReplyResponse>("/ai/reply", {
        method: "POST",
        body: JSON.stringify({ thread_id: threadId, instruction }),
      });
    },
    search(query: string, channel?: string | null, limit = 24) {
      return request<SearchResponse>("/ai/search", {
        method: "POST",
        body: JSON.stringify({ query, channel: channel ?? null, limit }),
      });
    },
    exportMarkdownUrl: `${API_BASE}/export/md`,
    exportJsonUrl: `${API_BASE}/export/json`,
  };
}

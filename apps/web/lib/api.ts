import type {
  ChannelNode,
  CreatePostPayload,
  PostSummary,
  ReplyResponse,
  SearchResponse,
  SummarizeResponse,
  ThreadPost,
  ThreadResponse,
} from "@/lib/types";


const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";


async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}


export const api = {
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
  search(query: string, channel?: string) {
    return request<SearchResponse>("/ai/search", {
      method: "POST",
      body: JSON.stringify({ query, channel, limit: 5 }),
    });
  },
  exportMarkdownUrl: `${API_BASE}/export/md`,
  exportJsonUrl: `${API_BASE}/export/json`,
};

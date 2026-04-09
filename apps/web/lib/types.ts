export type ChannelNode = {
  path: string;
  name: string;
  depth: number;
  post_count: number;
  total_post_count: number;
  children: ChannelNode[];
};

export type PostSummary = {
  id: string;
  author: string;
  channel: string;
  created_at: string;
  excerpt: string;
  reply_count: number;
  thread_root_id: string;
  parent_post_id: string | null;
};

export type ThreadPost = {
  id: string;
  author: string;
  channel: string;
  created_at: string;
  updated_at: string;
  body: string;
  thread_root_id: string;
  parent_post_id: string | null;
  markdown_path: string;
};

export type ThreadResponse = {
  root: ThreadPost;
  posts: ThreadPost[];
};

export type SearchHit = {
  post_id: string;
  channel: string;
  author: string;
  created_at: string;
  excerpt: string;
  score: number;
};

export type SearchResponse = {
  query: string;
  answer: string;
  hits: SearchHit[];
};

export type SummarizeResponse = {
  thread_id: string;
  summary: string;
};

export type ReplyResponse = {
  thread_id: string;
  reply: string;
};

export type CreatePostPayload = {
  author: string;
  channel: string;
  body: string;
  parent_post_id?: string | null;
};

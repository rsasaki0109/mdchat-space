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

export type StampSummary = {
  stamp_id: string;
  slug: string;
  label: string;
  kind: string;
  emoji_char: string | null;
  image_url: string | null;
  count: number;
  mine: boolean;
};

export type StampOut = {
  id: string;
  slug: string;
  label: string;
  kind: string;
  emoji_char: string | null;
  image_url: string | null;
};

export type StampToggleResponse = {
  active: boolean;
  count: number;
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
  stamps: StampSummary[];
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

export type UpdatePostPayload = {
  author?: string;
  body?: string;
};

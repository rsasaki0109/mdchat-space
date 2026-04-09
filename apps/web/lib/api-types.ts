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


export type MdchatApi = {
  getChannelsTree(): Promise<ChannelNode[]>;
  getPosts(channel: string): Promise<PostSummary[]>;
  createPost(payload: CreatePostPayload): Promise<ThreadPost>;
  updatePost(postId: string, payload: UpdatePostPayload): Promise<ThreadPost>;
  deleteThread(threadRootId: string): Promise<void>;
  getThread(threadId: string): Promise<ThreadResponse>;
  summarize(threadId: string): Promise<SummarizeResponse>;
  reply(threadId: string, instruction?: string): Promise<ReplyResponse>;
  search(query: string, channel?: string | null, limit?: number): Promise<SearchResponse>;
  exportMarkdownUrl: string;
  exportJsonUrl: string;
};

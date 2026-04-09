import type {
  ChannelNode,
  CreatePostPayload,
  PostSummary,
  ReplyResponse,
  SearchResponse,
  StampOut,
  StampToggleResponse,
  SummarizeResponse,
  ThreadPost,
  ThreadResponse,
  UpdatePostPayload,
} from "@/lib/types";


export type DmRoomRef = {
  channel: string;
};

export type MdchatApi = {
  getChannelsTree(): Promise<ChannelNode[]>;
  getPosts(channel: string): Promise<PostSummary[]>;
  createPost(payload: CreatePostPayload): Promise<ThreadPost>;
  updatePost(postId: string, payload: UpdatePostPayload): Promise<ThreadPost>;
  deleteThread(threadRootId: string): Promise<void>;
  getThread(threadId: string, actorKey?: string | null): Promise<ThreadResponse>;
  getStamps(): Promise<StampOut[]>;
  togglePostStamp(postId: string, stampId: string, actorKey: string): Promise<StampToggleResponse>;
  createImageStamp(slug: string, label: string, file: File): Promise<StampOut>;
  summarize(threadId: string): Promise<SummarizeResponse>;
  reply(threadId: string, instruction?: string): Promise<ReplyResponse>;
  search(query: string, channel?: string | null, limit?: number): Promise<SearchResponse>;
  listDmRooms(): Promise<string[]>;
  createDmRoom(): Promise<DmRoomRef>;
  exportMarkdownUrl: string;
  exportJsonUrl: string;
};

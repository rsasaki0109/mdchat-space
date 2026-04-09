import type { PostSummary } from "@/lib/types";


type PostListProps = {
  posts: PostSummary[];
  activeThreadId: string | null;
  onSelect: (threadId: string) => void;
};


const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
  dateStyle: "medium",
  timeStyle: "short",
});


export function PostList({ posts, activeThreadId, onSelect }: PostListProps) {
  return (
    <section className="panel p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ink">投稿一覧</h2>
          <p className="mt-1 text-sm text-slate-600">各スレッドの起点となる Markdown 投稿です。</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          {posts.length} threads
        </span>
      </div>

      {posts.length === 0 ? (
        <div className="panel-muted p-6 text-sm text-slate-600">
          このチャンネルにはまだ投稿がありません。上のフォームから最初の Markdown を残してください。
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => {
            const selected = post.id === activeThreadId;

            return (
              <button
                key={post.id}
                type="button"
                onClick={() => onSelect(post.id)}
                className={`w-full rounded-3xl border p-4 text-left transition ${
                  selected
                    ? "border-amber-300 bg-amber-50"
                    : "border-white/20 bg-white/70 hover:border-slate-200 hover:bg-white"
                }`}
              >
                <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.2em] text-slate-500">
                  <span>{post.author}</span>
                  <span>{dateFormatter.format(new Date(post.created_at))}</span>
                  <span>{post.channel}</span>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-700">{post.excerpt}</p>
                <p className="mt-4 text-xs font-medium text-amber-800">
                  {post.reply_count} replies in thread
                </p>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

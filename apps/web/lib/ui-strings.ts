export type UiLocale = "ja" | "en";

export type UiStrings = {
  heroKicker: string;
  heroTitleLine1: string;
  heroTitleLine2: string;
  heroBody: string;
  aiSearchLabel: string;
  aiSearchPlaceholder: string;
  searchButton: string;
  searchAllChannels: string;
  loadFailed: string;
  actionFailed: string;
  composerTitle: string;
  composerDescription: string;
  composerSubmit: string;
  composerSubmitPending: string;
  fieldAuthor: string;
  fieldChannel: string;
  fieldMarkdown: string;
  authorPlaceholder: string;
  bodyPlaceholder: string;
  sidebarChannelsLabel: string;
  sidebarTitle: string;
  sidebarDescription: string;
  sidebarEmpty: string;
  postListTitle: string;
  postListDescription: string;
  postListEmpty: string;
  postListThreadLabel: (n: number) => string;
  postListRepliesLabel: (n: number) => string;
  threadEmptyKicker: string;
  threadEmptyTitle: string;
  threadEmptyBody: string;
  threadKicker: string;
  threadPostsInConversation: (n: number) => string;
  summarize: string;
  generateReply: string;
  replySectionTitle: string;
  replySubmit: string;
  editPost: string;
  savePost: string;
  cancelEdit: string;
  deleteThread: string;
  deleteThreadConfirm: string;
  demoModeBanner: string;
  demoExportsNote: string;
};

const ja: UiStrings = {
  heroKicker: "Markdown First Chat",
  heroTitleLine1: "会話を UI ではなく",
  heroTitleLine2: "Markdown 資産として残す",
  heroBody:
    "`mdchat-space` は、本文をすべて Markdown ファイルで保存し、メタ情報だけを PostgreSQL に持つ OSS チャットです。UI はただのクライアントで、データ自体はいつでも外へ持ち出せます。",
  aiSearchLabel: "AI 検索",
  aiSearchPlaceholder: "GNSS の誤差, ログ保存, 方針整理...",
  searchButton: "検索",
  searchAllChannels: "全チャンネルで検索",
  loadFailed: "初期ロードに失敗しました。",
  actionFailed: "操作に失敗しました。",
  composerTitle: "新しい投稿",
  composerDescription:
    "選択中のチャンネルに Markdown を残します。チャンネル名を直接変えると、新しい階層もそのまま作れます。",
  composerSubmit: "投稿する",
  composerSubmitPending: "処理中...",
  fieldAuthor: "投稿者",
  fieldChannel: "チャンネル",
  fieldMarkdown: "Markdown",
  authorPlaceholder: "ryohei",
  bodyPlaceholder: "会話をそのまま資産化できるように、結論と前提を Markdown で残します。",
  sidebarChannelsLabel: "Channels",
  sidebarTitle: "会話のディレクトリ",
  sidebarDescription: "チャンネル構造はそのまま Markdown の保存先になります。",
  sidebarEmpty: "まだチャンネルがありません。投稿すると自動で階層が作られます。",
  postListTitle: "投稿一覧",
  postListDescription: "各スレッドの起点となる Markdown 投稿です。",
  postListEmpty: "このチャンネルにはまだ投稿がありません。上のフォームから最初の Markdown を残してください。",
  postListThreadLabel: (n) => `${n} スレッド`,
  postListRepliesLabel: (n) => `スレッド内 ${n} 件の返信`,
  threadEmptyKicker: "Thread",
  threadEmptyTitle: "スレッドビュー",
  threadEmptyBody: "投稿を選ぶと、返信の流れ・Markdown 本文・AI 補助をここで扱えます。",
  threadKicker: "Thread",
  threadPostsInConversation: (n) => `会話内 ${n} 件の投稿`,
  summarize: "要約",
  generateReply: "返信生成",
  replySectionTitle: "返信を書く",
  replySubmit: "スレッドに返信",
  editPost: "編集",
  savePost: "保存",
  cancelEdit: "キャンセル",
  deleteThread: "スレッドを削除",
  deleteThreadConfirm: "このスレッドとすべての返信を削除します。よろしいですか？",
  demoModeBanner:
    "デモモード: データはこのブラウザの sessionStorage にだけ保存され、他のユーザーとは共有されません。タブを閉じると消えます。",
  demoExportsNote: "デモではエクスポートは利用できません（API サーバーなし）。",
};

const en: UiStrings = {
  heroKicker: "Markdown First Chat",
  heroTitleLine1: "Keep conversations as",
  heroTitleLine2: "Markdown assets—not UI lock-in",
  heroBody:
    "`mdchat-space` stores every message body as a Markdown file and keeps only metadata in PostgreSQL. The UI is just an API client; you can export data any time.",
  aiSearchLabel: "AI search",
  aiSearchPlaceholder: "GNSS errors, log retention, planning...",
  searchButton: "Search",
  searchAllChannels: "Search all channels",
  loadFailed: "Failed to load the workspace.",
  actionFailed: "Something went wrong.",
  composerTitle: "New post",
  composerDescription:
    "Leave Markdown in the selected channel. Edit the channel path to create a new hierarchy on the fly.",
  composerSubmit: "Post",
  composerSubmitPending: "Working…",
  fieldAuthor: "Author",
  fieldChannel: "Channel",
  fieldMarkdown: "Markdown",
  authorPlaceholder: "sam",
  bodyPlaceholder: "Capture conclusions and assumptions in Markdown so the thread stays useful later.",
  sidebarChannelsLabel: "Channels",
  sidebarTitle: "Conversation directories",
  sidebarDescription: "Channel paths mirror where Markdown files are stored on disk.",
  sidebarEmpty: "No channels yet. Create a post and the hierarchy appears automatically.",
  postListTitle: "Threads",
  postListDescription: "Root posts—each one starts a Markdown thread.",
  postListEmpty: "No posts in this channel yet. Use the form above to add the first Markdown note.",
  postListThreadLabel: (n) => `${n} thread${n === 1 ? "" : "s"}`,
  postListRepliesLabel: (n) => {
    if (n === 0) return "No replies yet";
    if (n === 1) return "1 reply in thread";
    return `${n} replies in thread`;
  },
  threadEmptyKicker: "Thread",
  threadEmptyTitle: "Thread view",
  threadEmptyBody: "Select a thread to read the flow, Markdown bodies, and AI helpers here.",
  threadKicker: "Thread",
  threadPostsInConversation: (n) => `${n} post${n === 1 ? "" : "s"} in conversation`,
  summarize: "Summarize",
  generateReply: "Draft reply",
  replySectionTitle: "Write a reply",
  replySubmit: "Reply in thread",
  editPost: "Edit",
  savePost: "Save",
  cancelEdit: "Cancel",
  deleteThread: "Delete thread",
  deleteThreadConfirm: "Delete this thread and all replies permanently?",
  demoModeBanner:
    "Demo: data stays in this browser (sessionStorage only). Other visitors do not see your posts. Closing the tab clears it.",
  demoExportsNote: "Exports are unavailable in the static demo (no API server).",
};

export function getUiStrings(locale: UiLocale): UiStrings {
  return locale === "en" ? en : ja;
}

export function intlLocaleForUi(locale: UiLocale): string {
  return locale === "en" ? "en-US" : "ja-JP";
}

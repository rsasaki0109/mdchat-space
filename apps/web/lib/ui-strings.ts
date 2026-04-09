export type UiLocale = "ja" | "en";

/** 静的デモ（`NEXT_PUBLIC_MDCHAT_DEMO`）用のコピーを切り替える。 */
export type UiCopyVariant = "default" | "demo";

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
  dmDemoKicker: string;
  dmDemoTitle: string;
  dmDemoBody: string;
  dmDemoNew: string;
  dmDemoEmpty: string;
  demoExportsNote: string;
  /** デモ時のみ: ヒーロー下の「試す順」ヒント（既定は空）。 */
  demoTryFlow: string;
  /** デモ時のみ: DM パネル内のワンライナー（既定は空）。 */
  demoDmHint: string;
  stampsHeading: string;
  addCustomStamp: string;
  fieldStampSlug: string;
  fieldStampLabel: string;
  stampPickFile: string;
  stampUploadSubmit: string;
};

const ja: UiStrings = {
  heroKicker: "Markdown First Chat",
  heroTitleLine1: "会話を UI ではなく",
  heroTitleLine2: "Markdown 資産として残す",
  heroBody:
    "`mdchat-space` は、本文をすべて Markdown ファイルで保存し、メタ情報だけを PostgreSQL に持つ OSS チャットです。UI はただのクライアントで、データ自体はいつでも外へ持ち出せます。",
  aiSearchLabel: "AI 検索",
  aiSearchPlaceholder: "API 互換, ログ設計, リリース方針...",
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
    "デモ: データはこのブラウザの sessionStorage にだけ保存されます。他の人と共有する機能はなく、試し打ち用です。タブを閉じると消えます。",
  dmDemoKicker: "Demo · DM",
  dmDemoTitle: "DM ルーム",
  dmDemoBody:
    "この端末内だけのメモ用ルームです。`/dm/…` チャンネルに投稿がひも付き、一覧から戻れます。",
  dmDemoNew: "新しい DM ルーム",
  dmDemoEmpty: "まだルームがありません。上のボタンで作成できます。",
  demoExportsNote: "デモではエクスポートは利用できません（API サーバーなし）。",
  demoTryFlow: "",
  demoDmHint: "",
  stampsHeading: "スタンプ",
  addCustomStamp: "オリジナル画像スタンプを追加",
  fieldStampSlug: "スラッグ（英小文字・数字・ハイフン）",
  fieldStampLabel: "表示名",
  stampPickFile: "画像（PNG / JPEG / GIF / WebP、512KB まで）",
  stampUploadSubmit: "スタンプを登録",
};

const en: UiStrings = {
  heroKicker: "Markdown First Chat",
  heroTitleLine1: "Keep conversations as",
  heroTitleLine2: "Markdown assets—not UI lock-in",
  heroBody:
    "`mdchat-space` stores every message body as a Markdown file and keeps only metadata in PostgreSQL. The UI is just an API client; you can export data any time.",
  aiSearchLabel: "AI search",
  aiSearchPlaceholder: "API compatibility, logging, release planning...",
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
    "Demo only: data stays in this browser’s sessionStorage. There is no sharing with other people—just a local sandbox. Closing the tab clears it.",
  dmDemoKicker: "Demo · DM",
  dmDemoTitle: "DM rooms",
  dmDemoBody:
    "Local-only scratch rooms under `/dm/…`. Posts stay tied to this browser; use the list to jump back.",
  dmDemoNew: "New DM room",
  dmDemoEmpty: "No rooms yet. Create one with the button above.",
  demoExportsNote: "Exports are unavailable in the static demo (no API server).",
  demoTryFlow: "",
  demoDmHint: "",
  stampsHeading: "Stamps",
  addCustomStamp: "Add custom image stamp",
  fieldStampSlug: "Slug (lowercase letters, digits, hyphen)",
  fieldStampLabel: "Label",
  stampPickFile: "Image (PNG / JPEG / GIF / WebP, up to 512KB)",
  stampUploadSubmit: "Save stamp",
};

const jaDemo: Partial<UiStrings> = {
  heroKicker: "インストール不要 · ブラウザだけで試せます",
  heroTitleLine1: "チームの知識を",
  heroTitleLine2: "Markdown スレッドで積み上げる",
  heroBody:
    "**チャンネル**を選び、**スレ**を開き、右ペインで **要約** と **返信ドラフト**、スタンプまで一気に体験できます。左の **個別チャット** にもサンプルが入っています。データはこのタブ内だけなので、安心して触れます（閉じると消えます）。本番運用は README の Docker / API セットアップへ。",
  demoTryFlow:
    "おすすめの流れ: 「まずここから」スレを開く → **要約** → **返信ドラフト** → 左の **DM · yuki** を開いてみる。",
  aiSearchPlaceholder: "Dependabot, 要約, ランタイム, SBOM…",
  composerDescription:
    "選んだチャンネルにすぐ投稿。`/team/2026/foo` のようにパスを書けば、その場で階層も増えます。",
  authorPlaceholder: "表示名（例: あなた）",
  bodyPlaceholder: "いま決まったこと・次の一手をメモ。`# 見出し` や **強調** もこのまま使えます。",
  sidebarTitle: "ワークスペース",
  sidebarDescription:
    "一般 / OSS / プロダクト / 開発 / 運用のサンプル階層。`/dm/…` は個別チャット（相手名で表示）。",
  postListTitle: "このチャンネルのスレッド",
  postListDescription: "一覧から開くと、右に会話の全体が出ます。返信の分岐もそのまま表示されます。",
  postListEmpty: "まだスレがありません。上のフォームから最初の一行をどうぞ。",
  threadEmptyBody:
    "中央の一覧からスレを選ぶと、ここに Markdown 本文・返信チェーン・AI 補助がまとまって出ます。",
  demoModeBanner:
    "ライブデモ | 保存先はこのブラウザのメモリ（sessionStorage）だけ。共有・同期はありません。発表・内覧・UI 評価向けです。",
  dmDemoKicker: "直接メッセージ",
  dmDemoTitle: "個別チャット",
  dmDemoBody:
    "yuki / marin / ken とのサンプル会話が入っています。社内 DM のイメージで、そのまま読み返せます。",
  dmDemoNew: "新しい DM を始める",
  dmDemoEmpty: "ルームはボタン一つで追加できます。",
  demoExportsNote: "※ デモはブラウザ内だけのデータのため、Markdown / JSON のダウンロードはありません。",
  demoDmHint: "本番では FastAPI 経由でファイルに保存・エクスポートできます。",
  composerSubmit: "投稿してスレに載せる",
  searchButton: "検索する",
};

const enDemo: Partial<UiStrings> = {
  heroKicker: "No install · try everything in the browser",
  heroTitleLine1: "Turn team knowledge into",
  heroTitleLine2: "durable Markdown threads",
  heroBody:
    "Pick a **channel**, open a **thread**, then use **Summarize**, **Draft reply**, and stamps on the right. **DM** samples are on the left. Data never leaves this tab—safe to play (clears when you close it). For production, follow the Docker / API setup in the README.",
  demoTryFlow:
    "Suggested flow: open \"Start here\" → tap **Summarize** → **Draft reply** → open **DM · yuki** on the left.",
  aiSearchPlaceholder: "Dependabot, SBOM, runbook, rate limits…",
  composerDescription:
    "Post Markdown in the selected channel. Type `/team/2026/foo` to grow the tree on the fly.",
  authorPlaceholder: "Display name (e.g. You)",
  bodyPlaceholder: "Capture the decision and the next step. Use `# headings` and **bold** as usual.",
  sidebarTitle: "Workspace",
  sidebarDescription:
    "Sample tree: general, OSS, product, dev, ops. `/dm/…` rooms show as **DM · name**.",
  postListTitle: "Threads in this channel",
  postListDescription: "Selecting a thread opens the full conversation on the right, replies included.",
  postListEmpty: "No threads yet—drop the first note with the composer above.",
  threadEmptyBody: "Choose a thread in the center list to see Markdown, replies, and AI helpers here.",
  demoModeBanner:
    "Live demo | Data stays in this browser (sessionStorage) only—no sharing or sync. Great for walkthroughs and UI reviews.",
  dmDemoKicker: "Direct messages",
  dmDemoTitle: "1:1 chat",
  dmDemoBody: "Sample chats with yuki, marin, and ken—read like a real DM inbox.",
  dmDemoNew: "Start a new DM",
  dmDemoEmpty: "Create a room with one tap.",
  demoExportsNote: "※ Exports are unavailable in this static sandbox (no API server).",
  demoDmHint: "With the API running, posts persist as Markdown files and export works.",
  composerSubmit: "Post to channel",
  searchButton: "Search",
};

export function getUiStrings(locale: UiLocale, variant: UiCopyVariant = "default"): UiStrings {
  const base = locale === "en" ? en : ja;
  if (variant !== "demo") {
    return base;
  }
  const overlay = locale === "en" ? enDemo : jaDemo;
  return { ...base, ...overlay };
}

export function intlLocaleForUi(locale: UiLocale): string {
  return locale === "en" ? "en-US" : "ja-JP";
}
